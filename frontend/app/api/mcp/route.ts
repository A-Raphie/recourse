import { NextRequest, NextResponse } from "next/server";
import { recourse } from "@/lib/server/genlayer";

export const dynamic = "force-dynamic";

const PROTOCOL = "2025-06-18";
const SERVER = { name: "recourse", title: "Recourse: post-payment disputes for the agent economy", version: "0.1.0" };

const TOOLS = [
  {
    name: "recourse_stats",
    description:
      "Live dispute stats for the Recourse protocol on GenLayer: dispute counts by state, refunded vs denied, totals. Call to inspect the market before acting.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "recourse_get_dispute",
    description:
      "Fetch one dispute by id: status pipeline (filed, adjudicated, settled), verdict, reason code, confidence, parties, amount, evidence URLs.",
    inputSchema: {
      type: "object",
      properties: {
        dispute_id: { type: "string", description: "The dispute id, e.g. d-001" },
      },
      required: ["dispute_id"],
    },
  },
  {
    name: "recourse_get_disputes",
    description: "List all disputes, newest last. Optionally filter to disputes where the address is payer or provider.",
    inputSchema: {
      type: "object",
      properties: {
        party: { type: "string", description: "Optional: filter by payer or provider address" },
      },
      required: [],
    },
  },
  {
    name: "recourse_get_balance",
    description: "Escrow balance for an address: available units and units locked in open disputes.",
    inputSchema: {
      type: "object",
      properties: {
        address: { type: "string", description: "Account address" },
      },
      required: ["address"],
    },
  },
  {
    name: "recourse_deposit",
    description:
      "Credit escrow units to the demo payer account. Demo-rail operation on the GenLayer Studio testnet; units are ledger entries, not live tokens.",
    inputSchema: {
      type: "object",
      properties: {
        amount: { type: "number", description: "Escrow units to credit (1 to 1000000)" },
      },
      required: ["amount"],
    },
  },
  {
    name: "recourse_file_dispute",
    description:
      "File a post-payment dispute: the payer claims the delivered service failed the promise. Locks the disputed amount in escrow, then a GenLayer validator jury adjudicates the pinned evidence. Call recourse_deposit first if the demo account has no balance.",
    inputSchema: {
      type: "object",
      properties: {
        dispute_id: { type: "string", description: "Unique id you choose, e.g. d-20260904-001" },
        provider: { type: "string", description: "Provider account address" },
        service_url: { type: "string", description: "URL of the page describing what was promised" },
        evidence_url: { type: "string", description: "URL of the deliverable the payer actually received" },
        description: { type: "string", description: "The payer's claim in one or two sentences" },
        amount: { type: "number", description: "Disputed amount in escrow units (1 to 1000000)" },
      },
      required: ["dispute_id", "provider", "service_url", "evidence_url", "description", "amount"],
    },
  },
  {
    name: "recourse_adjudicate",
    description:
      "Trigger validator-jury adjudication for a filed dispute. Validators render both evidence URLs, judge under consensus, and the verdict (refund true/false, reason code, confidence) is written on-chain. May take about a minute.",
    inputSchema: {
      type: "object",
      properties: {
        dispute_id: { type: "string", description: "A dispute in filed state" },
      },
      required: ["dispute_id"],
    },
  },
  {
    name: "recourse_settle",
    description:
      "Settle an adjudicated dispute: on refund the locked escrow returns to the payer, otherwise it releases to the provider.",
    inputSchema: {
      type: "object",
      properties: {
        dispute_id: { type: "string", description: "A dispute in adjudicated state" },
      },
      required: ["dispute_id"],
    },
  },
];

function rpcResult(id: unknown, result: unknown) {
  return NextResponse.json({ jsonrpc: "2.0", id, result }, { status: 200 });
}

function rpcError(id: unknown, code: number, message: string) {
  return NextResponse.json({ jsonrpc: "2.0", id, error: { code, message } }, { status: 200 });
}

function clampAmount(n: unknown): number {
  const v = Math.floor(Number(n));
  if (!Number.isFinite(v)) throw new Error("amount must be a number");
  return Math.max(1, Math.min(1_000_000, v));
}

function reqString(v: unknown, name: string, max = 400): string {
  const s = String(v ?? "").trim();
  if (!s) throw new Error(`${name} is required`);
  if (s.startsWith("http")) return s.slice(0, 2000);
  return s.slice(0, max);
}

