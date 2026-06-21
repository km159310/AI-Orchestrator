"""
Ingest static project knowledge into ChromaDB.

Sources scanned (relative to repo root):
  - src/data/agents.js          per-agent metadata (name, phase, description)
  - src/data/streams.js          per-agent simulated activity stream lines
  - src/data/documents.js        full per-agent support documents
                                 (title, meta, sections with paragraphs, tables, lists)
  - src/data/phases.js           phase definitions
  - docs/architecture.md         project architecture notes
  - README.md                    project overview

Two Chroma collections are written:
  - kb_docs   static knowledge above (re-built each run)
  - kb_logs   left alone here; populated at runtime via the /logs endpoint

NOTE on embeddings: Anthropic does not offer an embeddings API, and the
corporate Zscaler proxy on this machine blocks model downloads from
huggingface.co (so sentence-transformers / Chroma's default ONNX embedder
cannot bootstrap either). We therefore store docs with a sentinel embedding
(`[0.0]`) and do retrieval via BM25 over the stored documents at query time.

Run:
  python ingest.py            # full rebuild of kb_docs
"""
from __future__ import annotations

import os
import re
import sys
from pathlib import Path

try:
    import truststore
    truststore.inject_into_ssl()
except ImportError:
    pass

from dotenv import load_dotenv

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
load_dotenv(HERE / ".env")

import chromadb
from chromadb.config import Settings

_SENTINEL_EMBED = [0.0]


# ---------------------------------------------------------------------------
# Balanced-brace walker for JS object literals
# ---------------------------------------------------------------------------

def _find_balanced(s: str, start: int, open_ch: str, close_ch: str) -> int:
    """Return the index of close_ch matching open_ch at s[start]. Respects
    single-quoted strings (the convention used throughout the data files)
    and escaped characters. Returns -1 if no match found."""
    assert s[start] == open_ch
    depth = 0
    i = start
    in_str = False
    esc = False
    while i < len(s):
        c = s[i]
        if in_str:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == "'":
                in_str = False
        else:
            if c == "'":
                in_str = True
            elif c == open_ch:
                depth += 1
            elif c == close_ch:
                depth -= 1
                if depth == 0:
                    return i
        i += 1
    return -1


def _unescape(s: str) -> str:
    return s.replace("\\'", "'").replace("\\\\", "\\")


def _strings_in(s: str) -> list[str]:
    """Pull every single-quoted string out of s, in order, unescaped."""
    return [_unescape(m) for m in re.findall(r"'((?:[^'\\]|\\.)*)'", s)]


# ---------------------------------------------------------------------------
# Source parsers — agents and streams (unchanged)
# ---------------------------------------------------------------------------

_PHASE_LABELS = {
    "req": "Requirements",
    "design": "Design",
    "dev": "Development",
    "test": "Testing",
    "pr": "PR (Pull Request)",
    "par": "PAR Approval",
    "deploy": "Deployment",
    "review": "Release Review",
    "monitor": "Dashboard & Observability",
}


def parse_agents(path: Path) -> list[dict]:
    text = path.read_text(encoding="utf-8")
    out: list[dict] = []
    phase_block = re.compile(r"(\w+)\s*:\s*\[(.*?)\]\s*,", re.DOTALL)
    agent_obj = re.compile(
        r"\{\s*id\s*:\s*'([^']+)'\s*,\s*name\s*:\s*'([^']+)'.*?desc\s*:\s*'([^']+)'\s*[,}]",
        re.DOTALL,
    )
    for pm in phase_block.finditer(text):
        phase_id = pm.group(1)
        if phase_id not in _PHASE_LABELS:
            continue
        body = pm.group(2)
        for am in agent_obj.finditer(body):
            aid, name, desc = am.group(1), am.group(2), am.group(3)
            out.append({
                "agent_id": aid,
                "agent_name": name,
                "phase_id": phase_id,
                "phase_label": _PHASE_LABELS[phase_id],
                "description": desc,
            })
    return out


def parse_streams(path: Path) -> dict[str, list[list[str]]]:
    text = path.read_text(encoding="utf-8")
    streams: dict[str, list[list[str]]] = {}
    streams_obj = re.search(r"const STREAMS\s*=\s*\{(.*)\};\s*$", text, re.DOTALL)
    if not streams_obj:
        return streams
    body = streams_obj.group(1)
    phase_block = re.compile(r"(\w+)\s*:\s*\[(.*?)\]\s*,\s*(?=\w+\s*:|$)", re.DOTALL)
    for pm in phase_block.finditer(body):
        phase_id = pm.group(1)
        if phase_id not in _PHASE_LABELS:
            continue
        inner = pm.group(2)
        arrays = re.findall(r"\[([^\[\]]*?)\]", inner, re.DOTALL)
        parsed: list[list[str]] = []
        for arr in arrays:
            lines = _strings_in(arr)
            if lines:
                parsed.append(lines)
        streams[phase_id] = parsed
    return streams


