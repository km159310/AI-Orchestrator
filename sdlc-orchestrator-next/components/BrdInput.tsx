"use client";
import { useStore } from "@/lib/store";
import { INIT_PASTE } from "@/data/brd";
import { api } from "@/lib/api";
import { useEffect, useRef } from "react";

export function BrdInput() {
  const brd = useStore(s => s.brd);
  const setBrd = useStore(s => s.setBrd);
  const addLog = useStore(s => s.addLog);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  function clearAll() {
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    setBrd({ file: null, fileName: null, fileSize: null, pasteText: INIT_PASTE, extracted: null, parseStep: 0 });
  }

  function clearFile() {
    setBrd({ file: null, fileName: null, fileSize: null });
  }

  function send() {
    const text = useStore.getState().brd.pasteText || "";
    const file = useStore.getState().brd.file;
    if (file) {
      addLog("AI parsing BRD file…", "info");
      const reader = new FileReader();
      reader.onload = e => doExtract(String(e.target?.result ?? ""));
      reader.onerror = () => addLog("Failed to read file as text", "danger");
      reader.readAsText(file);
    } else {
      addLog("AI parsing pasted description…", "info");
      doExtract(text);
    }
  }

  function doExtract(text: string) {
    setBrd({ parseStep: 1 });
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      const ps = useStore.getState().brd.parseStep;
      if (ps < 4) setBrd({ parseStep: ps + 1 });
    }, 600);

    api.extract(text)
      .then(res => {
        if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
        if (!res.ok || !res.extracted) {
          setBrd({ parseStep: 0 });
          addLog(`Extraction failed: ${res.error ?? "unknown error"}`, "danger");
          return;
        }
        const ext = res.extracted;
        setBrd({ parseStep: 5, extracted: ext });
        addLog(
          `✓ ${ext.reqCount} requirements extracted · ${ext.ports.length} port(s) · ${ext.riskCount} risk(s)`,
          "success",
        );
      })
      .catch((err: unknown) => {
        if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
        setBrd({ parseStep: 0 });
        const msg = err instanceof Error ? err.message : String(err);
        addLog(`Extraction error: ${msg}`, "danger");
      });
  }

  function attachFile(f: File) {
    setBrd({
      file: f, fileName: f.name,
      fileSize: f.size > 1024 * 1024 ? `${(f.size / 1024 / 1024).toFixed(1)} MB` : `${Math.round(f.size / 1024)} KB`,
    });
    addLog(`BRD attached: ${f.name}`, "info");
  }

  function fileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    attachFile(f);
    e.target.value = "";
  }

  function dragOver(e: React.DragEvent) { e.preventDefault(); e.currentTarget.classList.add("drag-over"); }
  function dragLeave(e: React.DragEvent) { e.currentTarget.classList.remove("drag-over"); }
  function dropFile(e: React.DragEvent) {
    e.preventDefault(); e.currentTarget.classList.remove("drag-over");
    const f = e.dataTransfer.files?.[0]; if (!f) return;
    attachFile(f);
  }

  // ── Extracted summary view ──────────────────────────────
  if (brd.extracted) {
    const ext = brd.extracted;
    const priCls: Record<string, string> = { must: "must", should: "should", nice: "nice" };
    const updatePri = (id: string, pri: "must" | "should" | "nice") => {
      const cur = useStore.getState().brd.extracted;
      if (!cur) return;
      setBrd({
        extracted: {
          ...cur,
          requirements: cur.requirements.map(r => r.id === id ? { ...r, pri } : r),
        },
      });
    };
    return (
      <>
        <div className="extract-card">
          <div className="extract-head">
            <i className="ti ti-circle-check" style={{ fontSize: 12 }} aria-hidden="true" />
            Requirements extracted from your input
            <span style={{
              marginLeft: "auto", fontSize: 10, fontWeight: 600,
              background: "var(--cyan4)", color: "var(--cyan)",
              padding: "3px 9px", borderRadius: 999,
              border: "1px solid rgba(37,99,235,.25)",
            }}>{brd.fileName ? "BRD file" : "chat input"}</span>
          </div>
          <div className="extract-body">
            <div className="stat-grid">
              <div className="stat-box"><div className="stat-num" style={{ color: "var(--cyan)"  }}>{ext.reqCount}</div><div className="stat-lbl">Requirements</div></div>
              <div className="stat-box"><div className="stat-num" style={{ color: "var(--red)"   }}>{ext.riskCount}</div><div className="stat-lbl">Risks</div></div>
              <div className="stat-box"><div className="stat-num" style={{ color: "var(--green)" }}>{ext.ports.length}</div><div className="stat-lbl">Ports</div></div>
              <div className="stat-box"><div className="stat-num" style={{ color: "var(--amber)" }}>4</div><div className="stat-lbl">Sections</div></div>
            </div>
            <div className="section-label" style={{ marginBottom: ".25rem" }}>Extracted requirements</div>
            <div className="pri-legend">
              <span className="pri-legend-item"><span className="pri must">MUST</span>Non-negotiable — release blocks without it</span>
              <span className="pri-legend-item"><span className="pri should">SHOULD</span>Important — can ship without it if needed</span>
              <span className="pri-legend-item"><span className="pri nice">NICE</span>Optional — drop first when scope tightens</span>
            </div>
            <ul className="req-list">
              {ext.requirements.map(r => (
                <li key={r.id} className="req-item">
                  <span className="req-id">{r.id}</span>
                  <span className="req-txt">{r.text}</span>
                  <select
                    className={`pri pri-select ${priCls[r.pri]}`}
                    value={r.pri}
                    onChange={e => updatePri(r.id, e.target.value as "must" | "should" | "nice")}
                    aria-label={`Priority for ${r.id}`}
                    title={
                      r.pri === "must"   ? "MUST — non-negotiable; the release blocks without it" :
                      r.pri === "should" ? "SHOULD — important but the release can ship without it" :
                                           "NICE — optional; drop first when scope tightens"
                    }
                  >
                    <option value="must"   title="Must-have — non-negotiable, ship-blocking">MUST</option>
                    <option value="should" title="Should-have — important but not release-blocking">SHOULD</option>
                    <option value="nice"   title="Nice-to-have — drop first when scope tightens">NICE</option>
                  </select>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: ".625rem", fontSize: 9, color: "var(--text3)" }}>
              Stakeholders: {ext.stakeholders.join(" · ")}
            </div>
            {ext.detectedFeatures && ext.detectedFeatures.length > 0 && (
              <div className="detected-feats">
                <div className="detected-feats-h">
                  <i className="ti ti-sparkles" aria-hidden="true" />
                  Features detected — will be deployed with the bank app
                </div>
                <div className="detected-feats-row">
                  {ext.detectedFeatures.map(f => (
                    <span key={f.key} className="detected-feat-chip" title={f.desc}>
                      <i className={`ti ${f.icon}`} aria-hidden="true" />
                      {f.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <button className="btn btn-ghost" onClick={clearAll}
                style={{ fontSize: 9, padding: ".22rem .5rem", marginTop: 4 }}>
          <i className="ti ti-pencil" aria-hidden="true" /> Edit input
        </button>
      </>
    );
  }

  // ── Parse progress ──────────────────────────────────────
  if (brd.parseStep > 0 && brd.parseStep < 5) {
    const steps = [
      "Reading description…",
      "Extracting functional requirements…",
      "Identifying NFRs, risks & port config…",
      "Structuring traceability matrix…",
    ];
    const ps = brd.parseStep;
    return (
      <div className="parse-box">
        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--cyan)", display: "flex", alignItems: "center", gap: 6, marginBottom: ".625rem" }}>
          <span className="spin" /> AI extracting requirements…
        </div>
        <div className="parse-steps">
          {steps.map((s, i) => {
            const cls = i < ps - 1 ? "done" : i === ps - 1 ? "active" : "idle";
            const ic  = i < ps - 1 ? "ti-check" : i === ps - 1 ? "ti-loader-2" : "ti-circle";
            const style = i === ps - 1 ? { fontSize: 10, animation: "spin .6s linear infinite" } : { fontSize: 10 };
            return <div key={i} className={`parse-step ${cls}`}><i className={`ti ${ic}`} style={style} aria-hidden="true" /> {s}</div>;
          })}
        </div>
      </div>
    );
  }

  // ── Single chatbot input ────────────────────────────────
  const chars = brd.pasteText.length;
  const ready = chars >= 50 || !!brd.file;
  const charClr = chars >= 80 ? "var(--green)" : chars > 0 ? "var(--amber)" : "var(--text3)";

  return (
    <div className="chat-brd" onDragOver={dragOver} onDragLeave={dragLeave} onDrop={dropFile}>
      <div className="chat-brd-head">
        <div className="chat-brd-bot">
          <i className="ti ti-robot" aria-hidden="true" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="chat-brd-title">Requirements Assistant</div>
          <div className="chat-brd-sub">Describe your project or upload a BRD — AI extracts structured requirements.</div>
        </div>
      </div>

      {brd.file && (
        <div className="chat-brd-chip">
          <i className="ti ti-paperclip" style={{ fontSize: 12 }} aria-hidden="true" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="chat-brd-chip-name">{brd.fileName}</div>
            <div className="chat-brd-chip-sz">{brd.fileSize}</div>
          </div>
          <button className="chat-brd-chip-x" onClick={clearFile} aria-label="Remove file">
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>
      )}

      <textarea
        className="chat-brd-input"
        placeholder="e.g. I need a banking app with login, account balance, transactions running on port 3001…"
        value={brd.pasteText}
        onChange={e => setBrd({ pasteText: e.target.value })}
        onKeyDown={e => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && ready) { e.preventDefault(); send(); }
        }}
      />

      <div className="chat-brd-bar">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.md"
          onChange={fileSelected}
          style={{ display: "none" }}
          aria-label="Upload BRD"
        />
        <button
          className="chat-brd-attach"
          onClick={() => fileInputRef.current?.click()}
          title="Upload BRD (PDF, DOCX, TXT, MD)"
        >
          <i className="ti ti-paperclip" aria-hidden="true" /> Upload BRD
        </button>
        <span style={{ fontSize: 9, color: charClr, marginLeft: 8 }}>
          {chars} chars{chars >= 80 ? " — ready" : ""}
        </span>
        <button
          className="btn btn-run"
          onClick={send}
          disabled={!ready}
          title={!ready ? "Type 50+ characters or attach a BRD" : undefined}
          style={{ marginLeft: "auto" }}
        >
          <i className="ti ti-send" aria-hidden="true" /> Generate Requirement
        </button>
      </div>
      <div className="chat-brd-hint">
        Tip: drag &amp; drop a file anywhere on this card · <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to send
      </div>
    </div>
  );
}