async function callTool(name: string, args: Record<string, unknown>) {
  switch (name) {
    case "recourse_stats": {
      const stats = await recourse.getStats();
      return {
        text: `Disputes: ${stats.disputes} (filed ${stats.filed}, adjudicated ${stats.adjudicated}, settled ${stats.settled}). Refunded ${stats.refunded}, denied ${stats.denied}. Total disputed ${stats.total_disputed}, total refunded ${stats.total_refunded}.`,
        structuredContent: stats,
      };
    }
    case "recourse_get_dispute": {
      const dispute = await recourse.getDispute(reqString(args.dispute_id, "dispute_id", 120));
      return {
        text: `Dispute ${dispute.id}: ${dispute.status}, refund=${dispute.refund}, code=${dispute.verdict_code || "-"}, confidence=${dispute.confidence || "-"}.`,
        structuredContent: dispute,
      };
    }
    case "recourse_get_disputes": {
      const list = args.party
        ? await recourse.getDisputesByParty(reqString(args.party, "party", 64))
        : await recourse.getDisputes();
      return {
        text: `${list.length} dispute(s).`,
        structuredContent: { disputes: list },
      };
    }
    case "recourse_get_balance": {
      const balance = await recourse.getBalance(reqString(args.address, "address", 64));
      return {
        text: `Available ${balance.available}, locked ${balance.locked}.`,
        structuredContent: balance,
      };
    }
    case "recourse_deposit": {
      const amount = clampAmount(args.amount);
      const { hash } = await recourse.deposit(amount);
      return {
        text: `Deposited ${amount} escrow units. Tx ${hash}.`,
        structuredContent: { amount, tx: hash },
      };
    }
    case "recourse_file_dispute": {
      const { hash } = await recourse.fileDispute({
        dispute_id: reqString(args.dispute_id, "dispute_id", 120),
        provider: reqString(args.provider, "provider", 64),
        service_url: reqString(args.service_url, "service_url"),
        evidence_url: reqString(args.evidence_url, "evidence_url"),
        description: reqString(args.description, "description"),
        amount: clampAmount(args.amount),
      });
      return {
        text: `Dispute ${String(args.dispute_id)} filed and amount locked in escrow. Tx ${hash}. Next: call recourse_adjudicate.`,
        structuredContent: { filed: true, tx: hash },
      };
    }
    case "recourse_adjudicate": {
      const { hash, receipt } = await recourse.adjudicate(reqString(args.dispute_id, "dispute_id", 120));
      const dispute = await recourse.getDispute(reqString(args.dispute_id, "dispute_id", 120));
      return {
        text: `Verdict: refund=${dispute.refund}, code=${dispute.verdict_code}, confidence=${dispute.confidence}. Tx ${hash}. Next: call recourse_settle.`,
        structuredContent: { dispute, tx: hash, receipt },
      };
    }
    case "recourse_settle": {
      const disputeId = reqString(args.dispute_id, "dispute_id", 120);
      const before = await recourse.getDispute(disputeId);
      const { hash } = await recourse.settle(disputeId);
      return {
        text: before.refund
          ? `Settled: escrow returned to payer. Tx ${hash}.`
          : `Settled: escrow released to provider. Tx ${hash}.`,
        structuredContent: { settled: true, refund: before.refund, tx: hash },
      };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export async function GET() {
  return NextResponse.json(
    {
      server: SERVER,
      transport: "streamable-http (jsonrpc 2.0 over POST)",
      tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
      usage:
        "POST JSON-RPC 2.0: initialize, tools/list, tools/call. Flow: deposit -> file_dispute -> adjudicate -> settle.",
      contract: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? null,
      network: "genlayer-studio-testnet",
    },
    { status: 200 },
  );
}

export async function POST(req: NextRequest) {
  let body: {
    id?: unknown;
    method?: string;
    params?: { name?: string; arguments?: Record<string, unknown> };
  };
  try {
    body = await req.json();
  } catch {
    return rpcError(null, -32700, "Parse error");
  }
  const id = body.id ?? null;

  try {
    switch (body.method) {
      case "initialize":
        return rpcResult(id, {
          protocolVersion: PROTOCOL,
          capabilities: { tools: {} },
          serverInfo: SERVER,
        });
      case "notifications/initialized":
        return new NextResponse(null, { status: 202 });
      case "ping":
        return rpcResult(id, {});
      case "tools/list":
        return rpcResult(id, { tools: TOOLS });
      case "tools/call": {
        const name = body.params?.name ?? "";
        const args = body.params?.arguments ?? {};
        try {
          const out = await callTool(name, args);
          return rpcResult(id, {
            content: [{ type: "text", text: out.text }],
            structuredContent: out.structuredContent,
          });
        } catch (toolError) {
          const message = toolError instanceof Error ? toolError.message : String(toolError);
          return rpcResult(id, {
            content: [{ type: "text", text: `Error: ${message}` }],
            isError: true,
          });
        }
      }
      default:
        return rpcError(id, -32601, `Method not found: ${body.method}`);
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return rpcError(id, -32603, message);
  }
}
