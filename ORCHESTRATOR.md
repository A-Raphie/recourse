# Recourse — Hackathon Orchestrator Ledger
Event: GenLayer Agent Tank (portal.genlayer.foundation/agent-tank/hackathon/) · Deadline: 2026-09-17 15:30 UTC · Current stage: 6 (shipped) · Updated: 2026-09-05

## Sweeps
| Stage | Entered | Exited | Notes |
|---|---|---|---|
| 0 Calibrate | 2026-09-04 | 2026-09-04 | verdict research done pre-approval (playbook win/loss applied) |
| 1 Idea + validation | 2026-09-04 | 2026-09-04 | idea locked: post-payment dispute layer for agent payments (x402 first) |
| 2 Plan + design | 2026-09-04 | 2026-09-04 | BRIEF APPROVED ("all good"); design axes locked; deploy target pinned (Vercel + Studio) |
| 3 Build | 2026-09-04 | 2026-09-05 | engine + MCP + x402 rail + dossier/jury + landing/feed, all render-verified |
| 4 Verify + polish | 2026-09-05 | 2026-09-05 | render audits fixed (iframes, pills); state matrix pass (populated/empty/offline/mobile); zero-raw-hex gate pass |
| 5 Ship | 2026-09-05 | 2026-09-05 | SHIPPED: https://tryrecourse.vercel.app - pre-ship gate verdict SHIPPED (live revision behaviorally verified, metadata battery live, CLI QA on prod incl. DEMO_KEY write) |
| 6 Demo + submit | 2026-09-05 | (open) | storyboard done (docs/DEMO_SCRIPT.md, ~285 VO words); RECORDING GATED ON RAPHIE'S VO; submission = his click |

## Ship record
- Production: https://tryrecourse.vercel.app (Vercel project "recourse", team ernxtos-projects)
- Canonical contract: 0x86384c6F2F9C705464ED73ac1270DD9B6Af92EC8 (GenLayer Studio testnet) - v3 with anti-spam staking (100 units, returned on refund, slashed to validator pool on dismissal) and graduated refunds (refund_pct 0-100 in bounded steps, consensus-safe). Old v2 contract 0xB6d3... remains on chain with its history.
- Sep 6 additions: Dispute Simulator (homepage, drives real deposit/buy/file/adjudicate/settle, live-verified end to end: sim case settled 100% refund), Developer Hub (TS/Python/cURL tabs + copy buttons + tool schema), vertical status timeline, copy fields on addresses/ids, jury chips with icons + honest leader-excluded consensus math, evidence diff panels, breadcrumb, testnet-framing chip, CTA hierarchy (agent-dev primary)
- Env on Vercel: NEXT_PUBLIC_CONTRACT_ADDRESS, NEXT_PUBLIC_DEMO_ADDRESS, SELLER_ADDRESS, DEMO_KEY, X402_MODE=symbolic, NEXT_PUBLIC_SITE_URL (production scope; preview scope unavailable without git-linked project - CLI deploys only)
- E2E: home + dossier + 404 in browser; MCP CLI QA on prod (read + write proving serverless DEMO_KEY); mobile 375px dossier pass
- Fixes shipped during rehearsal: receipts index bundled (prod dossiers render jury), in-session jury capture from action receipts, OG card
- Audit battery: mock-hunter reasoning pass (all visible values = live chain reads; symbolic escrow + x402 mode disclosed), claims exercised against deployment, lighthouse full run skipped per its own timebox note

## Remaining for submission
1. Raphie: record VO (docs/DEMO_SCRIPT.md Say lines) - hard gate on all takes
2. Raphie: two faucet hits on buyer wallet 0xf57F8AacC263524eded87FA1217ad2aCF9243ce6 (Base Sepolia ETH + USDC) if real-x402 payment wanted on camera
3. Takes on Desktop 2 (desktop-demo rules) -> demo-final-gate -> his cut review
4. Portal submission form (his click, notify-gate) by Sep 14; X posts (x-post-formatting rules, his approval)