# ---------------------------------------------------------------------------
# documents.js — full per-agent support docs
# ---------------------------------------------------------------------------

def _render_section(sec: str) -> str:
    """Render one section object `{h, p|list|table}` as markdown text."""
    h_m = re.search(r"h\s*:\s*'((?:[^'\\]|\\.)*)'", sec)
    heading = _unescape(h_m.group(1)) if h_m else ""

    # paragraph
    p_m = re.search(r"p\s*:\s*'((?:[^'\\]|\\.)*)'", sec)
    if p_m:
        return f"## {heading}\n\n{_unescape(p_m.group(1))}"

    # list
    l_m = re.search(r"list\s*:\s*\[", sec)
    if l_m:
        l_start = l_m.end() - 1
        l_end = _find_balanced(sec, l_start, "[", "]")
        if l_end > l_start:
            items = _strings_in(sec[l_start + 1:l_end])
            body = "\n".join(f"- {it}" for it in items)
            return f"## {heading}\n\n{body}" if items else f"## {heading}"

    # table
    t_m = re.search(r"table\s*:\s*\{", sec)
    if t_m:
        t_start = t_m.end() - 1
        t_end = _find_balanced(sec, t_start, "{", "}")
        if t_end > t_start:
            tbl = sec[t_start + 1:t_end]
            cols_m = re.search(r"cols\s*:\s*\[", tbl)
            cols: list[str] = []
            if cols_m:
                cs = cols_m.end() - 1
                ce = _find_balanced(tbl, cs, "[", "]")
                if ce > cs:
                    cols = _strings_in(tbl[cs + 1:ce])
            rows: list[list[str]] = []
            rows_m = re.search(r"rows\s*:\s*\[", tbl)
            if rows_m:
                rs = rows_m.end() - 1
                re_ = _find_balanced(tbl, rs, "[", "]")
                if re_ > rs:
                    r_body = tbl[rs + 1:re_]
                    for row_m in re.finditer(r"\[((?:[^\[\]]|\\.)*)\]", r_body, re.DOTALL):
                        rows.append(_strings_in(row_m.group(1)))
            if cols:
                md = f"## {heading}\n\n"
                md += "| " + " | ".join(cols) + " |\n"
                md += "| " + " | ".join(["---"] * len(cols)) + " |\n"
                for row in rows:
                    # pad short rows so markdown stays valid
                    padded = (row + [""] * len(cols))[:len(cols)]
                    md += "| " + " | ".join(padded) + " |\n"
                return md.rstrip()

    return f"## {heading}"


