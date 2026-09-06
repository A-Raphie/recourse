import { CircleAlert, CircleCheck } from "lucide-react";

async function fetchText(url: string): Promise<string> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const text = await res.text();
    return text.slice(0, 400);
  } catch {
    return "(could not fetch right now; validators fetch it live when judging)";
  }
}

function Chip({
  tone,
  icon: Icon,
  label,
}: {
  tone: "pass" | "fail" | "neutral";
  icon: typeof CircleCheck;
  label: string;
}) {
  const color =
    tone === "pass" ? "var(--refund)" : tone === "fail" ? "var(--deny)" : "var(--status-neutral)";
  const rgb =
    tone === "pass" ? "var(--refund-rgb)" : tone === "fail" ? "var(--deny-rgb)" : "188 213 223";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full font-mono"
      style={{
        fontSize: "0.62rem",
        letterSpacing: "0.08em",
        padding: "2px 8px",
        color,
        background: `rgb(${rgb} / 0.14)`,
        border: `1px solid rgb(${rgb} / 0.4)`,
      }}
    >
      <Icon size={11} strokeWidth={2.5} />
      {label}
    </span>
  );
}

function Lines({
  content,
  mark,
  otherLines,
}: {
  content: string;
  mark: "promise" | "delivered";
  otherLines: Set<string>;
}) {
  const lines = content.split("\n").filter((l) => l.trim().length > 0);
  return (
    <div className="flex flex-col gap-0.5">
      {lines.map((line, i) => {
        const unique = !otherLines.has(line.trim());
        const failed = mark === "delivered" && unique;
        const removed = mark === "promise" && unique;
        return (
          <span
            key={i}
            className="rounded font-mono text-[13px] leading-relaxed"
            style={{
              color: "var(--text-primary)",
              background: failed
                ? "rgb(var(--deny-rgb) / 0.12)"
                : removed
                  ? "rgb(var(--refund-rgb) / 0.08)"
                  : "transparent",
              padding: failed || removed ? "1px 4px" : "1px 4px",
              textDecoration: removed ? "line-through" : "none",
              opacity: removed ? 0.6 : 1,
            }}
          >
            {line}
          </span>
        );
      })}
    </div>
  );
}

export function EvidenceDuel({
  serviceUrl,
  evidenceUrl,
  description,
  promisedText,
  deliveredText,
  refundPct,
  adjudicated,
}: {
  serviceUrl: string;
  evidenceUrl: string;
  description: string;
  promisedText: string;
  deliveredText: string;
  refundPct: number;
  adjudicated: boolean;
}) {
  const promiseLines = new Set(
    promisedText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0),
  );
  const deliveredLines = new Set(
    deliveredText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0),
  );
  const verdictTone = !adjudicated ? "neutral" : refundPct > 0 ? "pass" : "fail";

  return (
    <section className="card p-5" aria-label="The case">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl">The case</h3>
        {adjudicated ? (
          refundPct >= 100 ? (
            <Chip tone="fail" icon={CircleAlert} label="DELIVERABLE FAILED" />
          ) : refundPct > 0 ? (
            <Chip tone="fail" icon={CircleAlert} label={`DELIVERABLE PARTIALLY HELD · ${refundPct}% REFUND`} />
          ) : (
            <Chip tone="pass" icon={CircleCheck} label="DELIVERABLE HELD UP" />
          )
        ) : (
          <Chip tone="neutral" icon={CircleAlert} label="AWAITING VERDICT" />
        )}
      </div>

      <p className="caption mb-1">The payer's claim</p>
      <p
        className="mb-5 border-l-2 pl-3 text-base"
        style={{ borderColor: "var(--accent)", color: "var(--text-primary)" }}
      >
        {description}
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div
          className="rounded-xl border p-4"
          style={{
            borderColor: verdictTone === "neutral" ? "var(--border-default)" : "rgb(var(--refund-rgb) / 0.35)",
            background: "rgb(var(--refund-rgb) / 0.05)",
          }}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <Chip tone={verdictTone === "neutral" ? "neutral" : "pass"} icon={CircleCheck} label="PROMISED" />
            <a
              href={serviceUrl}
              target="_blank"
              rel="noreferrer"
              className="micro"
              style={{ color: "var(--accent)", textTransform: "none" }}
            >
              source
            </a>
          </div>
          <Lines content={promisedText} mark="promise" otherLines={deliveredLines} />
        </div>

        <div
          className="rounded-xl border p-4"
          style={{
            borderColor:
              verdictTone === "fail"
                ? "rgb(var(--deny-rgb) / 0.45)"
                : verdictTone === "pass"
                  ? "rgb(var(--refund-rgb) / 0.35)"
                  : "var(--border-default)",
            background:
              verdictTone === "fail" ? "rgb(var(--deny-rgb) / 0.06)" : "rgb(var(--refund-rgb) / 0.05)",
          }}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <Chip
              tone={verdictTone === "fail" ? "fail" : verdictTone === "pass" ? "pass" : "neutral"}
              icon={verdictTone === "fail" ? CircleAlert : CircleCheck}
              label={verdictTone === "fail" ? "DELIVERED" : "DELIVERED"}
            />
            <a
              href={evidenceUrl}
              target="_blank"
              rel="noreferrer"
              className="micro"
              style={{ color: "var(--accent)", textTransform: "none" }}
            >
              source
            </a>
          </div>
          <Lines content={deliveredText} mark="delivered" otherLines={promiseLines} />
        </div>
      </div>

      <p className="micro mt-4" style={{ textTransform: "none", letterSpacing: "0.02em" }}>
        Both panels are the exact URLs validators render when they judge. Lines
        that do not appear on the other side are highlighted.
      </p>
    </section>
  );
}

export { fetchText };
