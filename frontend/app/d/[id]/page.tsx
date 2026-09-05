import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { recourse } from "@/lib/server/genlayer";
import { getContractReceiptJury } from "@/lib/server/genlayer";
import { StatusPipeline } from "@/components/dossier/StatusPipeline";
import { EvidenceDuel, fetchText } from "@/components/dossier/EvidenceDuel";
import { JuryGrid } from "@/components/dossier/JuryGrid";
import { ReceiptStrip } from "@/components/dossier/ReceiptStrip";
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

  const jury = await getContractReceiptJury(id);
  const settled = dispute.status === "settled";
  const [promisedText, deliveredText] = await Promise.all([
    fetchText(dispute.service_url),
    fetchText(dispute.evidence_url),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6">
      <header className="mb-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="micro" style={{ color: "var(--accent)" }}>
              ← Recourse
            </Link>
            <span className={`pill ${statusPillClass(dispute.status)}`}>
              <span className={`status-dot${settled ? " status-dot-live" : ""}`} />
              {dispute.status}
            </span>
          </div>
          <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
            {dispute.id}
          </span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="micro mb-1">Disputed amount, locked in escrow</p>
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
            />
          </div>
          <div className="flex flex-col gap-5 lg:col-span-2">
            <section className="card p-5" aria-label="Parties">
              <h3 className="mb-3 text-xl">Parties</h3>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="micro">Payer</span>
                  <span className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                    {dispute.payer.slice(0, 6)}…{dispute.payer.slice(-4)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="micro">Provider</span>
                  <span className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                    {dispute.provider.slice(0, 6)}…{dispute.provider.slice(-4)}
                  </span>
                </div>
              </div>
            </section>

            <JuryGrid
              seats={jury}
              status={dispute.status}
              refund={dispute.refund}
              verdictCode={dispute.verdict_code}
            />
          </div>
        </div>

        <DisputeActions disputeId={dispute.id} status={dispute.status} />

        <ReceiptStrip disputeId={dispute.id} />
      </div>
    </main>
  );
}
