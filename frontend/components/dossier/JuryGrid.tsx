import { Check, X, Minus, Gavel } from "lucide-react";
import type { JurySeat } from "@/lib/server/genlayer";

const VERDICT_TEXT: Record<string, string> = {
  service_unavailable: "The service was unreachable when it mattered",
  wrong_content: "The deliverable was not the promised content",
  not_as_promised: "The deliverable fell short of the promise",
  fulfilled: "The deliverable matched the promise",
};

export function verdictSentence(code: string): string {
  return VERDICT_TEXT[code] ?? "Verdict recorded";
}

type SeatMood = "led" | "agree" | "disagree" | "idle";

function seatMood(seat: JurySeat): SeatMood {
  if (seat.role === "leader") return "led";
  if (seat.vote === "agree") return "agree";
  if (seat.vote === "disagree") return "disagree";
  // no recorded vote (idle or errored): shown as idle, never as disagreement
  return "idle";
}

const MOOD_META: Record<SeatMood, { label: string; color: string; bg: string; border: string; Icon: typeof Check }> = {
  led: { label: "LED", color: "var(--accent)", bg: "var(--accent-subtle)", border: "rgb(var(--accent-rgb) / 0.4)", Icon: Gavel },
  agree: { label: "AGREE", color: "var(--refund)", bg: "rgb(var(--refund-rgb) / 0.14)", border: "rgb(var(--refund-rgb) / 0.4)", Icon: Check },
  disagree: { label: "DISAGREE", color: "var(--deny)", bg: "rgb(var(--deny-rgb) / 0.14)", border: "rgb(var(--deny-rgb) / 0.4)", Icon: X },
  idle: { label: "IDLE", color: "var(--status-neutral)", bg: "rgb(188 213 223 / 0.1)", border: "rgb(188 213 223 / 0.3)", Icon: Minus },
};

function Seat({ seat, index }: { seat: JurySeat; index: number }) {
  const isLeader = seat.role === "leader";
  const mood = seatMood(seat);
  const { label, color, bg, border, Icon } = MOOD_META[mood];
  const shortModel = (seat.model ?? "model").split("/").slice(-1)[0];

  return (
    <div
      className="card card-hover flex flex-col gap-2 p-3"
      style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="micro" style={{ color: isLeader ? "var(--accent)" : undefined }}>
          {isLeader ? "Leader" : `Validator ${index}`}
        </span>
        <span
          className="inline-flex items-center gap-1 rounded-full font-mono"
          style={{
            fontSize: "0.62rem",
            letterSpacing: "0.08em",
            padding: "2px 8px",
            color,
            background: bg,
            border: `1px solid ${border}`,
          }}
        >
          <Icon size={11} strokeWidth={2.5} />
          {label}
        </span>
      </div>
      <span className="font-mono text-sm text-txt-2">{shortModel}</span>
      <span className="micro" style={{ textTransform: "none", letterSpacing: "0.02em", color: "var(--text-muted)" }}>
        {seat.execution_result === "SUCCESS" ? "executed clean" : seat.execution_result.toLowerCase()}
      </span>
    </div>
  );
}

export function JuryGrid({
  seats,
  status,
  refund,
  verdictCode,
}: {
  seats: JurySeat[];
  status: string;
  refund: boolean;
  verdictCode: string;
}) {
  const waiting = status === "filed" || seats.length === 0;
  const leader = seats.find((s) => s.role === "leader");
  const validators = seats.filter((s) => s.role !== "leader");
  const concurring = validators.filter((s) => s.vote === "agree").length;
  const upheld = leader ? leader.execution_result === "SUCCESS" : false;

  return (
    <section className="card p-5" aria-label="The open jury">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl">
          The open jury
        </h3>
        {waiting ? (
          <span className="pill">
            <span className="status-dot" /> awaiting consensus
          </span>
        ) : (
          <span className="pill pill-live">
            {concurring} of {validators.length} validators concurred
          </span>
        )}
      </div>

      {waiting ? (
        <p className="caption">
          Five validator seats take this case when adjudication runs. Each one
          renders the evidence itself, judges it, and votes on the record.
        </p>
      ) : (
        <>
          <p className="micro mb-4" style={{ textTransform: "none", letterSpacing: "0.02em" }}>
            The leader ran the case and proposed the verdict
            {upheld ? "; the validator pool upheld it." : "; the pool did not uphold it."}
          </p>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {seats.map((seat, i) => (
              <Seat key={`${seat.address}-${i}`} seat={seat} index={i} />
            ))}
          </div>
          <div
            className="rounded-xl border p-4"
            style={{
              borderColor: `rgb(var(--${refund ? "refund" : "deny"}-rgb) / 0.4)`,
              background: `rgb(var(--${refund ? "refund" : "deny"}-rgb) / 0.08)`,
            }}
          >
            <span className="micro" style={{ color: `var(--${refund ? "refund" : "deny"})` }}>
              {refund ? "Refund" : "No refund"} · consensus verdict
            </span>
            <p className="mt-1 text-lg" style={{ color: "var(--text-primary)" }}>
              {verdictSentence(verdictCode)}
            </p>
          </div>
        </>
      )}
    </section>
  );
}
