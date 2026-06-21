"use client";
import { useState } from "react";
import { useActions } from "@/lib/useActions";

// Two-step reject button: click → inline reason textarea + Confirm/Cancel.
// Used wherever an "Approve & advance / Reject" bar appears.
export function RejectControl() {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const { rejectPhase } = useActions();

  function confirm() {
    rejectPhase(reason);
    setOpen(false);
    setReason("");
  }
  function cancel() {
    setOpen(false);
    setReason("");
  }

  if (!open) {
    return (
      <button className="btn btn-no" onClick={() => setOpen(true)} type="button">
        <i className="ti ti-circle-x" aria-hidden="true" /> Reject
      </button>
    );
  }

  return (
    <div className="reject-form">
      <textarea
        className="reject-reason"
        rows={3}
        placeholder="Why is this being rejected? (optional)"
        value={reason}
        onChange={e => setReason(e.target.value)}
        autoFocus
      />
      <div className="reject-form-actions">
        <button className="btn btn-no" onClick={confirm} type="button">
          <i className="ti ti-circle-x" aria-hidden="true" /> Confirm rejection
        </button>
        <button className="btn btn-ghost" onClick={cancel} type="button">Cancel</button>
      </div>
    </div>
  );
}
