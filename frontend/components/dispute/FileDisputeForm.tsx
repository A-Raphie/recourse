"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Judge path: every field ships prefilled with the demo scenario so one
// click files a real dispute; each field stays editable.
export function FileDisputeForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    dispute_id: `d-${new Date().toISOString().slice(5, 10).replace("-", "")}-${Math.floor(Math.random() * 900 + 100)}`,
    provider: "0x03D58A4DeF6fDFc032A56374785a5F571D07Bc11",
    service_url: "https://raw.githubusercontent.com/A-Raphie/recourse/master/evidence/service-manifest.txt",
    evidence_url: "https://raw.githubusercontent.com/A-Raphie/recourse/master/evidence/deliverable-error.txt",
    description: "Paid for a live FX quote, the deliverable endpoint returned a 500 error",
    amount: 400,
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
          Files through the demo key, locks the amount in escrow. Adjudicate from the dossier.
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
