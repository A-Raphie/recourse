// One-off backfill: adds filed_at timestamps to existing txindex entries by
// reading created_at off each file_dispute receipt. Idempotent.
// Usage: node scripts/backfill-txindex-times.mjs

import { readFileSync, writeFileSync } from "fs";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const index = JSON.parse(readFileSync("data/txindex-bundled.json", "utf8"));
const client = createClient({ chain: studionet, endpoint: "https://studio.genlayer.com/api" });

function toIso(created) {
  if (created === undefined || created === null) return undefined;
  if (typeof created === "number") {
    const ms = created > 1e12 ? created : created * 1000;
    return new Date(ms).toISOString();
  }
  const asDate = new Date(created);
  return isNaN(asDate.getTime()) ? undefined : asDate.toISOString();
}

for (const [disputeId, entry] of Object.entries(index)) {
  const filed = entry.file_dispute;
  const hash = typeof filed === "string" ? filed : filed?.hash;
  if (!hash) continue;
  if (typeof filed === "object" && filed?.at) continue;
  const tx = await client.getTransaction({
    hash: /** @type {`0x${string}`} */ (hash),
  });
  const iso = toIso(tx.created_at);
  if (iso) {
    entry.file_dispute = { hash, at: iso };
    console.log(disputeId, "->", iso);
  } else {
    console.log(disputeId, "-> no created_at on receipt:", String(tx.created_at));
  }
}

writeFileSync("data/txindex-bundled.json", JSON.stringify(index, null, 1));
console.log("done");
