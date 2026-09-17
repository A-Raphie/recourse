"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Judge path: every field ships prefilled with a real failure so one
// click files a real dispute; each field stays editable. The scenario
// rotates per form open so the docket does not fill with identical cases.
const EVIDENCE_BASE = "https://raw.githubusercontent.com/A-Raphie/recourse/master/evidence";
const SCENARIOS = [
  {
    service_url: `${EVIDENCE_BASE}/demo-01-manifest.txt`,
    evidence_url: `${EVIDENCE_BASE}/demo-01-delivered.txt`,
    description: "Paid for a live FX quote, the deliverable endpoint returned a 500 error",
  },
  {
    service_url: `${EVIDENCE_BASE}/demo-02-manifest.txt`,
    evidence_url: `${EVIDENCE_BASE}/demo-02-delivered.txt`,
    description: "Paid for real-time weather data, the endpoint timed out and returned no conditions",
  },
  {
    service_url: `${EVIDENCE_BASE}/demo-03-manifest.txt`,
    evidence_url: `${EVIDENCE_BASE}/demo-03-delivered.txt`,
    description: "Paid for English to French translation, the API returned the input unchanged",
  },
  {
    service_url: `${EVIDENCE_BASE}/demo-04-manifest.txt`,
    evidence_url: `${EVIDENCE_BASE}/demo-04-delivered.txt`,
    description: "Paid for sentiment analysis on an angry review, it returned positive with zero confidence",
  },
  {
    service_url: `${EVIDENCE_BASE}/demo-05-manifest.txt`,
    evidence_url: `${EVIDENCE_BASE}/demo-05-delivered.txt`,
    description: "Paid for price extraction from a product page, the scraper was blocked and returned nulls",
  },
  {
    service_url: `${EVIDENCE_BASE}/demo-06-manifest.txt`,
    evidence_url: `${EVIDENCE_BASE}/demo-06-delivered.txt`,
    description: "Paid for email verification, the API failed the SMTP probe and returned no result",
  },
  {
    service_url: `${EVIDENCE_BASE}/demo-07-manifest.txt`,
    evidence_url: `${EVIDENCE_BASE}/demo-07-delivered.txt`,
    description: "Paid for a live currency conversion, the API served a rate snapshot from 2024",
  },
  {
    service_url: `${EVIDENCE_BASE}/demo-08-manifest.txt`,
    evidence_url: `${EVIDENCE_BASE}/demo-08-delivered.txt`,
    description: "Paid for an invoice PDF, the renderer crashed and the file is unreadable",
  },
  {
    service_url: `${EVIDENCE_BASE}/demo-09-manifest.txt`,
    evidence_url: `${EVIDENCE_BASE}/demo-09-delivered.txt`,
    description: "Paid for audio transcription, the API returned a placeholder with zero words",
  },
  {
    service_url: `${EVIDENCE_BASE}/demo-10-manifest.txt`,
    evidence_url: `${EVIDENCE_BASE}/demo-10-delivered.txt`,
    description: "Paid for image resizing, the worker timed out and no output was produced",
  },
];

export function FileDisputeForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(() => {
    const scenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
    return {
      dispute_id: `d-${new Date().toISOString().slice(5, 10).replace("-", "")}-${Math.floor(Math.random() * 900 + 100)}`,
      provider: "0x03D58A4DeF6fDFc032A56374785a5F571D07Bc11",
      service_url: scenario.service_url,
      evidence_url: scenario.evidence_url,
      description: scenario.description,
      amount: 400,
    };
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "file", args: form }),
      });
      const body = await res.json();
      if (body.ok) {
        router.push(`/d/${form.dispute_id}`);
      } else {
        setError(body.error ?? "The chain rejected the filing");
        setBusy(false);
      }
    } catch {
      setError("Could not reach the action endpoint. Try again.");
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        File a dispute
      </button>
    );
  }

  const field =
    "input w-full font-mono text-sm";
  const label = "micro mb-1 block";

  return (
    <div className="card w-full p-5" role="form" aria-label="File a dispute">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg">File a dispute</h3>
        <button
          className="micro"
          style={{ color: "var(--text-muted)" }}
          onClick={() => setOpen(false)}
        >
          cancel
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className={label} htmlFor="f-id">Dispute id</label>
          <input id="f-id" className={field} value={form.dispute_id} onChange={(e) => set("dispute_id", e.target.value)} />
        </div>
        <div>
          <label className={label} htmlFor="f-amount">Amount (escrow units)</label>
          <input id="f-amount" className={field} type="number" min={1} max={1000000} value={form.amount} onChange={(e) => set("amount", Number(e.target.value))} />
        </div>
        <div className="md:col-span-2">
          <label className={label} htmlFor="f-provider">Provider address</label>
          <input id="f-provider" className={field} value={form.provider} onChange={(e) => set("provider", e.target.value)} />
        </div>
        <div>
          <label className={label} htmlFor="f-service">Promise URL (what was sold)</label>
          <input id="f-service" className={field} value={form.service_url} onChange={(e) => set("service_url", e.target.value)} />
        </div>
        <div>
          <label className={label} htmlFor="f-evidence">Evidence URL (what arrived)</label>
          <input id="f-evidence" className={field} value={form.evidence_url} onChange={(e) => set("evidence_url", e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className={label} htmlFor="f-desc">The claim</label>
          <input id="f-desc" className={field} value={form.description} onChange={(e) => set("description", e.target.value)} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button className="btn btn-primary" disabled={busy} onClick={submit}>
          {busy ? "Filing on chain…" : "File on chain"}
        </button>
        <span className="micro" style={{ textTransform: "none", letterSpacing: "0.02em" }}>
          Files through the demo key: locks 400 units + 100 anti-spam stake. The stake returns if the jury refunds, and is slashed if the dispute is dismissed.
        </span>
      </div>
      {error && (
        <p className="mt-2 text-sm" style={{ color: "var(--status-error)" }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
