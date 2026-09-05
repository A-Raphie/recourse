"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cacheJury } from "./JuryFromSession";

export function DisputeActions({
  disputeId,
  status,
}: {
  disputeId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: string) {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, args: { dispute_id: disputeId } }),
      });
      const body = await res.json();
      if (!body.ok) {
        setError(body.error ?? "The action failed on chain");
      } else if (action === "adjudicate" && body.receipt) {
        cacheJury(disputeId, body.receipt);
      }
    } catch {
      setError("Could not reach the action endpoint. Try again.");
    } finally {
      setBusy(false);
      startTransition(() => router.refresh());
    }
  }

  const working = busy || pending;

  if (status === "settled") return null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {status === "filed" && (
        <button
          className="btn btn-primary"
          disabled={working}
          onClick={() => run("adjudicate")}
        >
          {working ? "Jury in session, about a minute…" : "Call the jury"}
        </button>
      )}
      {status === "adjudicated" && (
        <button
          className="btn btn-primary"
          disabled={working}
          onClick={() => run("settle")}
        >
          {working ? "Settling…" : "Settle the escrow"}
        </button>
      )}
      {error && (
        <span className="text-sm" style={{ color: "var(--status-error)" }} role="alert">
          {error}
        </span>
      )}
      {working && status === "filed" && (
        <span className="micro" style={{ textTransform: "none", letterSpacing: "0.02em" }}>
          Validators are rendering both evidence URLs and judging. This page updates when they agree.
        </span>
      )}
    </div>
  );
}
