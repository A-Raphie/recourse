// Client-side receipts store: the action endpoint returns tx hashes and
// timestamps for every write; we persist them per-dispute in localStorage so
// the dossier's timeline, receipts, and jury render for anyone who ran the
// flow in their own session. The server-bundled index remains the durable
// record, refreshed on each deploy; chain receipts are always the truth.

export type Receipt = { hash: string; at?: string };
export type ReceiptMap = Record<string, Receipt>;

const key = (disputeId: string) => `recourse-receipts-${disputeId}`;

export function saveReceipts(disputeId: string, receipts: ReceiptMap) {
  try {
    const prev = readReceipts(disputeId);
    localStorage.setItem(key(disputeId), JSON.stringify({ ...prev, ...receipts }));
  } catch {
    // storage unavailable: the bundled index still covers pre-deploy cases
  }
}

export function readReceipts(disputeId: string): ReceiptMap {
  try {
    return JSON.parse(localStorage.getItem(key(disputeId)) ?? "{}") as ReceiptMap;
  } catch {
    return {};
  }
}
