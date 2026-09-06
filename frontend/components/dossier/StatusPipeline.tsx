export function StatusPipeline({ status }: { status: string }) {
  const steps = [
    { key: "filed", label: "Filed" },
    { key: "adjudicated", label: "Adjudicated" },
    { key: "settled", label: "Settled" },
  ];
  const current = steps.findIndex((s) => s.key === status);
  // a settled case has completed every step, including the last one
  const lastDone = status === "settled" ? steps.length : current;

  return (
    <ol className="flex items-center gap-0" aria-label="Dispute pipeline">
      {steps.map((step, i) => {
        const done = i < lastDone;
        const active = i === current;
        return (
          <li key={step.key} className="flex items-center">
            <div className="flex items-center gap-2">
              <span
                className="flex items-center justify-center rounded-full font-mono text-xs"
                style={{
                  width: 26,
                  height: 26,
                  border: `1px solid ${active || done ? "var(--accent)" : "var(--border-default)"}`,
                  background: active ? "var(--accent)" : done ? "rgb(var(--accent-rgb) / 0.14)" : "transparent",
                  color: active ? "var(--accent-foreground)" : done ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className="micro"
                style={{ color: active || done ? "var(--text-primary)" : "var(--text-muted)" }}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className="mx-3 inline-block"
                style={{
                  width: 40,
                  height: 1,
                  background: done ? "var(--accent)" : "var(--border-default)",
                }}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
