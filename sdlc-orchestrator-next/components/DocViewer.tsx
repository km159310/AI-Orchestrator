"use client";
import { useStore } from "@/lib/store";
import { DEV_UNIT_TEST_REPORT_V2, DOCS } from "@/data/documents";
import { Wireframe } from "./Wireframe";
import type { PhaseId } from "@/lib/types";

interface Props { pid: PhaseId }

export function DocViewer({ pid }: Props) {
  const baseDocs = DOCS[pid];
  const tab = useStore(s => s.docTab[pid] ?? 0);
  const setDocTab = useStore(s => s.setDocTab);
  const devRunCount = useStore(s => s.devRunCount);

  if (!baseDocs) return null;
  // After a coverage rejection + re-run, swap the Dev Unit-Test tab (index 1)
  // with the green re-run report.
  const docs = (pid === "dev" && devRunCount >= 2)
    ? { ...baseDocs, contents: baseDocs.contents.map((c, i) => i === 1 ? DEV_UNIT_TEST_REPORT_V2 : c) }
    : baseDocs;
  const page = docs.contents[tab] || docs.contents[0];

  return (
    <div className="doc-panel">
      <div className="doc-toolbar">
        <i className="ti ti-file-text" style={{ fontSize: 11, color: "var(--text3)" }} aria-hidden="true" />
        <span style={{
          fontSize: 9, fontWeight: 600, letterSpacing: ".08em",
          textTransform: "uppercase", color: "var(--text3)", flex: 1,
        }}>
          Generated Documents
        </span>
        {docs.tabs.map((t, i) => (
          <span
            key={t}
            className={`doc-tab ${i === tab ? "active" : ""}`}
            onClick={() => setDocTab(pid, i)}
          >
            {t}
          </span>
        ))}
      </div>
      <div className="doc-body">
        <div className="doc-title">{page.title}</div>
        <div className="doc-meta">
          <span><i className="ti ti-calendar" style={{ fontSize: 9 }} aria-hidden="true" />{page.meta.date}</span>
          <span><i className="ti ti-user" style={{ fontSize: 9 }} aria-hidden="true" />{page.meta.author}</span>
          <span style={{ color: "var(--amber)" }}>{page.meta.status}</span>
          <span>v{page.meta.ver}</span>
        </div>
        {page.sections.map((sec, i) => (
          <div key={i} className="doc-section">
            <div className="doc-h2">{sec.h}</div>
            {sec.p && <div className="doc-p">{sec.p}</div>}
            {sec.list && (
              <ul className="doc-list">
                {sec.list.map((li, j) => <li key={j}>{li}</li>)}
              </ul>
            )}
            {sec.table && (
              <table className="doc-table">
                <thead>
                  <tr>{sec.table.cols.map(c => <th key={c}>{c}</th>)}</tr>
                </thead>
                <tbody>
                  {sec.table.rows.map((row, ri) => (
                    <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{cell}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            )}
            {sec.wireframes && (
              <div className="wireframe-grid">
                {sec.wireframes.map((w, wi) => (
                  <Wireframe key={`${w.name}-${wi}`} name={w.name} caption={w.caption} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
