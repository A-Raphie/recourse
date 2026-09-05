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

function shortVote(seat: { vote: string | null }, isLeader: boolean): string {
  if (isLeader) return "led";
  if (seat.vote === "agree") return "agree";
  if (seat.vote === "disagree") return "disagree";
  return String(seat.vote ?? "idle");
}

function Seat({
  seat,
  index,
}: {
  seat: JurySeat;
  index: number;
}) {
  const isLeader = seat.role === "leader";
  const agreed = seat.vote === "agree" || seat.vote === "proposed";
  const shortModel = (seat.model ?? "model").split("/").slice(-1)[0];

  return (
    <div
      className="card card-hover flex flex-col gap-2 p-3"
      style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="micro">
          {isLeader ? "Leader" : `Validator ${index}`}
        </span>
        <span
          className="pill"
          style={{
            fontSize: "0.6rem",
            padding: "2px 7px",
            color: agreed ? "var(--refund)" : "var(--deny)",
            borderColor: `rgb(var(--${agreed ? "refund" : "deny"}-rgb) / 0.4)`,
            background: `rgb(var(--${agreed ? "refund" : "deny"}-rgb) / 0.12)`,
          }}
        >
          {shortVote(seat, isLeader)}
        </span>
      </div>
      <span className="font-mono text-sm text-txt-2">{shortModel}</span>
      <span className="micro" style={{ textTransform: "none", letterSpacing: "0.02em" }}>
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
  const agreedCount = seats.filter(
    (s) => s.vote === "agree" || s.vote === "proposed",
  ).length;

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
            {agreedCount} of {seats.length} concurred
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
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-2">
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
