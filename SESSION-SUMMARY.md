# AI Orchestrator — Session Summary

**Date:** 2026-06-06
**Project:** AI Orchestrator (formerly SDLC Orchestrator) — ABC Bank Application demo
**Working dir:** `c:\Users\159310\Downloads\sdlc-orchestrator\`

This document captures every change requested and built in this session, in chronological order.

---

## Phase 1 — UI polish on the vanilla orchestrator

| # | Request | Outcome |
|---|---|---|
| 1 | "i want nice front end look" | Restyled from dark/neon to clean light/professional theme; widened layout to 1180px; switched primary font to Inter; added soft drop-shadows; new design tokens in [public/css/variables.css](sdlc-orchestrator/public/css/variables.css) |
| 2 | "remove system online" | Removed the system-online pill from the topbar |
| 3 | "update sdlc orchestrator to run local host" | Created [start.ps1](sdlc-orchestrator/start.ps1) + [package.json](sdlc-orchestrator/package.json); Python http.server on `:3000` |
| 4 | "remove options to Extract with AI suggestions" | Removed the AI suggestion chips panel + dead `AI_SUGGESTIONS` data |
| 5 | "rename from Phase agents to Phases" | Renamed section label and Run button in all three phase renderers |

---

## Phase 2 — Real bank app generator

| # | Request | Outcome |
|---|---|---|
| 6 | "agent should create real ABC BANK application and run with different port after dev phase completed" | Built [server.py](sdlc-orchestrator/server.py) with `/api/generate-app`, `/api/launch`, `/api/stop`, `/api/status`. After Dev phase agents finish, materializes a real HTML/CSS/JS bank app (`index.html`, `dashboard.html`, `data.js`, `app.js`, `styles.css`, `README.md`) into [generated-app/](sdlc-orchestrator/generated-app/) and spawns `python -m http.server <port>` subprocesses on demand. Demo login: `demo` / `demo123` |

---

## Phase 3 — Next.js migration

| # | Request | Outcome |
|---|---|---|
| 7 | "i want change frontend to react/next js" | Scaffolded **34 files** at [sdlc-orchestrator-next/](sdlc-orchestrator-next/): Next.js 15 + React 19 + TypeScript 5.7 + Zustand 5. Vanilla app kept side-by-side for comparison |
| 8 | "run next.js in :3030" | Node not installed → winget blocked by group policy → portable Node download from `nodejs.org` got DPI-cut at 700KB → switched to `npmmirror.com` (32MB success) → extracted to `%LOCALAPPDATA%\SdlcOrch\` → `npm install` (304 packages, ~2.5 min) → `npm run dev` on `:3030` |
| 9 | "start local host application to validate" | Launched bank app on `:3001` and `:3002`; verified end-to-end with both UIs |

---

## Phase 4 — UI text tweaks

| # | Request | Outcome |
|---|---|---|
| 10 | "Rename Extract With AI to Validate Requirement" | Button + instruction text updated in both apps |
| 11 | 'remove instruction "Paste your description above then click..."' | Removed the helper hint |
| 12 | "change name from SDLC Orchestrator to AI Orchestrator" | Rebranded title, brand text, boot log, favicon |
| 13 | "create more attractive AI Orchestrator with logo and design the name" | Custom inline SVG: orbital ring + satellite nodes (top one pulses) + "AI" letters; gradient wordmark via `background-clip: text` |
| 14 | "rename ABC Bank · AI-Powered SDLC Pipeline to AI-Powered SDLC Pipeline" | Trimmed subtitle prefix |

---

## Phase 5 — Pipeline behavior

| # | Request | Outcome |
|---|---|---|
| 15 | "add feature to return back where if rejected phase" | Added `↩ Back to <previous>` button on rejected state; flips previous phase from `done` back to `active` so it can be revised |
| 16 | "Console Error: The result of getSnapshot should be cached to avoid an infinite loop" | Fixed Zustand selector bug in [SignOff.tsx](sdlc-orchestrator-next/components/SignOff.tsx): `s.approvers[pid] \|\| {}` (new `{}` per render) → `s.approvers[pid] ?? EMPTY_APPROVERS` (frozen module-level ref) |
| 17 | "is there a way to fix?" | Confirmed the fix was live + compiled |
| 18 | "run task agents one after another not run at same time" | Refactored both agent runners ([runner.js](sdlc-orchestrator/src/agents/runner.js) + [useAgentRunner.ts](sdlc-orchestrator-next/lib/useAgentRunner.ts)) to sequential execution — agent N+1 starts only after N is done |

---

## Phase 6 — Real agent + integrations

| # | Request | Outcome |
|---|---|---|
| 19 | "Requirement agent need extract & parse the input document and generate" | Replaced fake 4-step timer with `/api/extract` endpoint: regex-based heuristic NLP — modal verbs → priority (`must`/`should`/`nice`), port detection, security-keyword risk count, stakeholder role patterns. TXT/MD file uploads supported via `FileReader.readAsText` |
| 20 | "provide each phase add relevant image" | Added 7 phase hero banners (Requirements, Design, Development, Testing, Security, Deployment, Review). Each has phase-specific gradient, 56×56 frosted icon tile, title + tagline, 3 decorative icons, dot pattern overlay, soft corner circle |
| 21 | "Existing project — PR agent should trigger Jenkins pipeline feature branch" | Built `/api/jenkins/trigger`, `/api/jenkins/status`, `/api/jenkins/info` with HTTP Basic auth. Detected real Jenkins 2.529 on `localhost:8080`. Editable branch input, live polling every 2.5s, stages from Pipeline Stage View plugin, "View in Jenkins" link |
| 22 | "can we provide mock values for JENKINS_USER / JENKINS_TOKEN" | Auto-fallback to in-process mock when creds not set: 5-stage simulated pipeline (Checkout SCM → Build → Test → Deploy → Notify, ~2.5s per stage). `MOCK` amber badge in UI; "View in Jenkins" link hidden for mock URLs |

---

## Phase 7 — Final polish

| # | Request | Outcome |
|---|---|---|
| 23 | "what are the technology used this project" | Provided tech stack summary covering frontend (vanilla + Next.js), backend (Python stdlib only), integrations (Jenkins + mock), tooling, and architecture diagram |
| 24 | "Add reject reason and check mark verified to proceed" | Two-step reject flow: click Reject → inline textarea + Confirm/Cancel → on confirm, status flips to rejected with reason stored. Rejected banner shows reason + verify checkbox. Run phases / Back buttons disabled until checkbox is checked. Auto-clears on approve |
| 25 | "Add tech stack selector under New project: Java/J2EE, Python, .NET" | Three-option `ch-row-3` grid that appears after picking "New project". Icons: `ti-coffee` (Java), `ti-brand-python` (Python), `ti-brand-c-sharp` (.NET). Run phases gated until a stack is picked. Switching back to "Existing project" auto-clears |
| 26 | "create overall summary" | This document |

---

## Final architecture

```
  ┌─ Browser ──────────────────────────────────────────┐
  │  http://localhost:3000  vanilla orchestrator        │
  │  http://localhost:3030  Next.js orchestrator        │
  │  http://localhost:3001  ABC Bank instance #1        │
  │  http://localhost:3002  ABC Bank instance #2        │
  │  http://localhost:8080  Jenkins (or mock fallback)  │
  └────────────────┬───────────────────────────────────┘
                   │ fetch('/api/...')
                   ▼  (Next.js rewrites /api/* → :3000)
  ┌────────────────────────────────────────────────────┐
  │  server.py  ─── Python http.server + thread pool   │
  │  • /api/extract           heuristic BRD parser     │
  │  • /api/generate-app      writes bank app files    │
  │  • /api/launch /stop      subprocess manager       │
  │  • /api/jenkins/*         real Jenkins OR mock     │
  └────────────────────────────────────────────────────┘
```

## Tech stack (one-line view)

- **Vanilla app:** HTML5 + CSS3 + ES6+ JS (IIFE modules), Tabler Icons, Inter + JetBrains Mono
- **Next.js port:** Next.js 15.5 (App Router), React 19, TypeScript 5.7, Zustand 5
- **Backend:** Python 3.13 — stdlib only, no pip packages
- **Generated bank app:** Pure HTML/CSS/JS, sessionStorage auth
- **Integrations:** Jenkins (real + auto-mock fallback)
- **Runtime:** Windows 11 + PowerShell 5.1 + portable Node 22 LTS

## Session stats

| Metric | Count |
|---|---|
| Distinct requests fulfilled | 26 |
| Frontend codebases kept in sync | 2 (vanilla + Next.js) |
| External integrations added | 4 (file generation, subprocess spawning, BRD parsing, Jenkins + mock) |
| Phase hero banners designed | 7 |
| Tech stack options added | 3 (Java / Python / .NET) |
| Corporate-network workarounds | 1 (npmmirror.com after DPI-blocked nodejs.org download) |

---

## How to run everything

In one PowerShell:

```powershell
cd c:\Users\159310\Downloads\sdlc-orchestrator\sdlc-orchestrator
python server.py
# → http://localhost:3000 (vanilla)
```

In another PowerShell (for the Next.js port):

```powershell
$env:Path = "$env:LOCALAPPDATA\SdlcOrch\node-v22.11.0-win-x64;$env:Path"
cd c:\Users\159310\Downloads\sdlc-orchestrator\sdlc-orchestrator-next
npm run dev
# → http://localhost:3030 (Next.js)
```

Optional — enable real Jenkins (otherwise mock runs automatically):

```powershell
$env:JENKINS_URL   = "http://localhost:8080"
$env:JENKINS_USER  = "<your-username>"
$env:JENKINS_TOKEN = "<your-api-token>"
$env:JENKINS_JOB   = "abc-bank"
```
