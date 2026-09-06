"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({
  value,
  label,
  small,
}: {
  value: string;
  label?: string;
  small?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="inline-flex items-center gap-1 rounded-full font-mono transition-colors"
      style={{
        fontSize: small ? "0.62rem" : "0.7rem",
        letterSpacing: "0.06em",
        padding: small ? "2px 7px" : "3px 10px",
        color: copied ? "var(--refund)" : "var(--text-secondary)",
        border: "1px solid var(--border-default)",
        background: "var(--bg-subtle)",
      }}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
        }
      }}
      aria-label={label ?? `Copy ${value}`}
    >
      {copied ? <Check size={11} strokeWidth={2.5} /> : <Copy size={11} strokeWidth={2} />}
      {copied ? "copied" : (label ?? "copy")}
    </button>
  );
}

export function CopyField({
  value,
  display,
}: {
  value: string;
  display?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
        {display ?? value}
      </span>
      <CopyButton value={value} small />
    </span>
  );
}

const SNIPPETS: Record<string, string> = {
  TypeScript: `import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { privateKeyToAccount } from "viem/accounts";

const client = createClient({
  chain: studionet,
  account: privateKeyToAccount(process.env.KEY!),
  endpoint: "https://studio.genlayer.com/api",
});

// 1. fund the payer, 2. lock the dispute, 3. call the jury, 4. settle
await client.writeContract({
  address: CONTRACT, functionName: "deposit", args: [1000], value: 0n,
});
await client.writeContract({
  address: CONTRACT, functionName: "file_dispute",
  args: ["d-001", PROVIDER, PROMISE_URL, EVIDENCE_URL, CLAIM, 400], value: 0n,
});
await client.writeContract({ address: CONTRACT, functionName: "adjudicate", args: ["d-001"], value: 0n });
await client.writeContract({ address: CONTRACT, functionName: "settle", args: ["d-001"], value: 0n });`,
  Python: `# via the MCP endpoint, using any MCP client
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

async with streamablehttp_client("https://tryrecourse.vercel.app/api/mcp") as (r, w, _):
    async with ClientSession(r, w) as session:
        await session.initialize()
        await session.call_tool("recourse_deposit", {"amount": 1000})
        await session.call_tool("recourse_file_dispute", {
            "dispute_id": "d-001", "provider": PROVIDER,
            "service_url": PROMISE_URL, "evidence_url": EVIDENCE_URL,
            "description": "Paid for a live quote, got a 500",
            "amount": 400,
        })
        await session.call_tool("recourse_adjudicate", {"dispute_id": "d-001"})
        await session.call_tool("recourse_settle", {"dispute_id": "d-001"})`,
  cURL: `BASE=https://tryrecourse.vercel.app/api/mcp

# discover the server
curl -s $BASE

# file a dispute (after deposit)
curl -s -X POST $BASE -H 'Content-Type: application/json' -d '{
  "jsonrpc": "2.0", "id": 1, "method": "tools/call",
  "params": {
    "name": "recourse_file_dispute",
    "arguments": {
      "dispute_id": "d-001", "provider": "0x...",
      "service_url": "https://.../promise",
      "evidence_url": "https://.../delivered",
      "description": "500 instead of the paid quote",
      "amount": 400
    }
  }
}'`,
};

const TOOLS = [
  {
    name: "recourse_deposit",
    params: "amount: number (1 to 1000000)",
    returns: "escrow balance credited, tx hash",
  },
  {
    name: "recourse_file_dispute",
    params:
      "dispute_id: string · provider: string · service_url: string · evidence_url: string · description: string · amount: number",
    returns: "dispute filed, amount + stake locked, tx hash",
  },
  {
    name: "recourse_adjudicate",
    params: "dispute_id: string",
    returns: "refund_pct (0-100) · reason_code · confidence · tx hash",
  },
  {
    name: "recourse_settle",
    params: "dispute_id: string",
    returns: "escrow split between payer and provider, tx hash",
  },
];

export function DeveloperHub({ mcpUrl }: { mcpUrl: string }) {
  const [tab, setTab] = useState<string>("TypeScript");
  const tabs = Object.keys(SNIPPETS);

  return (
    <div className="flex flex-col gap-4">
      <div className="card overflow-hidden">
        <div
          className="flex items-center justify-between gap-3 border-b px-4 py-2"
          style={{ borderColor: "var(--border-default)" }}
        >
          <div className="flex gap-1">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="rounded-full font-mono"
                style={{
                  fontSize: "0.7rem",
                  letterSpacing: "0.06em",
                  padding: "3px 12px",
                  color: tab === t ? "var(--accent-foreground)" : "var(--text-secondary)",
                  background: tab === t ? "var(--accent)" : "transparent",
                  border: tab === t ? "1px solid transparent" : "1px solid var(--border-default)",
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <CopyButton value={SNIPPETS[tab]} label="copy snippet" />
        </div>
        <pre
          className="overflow-x-auto p-4 font-mono text-xs leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          {SNIPPETS[tab]}
        </pre>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--border-default)" }}>
              <th className="micro px-4 py-3 text-left">Tool</th>
              <th className="micro px-4 py-3 text-left">Inputs</th>
              <th className="micro px-4 py-3 text-left">Effect</th>
            </tr>
          </thead>
          <tbody>
            {TOOLS.map((t) => (
              <tr key={t.name} className="border-b last:border-0" style={{ borderColor: "var(--border-default)" }}>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--accent)" }}>
                  {t.name}
                </td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                  {t.params}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>
                  {t.returns}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-4">
        <p className="micro mb-2">MCP client config</p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <code className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
            {`{ "mcpServers": { "recourse": { "url": "${mcpUrl}" } } }`}
          </code>
          <CopyButton value={`{\n  "mcpServers": {\n    "recourse": {\n      "url": "${mcpUrl}",\n      "note": "flow: deposit, file_dispute, adjudicate, settle"\n    }\n  }\n}`} label="copy config" />
        </div>
      </div>
    </div>
  );
}
