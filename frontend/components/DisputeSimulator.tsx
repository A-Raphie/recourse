"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cacheJury, jurySeatsFromReceipt } from "./dossier/JuryFromSession";
import type { JurySeat } from "@/lib/server/genlayer";

type StepState = "pending" | "running" | "done" | "failed";

type Step = {
  key: string;
  label: string;
  detail: string;
  state: StepState;
};

const AMOUNT = 400;

function dot(state: StepState) {
  if (state === "done") return "var(--refund)";
  if (state === "running") return "var(--status-pending)";
  if (state === "failed") return "var(--status-error)";
  return "var(--border-default)";
}

function StepRow({ step }: { step: Step }) {
  return (
    <li className="flex items-start gap-3">
      <span className="relative flex flex-col items-center self-stretch">
        <span
          className="mt-1 inline-block rounded-full"
          style={{
            width: 10,
            height: 10,
            background: dot(step.state),
            boxShadow:
              step.state === "running" ? "0 0 0 4px rgb(var(--accent-rgb) / 0.15)" : "none",
          }}
        />
        <span
          aria-hidden
          className="min-h-6 w-px flex-1"
          style={{ background: "var(--border-default)" }}
        />
      </span>
      <span className="pb-4">
        <span
          className="block text-sm"
          style={{
            color:
              step.state === "pending" ? "var(--text-muted)" : "var(--text-primary)",
          }}
        >
          {step.label}
        </span>
        {step.detail && (
          <span className="caption block font-mono text-xs">{step.detail}</span>
        )}
      </span>
    </li>
  );
}

export function DisputeSimulator() {
  const [running, setRunning] = useState(false);
  const [disputeId, setDisputeId] = useState<string | null>(null);
  const [seats, setSeats] = useState<JurySeat[] | null>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [steps, setSteps] = useState<Step[]>([
    { key: "buy", label: "Buyer agent pays the seller", detail: "GET /api/sell/fx-quote?fail=1 · 400 units", state: "pending" },
    { key: "deliver", label: "Seller returns garbage", detail: "", state: "pending" },
    { key: "file", label: "Buyer files a dispute, escrow locks", detail: "400 units + 100 anti-spam stake", state: "pending" },
    { key: "jury", label: "The jury judges", detail: "validators render both evidence URLs", state: "pending" },
    { key: "settle", label: "Settlement", detail: "", state: "pending" },
  ]);

  const setStep = useCallback((key: string, patch: Partial<Step>) => {
    setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  }, []);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  async function api<T>(action: string, args: Record<string, unknown>): Promise<T> {
    const res = await fetch("/api/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, args }),
    });
    const body = await res.json();
    if (!body.ok) throw new Error(body.error ?? "on-chain action failed");
    return body as T;
  }

  const run = useCallback(async () => {
    setRunning(true);
    setError(null);
    setSeats(null);
    setPct(null);
    setDisputeId(null);
    setElapsed(0);
    setSteps((prev) => prev.map((s) => ({ ...s, state: "pending", detail: s.detail.split(" · ")[0] === s.detail ? s.detail : s.detail })));

    const id = `sim-${Date.now()}`;
    setDisputeId(id);

    try {
      setStep("buy", { state: "running", detail: "GET /api/sell/fx-quote?fail=1 · 400 units" });
      await fetch(`/api/sell/fx-quote?fail=1`).then((r) => r.json());
      setStep("buy", { state: "done" });

      setStep("deliver", { state: "running" });
      setStep("deliver", {
        state: "failed",
        detail: "Internal Server Error. Error code 500. No data available.",
      });

      setStep("file", { state: "running", detail: "400 units + 100 anti-spam stake" });
      await api("deposit", { amount: 1_000 });
      await api("file", {
        dispute_id: id,
        provider: "0x03D58A4DeF6fDFc032A56374785a5F571D07Bc11",
        service_url: "https://raw.githubusercontent.com/A-Raphie/recourse/master/evidence/service-manifest.txt",
        evidence_url: "https://raw.githubusercontent.com/A-Raphie/recourse/master/evidence/deliverable-error.txt",
        description: "Paid for a live FX quote, the deliverable endpoint returned a 500 error",
        amount: AMOUNT,
      });
      setStep("file", { state: "done", detail: `escrow locked 500 units · /d/${id}` });

      setStep("jury", { state: "running", detail: "validators are judging · this takes about a minute" });
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
      const adjudication = await api<{ receipt: unknown; dispute: { refund_pct: number } }>("adjudicate", {
        dispute_id: id,
      });
      if (timerRef.current) clearInterval(timerRef.current);
      const receiptSeats = jurySeatsFromReceipt(adjudication.receipt);
      setSeats(receiptSeats);
      cacheJury(id, adjudication.receipt);
      setPct(adjudication.dispute.refund_pct);
      setStep("jury", {
        state: "done",
        detail: `${receiptSeats.filter((st) => st.vote === "agree" || st.role === "leader").length} receipts recorded`,
      });

      setStep("settle", { state: "running", detail: `${adjudication.dispute.refund_pct}% refund` });
      await api("settle", { dispute_id: id });
      setStep("settle", { state: "done", detail: `${adjudication.dispute.refund_pct}% refunded to the payer` });
    } catch (e) {
      if (timerRef.current) clearInterval(timerRef.current);
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      setSteps((prev) =>
        prev.map((s) => (s.state === "running" ? { ...s, state: "failed", detail: message } : s)),
      );
    } finally {
      setRunning(false);
    }
  }, [setStep]);

  return (
    <div className="card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl">Simulate an agent dispute</h3>
          <p className="caption">
            One click runs the entire flow on chain: buy, fail, file, jury,
            settle. Nothing here is mocked.
          </p>
        </div>
        <button className="btn btn-primary" onClick={run} disabled={running}>
          {running ? `On chain… ${elapsed}s` : "Run a live dispute"}
        </button>
      </div>

      <ol className="mt-2">
        {steps.map((s) => (
          <StepRow key={s.key} step={s} />
        ))}
      </ol>

      {seats && seats.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {seats.map((seat, i) => {
            const isLeader = seat.role === "leader";
            const agreed = isLeader || seat.vote === "agree";
            const rgb = agreed ? "var(--refund-rgb)" : "var(--deny-rgb)";
            return (
              <span
                key={`${seat.address}-${i}`}
                className="inline-flex items-center gap-1 rounded-full font-mono"
                style={{
                  fontSize: "0.62rem",
                  padding: "2px 8px",
                  color: agreed ? "var(--refund)" : "var(--deny)",
                  background: `rgb(${rgb} / 0.12)`,
                  border: `1px solid rgb(${rgb} / 0.4)`,
                }}
              >
                {isLeader ? "LED" : String(seat.vote ?? "idle")} ·{" "}
                {(seat.model ?? "model").split("/").slice(-1)[0]}
              </span>
            );
          })}
        </div>
      )}

      {pct !== null && disputeId && (
        <p className="caption mt-3">
          Case record:{" "}
          <Link href={`/d/${disputeId}`} className="font-mono text-xs" style={{ color: "var(--accent)" }}>
            /d/{disputeId}
          </Link>
        </p>
      )}

      {error && (
        <p className="mt-3 text-sm" style={{ color: "var(--status-error)" }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
