import { getTxs } from "@/lib/server/txindex";

const EXPLORER = "https://genlayer-explorer.vercel.app";

// Vertical status timeline: every chain event of a dispute, in order, with
// timestamps and explorer links straight from the receipts.

const ORDER = [
  { key: "deposit", label: "Escrow funded" },
  { key: "file_dispute", label: "Dispute filed · amount + stake locked" },
  { key: "adjudicate", label: "Jury adjudicated" },
  { key: "settle", label: "Settled" },
] as const;

export function StatusTimeline({
  disputeId,
  status,
}: {
  disputeId: string;
  status: string;
}) {
  const txs = getTxs(disputeId);
  const entries = ORDER.map((o) => ({ ...o, entry: txs[o.key] }));
  const reached = entries.filter((e) => e.entry?.hash).length;
  const done = status === "settled";

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
          const happened = Boolean(e.entry?.hash);
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
                {e.entry?.hash && (
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 pt-0.5">
                    <a
                      href={`${EXPLORER}/tx/${e.entry.hash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-xs"
                      style={{ color: "var(--accent)" }}
                    >
                      {e.entry.hash.slice(0, 10)}…{e.entry.hash.slice(-8)}
                    </a>
                    {e.entry.at && (
                      <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                        {new Date(e.entry.at).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "UTC",
                        })}{" "}
                        UTC
                      </span>
                    )}
                  </span>
                )}
                {!happened && i === reached && (
                  <span className="micro" style={{ textTransform: "none", letterSpacing: "0.02em", color: "var(--text-muted)" }}>
                    next step
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
