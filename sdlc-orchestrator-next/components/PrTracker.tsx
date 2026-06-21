"use client";
import { useCallback, useEffect, useState } from "react";
import { api, type PrListResponse, type PrSummary, type PrUiState } from "@/lib/api";

const REFRESH_MS = 30_000;

const STATE_META: Record<PrUiState, { label: string; cls: string; icon: string }> = {
  open:       { label: "Open",        cls: "pr-st open",       icon: "ti-git-pull-request" },
  inProgress: { label: "In progress", cls: "pr-st in-progress",icon: "ti-loader-2" },
  merged:     { label: "Merged",      cls: "pr-st merged",     icon: "ti-git-merge" },
  closed:     { label: "Closed",      cls: "pr-st closed",     icon: "ti-circle-x" },
};

function fmtAgo(iso: string): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const secs = Math.max(0, (Date.now() - t) / 1000);
  if (secs < 60)    return `${Math.floor(secs)}s ago`;
  if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export function PrTracker() {
  const [data, setData] = useState<PrListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.listPrs();
      if (!res.ok) {
        setErr(res.error || "PR fetch failed");
      } else {
        setData(res);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), REFRESH_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  const counts = data?.counts ?? { open: 0, inProgress: 0, closed: 0, merged: 0 };
  const recent: PrSummary[] = data?.recent ?? [];

  return (
    <div className="pr-tracker">
      <div className="pr-tracker-head">
        <div className="pr-tracker-title">
          <i className="ti ti-git-pull-request" aria-hidden="true" />
          PR tracker
          {data?.repo && <span className="pr-tracker-repo">{data.repo}</span>}
          {data?.mock && <span className="pr-tracker-mock">MOCK</span>}
        </div>
        <button className="btn btn-ghost" onClick={() => void refresh()} disabled={loading}>
          <i className={`ti ${loading ? "ti-loader-2 spin-i" : "ti-refresh"}`} aria-hidden="true" />
          Refresh
        </button>
      </div>

      <div className="pr-stats">
        <div className="pr-stat open">
          <div className="pr-stat-ico"><i className="ti ti-git-pull-request" aria-hidden="true" /></div>
          <div>
            <div className="pr-stat-num">{counts.open}</div>
            <div className="pr-stat-lbl">Open</div>
          </div>
        </div>
        <div className="pr-stat in-progress">
          <div className="pr-stat-ico"><i className="ti ti-loader-2" aria-hidden="true" /></div>
          <div>
            <div className="pr-stat-num">{counts.inProgress}</div>
            <div className="pr-stat-lbl">In progress (CI)</div>
          </div>
        </div>
        <div className="pr-stat closed">
          <div className="pr-stat-ico"><i className="ti ti-git-merge" aria-hidden="true" /></div>
          <div>
            <div className="pr-stat-num">{counts.closed}</div>
            <div className="pr-stat-lbl">Closed{counts.merged ? ` · ${counts.merged} merged` : ""}</div>
          </div>
        </div>
      </div>

      {err && (
        <div className="notif n-danger" style={{ marginTop: ".5rem" }}>
          <i className="ti ti-alert-triangle" aria-hidden="true" /> {err}
        </div>
      )}

      {recent.length > 0 ? (
        <ul className="pr-list">
          {recent.map(pr => {
            const meta = STATE_META[pr.state];
            const isExternal = pr.url && pr.url !== "#" && pr.url.startsWith("http");
            const body = (
              <>
                <span className={meta.cls}>
                  <i className={`ti ${meta.icon}`} aria-hidden="true" /> {meta.label}
                </span>
                <span className="pr-num">#{pr.number}</span>
                <span className="pr-title-txt">
                  {pr.title}
                  {pr.draft && <span className="pr-draft"> · DRAFT</span>}
                </span>
                <span className="pr-branch" title={pr.branch}>
                  <i className="ti ti-git-branch" aria-hidden="true" /> {pr.branch}
                </span>
                <span className="pr-author">{pr.author}</span>
                <span className="pr-ago">{fmtAgo(pr.updatedAt)}</span>
              </>
            );
            return (
              <li key={pr.number} className="pr-row">
                {isExternal ? (
                  <a className="pr-row-link" href={pr.url} target="_blank" rel="noopener noreferrer">
                    {body}
                    <i className="ti ti-external-link" style={{ fontSize: 11, marginLeft: 4 }} aria-hidden="true" />
                  </a>
                ) : (
                  <div className="pr-row-link no-link">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        !err && !loading && (
          <div className="notif n-info" style={{ marginTop: ".5rem" }}>
            <i className="ti ti-info-circle" aria-hidden="true" /> No PRs found for this repo yet.
          </div>
        )
      )}
    </div>
  );
}
