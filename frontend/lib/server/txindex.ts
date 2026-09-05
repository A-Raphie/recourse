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

type TxEntry = { hash: string; at?: string };
type TxIndex = Record<string, Record<string, TxEntry>>;

function readLocal(): TxIndex {
  try {
    if (!existsSync(FILE)) return {};
    return JSON.parse(readFileSync(FILE, "utf8")) as TxIndex;
  } catch {
    return {};
  }
}

export function recordTx(
  disputeId: string,
  kind: string,
  hash: string,
  at?: string,
) {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    const index = readLocal();
    index[disputeId] = {
      ...(index[disputeId] ?? {}),
      [kind]: { hash, ...(at ? { at } : {}) },
    };
    writeFileSync(FILE, JSON.stringify(index, null, 1));
  } catch {
    // deployed filesystems are ephemeral; the client receipt capture covers it
  }
}

export function getTxs(disputeId: string): Record<string, TxEntry> {
  const bundledIndex = bundled as unknown as TxIndex;
  const merged: Record<string, TxEntry> = {
    ...(bundledIndex[disputeId] ?? {}),
    ...(readLocal()[disputeId] ?? {}),
  };
  // legacy rows carry bare hash strings; normalize so callers always get objects
  for (const [kind, v] of Object.entries(merged)) {
    if (typeof v === "string") merged[kind] = { hash: v };
  }
  return merged;
}
