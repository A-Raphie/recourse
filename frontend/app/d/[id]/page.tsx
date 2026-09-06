import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { recourse } from "@/lib/server/genlayer";
import { getContractReceiptJury } from "@/lib/server/genlayer";
import { StatusPipeline } from "@/components/dossier/StatusPipeline";
import { EvidenceDuel, fetchText } from "@/components/dossier/EvidenceDuel";
import { JuryGrid } from "@/components/dossier/JuryGrid";
import { JuryFromSession } from "@/components/dossier/JuryFromSession";
import { StatusTimeline } from "@/components/dossier/StatusTimeline";
import { readLiveReceipts } from "@/lib/server/receipts-publish";
import { getTxs } from "@/lib/server/txindex";
import { CopyField } from "@/components/DeveloperHub";
import { DisputeActions } from "@/components/dossier/DisputeActions";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Dispute ${id} — Recourse`,
    description: "Post-payment dispute for the agent economy, settled by a GenLayer validator jury.",
  };
}

function statusPillClass(status: string) {
  if (status === "settled") return "pill-live";
  if (status === "adjudicated") return "pill-live";
  return "";
}

export default async function DossierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dispute = await recourse.getDispute(id).catch(() => null);
  if (!dispute) notFound();

  const liveReceipts = await readLiveReceipts();
  const receipts = { ...getTxs(id), ...(liveReceipts[id] ?? {}) };
  const jury = await getContractReceiptJury(receipts["adjudicate"]?.hash);
  const settled = dispute.status === "settled";
  const [promisedText, deliveredText] = await Promise.all([
    fetchText(dispute.service_url),
    fetchText(dispute.evidence_url),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6">
      <header className="mb-6">
        <nav className="mb-3 flex flex-wrap items-center justify-between gap-3" aria-label="Breadcrumb">
          <div className="flex items-center gap-2 font-mono text-xs">
            <Link
              href="/"
              className="btn btn-ghost"
              style={{ minHeight: 0, padding: "4px 10px", fontSize: "0.75rem" }}
            >
              ← All disputes
            </Link>
            <span style={{ color: "var(--text-muted)" }}>/</span>
            <span style={{ color: "var(--text-secondary)" }}>{dispute.id}</span>
          </div>
          <span className={`pill ${statusPillClass(dispute.status)}`}>
            <span className={`status-dot${settled ? " status-dot-live" : ""}`} />
            {dispute.status}
          </span>
        </nav>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="micro mb-1">
              Disputed amount, locked in escrow · +{dispute.stake.toLocaleString()} anti-spam stake
            </p>
            <p className="number-xl">{dispute.amount.toLocaleString()}</p>
          </div>
          <StatusPipeline status={dispute.status} />
        </div>
      </header>

      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <EvidenceDuel
              serviceUrl={dispute.service_url}
              evidenceUrl={dispute.evidence_url}
              description={dispute.description}
              promisedText={promisedText}
              deliveredText={deliveredText}
              refundPct={dispute.refund_pct}
              adjudicated={dispute.status !== "filed"}
            />
          </div>
          <div className="flex flex-col gap-5 lg:col-span-2">
            <section className="card p-5" aria-label="Parties">
              <h3 className="mb-3 text-xl">Parties</h3>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="micro">Payer</span>
                  <CopyField value={dispute.payer} display={`${dispute.payer.slice(0, 6)}…${dispute.payer.slice(-4)}`} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="micro">Provider</span>
                  <CopyField value={dispute.provider} display={`${dispute.provider.slice(0, 6)}…${dispute.provider.slice(-4)}`} />
                </div>
              </div>
            </section>

            <JuryGrid
              seats={jury}
              status={dispute.status}
              refundPct={dispute.refund_pct}
              verdictCode={dispute.verdict_code}
            />
            {jury.length === 0 && <JuryFromSession disputeId={dispute.id} />}
          </div>
        </div>

        <DisputeActions disputeId={dispute.id} status={dispute.status} />

        <StatusTimeline disputeId={dispute.id} status={dispute.status} serverReceipts={receipts} />
      </div>
    </main>
  );
}