def parse_agent_documents(path: Path) -> list[dict]:
    """Walk DOCS = { phase: { tabs: [...], contents: [{title, meta, sections}, ...] } }
    and return one record per document, fully rendered as markdown."""
    text = path.read_text(encoding="utf-8")
    m = re.search(r"const DOCS\s*=\s*\{", text)
    if not m:
        return []
    docs_start = m.end() - 1
    docs_end = _find_balanced(text, docs_start, "{", "}")
    if docs_end < 0:
        return []
    docs_body = text[docs_start + 1:docs_end]

    results: list[dict] = []

    # Walk phase entries. Phase keys are at the top level of DOCS — find each
    # `<phase_id>: { ... }` whose body contains `tabs:` and `contents:`.
    i = 0
    while i < len(docs_body):
        key_m = re.compile(r"(\w+)\s*:\s*\{").search(docs_body, i)
        if not key_m:
            break
        phase_id = key_m.group(1)
        brace_start = key_m.end() - 1
        brace_end = _find_balanced(docs_body, brace_start, "{", "}")
        if brace_end < 0:
            break
        phase_body = docs_body[brace_start + 1:brace_end]

        if phase_id in _PHASE_LABELS:
            # tabs
            tabs: list[str] = []
            tabs_m = re.search(r"tabs\s*:\s*\[", phase_body)
            if tabs_m:
                ts = tabs_m.end() - 1
                te = _find_balanced(phase_body, ts, "[", "]")
                if te > ts:
                    tabs = _strings_in(phase_body[ts + 1:te])

            # contents
            contents_m = re.search(r"contents\s*:\s*\[", phase_body)
            if contents_m:
                cs = contents_m.end() - 1
                ce = _find_balanced(phase_body, cs, "[", "]")
                if ce > cs:
                    c_body = phase_body[cs + 1:ce]
                    doc_idx = 0
                    j = 0
                    while j < len(c_body):
                        # skip whitespace/commas between docs
                        while j < len(c_body) and c_body[j] in " \t\r\n,":
                            j += 1
                        if j >= len(c_body) or c_body[j] != "{":
                            break
                        d_end = _find_balanced(c_body, j, "{", "}")
                        if d_end < 0:
                            break
                        doc_text = c_body[j:d_end + 1]

                        title = ""
                        t_m = re.search(r"title\s*:\s*'((?:[^'\\]|\\.)*)'", doc_text)
                        if t_m:
                            title = _unescape(t_m.group(1))

                        author = ""
                        a_m = re.search(r"author\s*:\s*'((?:[^'\\]|\\.)*)'", doc_text)
                        if a_m:
                            author = _unescape(a_m.group(1))

                        status = ""
                        s_m = re.search(r"status\s*:\s*'((?:[^'\\]|\\.)*)'", doc_text)
                        if s_m:
                            status = _unescape(s_m.group(1))

                        ver = ""
                        v_m = re.search(r"ver\s*:\s*'((?:[^'\\]|\\.)*)'", doc_text)
                        if v_m:
                            ver = _unescape(v_m.group(1))

                        rendered_sections: list[tuple[str, str]] = []  # (heading, body_md)
                        sec_m = re.search(r"sections\s*:\s*\[", doc_text)
                        if sec_m:
                            ss = sec_m.end() - 1
                            se = _find_balanced(doc_text, ss, "[", "]")
                            if se > ss:
                                s_body = doc_text[ss + 1:se]
                                k = 0
                                while k < len(s_body):
                                    while k < len(s_body) and s_body[k] in " \t\r\n,":
                                        k += 1
                                    if k >= len(s_body) or s_body[k] != "{":
                                        break
                                    sec_end = _find_balanced(s_body, k, "{", "}")
                                    if sec_end < 0:
                                        break
                                    sec_text = s_body[k:sec_end + 1]
                                    h_m = re.search(r"h\s*:\s*'((?:[^'\\]|\\.)*)'", sec_text)
                                    heading = _unescape(h_m.group(1)) if h_m else ""
                                    rendered_sections.append(
                                        (heading, _render_section(sec_text))
                                    )
                                    k = sec_end + 1

                        tab = tabs[doc_idx] if doc_idx < len(tabs) else ""
                        results.append({
                            "phase_id": phase_id,
                            "tab": tab,
                            "author": author,
                            "title": title,
                            "status": status,
                            "ver": ver,
                            "sections": rendered_sections,
                        })
                        doc_idx += 1
                        j = d_end + 1

        i = brace_end + 1

    return results


def read_text_file(path: Path) -> str:
    return path.read_text(encoding="utf-8") if path.exists() else ""


def chunk_text(text: str, size: int = 1200, overlap: int = 150) -> list[str]:
    text = text.strip()
    if not text:
        return []
    if len(text) <= size:
        return [text]
    out: list[str] = []
    i = 0
    while i < len(text):
        out.append(text[i:i + size])
        if i + size >= len(text):
            break
        i += size - overlap
    return out


# ---------------------------------------------------------------------------
# Build records
# ---------------------------------------------------------------------------

