import { getTxs } from "@/lib/server/txindex";

const EXPLORER = "https://genlayer-explorer.vercel.app";

function formatUtc(at: string): string {
  const stamp = new Date(at).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
  return `${stamp} UTC`;
}

function TxLine({ label, entry }: { label: string; entry?: { hash: string; at?: string } }) {
  if (!entry?.hash) return null;
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="micro">
        {label}
        {entry.at && (
          <span style={{ color: "var(--text-muted)", textTransform: "none", letterSpacing: "0.02em" }}>
            {" "}
            {formatUtc(entry.at)}
          </span>
        )}
      </span>
      <a
        href={`${EXPLORER}/tx/${entry.hash}`}
        target="_blank"
        rel="noreferrer"
        className="font-mono text-xs"
        style={{ color: "var(--accent)" }}
      >
        {entry.hash.slice(0, 10)}…{entry.hash.slice(-8)}
      </a>
    </div>
  );
}

export function ReceiptStrip({ disputeId }: { disputeId: string }) {
  const txs = getTxs(disputeId);
  const entries = Object.entries(txs);
  if (entries.length === 0) return null;

  return (
    <section className="card p-5" aria-label="On-chain receipts">
      <h3 className="mb-2 text-lg">On-chain receipts</h3>
      <div className="divide-y" style={{ borderColor: "var(--border-default)" }}>
        <TxLine label="filed" entry={txs["file_dispute"]} />
        <TxLine label="deposit" entry={txs["deposit"]} />
        <TxLine label="adjudicated" entry={txs["adjudicate"]} />
        <TxLine label="settled" entry={txs["settle"]} />
      </div>
    </section>
  );
}
