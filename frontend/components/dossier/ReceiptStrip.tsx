import { getTxs } from "@/lib/server/txindex";

const EXPLORER = "https://genlayer-explorer.vercel.app";

function TxLine({ label, hash }: { label: string; hash?: string }) {
  if (!hash) return null;
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="micro">{label}</span>
      <a
        href={`${EXPLORER}/tx/${hash}`}
        target="_blank"
        rel="noreferrer"
        className="font-mono text-xs"
        style={{ color: "var(--accent)" }}
      >
        {hash.slice(0, 10)}…{hash.slice(-8)}
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
        <TxLine label="filed" hash={txs["file_dispute"]} />
        <TxLine label="deposit" hash={txs["deposit"]} />
        <TxLine label="adjudicated" hash={txs["adjudicate"]} />
        <TxLine label="settled" hash={txs["settle"]} />
      </div>
    </section>
  );
}
