// src/agents/runner.js
// Sequential agent runner — agent N+1 only starts after agent N has finished
// all of its stream lines. Each agent's lines still tick out one-by-one.
//
// opts:
//   onlyAgentIds:    array of agent ids to run (others are skipped)
//   streamOverride:  per-agent-id replacement stream array (overrides the
//                    default STREAMS[pid][i] for the matching agent)
const AgentRunner = (() => {
  const _timers = [];

  // Per-phase pacing override (ms between stream lines within an agent).
  // Default cadence is roughly 670 ms per line (480 + 380*random) — keeps
  // most phases finishing in ~3 s per agent. Phases that should look like
  // they take real time live here. Deploy ≈ 25 s — matches the AWS
  // pipeline duration so the agent cards finish together with the stages:
  // 16 lines × ~1.45 s + 4 × 200 ms boot + 3 × 300 ms gap ≈ 25 s.
  const PHASE_PACE = {
    deploy: { lineMin: 1100, lineRange: 700 },
  };

  function _setTimeout(fn, delay) {
    const id = setTimeout(fn, delay);
    _timers.push(id);
    return id;
  }

  function clearAll() {
    while (_timers.length) clearTimeout(_timers.pop());
  }

  function run(pid, onDone, opts) {
    const pace = PHASE_PACE[pid] || { lineMin: 480, lineRange: 380 };
    clearAll();
    const allAgs     = AGENTS[pid] || [];
    const allStreams = STREAMS[pid] || [];

    const queue = allAgs
      .map((a, i) => ({
        a,
        lines: (opts && opts.streamOverride && opts.streamOverride[a.id])
          ? opts.streamOverride[a.id]
          : (allStreams[i] || ['Processing…', 'Done']),
      }))
      .filter(({ a }) => !(opts && opts.onlyAgentIds) || opts.onlyAgentIds.includes(a.id));

    function runOne(qi) {
      if (qi >= queue.length) {
        _setTimeout(onDone, 300);
        return;
      }
      const { a, lines } = queue[qi];
      const agState = State.get().agState[pid];
      if (!agState || !agState[a.id]) {
        _setTimeout(() => runOne(qi + 1), 0);
        return;
      }
      agState[a.id].status   = 'running';
      agState[a.id].progress = 5;
      agState[a.id].lines    = [];
      App.renderPanel();

      let li = 0;

      function next() {
        if (li >= lines.length) {
          agState[a.id].status   = 'done';
          agState[a.id].progress = 100;
          App.renderPanel();
          _setTimeout(() => runOne(qi + 1), 300);
          return;
        }
        agState[a.id].lines.push(lines[li]);
        agState[a.id].progress = Math.min(agState[a.id].progress + 18, 90);
        App.renderPanel();
        li++;
        _setTimeout(next, pace.lineMin + Math.random() * pace.lineRange);
      }

      _setTimeout(next, 200);
    }

    runOne(0);
  }

  return { run, clearAll };
})();
