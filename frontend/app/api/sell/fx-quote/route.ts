import { NextRequest, NextResponse } from "next/server";

// The seller agent's public demo surface: same content the paid endpoint serves,
// free, so the landing-page simulator and docs work for every visitor.
// Agents paying real x402 go through /api/sell/fx-quote/x402 (Base Sepolia USDC).
// ?fail=1 deliberately serves garbage, which is the scenario a payer disputes.

const OK_BODY = `Real-time FX rate API.
Returns live USD/EUR quotes as JSON on every request.
Guaranteed uptime: 99.9 percent.

{"base":"USD","quote":"EUR","rate":0.9137,"ts":"2026-09-04T12:00:00Z"}`;

const GARBAGE_BODY = `Internal Server Error.
Error code 500.
No data available.`;

const handler = async (req: NextRequest) => {
  const fail = req.nextUrl.searchParams.get("fail") === "1";
  return NextResponse.json(
    {
      service: "fx-quote",
      promise: "live USD/EUR quote on every request",
      delivered: fail ? GARBAGE_BODY : OK_BODY,
      ok: !fail,
    },
    { status: 200 },
  );
};

export const GET = handler;
