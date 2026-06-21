---
name: ai-orchestrator
description: Run, demo, debug, or extend the AI Orchestrator — an AI-powered SDLC pipeline that accepts a plain-text BRD, extracts structured requirements, walks through 7 phase-by-phase AI agents with human sign-off, materialises a runnable ABC Bank application on disk, and triggers a Jenkins build for existing-project flows (with auto-mock fallback when credentials aren't configured).
---

# AI Orchestrator

A reusable skill for working with the AI Orchestrator project at `c:\Users\159310\Downloads\sdlc-orchestrator\`. Use this skill when the user wants to **run a demo**, **add a new phase / agent**, **debug a frontend or backend issue**, or **change the BRD parser / Jenkins integration**.

---

## When to use this skill

- "Start the orchestrator", "run the demo", "show me the bank app"
- "Add a new phase / agent / approver"
- "The Jenkins button doesn't work" / "agents aren't running" / "BRD won't extract"
- "Change the look", "rename a phase", "tweak the logo"
- "How does the pipeline state work?" / "Where is X defined?"

## When NOT to use this skill

- Generic web-dev questions unrelated to this project
- Help installing Node / Python / Jenkins itself (refer to vendor docs)
- The user is working on a different codebase

---

## Project layout

```
sdlc-orchestrator/                ← project root
├── SESSION-SUMMARY.md            ← full change log
├── skill.md                      ← this file
├── make_ppt.py                   ← regenerates the feature deck
├── AI-Orchestrator-Features.pptx ← 14-slide overview
├── sdlc-orchestrator/            ← vanilla JS app (port :3000)
│   ├── index.html
│   ├── server.py                 ← Python backend (serves both UIs' /api/*)
│   ├── start.ps1
│   ├── src/                      ← IIFE-pattern JS modules
│   │   ├── app.js                ← controller (App.startAgents, approvePhase, …)
│   │   ├── utils/{state,logger}.js
│   │   ├── data/{phases,agents,streams,documents,signoffs,brd}.js
│   │   ├── components/{strip,brdInput,agentGrid,docViewer,signOff,prAgent,
│   │   │              bankApp,phaseHero,rejectControl}.js
│   │   ├── phases/{requirements,development,generic}.js
│   │   └── agents/runner.js      ← sequential agent timer simulation
│   ├── public/css/               ← 11 modular stylesheets
│   └── generated-app/            ← real ABC Bank app written at dev-phase end
└── sdlc-orchestrator-next/       ← Next.js port (port :3030)
    ├── app/{layout,page,globals.css}.tsx
    ├── components/               ← React equivalents of the vanilla components
    ├── lib/                      ← store.ts (Zustand), api.ts, useActions.ts,
    │                              useAgentRunner.ts, types.ts
    └── data/                     ← TS ports of the vanilla data files
```

## Backend endpoints (all in [sdlc-orchestrator/server.py](sdlc-orchestrator/server.py))

| Endpoint | Purpose |
|---|---|
| `POST /api/extract` | Heuristic NLP — modal verbs → priority, regex for ports/risks/stakeholders |
| `POST /api/generate-app` | Writes 6 bank-app files to `generated-app/` |
| `POST /api/launch?port=N` | Spawns `python -m http.server N --directory generated-app` |
| `POST /api/stop?port=N` | Kills the subprocess on that port |
| `GET /api/status` | Lists currently-running bank-app ports |
| `POST /api/jenkins/trigger` | Real Jenkins build via Basic auth (or mock if creds missing) |
| `GET /api/jenkins/status?queueUrl=...` | Polls build state + stages |
| `GET /api/jenkins/info` | Returns config + `mock: true/false` |

Next.js dev server **rewrites `/api/*` → `http://localhost:3000`** via [next.config.ts](sdlc-orchestrator-next/next.config.ts).

---

## Run the demo

```powershell
# Terminal 1 — Python backend
cd c:\Users\159310\Downloads\sdlc-orchestrator\sdlc-orchestrator
python server.py
# → http://localhost:3000 (vanilla orchestrator)
```

```powershell
# Terminal 2 — Next.js (portable Node was installed to LOCALAPPDATA)
$env:Path = "$env:LOCALAPPDATA\SdlcOrch\node-v22.11.0-win-x64;$env:Path"
cd c:\Users\159310\Downloads\sdlc-orchestrator\sdlc-orchestrator-next
npm run dev
# → http://localhost:3030 (Next.js orchestrator)
```

Optional — connect to real Jenkins (otherwise mock auto-fires):
```powershell
$env:JENKINS_USER  = "<username>"
$env:JENKINS_TOKEN = "<api token from Jenkins User → Configure>"
$env:JENKINS_JOB   = "abc-bank"   # default — override if your job has a different name
```

## Demo walkthrough

1. **Paste** a description (or upload .txt/.md) → click **Validate Requirement**
2. Pick **Project type**: New or Existing
3. *(New)* Pick a **Technology stack**: Java / Python / .NET
4. *(Existing)* PR agent appears with editable branch + **Trigger Jenkins** button
5. **Run phases** — 4 agents tick through one after another
6. Stakeholders sign off → **Approve & advance** (or **Reject** with reason)
7. Pipeline auto-advances through Design → Development → Testing → Security → Deployment → Review
8. After Dev: **Launcher panel** appears → click `:3001` Launch → open http://localhost:3001 → login `demo` / `demo123`

---

## Common modifications

### Add a new phase
1. Add to `PHASES` in [vanilla data/phases.js](sdlc-orchestrator/src/data/phases.js) **and** [Next.js data/phases.ts](sdlc-orchestrator-next/data/phases.ts) — keep IDs in sync
2. Add the phase ID to the `PhaseId` union in [types.ts](sdlc-orchestrator-next/lib/types.ts)
3. Add agents to `AGENTS` and streams to `STREAMS` in both apps' data files
4. Add a `PhaseHero` scheme in [phaseHero.js](sdlc-orchestrator/src/components/phaseHero.js) + [PhaseHero.tsx](sdlc-orchestrator-next/components/PhaseHero.tsx)
5. Initial `statuses` array length must match — bump from 7 → 8 in [vanilla state.js](sdlc-orchestrator/src/utils/state.js) + [Next.js store.ts](sdlc-orchestrator-next/lib/store.ts)

### Rename a label
- Search both apps with `Grep` for the literal text — usually exists in 2 places
- The Next.js dev server hot-reloads; vanilla needs a browser refresh

### Change the BRD parser
- Single source of truth: `_extract_brd()` in [server.py](sdlc-orchestrator/server.py)
- Restart `server.py` after editing — Python doesn't hot-reload

### Switch Jenkins from real to mock or vice-versa
- Real → set both `JENKINS_USER` and `JENKINS_TOKEN` env vars before launching `server.py`
- Mock → unset them; restart; `/api/jenkins/info` will return `"mock": true`

---

## State management cheat-sheet

| State slice | Vanilla ([state.js](sdlc-orchestrator/src/utils/state.js)) | Next.js ([store.ts](sdlc-orchestrator-next/lib/store.ts)) |
|---|---|---|
| Pipeline cursor | `cur`, `statuses[]` | same |
| Phase agents (per pid) | `agState[pid][aid]` | same |
| BRD input + parse | `brd: {...}` | same |
| Bank app launcher | `bankApp: {...}` | same |
| Jenkins / PR agent | `pr: {...}` | same |
| Project / stack / env choices | `projectType`, `techStack`, `deployEnv` | same |
| Rejection reasons + verification | `rejections[pid]` | same |
| Activity log | `log[]` (LIFO, 200 max) | same |

Both apps follow the same shape — only the wrapper differs (IIFE module vs Zustand store).

---

## Known pitfalls

| Pitfall | Fix |
|---|---|
| Zustand selector returning `s.x \|\| {}` → React infinite loop | Use a module-level frozen `EMPTY` ref and `??` instead |
| `python -m pip install` 403s on PyPI / Tsinghua | Switch to `--index-url https://mirrors.aliyun.com/pypi/simple/` |
| Direct `nodejs.org` zip download cut at ~700KB by corp DPI | Use `npmmirror.com/mirrors/node/<ver>/` instead |
| `server.py` changes don't take effect | Restart Python — no hot-reload |
| Bank app fails to launch on a port | Check `netstat -ano \| Select-String :3001` — kill the stale subprocess |
| `winget` blocked by group policy | Download portable Node zip; extract; prepend to PATH for the session |

---

## Tech stack (quick reference)

- **Vanilla app:** HTML5 + CSS3 + ES6 vanilla JS (IIFE modules), Tabler Icons, Inter + JetBrains Mono
- **Next.js port:** Next.js 15.5 (App Router) + React 19 + TypeScript 5.7 + Zustand 5
- **Backend:** Python 3.13 — **stdlib only** (`http.server`, `urllib`, `subprocess`, `threading`, `re`)
- **Generated bank app:** Pure HTML/CSS/JS, sessionStorage auth, `python -m http.server` per port
- **Integrations:** Jenkins (real + auto-mock), Pipeline Stage View plugin (optional)
- **Runtime:** Windows 11 + PowerShell 5.1 + portable Node 22 LTS

---

## Related artefacts in this directory

- [SESSION-SUMMARY.md](SESSION-SUMMARY.md) — full chronological change log (26 requests in 7 phases)
- [AI-Orchestrator-Features.pptx](AI-Orchestrator-Features.pptx) — 14-slide deck for stakeholders
- [make_ppt.py](make_ppt.py) — regenerates the deck via python-pptx
