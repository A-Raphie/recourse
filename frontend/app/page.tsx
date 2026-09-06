import Link from "next/link";
import { DisputeSimulator } from "@/components/DisputeSimulator";
import { recourse } from "@/lib/server/genlayer";
import { getTxs } from "@/lib/server/txindex";
import { SITE_URL } from "@/lib/site";
import { SiteFooter } from "@/components/SiteFooter";
import { FileDisputeForm } from "@/components/dispute/FileDisputeForm";
import { DeveloperHub } from "@/components/DeveloperHub";
import type { RecourseDispute, RecourseStats } from "@/lib/server/genlayer";

export const dynamic = "force-dynamic";

const CONTRACT = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";
const PAGE_SIZE = 8;

function StatusPill({ status, refundPct }: { status: string; refundPct: number }) {
  if (status === "settled") {
    return (
      <span className={`pill ${refundPct > 0 ? "pill-refund" : "pill-deny"}`}>
        {refundPct > 0 ? `settled · ${refundPct}% refunded` : "settled · denied"}
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
        { label: "Slashed to validator pool", value: stats.validator_pool },
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

        {/* HERO: split fold. Left: the pitch. Right: the live control room. */}
        <section className="hero-wash relative mb-12 overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border-default)" }}>
          <div className="grid-texture absolute inset-0" aria-hidden />
          <div className="relative grid grid-cols-1 gap-8 p-6 sm:p-10 lg:grid-cols-12">
            <div className="flex flex-col justify-center lg:col-span-7">
              <p className="micro mb-4" style={{ color: "var(--accent)" }}>
                Post-payment recourse · GenLayer Agent Tank
              </p>
              <h1
                className="max-w-2xl"
                style={{ fontSize: "clamp(2rem, 4.6vw, 3.9rem)", lineHeight: 1.03 }}
              >
                Your agent paid. The service lied.
                <br />
                <span style={{ color: "var(--accent)" }}>Get the units back.</span>
              </h1>
              <p className="caption mt-5 max-w-xl text-base">
                A dispute layer for machine-to-machine payments. File with pinned
                evidence, a jury of validators judges it under consensus, and the
                escrowed amount settles on-chain. A court that runs in a minute.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link href="#agent" className="btn btn-primary btn-lg">
                  Connect your agent · MCP
                </Link>
                <Link href="#feed" className="btn btn-ghost btn-lg">
                  See live disputes
                </Link>
              </div>
              <p className="micro mt-4" style={{ textTransform: "none", letterSpacing: "0.02em" }}>
                I ship agents: disputes as MCP tool calls · I buy services: file from the feed, no wallet needed
              </p>
            </div>

            {/* Control room: the product, live, in the fold */}
            <div className="lg:col-span-5">
              <div className="card card-inset flex h-full flex-col overflow-hidden" style={{ boxShadow: "0 24px 60px -24px rgb(0 19 32 / 0.95), 0 0 0 1px rgb(var(--accent-rgb) / 0.12)" }}>
                <div className="flex items-center justify-between border-b px-4 py-2.5" style={{ borderColor: "var(--border-default)", background: "var(--bg-subtle)" }}>
                  <div className="flex items-center gap-2">
                    <span className="status-dot status-dot-live" />
                    <span className="micro">control room</span>
                  </div>
                  <span className="pill pill-live" style={{ fontSize: "0.6rem", padding: "2px 8px" }}>
                    live · studio
                  </span>
                </div>

                {offline ? (
                  <div className="flex flex-1 items-center justify-center p-6">
                    <p className="caption">GenLayer RPC did not answer. Refresh: the chain is the only source.</p>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col gap-4 p-5">
                    <div>
                      <p className="micro mb-1">Units returned by juries</p>
                      <div className="flex items-baseline gap-3">
                        <p className="number-xl" style={{ fontSize: "clamp(2.6rem, 4vw, 3.6rem)" }}>
                          {stats?.total_refunded.toLocaleString() ?? "…"}
                        </p>
                        <span className="pill pill-refund" style={{ fontSize: "0.6rem" }}>
                          {stats?.refunded ?? 0} refunds
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg border px-3 py-2" style={{ borderColor: "var(--border-default)" }}>
                        <p className="micro" style={{ fontSize: "0.58rem" }}>filed</p>
                        <p className="tabular font-mono text-lg" style={{ color: "var(--text-primary)" }}>{stats?.disputes ?? 0}</p>
                      </div>
                      <div className="rounded-lg border px-3 py-2" style={{ borderColor: "var(--border-default)" }}>
                        <p className="micro" style={{ fontSize: "0.58rem" }}>settled</p>
                        <p className="tabular font-mono text-lg" style={{ color: "var(--text-primary)" }}>{stats?.settled ?? 0}</p>
                      </div>
                      <div className="rounded-lg border px-3 py-2" style={{ borderColor: "var(--border-default)" }}>
                        <p className="micro" style={{ fontSize: "0.58rem" }}>pool</p>
                        <p className="tabular font-mono text-lg" style={{ color: "var(--text-primary)" }}>{stats?.validator_pool ?? 0}</p>
                      </div>
                    </div>

                    <div className="mt-auto">
                      <p className="micro mb-2" style={{ fontSize: "0.58rem" }}>latest case</p>
                      {disputes[0] ? (
                        <Link
                          href={`/d/${disputes[0].id}`}
                          className="group flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                          style={{ borderColor: "var(--border-default)", background: "var(--bg-subtle)" }}
                        >
                          <span className="font-mono text-xs" style={{ color: "var(--accent)" }}>
                            /d/{disputes[0].id.slice(0, 22)}
                          </span>
                          <span className={`pill ${disputes[0].refund_pct > 0 ? "pill-refund" : "pill-deny"}`} style={{ fontSize: "0.58rem" }}>
                            {disputes[0].status === "settled"
                              ? `${disputes[0].refund_pct}% refund`
                              : disputes[0].status}
                          </span>
                        </Link>
                      ) : (
                        <span className="caption">No cases yet. Run one below.</span>
                      )}
                    </div>

                    <p className="micro" style={{ textTransform: "none", letterSpacing: "0.02em", fontSize: "0.62rem" }}>
                      chain 61999 · contract {CONTRACT.slice(0, 8)}…{CONTRACT.slice(-4)} · every number is chain state
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Simulator: the whole flow, one click, on chain. */}
        <section className="mb-14 scroll-mt-16" id="simulate" aria-label="Dispute simulator">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="text-3xl">Watch a dispute run</h2>
            <span className="pill pill-live">
              <span className="status-dot status-dot-live" /> real transactions
            </span>
            <span className="micro" style={{ textTransform: "none", letterSpacing: "0.02em" }}>
              one click: buy · fail · file · jury · settle
            </span>
          </div>
          <DisputeSimulator />
        </section>

        {/* How the escrow stands right now (bento density, glance-first). */}
        <section className="mb-12" aria-label="Live stats">
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
            <div className="stagger grid grid-cols-2 gap-4 md:grid-cols-4">
              {(stats ? [
                { label: "Disputes filed", value: stats.disputes, sub: "on the ledger" },
                { label: "Settled by jury", value: stats.settled, sub: "consensus verdicts" },
                { label: "Refunded", value: stats.refunded, sub: "units returned" },
                { label: "Disputed volume", value: stats.total_disputed, sub: "units locked" },
              ] : []).map((c) => (
                <div key={c.label} className="card lift p-5">
                  <p className="micro mb-2">{c.label}</p>
                  <p className="number-lg">{c.value.toLocaleString()}</p>
                  <p className="micro mt-1" style={{ textTransform: "none", letterSpacing: "0.02em", fontSize: "0.62rem" }}>
                    {c.sub}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* How a dispute runs: one connected line, four nodes. */}
        <section className="mb-12">
          <h2 className="mb-5 text-3xl">How a dispute runs</h2>
          <div className="stagger grid grid-cols-1 gap-4 md:grid-cols-4">
            {[
              { n: 1, title: "The agent pays", body: "A payer buys a service over x402 or any rail. The amount sits in the Recourse escrow ledger.", accent: "var(--refund)" },
              { n: 2, title: "The deliverable is garbage", body: "A 500 page instead of the quote. Until now: no refund path existed.", accent: "var(--deny)" },
              { n: 3, title: "The payer files", body: "One tool call pins both evidence URLs and locks amount plus anti-spam stake.", accent: "var(--accent)" },
              { n: 4, title: "The jury settles", body: "Validators render both URLs, judge under consensus, escrow splits on-chain in about a minute.", accent: "var(--lime)" },
            ].map((step, i) => (
              <div key={step.n} className="relative">
                {i > 0 && (
                  <span
                    aria-hidden
                    className="absolute top-7 hidden h-px w-4 md:block"
                    style={{ left: -16, background: "var(--border-default)" }}
                  />
                )}
                <div className="card lift h-full p-5" style={{ borderTop: `2px solid ${step.accent}` }}>
                  <div className="mb-3 flex items-center gap-3">
                    <span
                      className="inline-flex items-center justify-center rounded-full font-mono text-xs"
                      style={{
                        width: 28,
                        height: 28,
                        background: "var(--bg-subtle)",
                        border: `1px solid ${step.accent}`,
                        color: step.accent,
                      }}
                    >
                      {step.n}
                    </span>
                    <span className="status-dot" style={{ background: step.accent }} />
                  </div>
                  <h3 className="mb-1 text-lg">{step.title}</h3>
                  <p className="caption">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Simulator: the whole flow, one click, on chain. */}
        <section className="mb-14 scroll-mt-16" id="simulate" aria-label="Dispute simulator">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="text-3xl">Watch a dispute run</h2>
            <span className="pill pill-live">
              <span className="status-dot status-dot-live" /> real transactions
            </span>
            <span className="micro" style={{ textTransform: "none", letterSpacing: "0.02em" }}>
              one click: buy · fail · file · jury · settle
            </span>
          </div>
          <DisputeSimulator />
        </section>

        {/* How the escrow stands right now (bento density, glance-first). */}
        <section className="mb-12" aria-label="Live stats">
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
            <div className="stagger grid grid-cols-2 gap-4 md:grid-cols-4">
              {(stats ? [
                { label: "Disputes filed", value: stats.disputes, sub: "on the ledger" },
                { label: "Settled by jury", value: stats.settled, sub: "consensus verdicts" },
                { label: "Refunded", value: stats.refunded, sub: "units returned" },
                { label: "Disputed volume", value: stats.total_disputed, sub: "units locked" },
              ] : []).map((c) => (
                <div key={c.label} className="card lift p-5">
                  <p className="micro mb-2">{c.label}</p>
                  <p className="number-lg">{c.value.toLocaleString()}</p>
                  <p className="micro mt-1" style={{ textTransform: "none", letterSpacing: "0.02em", fontSize: "0.62rem" }}>
                    {c.sub}
                  </p>
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
                          style={{ borderColor: "var(--border-default)", boxShadow: "inset 0 0 0 0 transparent" }}
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
                            <StatusPill status={d.status} refundPct={d.refund_pct} />
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

        {/* Connect your agent: pitch left, instrument right. */}
        <section className="mb-6 scroll-mt-16" id="agent" aria-label="Connect your agent">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <h2 className="mb-4 text-3xl">Connect your agent</h2>
              <p className="caption mb-5">
                Any MCP client can run the whole loop: check the ledger, file
                the dispute, call the jury, collect the settlement. Four tool
                calls, zero humans.
              </p>
              <div className="flex flex-col gap-3">
                <div className="card p-4" style={{ borderLeft: "2px solid var(--accent)" }}>
                  <p className="micro mb-1" style={{ color: "var(--accent)" }}>For agent builders</p>
                  <p className="caption">Point your client at the endpoint and give it the config. The tools self-describe.</p>
                </div>
                <div className="card p-4" style={{ borderLeft: "2px solid var(--refund)" }}>
                  <p className="micro mb-1" style={{ color: "var(--refund-strong)" }}>For API sellers</p>
                  <p className="caption">Wrap your endpoint with the seller rail; bad deliveries become refundable, provably.</p>
                </div>
                <div className="card p-4" style={{ borderLeft: "2px solid var(--deny)" }}>
                  <p className="micro mb-1" style={{ color: "var(--deny-strong)" }}>For humans</p>
                  <p className="caption">File from the feed with one click. No wallet, no setup.</p>
                </div>
              </div>
              <p className="micro mt-4" style={{ textTransform: "none", letterSpacing: "0.02em" }}>
                GET /api/mcp self-describes · llms.txt at the root
              </p>
            </div>
            <div className="lg:col-span-8">
              <DeveloperHub mcpUrl={`${SITE_URL}/api/mcp`} />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
