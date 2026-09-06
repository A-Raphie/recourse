import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "x402-next";

// The seller agent's PAID surface: real x402 over Base Sepolia when
// X402_MODE=real (buyer pays 0.01 USDC per request, facilitator settles to the
// seller wallet). Any other value serves free, for runs that must not block on
// faucet availability. Materials only claim real x402 when mode was real.
// The free browser-demo twin of this endpoint is /api/sell/fx-quote.

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
