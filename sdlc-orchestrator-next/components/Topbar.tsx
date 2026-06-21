"use client";
import { useActions } from "@/lib/useActions";

export function Topbar() {
  const { hardReset } = useActions();
  return (
    <header className="topbar">
      <div className="logo-mark" aria-label="AI Orchestrator">
        <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="16" r="11" fill="none" stroke="#ffffff" strokeWidth="0.7" opacity="0.45" />
          <circle className="orbital-node" cx="16" cy="5" r="1.9" fill="#ffffff" />
          <circle cx="27" cy="16" r="1.4" fill="#ffffff" opacity="0.7" />
          <circle cx="5" cy="16" r="1.4" fill="#ffffff" opacity="0.7" />
          <text
            x="16"
            y="21.5"
            fontFamily="Inter, sans-serif"
            fontSize="11"
            fontWeight={800}
            fill="#ffffff"
            textAnchor="middle"
            letterSpacing="-0.3"
          >
            AI
          </text>
        </svg>
      </div>
      <div className="brand">
        <div className="brand-name">
          <span className="brand-ai">AI</span>
          <span className="brand-orch">Orchestrator</span>
        </div>
        <div className="brand-sub">AI-Powered SDLC Pipeline</div>
      </div>
      <div className="topbar-right">
        <button className="reset-btn" onClick={() => void hardReset()} type="button">
          <i className="ti ti-refresh" aria-hidden="true" /> Reset
        </button>
      </div>
    </header>
  );
}