def build_records() -> list[dict]:
    records: list[dict] = []

    agents = parse_agents(ROOT / "src" / "data" / "agents.js")
    streams = parse_streams(ROOT / "src" / "data" / "streams.js")

    # Build a quick lookup: agent_name → agent record (for linking documents).
    agent_by_name: dict[str, dict] = {a["agent_name"]: a for a in agents}

    # ---- One card record per agent (id, name, phase, purpose, sample stream)
    for a in agents:
        phase_streams = streams.get(a["phase_id"], [])
        phase_agents = [x for x in agents if x["phase_id"] == a["phase_id"]]
        idx = next(
            (i for i, x in enumerate(phase_agents) if x["agent_id"] == a["agent_id"]),
            -1,
        )
        stream_lines = phase_streams[idx] if 0 <= idx < len(phase_streams) else []
        body = (
            f"Agent: {a['agent_name']}\n"
            f"Phase: {a['phase_label']} ({a['phase_id']})\n"
            f"ID: {a['agent_id']}\n"
            f"Purpose: {a['description']}\n"
        )
        if stream_lines:
            body += "\nTypical activity stream:\n" + "\n".join(
                f"  - {ln}" for ln in stream_lines
            )
        records.append({
            "id": f"agent::{a['phase_id']}::{a['agent_id']}",
            "text": body,
            "metadata": {
                "kind": "agent_card",
                "agent_id": a["agent_id"],
                "agent_name": a["agent_name"],
                "phase_id": a["phase_id"],
                "phase_label": a["phase_label"],
            },
        })

    # ---- One record per SECTION of each agent's support document.
    # Chunking by section keeps BM25 retrieval focused — a question about
    # "functional requirements" hits the FR section directly instead of
    # competing with every other section in the same long document.
    seen_doc_ids: set[str] = set()
    for d in parse_agent_documents(ROOT / "src" / "data" / "documents.js"):
        a = agent_by_name.get(d["author"])
        agent_id = a["agent_id"] if a else ""
        phase_label = (
            a["phase_label"] if a else _PHASE_LABELS.get(d["phase_id"], d["phase_id"])
        )
        slug = agent_id or d["author"].lower().replace(" ", "_") or "unknown"
        rec_id_base = f"doc::{d['phase_id']}::{slug}"
        # Collision suffix when two phases reuse an agent_id (e.g. par/risk).
        base = rec_id_base
        n = 2
        while rec_id_base in seen_doc_ids:
            rec_id_base = f"{base}::{n}"
            n += 1
        seen_doc_ids.add(rec_id_base)

        header = (
            f"Support Document: {d['title']}\n"
            f"Produced by: {d['author']}"
            + (f" (agent_id: {agent_id})" if agent_id else "")
            + f"\nPhase: {phase_label} ({d['phase_id']})"
            f"\nTab: {d['tab']}"
            f"\nStatus: {d['status']}  Version: {d['ver']}"
        )

        for s_idx, (heading, sec_md) in enumerate(d["sections"]):
            heading_slug = (
                re.sub(r"[^a-z0-9]+", "_", heading.lower()).strip("_") or f"s{s_idx}"
            )
            records.append({
                "id": f"{rec_id_base}::{heading_slug}",
                # Each section carries the doc header so even a small chunk
                # tells Claude which agent / phase / document it came from.
                "text": f"{header}\n\n{sec_md}",
                "metadata": {
                    "kind": "agent_doc_section",
                    "agent_id": agent_id,
                    "agent_name": d["author"],
                    "phase_id": d["phase_id"],
                    "phase_label": phase_label,
                    "tab": d["tab"],
                    "title": d["title"],
                    "section_heading": heading,
                    "status": d["status"],
                    "ver": d["ver"],
                },
            })

    # ---- Markdown files (README, architecture notes)
    md_sources = [
        (ROOT / "README.md", "readme"),
        (ROOT / "docs" / "architecture.md", "architecture"),
    ]
    for path, label in md_sources:
        raw = read_text_file(path)
        for i, ch in enumerate(chunk_text(raw)):
            records.append({
                "id": f"md::{label}::{i}",
                "text": ch,
                "metadata": {
                    "kind": "markdown",
                    "source": label,
                    "path": str(path.relative_to(ROOT)),
                },
            })

    # ---- Phase index card
    phases_js = read_text_file(ROOT / "src" / "data" / "phases.js")
    if phases_js:
        records.append({
            "id": "phases::index",
            "text": (
                "SDLC Orchestrator pipeline phases (in order):\n"
                "Requirements → Design → Development → Testing → PR (Pull Request)\n"
                "→ PAR Approval → Deployment → Release Review → Dashboard & Observability.\n\n"
                "Source listing:\n" + phases_js
            ),
            "metadata": {"kind": "phase_index"},
        })

    return records


# ---------------------------------------------------------------------------
# Chroma write
# ---------------------------------------------------------------------------

def main() -> int:
    records = build_records()
    if not records:
        print("No records produced — nothing to ingest.", file=sys.stderr)
        return 1

    # Summary
    kinds: dict[str, int] = {}
    for r in records:
        k = r["metadata"].get("kind", "other")
        kinds[k] = kinds.get(k, 0) + 1
    print(f"Building kb_docs with {len(records)} records:")
    for k, n in sorted(kinds.items()):
        print(f"  {k:14s} {n}")

    client = chromadb.PersistentClient(
        path=str(HERE / "chroma_store"),
        settings=Settings(anonymized_telemetry=False),
    )
    try:
        client.delete_collection("kb_docs")
    except Exception:
        pass
    docs = client.create_collection(
        name="kb_docs",
        metadata={"hnsw:space": "cosine"},
    )

    batch = 64
    for i in range(0, len(records), batch):
        chunk = records[i:i + batch]
        docs.add(
            ids=[r["id"] for r in chunk],
            documents=[r["text"] for r in chunk],
            metadatas=[r["metadata"] for r in chunk],
            embeddings=[_SENTINEL_EMBED] * len(chunk),
        )
        print(f"  + {min(i + batch, len(records))}/{len(records)}")

    try:
        client.get_collection("kb_logs")
    except Exception:
        client.create_collection(name="kb_logs", metadata={"hnsw:space": "cosine"})

    print(f"Done. {len(records)} records in kb_docs at {HERE / 'chroma_store'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
