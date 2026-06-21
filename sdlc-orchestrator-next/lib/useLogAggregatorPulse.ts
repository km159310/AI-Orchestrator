import { useEffect, useRef } from "react";
import { useStore } from "./store";
import { PHASES } from "@/data/phases";

// Global pulse for the Log Aggregator agent. Mounted once at the app
// shell so it fires on every activity-log update regardless of which
// phase the user is currently viewing — the Log Aggregator's job is to
// aggregate continuously, not only when its card is on screen.
export function useLogAggregatorPulse() {
  const log             = useStore(s => s.log);
  const updateAgent     = useStore(s => s.updateAgent);
  const appendAgentLine = useStore(s => s.appendAgentLine);
  const initAgents      = useStore(s => s.initAgents);

  const lastIdRef     = useRef<number | null>(null);
  const revertRef     = useRef<number | null>(null);
  const baselineRef   = useRef<"idle" | "running" | "done">("idle");
  const initedRef     = useRef(false);

  // Make sure the monitor agent slice exists so we can pulse it even
  // before the user navigates to Dashboard & Observability.
  useEffect(() => {
    if (initedRef.current) return;
    initedRef.current = true;
    initAgents("monitor");
  }, [initAgents]);

  useEffect(() => {
    const latest = log[0];
    if (!latest) return;
    if (latest.id === lastIdRef.current) return;
    lastIdRef.current = latest.id;

    const agg = useStore.getState().agState.monitor?.agg;
    if (!agg) return;

    // Capture the real baseline only when no pulse is currently in
    // flight, so a burst of logs doesn't clobber the "done" baseline
    // with the pulse's own "running" state.
    if (revertRef.current == null) baselineRef.current = agg.status;

    const summary = latest.m.length > 70 ? latest.m.slice(0, 70) + "…" : latest.m;
    const ph = PHASES.find(p => p.id === latest.phase);
    const source = ph?.label ?? "System";

    updateAgent("monitor", "agg", {
      status: "running",
      progress: Math.max(55, agg.progress ?? 0),
    });
    appendAgentLine("monitor", "agg", `[${latest.tag}] ${source}: ${summary}`);

    if (revertRef.current) window.clearTimeout(revertRef.current);
    revertRef.current = window.setTimeout(() => {
      revertRef.current = null;
      const cur = useStore.getState().agState.monitor?.agg;
      if (!cur) return;
      const baseline = baselineRef.current;
      updateAgent("monitor", "agg", {
        status: baseline === "done" ? "done" : "running",
        progress: baseline === "done" ? 100 : Math.min(95, cur.progress ?? 60),
      });
    }, 850);
  }, [log, updateAgent, appendAgentLine]);

  useEffect(() => () => {
    if (revertRef.current) window.clearTimeout(revertRef.current);
  }, []);
}
