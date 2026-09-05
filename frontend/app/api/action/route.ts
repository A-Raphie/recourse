import { NextRequest, NextResponse } from "next/server";
import { recourse, getContractReceiptJury } from "@/lib/server/genlayer";

export const dynamic = "force-dynamic";

// UI action endpoint: the zero-wallet judge path. Buttons here write through
// the server demo key; the MetaMask path stays available in the app surface.

function clampAmount(n: unknown): number {
  const v = Math.floor(Number(n));
  if (!Number.isFinite(v)) throw new Error("amount must be a number");
  return Math.max(1, Math.min(1_000_000, v));
}

function reqString(v: unknown, name: string, max = 400): string {
  const s = String(v ?? "").trim();
  if (!s) throw new Error(`${name} is required`);
  return s.slice(0, max);
}

export async function POST(req: NextRequest) {
  let body: { action?: string; args?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }
  const args = body.args ?? {};

  try {
    switch (body.action) {
      case "deposit": {
        const amount = clampAmount(args.amount);
        const { hash } = await recourse.deposit(amount);
        return NextResponse.json({ ok: true, tx: hash, amount });
      }
      case "file": {
        const dispute_id = reqString(args.dispute_id, "dispute id", 120);
        const { hash } = await recourse.fileDispute({
          dispute_id,
          provider: reqString(args.provider, "provider", 64),
          service_url: reqString(args.service_url, "service url"),
          evidence_url: reqString(args.evidence_url, "evidence url"),
          description: reqString(args.description, "description"),
          amount: clampAmount(args.amount),
        });
        return NextResponse.json({ ok: true, tx: hash, dispute_id });
      }
      case "adjudicate": {
        const dispute_id = reqString(args.dispute_id, "dispute id", 120);
        const { hash, receipt } = await recourse.adjudicate(dispute_id);
        const dispute = await recourse.getDispute(dispute_id);
        return NextResponse.json({ ok: true, tx: hash, dispute, receipt });
      }
      case "settle": {
        const dispute_id = reqString(args.dispute_id, "dispute id", 120);
        const dispute = await recourse.getDispute(dispute_id);
        const refund = dispute.refund;
        const { hash } = await recourse.settle(dispute_id);
        return NextResponse.json({ ok: true, tx: hash, refund });
      }
      default:
        return NextResponse.json({ ok: false, error: `unknown action: ${body.action}` }, { status: 400 });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 200 });
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("jury");
  if (!id) {
    return NextResponse.json({ ok: false, error: "jury=<dispute_id> required" }, { status: 400 });
  }
  const jury = await getContractReceiptJury(id);
  return NextResponse.json({ ok: true, jury });
}
