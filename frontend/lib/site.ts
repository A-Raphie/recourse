// Canonical public URL: single source of truth for the landing's MCP config
// and any absolute links. Vercel env vars proved flaky through the CLI
// (empty-string saves), so this lives in code where a claim can be verified.
export const SITE_URL = "https://tryrecourse.vercel.app";
