"""
KB chat + log capture server (Anthropic Claude + BM25 retrieval).

Endpoints:
  GET  /health              service heartbeat
  POST /logs                browser pushes one activity-log entry per call
  POST /chat                {messages: [...], top_k?: int} -> RAG answer
  GET  /stats               quick counts for both collections

Architecture:
  - ChromaDB holds the documents (static KB + live logs)
  - Retrieval is BM25 lexical search over the stored documents (no embeddings
    API needed — Anthropic doesn't offer one, and corporate egress here
    blocks huggingface.co so local embedding-model downloads also fail)
  - Chat goes to Claude (claude-haiku-4-5 by default — 3x cheaper than Sonnet
    on both input and output, fine for short RAG answers)

Run:
  python server.py
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
import uuid
from pathlib import Path
from typing import Any

# Use the OS certificate store so Python trusts corporate root CAs that
# intercept TLS. Must run before any HTTPS client is built.
try:
    import truststore
    truststore.inject_into_ssl()
except ImportError:
    pass

from dotenv import load_dotenv

HERE = Path(__file__).resolve().parent
load_dotenv(HERE / ".env")

import anthropic
import chromadb
from chromadb.config import Settings
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from rank_bm25 import BM25Okapi

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "").strip()
CHAT_MODEL = os.environ.get("ANTHROPIC_CHAT_MODEL", "claude-haiku-4-5")
HOST = os.environ.get("KB_HOST", "127.0.0.1")
PORT = int(os.environ.get("KB_PORT", "8765"))
TOP_K = int(os.environ.get("KB_TOP_K", "6"))
LOG_FILE = HERE / "activity_log.jsonl"

if not ANTHROPIC_API_KEY:
    print("ERROR: ANTHROPIC_API_KEY missing from kb/.env", file=sys.stderr)
    sys.exit(2)

claude = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
chroma = chromadb.PersistentClient(
    path=str(HERE / "chroma_store"),
    settings=Settings(anonymized_telemetry=False),
)


def _get_or_create(name: str):
    try:
        return chroma.get_collection(name)
    except Exception:
        return chroma.create_collection(name=name, metadata={"hnsw:space": "cosine"})


docs_col = _get_or_create("kb_docs")
logs_col = _get_or_create("kb_logs")

_SENTINEL_EMBED = [0.0]


# ---------------------------------------------------------------------------
# BM25 retrieval over Chroma-stored documents
# ---------------------------------------------------------------------------

_TOKEN_RE = re.compile(r"[A-Za-z0-9_]+")


def _tokenize(text: str) -> list[str]:
    return [t.lower() for t in _TOKEN_RE.findall(text)]


def _pull_all(col) -> tuple[list[str], list[str], list[dict]]:
    """Pull every doc out of a Chroma collection. Small KB — fine to do per request."""
    if col.count() == 0:
        return [], [], []
    res = col.get(include=["documents", "metadatas"])
    return res["ids"], res["documents"], res["metadatas"]


def retrieve(query: str, k: int) -> list[dict]:
    """BM25 over both collections, merged by score."""
    hits: list[dict] = []
    q_tokens = _tokenize(query)
    if not q_tokens:
        return hits

    for source, col in (("docs", docs_col), ("logs", logs_col)):
        ids, docs, metas = _pull_all(col)
        if not docs:
            continue
        tokenized = [_tokenize(d) for d in docs]
        # b=0.5 (default 0.75) — softer length penalty so longer detail-rich
        # sections (e.g. a full requirements table) aren't unfairly down-
        # weighted vs short sections that merely mention the same terms.
        bm25 = BM25Okapi(tokenized, b=0.5)
        scores = bm25.get_scores(q_tokens)
        # Top-k per collection, then merged + sorted globally below.
        order = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:k]
        for i in order:
            if scores[i] <= 0:
                continue
            hits.append({
                "source": source,
                "id": ids[i],
                "text": docs[i],
                "metadata": metas[i] or {},
                "score": float(scores[i]),
            })
    hits.sort(key=lambda h: h["score"], reverse=True)
    return hits[:k]


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class LogEntry(BaseModel):
    time: str | None = None
    msg: str
    tag: str = "info"
    phase: str = "system"
    agent_id: str | None = None


class ChatMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    top_k: int | None = None


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(title="SDLC Orchestrator KB (Anthropic)", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "provider": "anthropic",
        "chat_model": CHAT_MODEL,
        "retrieval": "bm25",
        "docs": docs_col.count(),
        "logs": logs_col.count(),
    }


@app.get("/stats")
def stats() -> dict:
    return {"docs": docs_col.count(), "logs": logs_col.count()}


@app.post("/logs")
def ingest_log(entry: LogEntry) -> dict:
    """Index a single activity-log entry into the logs collection and mirror
    it to a JSONL file for replay/debugging."""
    eid = f"log::{int(time.time() * 1000)}::{uuid.uuid4().hex[:8]}"
    text = (
        f"[{entry.tag}] {entry.phase}"
        + (f"/{entry.agent_id}" if entry.agent_id else "")
        + f" @ {entry.time or ''} — {entry.msg}"
    )
    logs_col.add(
        ids=[eid],
        documents=[text],
        metadatas=[{
            "kind": "log",
            "phase": entry.phase,
            "tag": entry.tag,
            "time": entry.time or "",
            "agent_id": entry.agent_id or "",
        }],
        embeddings=[_SENTINEL_EMBED],
    )
    with LOG_FILE.open("a", encoding="utf-8") as f:
        f.write(json.dumps({"id": eid, **entry.model_dump()}) + "\n")
    return {"id": eid, "ok": True}


SYSTEM_PROMPT = (
    "You are the SDLC Orchestrator assistant. You help the user understand "
    "the pipeline phases, the agents that run inside each phase, the "
    "documents those agents produce, and recent live activity captured from "
    "the running dashboard.\n\n"
    "Answer ONLY using the context block provided in the user message. If "
    "the answer is not in the context, say so plainly and suggest where in "
    "the pipeline the user might look. Be concise. When citing an agent, "
    "use the format `Phase / AgentName`."
)


@app.post("/chat")
def chat(req: ChatRequest) -> dict:
    if not req.messages:
        raise HTTPException(status_code=400, detail="messages required")
    user_turns = [m for m in req.messages if m.role == "user"]
    if not user_turns:
        raise HTTPException(status_code=400, detail="at least one user message required")
    query = user_turns[-1].content.strip()
    if not query:
        raise HTTPException(status_code=400, detail="empty user message")

    k = req.top_k or TOP_K
    hits = retrieve(query, k)
    context_block = "\n\n---\n\n".join(
        f"[{h['source']}] {h['text']}" for h in hits
    ) or "(no context retrieved)"

    # Conversation history: every prior turn, plus the current question with
    # retrieved context inlined. We DON'T cache the context+question turn
    # because the retrieved chunks change with every query.
    history = [m.model_dump() for m in req.messages[-7:-1]]
    final_user = {
        "role": "user",
        "content": (
            f"Context:\n{context_block}\n\n"
            f"Question: {query}"
        ),
    }
    messages = history + [final_user]

    # cache_control on the system prompt: this is the stable prefix that
    # doesn't change across requests. Anthropic's minimum cacheable prefix
    # on Haiku 4.5 is 4096 tokens; our current system prompt is well under
    # that, so the marker is a forward-looking annotation that will start
    # paying off only if the prompt grows. Harmless when under the threshold
    # (no error, just usage.cache_creation_input_tokens stays 0).
    system = [{
        "type": "text",
        "text": SYSTEM_PROMPT,
        "cache_control": {"type": "ephemeral"},
    }]

    try:
        response = claude.messages.create(
            model=CHAT_MODEL,
            max_tokens=1024,
            system=system,
            messages=messages,
        )
    except anthropic.APIStatusError as e:
        raise HTTPException(status_code=502, detail=f"Claude API error: {e.message}") from e
    except anthropic.APIConnectionError as e:
        raise HTTPException(status_code=503, detail=f"Claude unreachable: {e}") from e

    answer = "".join(b.text for b in response.content if b.type == "text")

    return {
        "answer": answer,
        "sources": [
            {
                "id": h["id"],
                "source": h["source"],
                "metadata": h["metadata"],
                "score": h["score"],
            }
            for h in hits
        ],
        "model": response.model,
        "usage": {
            "input_tokens": response.usage.input_tokens,
            "output_tokens": response.usage.output_tokens,
            "cache_creation_input_tokens": getattr(
                response.usage, "cache_creation_input_tokens", 0
            ),
            "cache_read_input_tokens": getattr(
                response.usage, "cache_read_input_tokens", 0
            ),
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host=HOST, port=PORT, reload=False)
