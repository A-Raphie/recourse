import Link from "next/link";
import { recourse } from "@/lib/server/genlayer";
import { getTxs } from "@/lib/server/txindex";
import { SITE_URL } from "@/lib/site";
import { SiteFooter } from "@/components/SiteFooter";
import { FileDisputeForm } from "@/components/dispute/FileDisputeForm";
import type { RecourseDispute, RecourseStats } from "@/lib/server/genlayer";

export const dynamic = "force-dynamic";

const CONTRACT = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";
const PAGE_SIZE = 8;

function StatusPill({ status, refund }: { status: string; refund: boolean }) {
  if (status === "settled") {
    return (
      <span className={`pill ${refund ? "pill-refund" : "pill-deny"}`}>
        {refund ? "settled · refunded" : "settled · denied"}
      </span>
    );
  }
  return (
    <span className="pill pill-live">
      <span className="status-dot" />
      {status}
    </span>
  );
}

function FlowStep({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="card card-hover p-5">
      <span
        className="mb-3 inline-flex items-center justify-center rounded-full font-mono text-xs"
        style={{
          width: 26,
          height: 26,
          background: "var(--accent)",
          color: "var(--accent-foreground)",
        }}
      >
        {n}
      </span>
      <h3 className="mb-1 text-lg">{title}</h3>
      <p className="caption">{body}</p>
    </div>
  );
}

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? "1") || 1);

  let stats: RecourseStats | null = null;
  let disputes: RecourseDispute[] = [];
  let offline = false;
  try {
    [stats, disputes] = await Promise.all([recourse.getStats(), recourse.getDisputes()]);
    disputes = [...disputes].sort((a, b) => Number(b.seq) - Number(a.seq));
  } catch {
    offline = true;
  }

  const totalPages = Math.max(1, Math.ceil(disputes.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = disputes.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const statCards = stats
    ? [
        { label: "Disputes filed", value: stats.disputes },
        { label: "Settled by jury", value: stats.settled },
        { label: "Refunded", value: stats.refunded },
        { label: "Units returned", value: stats.total_refunded },
      ]
    : [];

  return (
    <>
      <main className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6">
        <nav className="mb-14 flex items-center justify-between">
          <span className="font-mono text-sm font-bold tracking-wide" style={{ color: "var(--text-primary)" }}>
            RE·COURSE
          </span>
          <div className="flex items-center gap-5 font-mono text-xs">
            <span className="pill pill-live">
              <span className="status-dot status-dot-live" /> live
            </span>
            <a href="#feed" style={{ color: "var(--text-secondary)" }}>
              feed
            </a>
            <a href="#agent" style={{ color: "var(--text-secondary)" }}>
              agents
            </a>
            <a
              href="https://github.com/A-Raphie/recourse"
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--text-secondary)" }}
            >
              github
            </a>
          </div>
        </nav>

        {/* Hero: plain verbs. Agents are the audience; the CTA says so. */}
        <section className="mb-14">
          <h1
            className="max-w-4xl"
            style={{ fontSize: "clamp(2.4rem, 6vw, 4.2rem)", lineHeight: 1.02 }}
          >
            Your agent paid. The service lied.
            <br />
            <span style={{ color: "var(--accent)" }}>Get the units back.</span>
          </h1>
          <p className="caption mt-5 max-w-2xl text-base">
            Recourse is a dispute layer for machine-to-machine payments on
            GenLayer. File with pinned evidence, a jury of validators judges it
            under consensus, and the escrowed amount settles refund-or-deny
            on-chain. No emails. No support desk. A court that runs in a minute.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="#agent" className="btn btn-primary btn-lg">
              Connect your agent · MCP
            </Link>
            <Link href="#feed" className="btn btn-ghost btn-lg">
              See live disputes
            </Link>
          </div>
          <p className="micro mt-3" style={{ textTransform: "none", letterSpacing: "0.02em" }}>
            I ship agents: file and settle disputes as MCP tool calls. I buy
            services: file from the feed below, no wallet needed.
          </p>
          <p className="micro mt-5" style={{ textTransform: "none", letterSpacing: "0.02em" }}>
            live · genlayer studio testnet · contract {CONTRACT.slice(0, 10)}…{CONTRACT.slice(-6)}
          </p>
        </section>

        {/* Stats strip: four numbers, framed as the demo ledger they come from. */}
        <section className="mb-14" aria-label="Live stats">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="pill">testnet demo ledger</span>
            <span className="micro" style={{ textTransform: "none", letterSpacing: "0.02em" }}>
              live counts from the GenLayer Studio demo, not production volume
            </span>
          </div>
          {offline ? (
            <div className="card p-5">
              <span className="micro" style={{ color: "var(--status-error)" }}>
                The GenLayer RPC did not answer just now.
              </span>
              <p className="caption mt-1">Refresh the page; the chain state is the only source of these numbers.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {statCards.map((s) => (
                <div key={s.label} className="card p-5">
                  <p className="micro mb-2">{s.label}</p>
                  <p className="number-lg">{s.value}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* How it works. */}
        <section className="mb-14">
          <h2 className="mb-5 text-3xl">How a dispute runs</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <FlowStep
              n={1}
              title="The agent pays"
              body="A payer agent buys a service over x402 or any rail. The disputed amount sits in the Recourse escrow ledger."
            />
            <FlowStep
              n={2}
              title="The deliverable is garbage"
              body="A 500 page instead of the quote. Until now that was the end of the story: no refund path existed."
            />
            <FlowStep
              n={3}
              title="The payer files"
              body="One tool call pins both evidence URLs and locks the amount. Agents file through MCP; humans file below."
            />
            <FlowStep
              n={4}
              title="The jury settles"
              body="Validators render both URLs themselves, judge under consensus, and the escrow pays the payer or the provider. On-chain, in about a minute."
            />
          </div>
        </section>

        {/* Live feed: the product proof. */}
        <section className="mb-14 scroll-mt-16" id="feed" aria-label="Live disputes">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-3xl">Live disputes</h2>
            <span className="pill pill-live">
              <span className="status-dot status-dot-live" /> every row is chain state
            </span>
          </div>

          <div className="mb-5">
            <FileDisputeForm />
          </div>

          {disputes.length === 0 && !offline ? (
            <div className="card p-6">
              <p className="caption">
                No disputes on the ledger yet. File the first one: the form ships
                prefilled with a real failed delivery.
              </p>
            </div>
          ) : (
            <>
              <div className="card overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "var(--border-default)" }}>
                      <th className="micro px-4 py-3 text-left">Dispute</th>
                      <th className="micro px-4 py-3 text-left">Filed</th>
                      <th className="micro px-4 py-3 text-left">Parties</th>
                      <th className="micro px-4 py-3 text-left">Amount</th>
                      <th className="micro px-4 py-3 text-left">Status</th>
                      <th className="micro px-4 py-3 text-left">Verdict</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((d) => {
                      const filedAt = getTxs(d.id)["file_dispute"]?.at;
                      return (
                        <tr
                          key={d.id}
                          className="border-b transition-colors last:border-0 hover:bg-subtle"
                          style={{ borderColor: "var(--border-default)" }}
                        >
                          <td className="px-4 py-3">
                            <Link href={`/d/${d.id}`} className="font-mono text-xs" style={{ color: "var(--accent)" }}>
                              /d/{d.id}
                            </Link>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                            {filedAt
                              ? new Date(filedAt).toLocaleString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  timeZone: "UTC",
                                })
                              : "…"}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                            {short(d.payer)} → {short(d.provider)}
                          </td>
                          <td className="tabular px-4 py-3">{d.amount.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <StatusPill status={d.status} refund={d.refund} />
                          </td>
                          <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                            {d.verdict_code || "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="mt-3 flex items-center justify-between font-mono text-xs">
                  <span style={{ color: "var(--text-muted)" }}>
                    page {safePage} of {totalPages} · {disputes.length} disputes
                  </span>
                  <div className="flex gap-3">
                    {safePage > 1 && (
                      <Link
                        href={safePage - 1 === 1 ? "/?#feed" : `/?page=${safePage - 1}#feed`}
                        style={{ color: "var(--accent)" }}
                      >
                        ← newer
                      </Link>
                    )}
                    {safePage < totalPages && (
                      <Link href={`/?page=${safePage + 1}#feed`} style={{ color: "var(--accent)" }}>
                        older →
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* Connect your agent. */}
        <section className="mb-6 scroll-mt-16" id="agent" aria-label="Connect your agent">
          <h2 className="mb-5 text-3xl">Connect your agent</h2>
          <p className="caption mb-4 max-w-2xl">
            Any MCP client can run the whole loop: check the ledger, file the
            dispute, call the jury, collect the settlement. Point it at the
            endpoint and give it this config:
          </p>
          <div className="card overflow-x-auto p-5">
            <pre className="font-mono text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
{`{
  "mcpServers": {
    "recourse": {
      "url": "${SITE_URL}/api/mcp",
      "note": "flow: deposit, file_dispute, adjudicate, settle"
    }
  }
}`}
            </pre>
          </div>
          <p className="micro mt-3" style={{ textTransform: "none", letterSpacing: "0.02em" }}>
            GET /api/mcp self-describes: tool list, flow, contract address. llms.txt at the root.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
