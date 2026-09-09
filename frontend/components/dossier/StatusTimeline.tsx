"use client";

import { useEffect, useState } from "react";
import { readReceipts, type ReceiptMap } from "./receipts-store";

const EXPLORER = "https://explorer-studio.genlayer.com";

const ORDER = [
  { key: "deposit", label: "Escrow funded" },
  { key: "file_dispute", label: "Dispute filed · amount + stake locked" },
  { key: "adjudicate", label: "Jury adjudicated" },
  { key: "settle", label: "Settled" },
] as const;

function formatUtc(at: string): string {
  return `${new Date(at).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  })} UTC`;
}

export function StatusTimeline({
  disputeId,
  status,
  serverReceipts,
}: {
  disputeId: string;
  status: string;
  serverReceipts: ReceiptMap;
}) {
  const [sessionReceipts, setSessionReceipts] = useState<ReceiptMap>({});

  useEffect(() => {
    setSessionReceipts(readReceipts(disputeId));
  }, [disputeId]);

  const txs: ReceiptMap = { ...serverReceipts, ...sessionReceipts };
  const entries = ORDER.map((o) => ({ ...o, receipt: txs[o.key] }));
  const done = status === "settled";
  const anyReceipt = entries.some((e) => e.receipt?.hash);

  return (
    <section className="card p-5" aria-label="Status timeline">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl">Timeline</h3>
        <span className={`pill ${done ? "pill-refund" : "pill-live"}`}>
          <span className={`status-dot${done ? " status-dot-live" : ""}`} />
          {done ? "case closed" : "in progress"}
        </span>
      </div>

      <ol>
        {entries.map((e, i) => {
          const happened = Boolean(e.receipt?.hash);
          const isLast = i === entries.length - 1;
          return (
            <li key={e.key} className="flex items-stretch gap-3">
              <span className="flex flex-col items-center">
                <span
                  className="mt-1.5 inline-block rounded-full"
                  style={{
                    width: 10,
                    height: 10,
                    background: happened ? "var(--accent)" : "var(--bg-subtle)",
                    border: `1px solid ${happened ? "var(--accent)" : "var(--border-default)"}`,
                  }}
                />
                {!isLast && (
                  <span
                    aria-hidden
                    className="w-px flex-1"
                    style={{ background: happened ? "var(--accent)" : "var(--border-default)" }}
                  />
                )}
              </span>
              <span className="pb-5">
                <span
                  className="block text-sm"
                  style={{ color: happened ? "var(--text-primary)" : "var(--text-muted)" }}
                >
                  {e.label}
                </span>
                {e.receipt?.hash && (
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 pt-0.5">
                    <a
                      href={`${EXPLORER}/tx/${e.receipt.hash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-xs"
                      style={{ color: "var(--accent)" }}
                    >
                      {e.receipt.hash.slice(0, 10)}…{e.receipt.hash.slice(-8)}
                    </a>
                    {e.receipt.at && (
                      <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                        {formatUtc(e.receipt.at)}
                      </span>
                    )}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>

      {!anyReceipt && (
        <p className="micro" style={{ textTransform: "none", letterSpacing: "0.02em", color: "var(--text-muted)" }}>
          Step receipts for this case publish to the public receipts index automatically; chain state above is live.
        </p>
      )}
    </section>
  );
}
