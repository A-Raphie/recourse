import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "x402-next";

// The seller agent: charges per request over x402 (real protocol, Base Sepolia).
// Demo mode: ?fail=1 deliberately serves garbage AFTER taking payment, which is
// the scenario a payer disputes. The served content matches the pinned evidence
// fixtures in this repository so validators can render exactly what was received.

const OK_BODY = `Real-time FX rate API.
Returns live USD/EUR quotes as JSON on every request.
Guaranteed uptime: 99.9 percent.

{"base":"USD","quote":"EUR","rate":0.9137,"ts":"2026-09-04T12:00:00Z"}`;

const GARBAGE_BODY = `Internal Server Error.
Error code 500.
No data available.`;

const SELLER_ADDRESS = (process.env.SELLER_ADDRESS ??
  process.env.NEXT_PUBLIC_DEMO_ADDRESS ??
  "") as `0x${string}`;

// X402_MODE=real wraps the route with the actual x402 payment protocol on
// Base Sepolia (needs funded buyer + seller wallets). Any other value serves
// the same endpoint without payment, for demo takes that must not block on
// faucet availability. Materials only claim real x402 when mode was real.
const x402Real = process.env.X402_MODE === "real";

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

export const GET = x402Real
  ? withX402(handler, SELLER_ADDRESS, {
      price: "$0.01",
      network: "base-sepolia",
      config: {
        description: "Recourse demo seller: one live FX quote request",
      },
    })
  : handler;
