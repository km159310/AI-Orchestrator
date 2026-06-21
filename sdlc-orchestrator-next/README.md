# SDLC Orchestrator — Next.js port

TypeScript + Next.js 15 (App Router) port of the vanilla JS orchestrator.

## Prerequisites

- **Node.js 20+** (install from https://nodejs.org/)
- **Python 3.10+** — the existing backend (`../sdlc-orchestrator/server.py`) handles `/api/*`

## Architecture

```
  Browser (you)
       │
       ▼  http://localhost:3030  (next.js dev server)
  ┌──────────────────┐
  │   Next.js app    │  React components, Zustand store
  └────────┬─────────┘
           │ fetch('/api/...') — rewritten by next.config.ts
           ▼
  ┌──────────────────┐
  │  server.py       │  http://localhost:3000
  │  (Python)        │  POST /api/generate-app · /api/launch · /api/stop
  └────────┬─────────┘
           │ subprocess.Popen
           ▼
  ┌──────────────────┐
  │  Bank app(s)     │  http://localhost:3001 · http://localhost:3002
  │  (python http.s) │  Serves generated-app/ on demand
  └──────────────────┘
```

## Run

In two terminals:

```powershell
# 1. Start the Python backend (from ../sdlc-orchestrator/)
cd ..\sdlc-orchestrator
python server.py
```

```powershell
# 2. Start the Next.js dev server
npm install
npm run dev
```

Open http://localhost:3030.

## Layout

```
app/                       Next.js App Router
  layout.tsx               Root layout — global CSS, fonts
  page.tsx                 The orchestrator page (client component shell)
  globals.css              All styling (ported 1:1 from the vanilla app)

components/
  Topbar.tsx
  PipelineStrip.tsx
  MainPanel.tsx
  ActivityLog.tsx
  BrdInput.tsx
  AgentGrid.tsx
  DocViewer.tsx
  SignOff.tsx
  PrAgent.tsx
  BankApp.tsx
  phases/
    RequirementsPhase.tsx
    DevelopmentPhase.tsx
    GenericPhase.tsx

data/                      Static demo data (TS ports of the vanilla data/*.js)
  phases.ts
  agents.ts
  streams.ts
  documents.ts
  signoffs.ts
  brd.ts

lib/
  store.ts                 Zustand store — pipeline, agents, BRD, bank app, log
  types.ts
  api.ts                   Wrappers for /api/generate-app · /api/launch · /api/stop
  format.ts
  useAgentRunner.ts        Hook implementing the agent timer-based simulation
```
