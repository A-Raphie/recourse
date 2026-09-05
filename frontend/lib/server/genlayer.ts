import { createClient } from "genlayer-js";
import { TransactionStatus } from "genlayer-js/types";
import { studionet } from "genlayer-js/chains";
import { privateKeyToAccount } from "viem/accounts";
import { recordTx, getTxs } from "./txindex";

type GenlayerClient = ReturnType<typeof createClient>;
type DemoAccount = ReturnType<typeof privateKeyToAccount>;

export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";
export const RPC_URL = studionet.rpcUrls.default.http[0];

export type RecourseDispute = {
  id: string;
  seq: number;
  payer: string;
  provider: string;
  service_url: string;
  evidence_url: string;
  description: string;
  amount: number;
  status: "filed" | "adjudicated" | "settled";
  refund: boolean;
  verdict_code: string;
  confidence: string;
};

export type RecourseStats = {
  disputes: number;
  filed: number;
  adjudicated: number;
  settled: number;
  refunded: number;
  denied: number;
  total_disputed: number;
  total_refunded: number;
};

function readClient(): GenlayerClient {
  return createClient({ chain: studionet, endpoint: RPC_URL });
}

function writeClient(): {
  client: GenlayerClient;
  account: DemoAccount;
} {
  const key = process.env.DEMO_KEY;
  if (!key) {
    throw new Error("DEMO_KEY is not configured for write operations");
  }
  const account = privateKeyToAccount(key as `0x${string}`);
  const client = createClient({
    chain: studionet,
    // viem is pinned at 2.21.54; genlayer-js peer types expect a newer
    // Account surface. Runtime contract is compatible, only types skew.
    account: account as unknown as never,
    endpoint: RPC_URL,
  });
  return { client, account };
}

async function read<T>(functionName: string, args: unknown[]): Promise<T> {
  const client = readClient();
  const result = await client.readContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    functionName,
    args: args as never,
  });
  return result as T;
}

async function write(
  functionName: string,
  args: unknown[],
  disputeId?: string,
): Promise<{ hash: string; receipt: Record<string, unknown> }> {
  const { client } = writeClient();
  const hash = (await client.writeContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    functionName,
    args: args as never,
    value: 0n,
  })) as unknown as string;
  const receipt = (await client.waitForTransactionReceipt({
    hash: hash as `0x${string}` & { length: 66 },
    status: TransactionStatus.ACCEPTED,
    retries: 60,
    interval: 3000,
  })) as unknown as Record<string, unknown>;
  if (disputeId) recordTx(disputeId, functionName, hash, String(receipt.created_at ?? ""));
  return { hash, receipt };
}

export const recourse = {
  async getStats(): Promise<RecourseStats> {
    return read<RecourseStats>("get_stats", []);
  },
  async getDispute(id: string): Promise<RecourseDispute> {
    return read<RecourseDispute>("get_dispute", [id]);
  },
  async getDisputes(): Promise<RecourseDispute[]> {
    return read<RecourseDispute[]>("get_disputes", []);
  },
  async getDisputesByParty(address: string): Promise<RecourseDispute[]> {
    return read<RecourseDispute[]>("get_disputes_by_party", [address]);
  },
  async getBalance(address: string): Promise<{ available: number; locked: number }> {
    return read("get_balance", [address]);
  },
  async deposit(amount: number) {
    return write("deposit", [amount]);
  },
  async fileDispute(input: {
    dispute_id: string;
    provider: string;
    service_url: string;
    evidence_url: string;
    description: string;
    amount: number;
  }) {
    return write(
      "file_dispute",
      [
        input.dispute_id,
        input.provider,
        input.service_url,
        input.evidence_url,
        input.description,
        input.amount,
      ],
      input.dispute_id,
    );
  },
  async adjudicate(disputeId: string) {
    return write("adjudicate", [disputeId], disputeId);
  },
  async settle(disputeId: string) {
    return write("settle", [disputeId], disputeId);
  },
};

export type JurySeat = {
  role: string;
  address: string;
  model: string;
  vote: string | null;
  execution_result: string;
};

// The Open Jury data: the adjudicate tx's consensus record carries every
// validator's model and vote. Source of truth is the chain receipt; the
// txindex only tells us which receipt to fetch.
export async function getContractReceiptJury(disputeId: string): Promise<JurySeat[]> {
  const txs = getTxs(disputeId);
  const hash = txs["adjudicate"]?.hash;
  if (!hash) return [];

  const client = readClient();
  try {
    const tx = (await client.getTransaction({
      hash: hash as unknown as `0x${string}` & { length: 66 },
    })) as unknown as {
      consensus_data?: {
        leader_receipt?: Array<Record<string, unknown>>;
        validators?: Array<Record<string, unknown>>;
      };
    };

    const cd = tx.consensus_data;
    if (!cd) return [];

    const seats: JurySeat[] = [];

    const leaderReceipt = cd.leader_receipt?.[0];
    if (leaderReceipt) {
      const nodeConfig = leaderReceipt.node_config as
        | { address?: string; primary_model?: { model?: string } }
        | undefined;
      seats.push({
        role: "leader",
        address: nodeConfig?.address ?? "",
        model: nodeConfig?.primary_model?.model ?? "unknown model",
        vote: (leaderReceipt.vote as string) ?? "proposed",
        execution_result: String(leaderReceipt.execution_result ?? "UNKNOWN"),
      });
    }

    for (const v of cd.validators ?? []) {
      const nodeConfig = v.node_config as
        | { address?: string; primary_model?: { model?: string } }
        | undefined;
      seats.push({
        role: "validator",
        address: nodeConfig?.address ?? "",
        model: nodeConfig?.primary_model?.model ?? "unknown model",
        vote: (v.vote as string) ?? null,
        execution_result: String(v.execution_result ?? "UNKNOWN"),
      });
    }

    return seats;
  } catch {
    // RPC hiccup: the dossier still renders; the jury section falls back to
    // the awaiting state rather than failing the whole page.
    return [];
  }
}
