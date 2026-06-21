import { useMemo, useRef } from "react";
import { useStore } from "./store";
import { AGENTS } from "@/data/agents";
import { STREAMS } from "@/data/streams";
import type { PhaseId } from "./types";

// Sequential agent runner — agent N+1 only starts after agent N has finished
// all of its stream lines. Each agent's lines still tick out one-by-one.
//
// The returned { run, clearAll } object is memoised so consumers that pass
// these into useCallback/useEffect deps (e.g. useActions → approvePhase →
// SignOff effects) see a stable reference and don't re-run on every render.
// Without this, the addLog call inside SignOff's "push complete" branch
// caused a render cascade (log change → MainPanel re-render via
// useLogAggregatorPulse → new approvePhase → effect re-fire → addLog again),
// tripping React's "Maximum update depth exceeded" guard.
export function useAgentRunner() {
  const timersRef = useRef<number[]>([]);

  return useMemo(() => {
    function _setTimeout(fn: () => void, delay: number) {
      const id = window.setTimeout(fn, delay);
      timersRef.current.push(id);
      return id;
    }

    function clearAll() {
      timersRef.current.forEach(id => window.clearTimeout(id));
      timersRef.current = [];
    }

    function run(
      pid: PhaseId,
      onDone: () => void,
      opts?: { onlyAgentIds?: string[]; streamOverride?: Record<string, string[]> },
    ) {
      clearAll();
      const allAgs = AGENTS[pid] || [];
      const allStreams = STREAMS[pid] || [];

      // Pair each agent with its stream slot so we can filter without
      // losing the agent → stream index mapping.
      const queue = allAgs
        .map((a, i) => ({ a, lines: opts?.streamOverride?.[a.id] ?? allStreams[i] ?? ["Processing…", "Done"] }))
        .filter(({ a }) => !opts?.onlyAgentIds || opts.onlyAgentIds.includes(a.id));

      function runOne(qi: number) {
        if (qi >= queue.length) {
          _setTimeout(onDone, 300);
          return;
        }
        const { a, lines } = queue[qi];
        const { updateAgent, appendAgentLine } = useStore.getState();
        updateAgent(pid, a.id, { status: "running", progress: 5, lines: [] });

        let li = 0;

        function next() {
          if (li >= lines.length) {
            updateAgent(pid, a.id, { status: "done", progress: 100 });
            _setTimeout(() => runOne(qi + 1), 300);
            return;
          }
          appendAgentLine(pid, a.id, lines[li]);
          const cur = useStore.getState().agState[pid]?.[a.id];
          const nextProgress = Math.min((cur?.progress ?? 0) + 18, 90);
          updateAgent(pid, a.id, { progress: nextProgress });
          li++;
          _setTimeout(next, 480 + Math.random() * 380);
        }

        _setTimeout(next, 200);
      }

      runOne(0);
    }

    return { run, clearAll };
  }, []);
}
