import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

// Dispute tx-hash index: the chain does not expose tx hashes to contract
// reads, so every write through our server records its hash here. The public
// dossier reads it to render real consensus receipts, no wallet needed.

const DATA_DIR = join(process.cwd(), ".data");
const FILE = join(DATA_DIR, "txindex.json");

type TxIndex = Record<string, Record<string, string>>;

function readIndex(): TxIndex {
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
    const index = readIndex();
    index[disputeId] = { ...(index[disputeId] ?? {}), [kind]: hash };
    writeFileSync(FILE, JSON.stringify(index, null, 1));
  } catch {
    // index is best-effort; chain state remains the source of truth
  }
}

export function getTxs(disputeId: string): Record<string, string> {
  return readIndex()[disputeId] ?? {};
}
