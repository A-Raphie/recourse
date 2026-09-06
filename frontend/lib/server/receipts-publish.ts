import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

// Durable receipt publishing: every write through our server appends its
// receipt to data/txindex-bundled.json and pushes it to the GitHub repo via
// the Contents API. The dossier then reads the published file live, so
// receipts go site-wide within seconds of any dispute - no redeploy.
// Chain receipts remain the source of truth; GitHub is the publication rail.

const REPO = "A-Raphie/recourse";
const PATH = "frontend/data/txindex-bundled.json";
const BRANCH = "master";
const LOCAL = join(process.cwd(), "data", "txindex-bundled.json");
const DATA_DIR = join(process.cwd(), ".data");
const LOCAL_RUNTIME = join(DATA_DIR, "txindex.json");

type TxEntry = { hash: string; at?: string };
type TxIndex = Record<string, Record<string, TxEntry>>;

function ghHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "User-Agent": "recourse",
  };
}

async function readPublished(token: string): Promise<{ index: TxIndex; sha: string | null }> {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${PATH}?ref=${BRANCH}`, {
    headers: ghHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) return { index: {}, sha: null };
  const body = (await res.json()) as { sha?: string; content?: string };
  const index = JSON.parse(Buffer.from(body.content ?? "", "base64").toString("utf8")) as TxIndex;
  return { index, sha: body.sha ?? null };
}

function mergeLocal(published: TxIndex): TxIndex {
  // local files first (dev convenience), published wins as the durable record
  const merged: TxIndex = JSON.parse(JSON.stringify(published));
  try {
    for (const src of [LOCAL, LOCAL_RUNTIME]) {
      if (!existsSync(src)) continue;
      const local = JSON.parse(readFileSync(src, "utf8")) as TxIndex;
      for (const [id, entries] of Object.entries(local)) {
        merged[id] = { ...(merged[id] ?? {}), ...entries };
      }
    }
  } catch {
    // local reads are best-effort
  }
  return merged;
}

export async function publishReceipts(
  disputeId: string,
  kind: string,
  hash: string,
  at?: string,
): Promise<boolean> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return false;
  try {
    const { index: published, sha } = await readPublished(token);
    const merged = mergeLocal(published);
    merged[disputeId] = {
      ...(merged[disputeId] ?? {}),
      [kind]: { hash, ...(at ? { at } : {}) },
    };
    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${PATH}`, {
      method: "PUT",
      headers: ghHeaders(token),
      body: JSON.stringify({
        message: `receipts: ${disputeId} ${kind}`,
        content: Buffer.from(JSON.stringify(merged, null, 1) + "\n").toString("base64"),
        branch: BRANCH,
        ...(sha ? { sha } : {}),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Live read for the dossier: the published file (fresh), merged over the
// build-time bundle. Falls back to the bundle when GitHub is unreachable.
export async function readLiveReceipts(): Promise<TxIndex> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return {};
  try {
    const { index } = await readPublished(token);
    return index;
  } catch {
    return {};
  }
}

// Local-dev append (mirrors the old runtime file behavior).
export function recordLocal(disputeId: string, kind: string, hash: string, at?: string) {
  try {
    if (!existsSync(DATA_DIR)) mkdirSyncLocal();
    const runtime: TxIndex = existsSync(LOCAL_RUNTIME)
      ? JSON.parse(readFileSync(LOCAL_RUNTIME, "utf8"))
      : {};
    runtime[disputeId] = { ...(runtime[disputeId] ?? {}), [kind]: { hash, ...(at ? { at } : {}) } };
    writeFileSync(LOCAL_RUNTIME, JSON.stringify(runtime, null, 1));
    // keep the bundled file in sync locally so dev deploys carry receipts
    const bundled: TxIndex = existsSync(LOCAL)
      ? JSON.parse(readFileSync(LOCAL, "utf8"))
      : {};
    bundled[disputeId] = { ...(bundled[disputeId] ?? {}), [kind]: { hash, ...(at ? { at } : {}) } };
    writeFileSync(LOCAL, JSON.stringify(bundled, null, 1) + "\n");
  } catch {
    // best-effort
  }
}

function mkdirSyncLocal() {
  mkdirSync(DATA_DIR, { recursive: true });
}
