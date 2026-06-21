"use client";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { useActions } from "@/lib/useActions";
import { Topbar } from "@/components/Topbar";
import { PipelineStrip } from "@/components/PipelineStrip";
import { MainPanel } from "@/components/MainPanel";
import { ActivityLog } from "@/components/ActivityLog";

export default function HomePage() {
  const log = useStore(s => s.log);
  const addLog = useStore(s => s.addLog);
  const { initBankApp } = useActions();

  // Boot once — seed the activity log and recover any already-running
  // bank-app subprocesses from /api/status.
  useEffect(() => {
    if (log.length === 0) {
      addLog("AI Orchestrator online — ABC Bank project loaded", "info");
    }
    void initBankApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="root" id="app">
      <Topbar />
      <PipelineStrip />
      <MainPanel />
      <ActivityLog />
    </div>
  );
}
