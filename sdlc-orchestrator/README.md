# SDLC Orchestrator — ABC Bank Application

A premium dark-themed, AI-powered Software Development Lifecycle orchestration dashboard built with vanilla HTML, CSS, and JavaScript.

## Project Structure

```
sdlc-orchestrator/
├── index.html                  # App entry point
├── README.md
├── config/
│   └── settings.json           # Runtime configuration
├── docs/
│   └── architecture.md         # Project architecture notes
├── public/
│   ├── favicon.svg
│   └── css/
│       ├── variables.css       # Design tokens & CSS variables
│       ├── base.css            # Reset, layout, shared components
│       ├── pipeline.css        # Pipeline strip styles
│       ├── panel.css           # Main panel & sign-off styles
│       ├── agents.css          # Agent card grid styles
│       ├── brd.css             # BRD input component styles
│       ├── documents.css       # Document viewer & PR agent styles
│       ├── log.css             # Activity log styles
│       └── animations.css      # Keyframe animations
└── src/
    ├── app.js                  # Main app controller
    ├── agents/
    │   └── runner.js           # Async agent execution engine
    ├── components/
    │   ├── agentGrid.js        # Agent card grid renderer
    │   ├── brdInput.js         # BRD upload / paste component
    │   ├── docViewer.js        # Generated document viewer
    │   ├── prAgent.js          # PR agent pipeline component
    │   ├── signOff.js          # Multi-reviewer sign-off component
    │   └── strip.js            # Pipeline phase strip
    ├── data/
    │   ├── agents.js           # Agent definitions per phase
    │   ├── brdData.js          # BRD extracted data & AI suggestions
    │   ├── documents.js        # Generated document content
    │   ├── phases.js           # Phase definitions
    │   ├── signoffs.js         # Reviewer sign-off profiles
    │   └── streams.js          # Agent output stream content
    ├── phases/
    │   ├── development.js      # Development phase renderer
    │   ├── generic.js          # Generic phase renderer
    │   └── requirements.js     # Requirements phase renderer
    └── utils/
        ├── logger.js           # Activity log utility
        └── state.js            # Global state management
```

## Getting Started

### Option 1 — Open directly
Just open `index.html` in any modern browser. No build step required.

### Option 2 — Local dev server
```bash
# Using Python
python3 -m http.server 3000

# Using Node.js (npx)
npx serve .

# Using VS Code Live Server extension
# Right-click index.html → Open with Live Server
```

Then navigate to `http://localhost:3000`.

## Pipeline Phases

| Phase | Agents |
|-------|--------|
| Requirements | BA Agent, Doc Agent, Validator, Risk Agent |
| Design | Architect, API Agent, DB Agent, UI Agent |
| Development | Code Agent, Unit Test, Lint Agent, DocGen |
| Testing | Integration, Load Test, UAT Agent, Report |
| Security | SAST Agent, Dep Audit, Secrets, Pen Test |
| Deployment | Infra, Container, CD Agent, Smoke |
| Review | Post-mortem, Metrics, Lessons, Release |

## Key Features

- **BRD Input** — Paste a project description or upload a file (PDF, DOCX, TXT, MD). AI extracts structured requirements automatically.
- **Multi-port detection** — Automatically detects and visualises port configurations (`:3000`, `:3001`, `:3002`).
- **AI agent execution** — Each phase runs 4 concurrent agents with live streaming output and progress bars.
- **Human-in-the-loop** — Every phase gates on human approval. Requirements and Design phases require multi-reviewer sign-off.
- **Auto-trigger** — Approving a phase automatically triggers the next one, with agents starting immediately.
- **Document generation** — Requirements and Design phases generate tabbed documents (SRS, User Stories, Port Config, Risk Register, Architecture, API Contract).
- **PR Agent** — For existing projects, triggers a feature branch → build → test → merge → deploy pipeline.
- **Dark command-center UI** — JetBrains Mono + Syne fonts, electric cyan accents, glowing status indicators.

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| `--cyan` | `#00d4ff` | Primary accent, active states |
| `--green` | `#00e5a0` | Success, approved, done |
| `--amber` | `#f5a623` | Running, warning, pending |
| `--red` | `#ff4d6d` | Error, rejected, danger |
| `--bg0` | `#0a0c10` | Deepest background |
| `--mono` | JetBrains Mono | All data, code, labels |
| `--sans` | Syne | Headings, brand |

## ABC Bank Application

The pre-loaded project description generates 8 requirements including:
- Login with JWT credential validation
- Auto-generated runnable scaffold
- Multi-port deployment (`:3000`, `:3001`, `:3002` via `PORT` env var)
- Admin account management
