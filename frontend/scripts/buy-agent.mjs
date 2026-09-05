// The buyer agent: pays the seller over x402, receives the response, and when
// the deliverable is garbage files a Recourse dispute through the MCP surface.
// Usage: node scripts/buy-agent.mjs [--fail]
//   --fail  request the seller's ?fail=1 variant (pays, then receives garbage)

import { readFileSync } from "fs";
import { privateKeyToAccount } from "viem/accounts";
import { createWalletClient, http, createPublicClient, defineChain } from "viem";
import { wrapFetchWithPayment } from "x402-fetch";

const args = process.argv.slice(2);
const fail = args.includes("--fail");

function readEnv() {
  const out = {};
  for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const env = readEnv();
const BASE = process.env.DEMO_BASE_URL ?? "http://127.0.0.1:3210";

if (!env.BUYER_KEY) {
  console.error("BUYER_KEY missing in frontend/.env (generate: node scripts/gen-buyer.mjs)");
  process.exit(1);
}

// base-sepolia chain definition (viem has it built in via chains, but keep this
// script dependency-light)
const baseSepolia = defineChain({
  id: 84532,
  name: "Base Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [env.BASE_SEPOLIA_RPC ?? "https://sepolia.base.org"] } },
  testnet: true,
});

const account = privateKeyToAccount(env.BUYER_KEY);
const walletClient = createWalletClient({ account, chain: baseSepolia, transport: http() });
const publicClient = createPublicClient({ chain: baseSepolia, transport: http() });

const ethBal = await publicClient.getBalance({ address: account.address });
console.log("Buyer:", account.address);
console.log("Base Sepolia ETH balance:", Number(ethBal) / 1e18);

const paidFetch = wrapFetchWithPayment(fetch, walletClient);

const url = `${BASE}/api/sell/fx-quote${fail ? "?fail=1" : ""}`;
console.log("Paying seller for one request:", url);
const res = await paidFetch(url);
const body = await res.json();
console.log("Seller response status:", res.status);
console.log("Delivered:", JSON.stringify(body).slice(0, 200));

if (body.ok === false) {
  console.log("\nDeliverable is garbage. Filing a Recourse dispute via MCP...");
  const dispute = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "recourse_file_dispute",
      arguments: {
        dispute_id: `x402-${Date.now()}`,
        provider: env.SELLER_ADDRESS ?? "",
        service_url: "https://raw.githubusercontent.com/A-Raphie/recourse/master/evidence/service-manifest.txt",
        evidence_url: "https://raw.githubusercontent.com/A-Raphie/recourse/master/evidence/deliverable-error.txt",
        description: "Paid over x402 for a live FX quote, the seller returned a 500 error page",
        amount: 400,
      },
    },
  };
  const mcpRes = await fetch(`${BASE}/api/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dispute),
  });
  const mcpBody = await mcpRes.json();
  console.log("Dispute filed:", mcpBody.result?.content?.[0]?.text ?? JSON.stringify(mcpBody).slice(0, 200));
  console.log("Next: recourse_adjudicate (validators judge, about a minute), then recourse_settle.");
} else {
  console.log("Deliverable looks fine. No dispute needed.");
}
