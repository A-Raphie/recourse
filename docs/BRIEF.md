# Recourse — Build Brief

Event: GenLayer Agent Tank · closes 2026-09-17 15:30 UTC · submit target Sep 14 · solo
Track: Agentic Commerce Infrastructure · judged by panel + live community rating

## The bet

For agent operators who get burned when a paid agent call delivers garbage, **Recourse** is an on-chain dispute layer that lets a GenLayer validator jury adjudicate pinned evidence and settle a refund, unlike escrow-at-purchase or manual complaints, because recourse exists after payment, not just before.

Core loop: agent pays over x402 → deliverable is bad → payer files a dispute with pinned evidence → validators render service promise + actual deliverable, judge under consensus (`eq_principle.strict_eq`) → refund-or-deny settles on-chain → MCP tool so any agent can file disputes natively.

## Risk review (compressed: judged hackathon, evidence banked)

| Risk | Status |
|---|---|
| Demand | Sponsor lists the exact idea ("stablecoin payments with chargeback, one dispute API across cards, x402 and any chain"); x402 adoption wave is current; zero tank entries in the lane as of day 2 |
| Mechanic risk | Retired Sep 4: spike proves file → adjudicate → settle, 6/6 direct tests, lint clean |
| Autopsy constraint | Demo must show consensus + on-chain settlement on camera, never "the LLM said so" |
| Crowd risk | 6 builds in tank already took escrow-adjudication, insurance, trust registry, receipts, scanner; recourse lane empty |
| Calendar | Heavy build Sep 10-14 (after Assay Sep 8 + Sibyl Sep 9); buffer Sep 15-17 |
| Smallest test already passed | Direct-mode spike = the mechanic works with mocked consensus; next test is Studio real-consensus deploy in build week |

## Scope (what ships by Sep 14)

1. Python intelligent contract: disputes, evidence URLs, adjudication, settlement, payer/provider ledger. Direct tests + integration test on Studio.
2. x402 payment demo rail: a seller agent endpoint that charges per request and a buyer agent that pays; one scripted bad-deliverable run.
3. MCP endpoint (`/api/mcp`) exposing `file_dispute` + `get_dispute` as agent tools.
4. Next.js 15 UI: landing + dispute dossier + live dispute feed; reads real contract state. Front door rule: what-is-this in 10s + enter path.
5. Submission package: README-as-submission, 90-second judge path, honesty table, criterion mapping, demo video (VO gated on Raphie's audio).

Cut first if time compresses: multi-chain shape (stay x402-only), provider-side UI, fee/escrow funding mechanics on real tokens (demo uses Studio test balances), post-submit polish.

## Deploy target (pinned at Stage 2 per standing rule)

**Vercel**: Next.js 15 frontend + API routes, including the MCP endpoint at `/api/mcp` (Assay precedent, same architecture). **GenLayer Studio/testnet** carries the contract side: it is the sponsor's hosted validator network, not our infrastructure. No persistent-process backend exists in this scope, so Railway stays unused. Netlify is the fallback only if Vercel blocks something, which nothing currently does.

## Design direction

```
Design brief: Recourse
- Consensus default (banned): dark navy AI dashboard, purple-blue gradient hero,
  glassmorphic bento, neon glow, emoji icons, chat panel, "Powered by" footer.
- Axes pushed: (1) Color strategy: desaturated verdict-pair palette on the mined
  tank-ink base: refund green #3eaa6d vs deny orange #ee8521 (both mined from the
  portal's role system; no red, no purple, no gradients). (2) Motion:
  live-streaming dispute/settlement events only, scarce by design.
  (3) Typography: grotesk weight-400 at editorial scale, no Inter-bold defaults.
- Axes kept conventional: density (command-center on the dossier screen only),
  layout (split hero + live dispute rail), elevation (borderless tint steps).
- Sponsor synthesis: verbatim tank tokens from portal.genlayer.foundation CSS:
  ink #001320, panel #002a3d, border #06506a, muted #bcd5df, cyan #45d7ff
  (evidence/live links), lime #dfff00 (settled highlight). Structure ours, accent theirs.
- Signature move: THE OPEN JURY. A dispute dossier where validator seats sit as
  blank ballots; on adjudication each seat independently commits its verdict with
  validator tag + timing, a consensus counter fills, and the majority verdict
  releases the escrow line into a settlement receipt with tx hash.
  Mechanism test: visualizes Optimal Democracy, the product's actual engine.
  5-minute test: a static vote grid is cheap; live per-validator commits with
  real eq_principle receipts are not. Demo test: it IS the money moment.
  Scarcity: one jury forms per dispute; interruptible; never ambient.
- Avoid-list: purple/blue gradients, glassmorphism, glow shadows, red/green
  traffic-light cliches, stamp/strike mechanics (used in Assay), tapbacks (Quash),
  paper-mono receipt look (Rushes), document/ledger layout (Rushes).
- Familiarity anchor: dark theme itself; submissions live inside the judges'
  dark tank portal (Jakob).
- Chains to: semantic-tokens -> ui-craft -> deterministic-design
```

## Pipeline

Design family (semantic-tokens, component-harvest, ui-craft, winsznx-ui, enoch-ui, ux-laws, baseline-ui) loads before the first component. Ship order: ship-rehearsal → pre-release-review → pre-ship-gate. Demo chain: demo-script → vo-first (gated on Raphie's VO) → recorder. Submission via portal, Raphie clicks submit (notify-gate).

Standing rules: footer credit "built by Raphie" links https://x.com/a_raphie · no em dashes anywhere · English only · section links anchor to /#id · every fill re-verified after clicks.
