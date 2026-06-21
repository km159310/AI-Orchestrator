"use client";
import { useStore } from "@/lib/store";
import { useActions } from "@/lib/useActions";
import type { PhaseId } from "@/lib/types";

const EMPTY = Object.freeze({ reason: "", verified: false });

interface Props { pid: PhaseId }

export function RejectedBanner({ pid }: Props) {
  const rej = useStore(s => s.rejections[pid] ?? EMPTY);
  const { verifyRejection } = useActions();

  return (
    <div className="rejected-card">
      <div className="rejected-head">
        <i className="ti ti-circle-x" aria-hidden="true" /> Phase rejected — revise and resubmit
      </div>
      <div className="rejected-reason">
        {rej.reason ? (
          <>
            <span className="rejected-reason-label">Reason:</span>{" "}
            <span className="rejected-reason-text">{rej.reason}</span>
          </>
        ) : (
          <em className="rejected-reason-empty">No reason was provided.</em>
        )}
      </div>
      <label className="rejected-verify">
        <input
          type="checkbox"
          checked={rej.verified}
          onChange={e => verifyRejection(e.target.checked)}
        />
        <span>
          <strong>Reason addressed</strong> — verified and ready to proceed
        </span>
      </label>
    </div>
  );
}

// Helper hook for the phase components to gate Run/Back buttons.
export function useRejectionGate(pid: PhaseId, status: string) {
  const rej = useStore(s => s.rejections[pid]);
  // If not in 'rejected' state, no gate; otherwise must be explicitly verified.
  if (status !== "rejected") return { gated: false, verified: true };
  return { gated: true, verified: !!rej?.verified };
}
