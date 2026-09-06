import Link from "next/link";
import { CreditCard, CircleAlert, FileText, Gavel, ChevronDown } from "lucide-react";
import { recourse } from "@/lib/server/genlayer";
import { getTxs } from "@/lib/server/txindex";
import { SITE_URL } from "@/lib/site";
import { SiteFooter } from "@/components/SiteFooter";
import { FileDisputeForm } from "@/components/dispute/FileDisputeForm";
import { DisputeSimulator } from "@/components/DisputeSimulator";
import { DeveloperHub } from "@/components/DeveloperHub";
import { Reveal } from "@/components/Reveal";
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

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="micro mb-4" style={{ color: "var(--accent)" }}>
      {children}
    </p>
  );
}

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const HOW_STEPS = [
  { n: "01", icon: CreditCard, title: "The agent pays", body: "A payer buys a service over any rail. The amount sits in escrow." },
  { n: "02", icon: CircleAlert, title: "The delivery fails", body: "A 500 page instead of the quote. No refund path existed." },
  { n: "03", icon: FileText, title: "The payer files", body: "One tool call pins both evidence URLs and locks the stake." },
  { n: "04", icon: Gavel, title: "The jury settles", body: "Validators judge under consensus; escrow splits on-chain." },
];

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
  const latest = disputes[0];

  return (
    <>
      <main className="w-full">
        <nav className="mx-auto mb-8 flex w-full max-w-6xl items-center justify-between px-6 pt-6">
          <span className="font-mono text-sm font-bold tracking-wide" style={{ color: "var(--text-primary)" }}>
            RE·COURSE
          </span>
          <div className="flex items-center gap-5 font-mono text-xs">
            <span className="pill pill-live">
              <span className="status-dot status-dot-live" /> live
            </span>
            <a href="#docket" style={{ color: "var(--text-secondary)" }}>
              docket
            </a>
            <a href="#agents" style={{ color: "var(--text-secondary)" }}>
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

        {/* ============ HERO: one column of attention ============ */}
        <section className="hero-wash relative overflow-hidden pb-24 pt-16 md:pt-24">
          <div className="grid-texture absolute inset-0" aria-hidden />
          <div className="relative mx-auto max-w-5xl px-6 text-center">
            <Reveal>
              <span
                className="mb-8 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
                style={{
                  borderColor: "rgb(var(--accent-rgb) / 0.3)",
                  background: "var(--accent-subtle)",
                  color: "var(--accent)",
                }}
              >
                <span className="status-dot status-dot-live" aria-hidden />
                Live on the GenLayer Studio testnet
              </span>
            </Reveal>

            <Reveal delay={80}>
              <h1
                className="mb-6 tracking-tight"
                style={{ fontSize: "clamp(1.9rem, 6vw, 4.5rem)", lineHeight: 1.06, fontWeight: 700, textWrap: "balance" }}
              >
                Your agent paid. The service lied.
                <br />
                <span style={{ color: "var(--accent)" }}>Get the units back.</span>
              </h1>
            </Reveal>

            <Reveal delay={150}>
              <p
                className="mx-auto mb-10 max-w-2xl"
                style={{ fontSize: "1.1rem", lineHeight: 1.6, color: "var(--text-secondary)" }}
              >
                Recourse is a dispute layer for machine-to-machine payments: file
                with pinned evidence, a validator jury settles it on-chain in
                about a minute.
              </p>
            </Reveal>

            <Reveal delay={220}>
              <div className="mb-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="#agents" className="btn btn-primary btn-lg">
                  Connect your agent · MCP
                </Link>
                <a href="#live-run" className="btn btn-ghost btn-lg">
                  Watch a dispute run ↓
                </a>
              </div>
            </Reveal>

            {/* The product, framed as one object. Density inside reads as a
                screenshot of the product, not as competing clusters. */}
            <Reveal delay={300}>
              <div
                className="mx-auto max-w-5xl overflow-hidden rounded-[28px] border p-4 text-left"
                style={{
                  borderColor: "var(--border-default)",
                  background: "rgb(7 29 42 / 0.5)",
                  boxShadow: "0 32px 80px -32px rgb(0 19 32 / 0.95), 0 0 0 1px rgb(var(--accent-rgb) / 0.1)",
                  backdropFilter: "blur(6px)",
                }}
              >
                <div
                  className="mb-4 flex items-center justify-between rounded-2xl border px-4 py-2.5"
                  style={{ borderColor: "var(--border-default)", background: "var(--bg-subtle)" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="status-dot status-dot-live" />
                    <span className="micro">control room</span>
                  </div>
                  <span className="micro" style={{ color: "var(--text-muted)" }}>
                    chain 61999 · contract {CONTRACT.slice(0, 8)}…{CONTRACT.slice(-4)}
                  </span>
                </div>

                {offline ? (
                  <p className="p-6 caption">
                    The GenLayer RPC did not answer. Refresh: the chain is the only source.
                  </p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
                    <div
                      className="rounded-2xl border p-5"
                      style={{ borderColor: "var(--border-default)", background: "var(--bg-surface)" }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="micro">Units returned by juries</p>
                          <p
                            className="mt-2 font-bold"
                            style={{
                              fontSize: "clamp(2rem, 3.5vw, 2.6rem)",
                              fontVariantNumeric: "tabular-nums",
                              letterSpacing: "-0.02em",
                            }}
                          >
                            {stats?.total_refunded.toLocaleString() ?? "…"}
                          </p>
                        </div>
                        <span className="pill pill-refund" style={{ fontSize: "0.6rem" }}>
                          {stats?.refunded ?? 0} refunds
                        </span>
                      </div>
                      <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        {[
                          { label: "Filed", value: stats?.disputes ?? 0 },
                          { label: "Settled", value: stats?.settled ?? 0 },
                          { label: "Pool", value: stats?.validator_pool ?? 0 },
                        ].map((c) => (
                          <div
                            key={c.label}
                            className="rounded-xl border px-3 py-3"
                            style={{ borderColor: "var(--border-default)", background: "var(--bg-subtle)" }}
                          >
                            <p className="micro" style={{ fontSize: "0.58rem" }}>
                              {c.label}
                            </p>
                            <p className="mt-1.5 font-mono text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                              {c.value.toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      {latest ? (
                        <Link
                          href={`/d/${latest.id}`}
                          className="rounded-2xl border p-5 transition-colors"
                          style={{ borderColor: "var(--border-default)", background: "var(--bg-surface)" }}
                        >
                          <p className="micro">Latest case</p>
                          <p className="mt-2 font-mono text-sm" style={{ color: "var(--accent)" }}>
                            /d/{latest.id.slice(0, 24)}
                          </p>
                          <p className="mt-1 caption">{latest.description.slice(0, 64)}…</p>
                          <div className="mt-3 flex items-center gap-2">
                            <StatusPill status={latest.status} refundPct={latest.refund_pct} />
                            <span className="tabular font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                              {latest.amount.toLocaleString()} units
                            </span>
                          </div>
                        </Link>
                      ) : (
                        <div
                          className="rounded-2xl border p-5"
                          style={{ borderColor: "var(--border-default)", background: "var(--bg-surface)" }}
                        >
                          <p className="caption">No cases yet. Run the first one below.</p>
                        </div>
                      )}
                      <div
                        className="flex-1 rounded-2xl border p-5"
                        style={{ borderColor: "var(--border-default)", background: "var(--bg-surface)" }}
                      >
                        <p className="micro">The jury</p>
                        <p className="mt-2 caption">
                          Five validators render the evidence themselves and vote
                          on the record. Leader proposes, pool concurs, verdict
                          settles.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Reveal>

            <Reveal delay={380}>
              <div className="mt-12 flex justify-center">
                <a href="#how" aria-label="Scroll to how it works" style={{ color: "var(--text-muted)" }}>
                  <ChevronDown size={24} className="animate-bounce" />
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ============ HOW: open nodes on one line, no cards ============ */}
        <section id="how" className="border-t py-24 md:py-32" style={{ borderColor: "var(--border-default)" }}>
          <div className="mx-auto max-w-5xl px-6">
            <Reveal>
              <Eyebrow>HOW IT WORKS</Eyebrow>
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-5xl">
                From payment to refund in one minute.
              </h2>
              <p className="mb-16 max-w-2xl text-lg" style={{ color: "var(--text-secondary)" }}>
                No support desk, no emails. The dispute is a transaction and the
                jury is the protocol.
              </p>
            </Reveal>

            <div className="relative hidden grid-cols-4 gap-4 md:grid">
              <div
                aria-hidden
                className="absolute left-[12.5%] right-[12.5%] top-8 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, rgb(var(--accent-rgb) / 0.15), rgb(var(--accent-rgb) / 0.45), rgb(var(--accent-rgb) / 0.15))",
                }}
              />
              {HOW_STEPS.map((step, i) => (
                <Reveal key={step.n} delay={i * 80}>
                  <div className="flex flex-col items-center space-y-3 text-center">
                    <div
                      className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border"
                      style={{
                        borderColor: "rgb(var(--accent-rgb) / 0.25)",
                        background: "var(--accent-subtle)",
                      }}
                    >
                      <step.icon size={22} style={{ color: "var(--accent)" }} />
                    </div>
                    <p className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                      {step.n}
                    </p>
                    <h3 className="text-base font-bold">{step.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {step.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>

            <div className="space-y-6 md:hidden">
              {HOW_STEPS.map((step, i) => (
                <Reveal key={step.n} delay={i * 60}>
                  <div className="flex gap-5">
                    <div className="flex flex-col items-center">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl border"
                        style={{
                          borderColor: "rgb(var(--accent-rgb) / 0.25)",
                          background: "var(--accent-subtle)",
                        }}
                      >
                        <step.icon size={18} style={{ color: "var(--accent)" }} />
                      </div>
                      {i < HOW_STEPS.length - 1 && (
                        <div className="mt-2 w-px flex-1" style={{ background: "var(--border-default)" }} />
                      )}
                    </div>
                    <div className="pb-6">
                      <p className="mb-1 font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                        {step.n}
                      </p>
                      <h3 className="mb-1 text-base font-bold">{step.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        {step.body}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ============ LIVE RUN ============ */}
        <section id="live-run" className="scroll-mt-16 border-t py-24 md:py-32" style={{ borderColor: "var(--border-default)" }}>
          <div className="mx-auto max-w-5xl px-6">
            <Reveal>
              <Eyebrow>LIVE RUN</Eyebrow>
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-5xl">
                Watch a dispute run.
              </h2>
              <p className="mb-10 max-w-2xl text-lg" style={{ color: "var(--text-secondary)" }}>
                One click drives the entire flow on chain: buy, fail, file,
                jury, settle. Nothing here is mocked.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <DisputeSimulator />
            </Reveal>
          </div>
        </section>

        {/* ============ LEDGER ============ */}
        <section className="border-t py-24 md:py-32" style={{ borderColor: "var(--border-default)" }}>
          <div className="mx-auto max-w-5xl px-6">
            <Reveal>
              <Eyebrow>THE LEDGER</Eyebrow>
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-5xl">
                Every number is chain state.
              </h2>
              <p className="mb-16 max-w-2xl text-lg" style={{ color: "var(--text-secondary)" }}>
                Read live from the Studio demo ledger. Testnet units, not
                production volume.
              </p>
            </Reveal>

            {offline ? (
              <div className="card p-8">
                <span className="micro" style={{ color: "var(--status-error)" }}>
                  The GenLayer RPC did not answer just now.
                </span>
                <p className="caption mt-1">Refresh; the chain state is the only source of these numbers.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {(stats
                  ? [
                      { value: stats.disputes, label: "Disputes filed" },
                      { value: stats.settled, label: "Settled by jury" },
                      { value: stats.refunded, label: "Refunded" },
                      { value: stats.total_disputed, label: "Units disputed" },
                    ]
                  : []
                ).map((c, i) => (
                  <Reveal key={c.label} delay={i * 80}>
                    <div className="card h-full p-8">
                      <p
                        className="mb-3 font-mono text-4xl font-bold"
                        style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}
                      >
                        {c.value.toLocaleString()}
                      </p>
                      <p className="text-base font-semibold">{c.label}</p>
                      <p className="mt-3 text-[11px]" style={{ color: "var(--text-muted)" }}>
                        read live from {CONTRACT.slice(0, 10)}…{CONTRACT.slice(-6)}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ============ DOCKET ============ */}
        <section id="docket" className="scroll-mt-16 border-t py-24 md:py-32" style={{ borderColor: "var(--border-default)" }}>
          <div className="mx-auto max-w-5xl px-6">
            <Reveal>
              <Eyebrow>THE DOCKET</Eyebrow>
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-5xl">
                Live disputes.
              </h2>
              <p className="mb-10 max-w-2xl text-lg" style={{ color: "var(--text-secondary)" }}>
                Every row is a real case. Open one to see the evidence, the
                jury, and the receipts.
              </p>
            </Reveal>

            <Reveal delay={100}>
              <div className="mb-5">
                <FileDisputeForm />
              </div>

              {disputes.length === 0 && !offline ? (
                <div className="card p-8">
                  <p className="caption">
                    No disputes on the ledger yet. File the first one: the form
                    ships prefilled with a real failed delivery.
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
                            href={safePage - 1 === 1 ? "/#docket" : `/?page=${safePage - 1}#docket`}
                            style={{ color: "var(--accent)" }}
                          >
                            ← newer
                          </Link>
                        )}
                        {safePage < totalPages && (
                          <Link href={`/?page=${safePage + 1}#docket`} style={{ color: "var(--accent)" }}>
                            older →
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </Reveal>
          </div>
        </section>

        {/* ============ AGENTS ============ */}
        <section id="agents" className="scroll-mt-16 border-t py-24 md:py-32" style={{ borderColor: "var(--border-default)" }}>
          <div className="mx-auto max-w-5xl px-6">
            <Reveal>
              <Eyebrow>FOR AGENTS</Eyebrow>
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-5xl">
                Four tool calls. Zero humans.
              </h2>
              <p className="mb-10 max-w-2xl text-lg" style={{ color: "var(--text-secondary)" }}>
                Any MCP client can run the whole loop: deposit, file, adjudicate,
                settle. Sellers can wrap their endpoints with the same rail;
                humans can file from the docket without a wallet.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <DeveloperHub mcpUrl={`${SITE_URL}/api/mcp`} />
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
