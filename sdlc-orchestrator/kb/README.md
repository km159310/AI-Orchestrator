# Knowledge Base + Chatbot

A small Python service that indexes this project's agent metadata, generated
documents, and live activity log into **ChromaDB**, then serves a RAG chat
endpoint backed by **Claude** (`claude-haiku-4-5` by default). The browser
dashboard shows a floating "Assistant" button in the topbar that talks to
this server.

## Why the stack looks like this

This machine sits behind a corporate **Zscaler** proxy that returns `403` for:

- `api.openai.com` (OpenAI is blocked)
- `registry.ollama.ai` (Ollama model pulls are blocked)
- `huggingface.co` (sentence-transformers / Chroma's default ONNX model
  downloads are blocked)

`api.anthropic.com` **is** reachable. So:

- **Chat → Anthropic Claude**, via the `anthropic` SDK.
- **Embeddings → none.** Anthropic doesn't offer an embeddings API, and we
  can't download a local embedder. We use **BM25 lexical search**
  (`rank-bm25`, pure Python) over the documents stored in Chroma.
- **Storage → ChromaDB** (the user explicitly asked for it). Docs are stored
  with a sentinel `[0.0]` embedding because Chroma requires *something*; we
  never query by vector similarity.

## Architecture

```
 browser ──POST /logs──▶  FastAPI ──store──▶  Chroma kb_logs
   │                          │
   ▼                          ▼
chatbot ──POST /chat──▶  BM25 over kb_docs + kb_logs ──▶ Claude messages ──▶ answer
```

## 1) Configure the API key

Edit `kb/.env`:

```
ANTHROPIC_API_KEY=sk-ant-api03-...your fresh key...
ANTHROPIC_CHAT_MODEL=claude-haiku-4-5   # or claude-sonnet-4-6 for higher quality
```

> ⚠️ **Rotate the key before relying on it.** Both API keys that have lived
> in this `.env` so far were exposed via chat transcripts and should be
> considered compromised. Generate a new one at
> <https://console.anthropic.com/settings/keys>.

## 2) Install Python deps (Windows PowerShell)

```powershell
cd kb
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

`requirements.txt` installs `chromadb`, `anthropic`, `fastapi`, `uvicorn`,
`python-dotenv`, `pydantic`, `truststore` (corporate-cert TLS), and
`rank-bm25`.

## 3) Build the knowledge base (one-time / after content changes)

```powershell
python ingest.py
```

Writes 71 records to `kb/chroma_store/`:
- 29 per-agent cards (id, name, phase, description, sample stream lines)
- generated-document sections from `documents.js`
- chunked `README.md` and `docs/architecture.md`
- a phase-index card

Rebuilds `kb_docs` each run; `kb_logs` is left alone so live log history
survives.

## 4) Start the server

```powershell
python server.py
# → http://127.0.0.1:8765
```

Verify:

```powershell
curl http://127.0.0.1:8765/health
```

Expect:
```json
{"status":"ok","provider":"anthropic","chat_model":"claude-haiku-4-5",
 "retrieval":"bm25","docs":71,"logs":0}
```

## 5) Use the dashboard

Open `../index.html` in a browser. The "Assistant" button in the topbar
(next to Reset) shows `● online · N docs · M logs` once the backend is
reachable. Every entry that appears in the Activity Log is also POSTed to
`/logs` and indexed into `kb_logs` in the background.

Try asking:

- *"What does the Validator Agent produce?"*
- *"List the agents in the Deployment phase."*
- *"Summarise the last few activity log entries."*
- *"What's the unit-test coverage gate?"*

## API

| Method | Path     | Body                                            | Notes                          |
|--------|----------|-------------------------------------------------|--------------------------------|
| GET    | /health  | —                                               | counts + model info            |
| GET    | /stats   | —                                               | doc / log counts               |
| POST   | /logs    | `{msg, tag?, phase?, time?, agent_id?}`         | called by `logger.js`          |
| POST   | /chat    | `{messages: [{role, content}, ...], top_k?}`    | RAG over `kb_docs` + `kb_logs` |

The `/chat` response shape:

```json
{
  "answer": "…",
  "sources": [
    {"id": "agent::req::risk", "source": "docs", "metadata": {…}, "score": 5.27},
    …
  ],
  "model": "claude-haiku-4-5-20251001",
  "usage": {
    "input_tokens": 892,
    "output_tokens": 150,
    "cache_creation_input_tokens": 0,
    "cache_read_input_tokens": 0
  }
}
```

## Pointing the browser at a different host

Set `window.KB_BASE_URL = 'http://my-host:8765'` **before** `logger.js` and
`chatbot.js` load (e.g. in a `<script>` tag in `index.html`). Default is
`http://127.0.0.1:8765`.

## Notes on prompt caching

The system prompt has a `cache_control: {type: "ephemeral"}` marker, but
Claude's minimum cacheable prefix on Haiku 4.5 is **4096 tokens** — our
current system prompt is well under that, so `cache_read_input_tokens`
stays `0`. The marker is a forward-looking annotation that will start
paying off if the prompt grows. Harmless when under the threshold.

The retrieved-context block is **not** cached because the chunks change
with every query.

## Cost ballpark

With `claude-haiku-4-5` ($1 / $5 per 1M tokens input/output) and a ~900-token
context + ~150-token answer: about **$0.0017 per /chat call**. /logs is free
(no Claude call — just a Chroma write).

## Files

- `ingest.py` — parses JS data files with regex (no Node runtime needed) and
  writes each agent card / document section / markdown chunk to Chroma.
- `server.py` — FastAPI app exposing `/health`, `/logs`, `/chat`, `/stats`.
  Uses `anthropic.Anthropic` for chat and `rank_bm25.BM25Okapi` for
  retrieval.
- `chroma_store/` — persistent Chroma DB (gitignored).
- `activity_log.jsonl` — append-only mirror of every `/logs` POST (gitignored).
