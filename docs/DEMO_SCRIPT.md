# Demo Script: Recourse

**Hackathon:** GenLayer Agent Tank (Agentic Commerce Infrastructure track)
**Time limit:** none published; target 2:45
**Judging:** panel review + open community rating. Criteria not weighted publicly; this script maps to: working product, sponsor-tech centrality (validator jury), agent-legibility, judge experience.

**Recording gate:** no takes until Raphie records the VO (vo-first rule). Takes on Desktop 2, his Chrome, drawn cursor, per desktop-demo rules.

**Setup:** Chrome 1280x800 on Desktop 2, drawn cursor overlay with visible clicks, no dock/menu bar, no explorer tabs in the cut.

---

### Scene 1: Hook (0:00-0:12)
**Criterion:** Product (danger opener, quotable first sentence)
**Show:** Landing hero: "Your agent paid. The service lied. Get the units back."
**Say:** "Your agent just paid a stranger on the internet. And nothing stops that stranger from sending back garbage. Until now. This is Recourse: disputes for machine payments, settled on chain."
**Action:** Hold on hero, slight scroll to reveal the status strip.

### Scene 2: It is live (0:12-0:36)
**Criterion:** Deployment proof + product
**Show:** Scroll to the stats strip: disputes filed, settled by jury, refunded, units returned. Mono status line: live · genlayer studio · contract address.
**Say:** "This is not a mockup. Every number here is read straight off the GenLayer studio network. No dashboard database. No cached figures. Real disputes, judged by real validators, settled on chain. Judged in the open, not by a help desk. Contract address on screen."
**Action:** Slow scroll, pause on each stat card.

### Scene 3: The flow (0:36-0:56)
**Criterion:** Product clarity
**Show:** "How a dispute runs" four cards: pay, garbage, file, jury.
**Say:** "The flow is four steps. An agent pays for a service. The deliverable comes back broken: a five hundred where the quote should be. The payer files a dispute and pins both pages as evidence. The escrow locks the amount. Then a jury settles it."
**Action:** Hover each card left to right, in step order.

### Scene 4: File a real dispute (0:56-1:16)
**Criterion:** Judge path + UX
**Show:** Live feed. Click "File a dispute": the form is prefilled with a real failed delivery. Click "File on chain", toast confirms, redirect to the new dossier.
**Say:** "Filing takes one click. The form ships prefilled with a real failure: an agent paid over x402 for a live FX quote, and got a five hundred error instead. One transaction locks the amount, plus an anti-spam stake. Paid on one chain. Judged on another."
**Action:** Click File a dispute → File on chain → wait for redirect to the dossier.

### Scene 5: The open jury (1:16-2:05)
**Criterion:** Sponsor-tech centrality: THE money moment
**Show:** The dossier: the case (promise vs delivered side by side), then click "Call the jury". The page waits, then the jury seats land: five validators, each with its model, votes filling in, the concurrence counter, the verdict card: REFUND.
**Say:** "Now the part only GenLayer can do. I call the jury. Every validator fetches both pages itself, judges the claim, and votes. Watch the seats fill. There goes the first vote. And the next. Nobody takes anybody's word; they all ran the case. Remember the stranger from the start? He doesn't get to keep the payment. The verdict lands on chain, and the escrow pays the refund."
**Action:** Click "Call the jury", let the wait breathe ("about a minute" pending state on the button), then hold 3 seconds after the verdict card lands. Do not cut early.
**Note:** for the recording, adjudicate a fresh dispute so the seats land live on camera. The Say line is deliberately model-agnostic: jury composition and the concurrence count are nondeterministic, so the pre-recorded VO never names models or counts; the screen shows them.

### Scene 6: Agents call it as a tool (2:05-2:25)
**Criterion:** Agent-legibility
**Show:** Scroll landing to "Connect your agent": the MCP config block. Then GET /api/mcp in the address bar: the self-describing tool list.
**Say:** "Humans click. Agents don't have to. The whole loop is an MCP tool: deposit, file, adjudicate, settle. The endpoint describes itself, so any MCP client can list the tools and run the entire case on its own. No SDK rewrite. No ticket queue. The agent economy, with a returns policy."
**Action:** Show the config block, then the endpoint JSON, then back.

### Scene 7: Close (2:25-2:45)
**Criterion:** All
**Show:** Landing with feed, GitHub link, contract address. Live URL + repo on screen.
**Say:** "Recourse. Your agent paid. The service lied. And this time, the units came back. Live URL and source on screen."
**Action:** None. Hold 5 seconds on the links.

---

**Time budget:**
| Beat | Allocated | Scenes |
|------|-----------|--------|
| Hook + proof | 36s | 1, 2 |
| Flow + judge path | 40s | 3, 4 |
| The open jury | 49s | 5 |
| Agent surface | 20s | 6 |
| Close | 20s | 7 |
| **Total** | **2:45** | |

**VO word count:** ~302 words. On pace with the 320/3min standard for the 2:45 target; the adjudication wait eats screen time without words, which is the honest pacing for a consensus demo.

**Submission checklist:**
- [x] Live URL shown: https://tryrecourse.vercel.app
- [x] GitHub shown: https://github.com/A-Raphie/recourse
- [x] Contract address shown: 0x86384c6F2F9C705464ED73ac1270DD9B6Af92EC8
- [x] Chain shown: GenLayer Studio testnet, explorer link in receipts
- [ ] Demo video: recording gated on Raphie's VO
