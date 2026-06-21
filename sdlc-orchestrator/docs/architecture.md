# Architecture Notes

## Module Pattern

All JavaScript modules use the IIFE (Immediately Invoked Function Expression) pattern with a returned public API object. This avoids global namespace pollution while keeping the code dependency-free (no bundler needed).

```
const ModuleName = (() => {
  // private
  function _private() { … }

  // public API
  function publicMethod() { … }

  return { publicMethod };
})();
```

## Data Flow

```
User interaction
      ↓
  App controller  (src/app.js)
      ↓
  State mutation  (src/utils/state.js)
      ↓
  Re-render panel (phase renderer)
      ↓
  Component HTML  (src/components/*)
      ↓
  innerHTML update (panel-body)
```

## State shape

```json
{
  "cur": 0,
  "statuses": ["active","locked","locked","locked","locked","locked","locked"],
  "agState": { "req": { "ba": { "status": "idle", "progress": 0, "lines": [] } } },
  "docTab": { "req": 0 },
  "projectType": null,
  "deployEnv": null,
  "prStage": 0,
  "prBranch": null,
  "prTimer": null,
  "approvers": {},
  "autoTriggered": {},
  "log": [],
  "lc": 0,
  "brd": {
    "activeTab": "paste",
    "file": null,
    "fileName": null,
    "fileSize": null,
    "pasteText": "…",
    "parseStep": 0,
    "parseTimer": null,
    "extracted": null
  }
}
```

## Rendering Strategy

The app uses full innerHTML replacement per panel render (not virtual DOM). This is intentional — the panel content changes entirely between phases and states, making diff-patching unnecessary complexity. Individual interactive elements (textarea, buttons) preserve state via the `State` singleton, not DOM.

## No build step

The project is intentionally zero-dependency and zero-build. Open `index.html` directly in a browser. External resources (Google Fonts, Tabler Icons) are loaded from CDN.
