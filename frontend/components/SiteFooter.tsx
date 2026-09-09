import { recourse } from "@/lib/server/genlayer";

const EXPLORER = "https://explorer-studio.genlayer.com";
const REPO = "https://github.com/A-Raphie/recourse";
const PORTAL = "https://portal.genlayer.foundation/agent-tank/hackathon/";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t py-10" style={{ borderColor: "var(--border-default)" }}>
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-baseline justify-between gap-4 px-4 sm:px-6">
        <p className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
          Recourse · built by{" "}
          <a
            href="https://x.com/a_raphie"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 transition-colors duration-150"
            style={{ color: "var(--text-secondary)", textDecorationColor: "var(--border-default)" }}
          >
            Raphie
          </a>{" "}
          for the GenLayer Agent Tank
        </p>
        <div className="flex flex-wrap gap-6 font-mono text-xs">
          <a href={REPO} target="_blank" rel="noreferrer" style={{ color: "var(--text-secondary)" }}>
            GitHub
          </a>
          <a href="/api/mcp" style={{ color: "var(--text-secondary)" }}>
            MCP endpoint
          </a>
          <a href={EXPLORER} target="_blank" rel="noreferrer" style={{ color: "var(--text-secondary)" }}>
            Explorer
          </a>
          <a href={PORTAL} target="_blank" rel="noreferrer" style={{ color: "var(--text-secondary)" }}>
            Agent Tank
          </a>
        </div>
      </div>
    </footer>
  );
}
