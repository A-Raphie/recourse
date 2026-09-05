async function fetchText(url: string): Promise<string> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const text = await res.text();
    return text.slice(0, 400);
  } catch {
    return "(could not fetch right now; validators fetch it live when judging)";
  }
}

function Panel({
  label,
  color,
  url,
  content,
}: {
  label: string;
  color: string;
  url: string;
  content: string;
}) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-default)" }}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="micro" style={{ color }}>
          {label}
        </span>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="micro"
          style={{ color: "var(--accent)", textTransform: "none" }}
        >
          source
        </a>
      </div>
      <pre
        className="overflow-hidden rounded-lg border p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap"
        style={{
          borderColor: "var(--border-default)",
          background: "var(--bg-subtle)",
          color: "var(--text-secondary)",
          maxHeight: "11rem",
        }}
      >
        {content}
      </pre>
    </div>
  );
}

export function EvidenceDuel({
  serviceUrl,
  evidenceUrl,
  description,
  promisedText,
  deliveredText,
}: {
  serviceUrl: string;
  evidenceUrl: string;
  description: string;
  promisedText: string;
  deliveredText: string;
}) {
  return (
    <section className="card p-5" aria-label="The case">
      <h3 className="mb-4 text-xl">The case</h3>

      <p className="caption mb-1">The payer's claim</p>
      <p
        className="mb-5 border-l-2 pl-3 text-base"
        style={{ borderColor: "var(--accent)", color: "var(--text-primary)" }}
      >
        {description}
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel label="What was promised" color="var(--refund)" url={serviceUrl} content={promisedText} />
        <Panel label="What was delivered" color="var(--deny)" url={evidenceUrl} content={deliveredText} />
      </div>

      <p className="micro mt-4" style={{ textTransform: "none", letterSpacing: "0.02em" }}>
        Both panels are the exact URLs validators render when they judge. Open them yourself.
      </p>
    </section>
  );
}

export { fetchText };