## Skill ledger
| Skill | Stage | State | Note (reason / revisit trigger / result) |
|---|---|---|---|
| web-search-fallback | 0 | ✅ done | GLM search quota dead; Bing discovery partially degraded (2 noise queries); GitHub/X/DNS direct checks carried the sweep |
| see-whats-going-on | 0 | ✅ done | event page + submit gate + builds page read via control-browser (JS-rendered portal) |
| browser-use:control-browser | 0 | ✅ done | portal rendered read: rules, schedule, 6 tracks, 6 competing builds |
| hackathon-winner-research | 0 | ✅ done | no prior winners (first event); enoch-winsznx playbook win/loss section applied instead |
| hackathon-idea-hack | 1 | ✅ done | 3 pitched; exclusion list vs 6 day-2 tank builds |
| idea-autopsy | 1 | ✅ done | Recourse SURVIVED (settlement-on-camera constraint); Proofdrop DEAD (free-AI + no moat); REJECTION.md creation pending user consent |
| naming | 2 | ✅ done | full mechanics: 20+ candidates, 8 themes; finalists Recourse / Remand / Recoup; sweep: A-Raphie/recourse free, @tryrecourse + @recoursepay + tryrecourse.com free, bare @recourse taken; USPTO knockout = user manual item |
| hackathon-orchestrator | all | ✅ done | this ledger; routing all stages |
| before-you-build | 2 | ⏸ deferred | full brief at heavy-build entry (Sep 10); positioning one-liner already exists from naming Rule 0 |
| hackathon-design | 2 | ⏸ deferred | DESIGN_LEDGER entry + differentiator identity at heavy-build entry |
| design-direction | 2 | ⏸ deferred | visual direction before any UI component |
| spec | 2 | ⏸ deferred | PRD/Architecture/Tasks after brief approval |
| agents-md | 2 | ⏸ deferred | write repo AGENTS.md when heavy build starts |
| semantic-tokens / component-harvest / ui-craft / winsznx-ui / enoch-ui / winsznx-landing / ux-laws | 3 | ⏸ deferred | full UI family loads BEFORE first component (standing rule) |
| terminal-preflight | 3 | ⏸ deferred | before any browser/e2e/recording launch |
| andrej-karpathy | 3 | ⏸ deferred | always-on while coding, activates at build |
| lemmaly (+ invariant-guard, mathguard) | 3 | 🔍 checked-not-needed | spike has no non-trivial loops/recursion/scale math |
| deploy-target check | 2 | ✅ done | Vercel for frontend + API routes (precedent: Assay MCP endpoint on Vercel); contracts run on GenLayer Studio/testnet, not our infra |
| deploy-target: mock-hunter | 4 | ⏸ deferred | pre-demo real-vs-mock audit |
| ship-rehearsal → pre-release-review → pre-ship-gate | 5 | ⏸ deferred | mandated ship order before any live claim |
| vercel-disable-sso | 5 | ⏸ deferred | after Vercel deploy |
| demo-script → vo-first → demo-video/desktop-demo | 6 | ⏸ deferred | video waits for user VO; desktop takes on Desktop 2 only |
| submission | 6 | ⏸ deferred | user clicks portal submit (notify-gate) |
| post-hackathon | 7 | ⏸ deferred | after Sep 25 winners |
| srt-extractor, stock-checker, youtube-description, youtube-virality | - | 🔍 excluded | orchestrator exclusion list (YouTube pipeline) |
| wallet-connect-fix | 3 | ⏸ deferred | only if a wallet connect surface appears (agents pay via x402, users may not need a wallet) |
| frontend-lighthouse / website-audit / ui-ux-audit / production-audit | 4-5 | ⏸ deferred | audit battery per phase gate; re-run bound to each deploy revision |

## Stage gate
- [x] Exit sweep done (all ⏳/⏸ revisited) — stage 1 exit
- [x] ◆ skills that ran: none yet (no external-effect actions taken)
- [x] Next stage's entry sweep queued — stage 2 entry recorded above

## Seed slice results (2026-09-04)
- Scaffold: boilerplate cloned, fresh git, stray root __init__.py removed (broke pytest package resolution)
- Toolchain: 43/43 boilerplate direct tests pass on Python 3.14.4
- Spike: contracts/recourse.py (file -> adjudicate via web.render + exec_prompt under eq_principle -> settle) + 6/6 direct tests in 0.07s
- Kill-check verdict: mechanic is consensus-settled state transition, not a prompt wrapper; GO confirmed for heavy build
- Real-consensus slice (Sep 4 evening): integration flow GREEN on hosted Studio (studionet) in 54s: deploy -> file -> adjudicate -> settle, verdict refund=True code=service_unavailable confidence=high. Key finding: strict_eq over free-text reason = validator disagreement (vote: disagree, state never commits); fix = enum verdict surface (refund bool + reason_code enum + confidence). prompt_non_comparative exists in the SDK but the locally pinned runner lacks it (returns None in direct mode; newer runner hash not in local bundle). gltest API shapes: reads .call(), writes .transact(); boilerplate's own integration tests are stale against gltest 0.29.2 (wrong import + invocation shapes). Evidence fixtures served from raw.githubusercontent on this repo so validators render real URLs.

## Ship rehearsal round (2026-09-06, ship-rehearsal skill, his order: "do ship-rehearsal to see if everything works")
- Phase 1 branch deploy: preview scope envs mirrored via raw API (local .env lacks X402_MODE -> first mirror wrote EMPTY, preview served free instead of challenge; fixed by explicit upsert). Finding: preview env for CLI deploys on non-git-linked projects needs explicit values, never mirror-by-absence.
- Phase 2 browser E2E on preview (IAB, 1440 + 375): cold load renders all live chain data; DisputeSimulator one-click full flow settled 100% in ~30s (sim-1788723947045); dossier shows jury (3 of 4 concurred, leader excluded) + 4-event timeline; mobile 375 zero horizontal overflow. Note: hero screenshot right after load catches the reveal mid-fade (opacity animating) - wait 2s before judging.
- Phase 3 CLI-QA over preview MCP found a REAL BUG: file_dispute with amount >> balance returned SUCCESS + tx hash while the tx reverted on chain (no dispute, no balance change). Root cause: genlayer-js waitForTransactionReceipt(ACCEPTED) returns any DECIDED receipt - reverts reach consensus as MAJORITY_AGREE on a failed outcome; the leader receipt's execution_result field (SUCCESS vs ERROR) is the true signal and write() never checked it. Fix in lib/server/genlayer.ts write(): throw when leader execution_result != SUCCESS (before recordTx, so dead txs never enter the receipts ledger). Same fix covers deposit/adjudicate/settle + /api/action route.
- Retested: over-balance file -> isError "failed on chain (execution_result: ERROR)"; double settle + double adjudicate -> clean isError (were silent false-successes too); full happy loop re-ran green (qa3-rehearse 100% refund); qa2-over2 absent from published receipts; false qa2-over entry scrubbed from txindex-bundled.json (commit c1e5296 lineage).
- Phase 4: same source deployed to prod (recourse-ov6ddbanw), canonical alias direct, prod edge re-proven (isError on over-balance), challenge 402 / free 200 / MCP reads live.
