// Deploys the canonical Recourse contract and records the address in .env.
// Generates DEMO_KEY into frontend/.env on first run (never printed).
// Usage: node scripts/deploy.mjs

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { privateKeyToAccount } from "viem/accounts";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendDir = join(__dirname, "..");
const envPath = join(frontendDir, ".env");
const contractPath = join(frontendDir, "..", "contracts", "recourse.py");

function readEnv() {
  if (!existsSync(envPath)) return {};
  const out = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function upsertEnv(key, value) {
  const env = readEnv();
  env[key] = value;
  writeFileSync(
    envPath,
    Object.entries(env)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n") + "\n",
  );
}

const env = readEnv();
if (!env.DEMO_KEY) {
  const raw = [...crypto.getRandomValues(new Uint8Array(32))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  upsertEnv("DEMO_KEY", `0x${raw}`);
  console.log("DEMO_KEY generated into .env");
}

const account = privateKeyToAccount(readEnv().DEMO_KEY);
console.log("Demo account address:", account.address);

const client = createClient({
  chain: studionet,
  account,
  endpoint: studionet.rpcUrls.default.http[0],
});

const code = new Uint8Array(readFileSync(contractPath));

console.log("Initializing consensus smart contract...");
await client.initializeConsensusSmartContract();

console.log("Deploying contracts/recourse.py to studionet...");
const deployTx = await client.deployContract({ code, args: [] });
const receipt = await client.waitForTransactionReceipt({
  hash: deployTx,
  status: "ACCEPTED",
  retries: 60,
  interval: 3000,
});

const contractAddress =
  receipt.data?.contract_address ?? receipt.contract_address ?? receipt.to;
if (!contractAddress) {
  console.error("Could not read contract address from receipt:", JSON.stringify(receipt).slice(0, 500));
  process.exit(1);
}

upsertEnv("NEXT_PUBLIC_CONTRACT_ADDRESS", contractAddress);
console.log("Canonical Recourse contract:", contractAddress);
console.log("NEXT_PUBLIC_CONTRACT_ADDRESS written to .env");
