import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import bundled from "@/data/txindex-bundled.json";

// Dispute tx-hash index. The chain does not expose tx hashes to contract
// reads, so receipts are tracked out-of-band:
// - the bundled JSON ships with the build (public tx hashes, refreshed on
//   deploy);
// - locally, writes also append to .data/txindex.json;
// - live adjudications on the deployed site return the receipt to the browser,
//   which caches it in localStorage so the jury renders in that session.
// Chain state remains the source of truth; this index only locates receipts.

const DATA_DIR = join(process.cwd(), ".data");
const FILE = join(DATA_DIR, "txindex.json");

type TxIndex = Record<string, Record<string, string>>;

function readLocal(): TxIndex {
  try {
    if (!existsSync(FILE)) return {};
    return JSON.parse(readFileSync(FILE, "utf8")) as TxIndex;
  } catch {
    return {};
  }
}

export function recordTx(disputeId: string, kind: string, hash: string) {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    const index = readLocal();
    index[disputeId] = { ...(index[disputeId] ?? {}), [kind]: hash };
    writeFileSync(FILE, JSON.stringify(index, null, 1));
  } catch {
    // deployed filesystems are ephemeral; the client receipt capture covers it
  }
}

export function getTxs(disputeId: string): Record<string, string> {
  const merged: Record<string, string> = {
    ...((bundled as TxIndex)[disputeId] ?? {}),
    ...readLocal()[disputeId],
  };
  return merged;
}
