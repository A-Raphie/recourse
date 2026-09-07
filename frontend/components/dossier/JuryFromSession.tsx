"use client";

import { useEffect, useState } from "react";
import type { JurySeat } from "@/lib/server/genlayer";

// Jury seats captured in-session: when a visitor triggers adjudication on the
// deployed site, the receipt comes back in the action response and is cached
// here, so the jury renders even though deployed file storage is ephemeral.

export function jurySeatsFromReceipt(receipt: unknown): JurySeat[] {
  const cd = (receipt as { consensus_data?: { leader_receipt?: Array<Record<string, unknown>>; validators?: Array<Record<string, unknown>> } })
    ?.consensus_data;
  if (!cd) return [];
  const seats: JurySeat[] = [];
  const leader = cd.leader_receipt?.[0];
  if (leader) {
    const nc = leader.node_config as { address?: string; primary_model?: { model?: string } } | undefined;
    seats.push({
      role: "leader",
      address: nc?.address ?? "",
      model: nc?.primary_model?.model ?? "unknown model",
      vote: (leader.vote as string) ?? "proposed",
      execution_result: String(leader.execution_result ?? "UNKNOWN"),
    });
  }
  for (const v of cd.validators ?? []) {
    const nc = v.node_config as { address?: string; primary_model?: { model?: string } } | undefined;
    seats.push({
      role: "validator",
      address: nc?.address ?? "",
      model: nc?.primary_model?.model ?? "unknown model",
      vote: (v.vote as string) ?? null,
      execution_result: String(v.execution_result ?? "UNKNOWN"),
    });
  }
  return seats;
}

export function cacheJury(disputeId: string, receipt: unknown) {
  try {
    const seats = jurySeatsFromReceipt(receipt);
    if (seats.length > 0) {
      localStorage.setItem(`recourse-jury-${disputeId}`, JSON.stringify(seats));
    }
  } catch {
    // private browsing or storage full: the bundle index still covers old cases
  }
}

export function JuryFromSession({ disputeId }: { disputeId: string }) {
  const [seats, setSeats] = useState<JurySeat[] | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`recourse-jury-${disputeId}`);
      if (raw) setSeats(JSON.parse(raw) as JurySeat[]);
    } catch {
      setSeats([]);
    }
  }, [disputeId]);

  if (!seats || seats.length === 0) return null;
  return <CachedNotice seats={seats} />;
}

function CachedNotice({ seats }: { seats: JurySeat[] }) {
  const agreed = seats.filter((s) => s.vote === "agree" || s.vote === "proposed").length;
  return (
    <p className="micro mt-3" style={{ textTransform: "none", letterSpacing: "0.02em" }}>
      Session receipt on file: {agreed} of {seats.length} seats concurred in your
      browser; the public receipts index carries the canonical seat-by-seat record.
    </p>
  );
}
