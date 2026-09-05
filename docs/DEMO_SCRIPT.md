# Demo Script: Recourse

**Hackathon:** GenLayer Agent Tank (Agentic Commerce Infrastructure track)
**Time limit:** none published; target 2:30
**Judging:** panel review + open community rating. Criteria not weighted publicly; this script maps to: working product, sponsor-tech centrality (validator jury), agent-legibility, judge experience.

**Recording gate:** no takes until Raphie records the VO (vo-first rule). Takes on Desktop 2, his Chrome, drawn cursor, per desktop-demo rules.

**Setup:** Chrome 1280x800 on Desktop 2, drawn cursor overlay with visible clicks, no dock/menu bar, no explorer tabs in the cut.

---

### Scene 1: Hook (0:00-0:10)
**Criterion:** Product (danger opener, quotable first sentence)
**Show:** Landing hero: "Your agent paid. The service lied. Get the units back."
**Say:** "Your agent just paid a stranger on the internet. And nothing stops that stranger from sending back garbage. Until now. This is Recourse."
**Action:** Hold on hero, slight scroll to reveal the status strip.

### Scene 2: It is live (0:10-0:32)
**Criterion:** Deployment proof + product
**Show:** Scroll to the stats strip: 2 disputes, 1 settled by jury, 1 refunded, 400 units returned. Mono status line: live · genlayer studio · contract address.
**Say:** "This is not a mockup. These numbers are read straight off the GenLayer studio network. Real disputes, judged by real validators, settled on chain. Contract address on screen."
**Action:** Slow scroll, pause on each stat card.

### Scene 3: The flow (0:32-0:52)
**Criterion:** Product clarity
**Show:** "How a dispute runs" four cards: pay, garbage, file, jury.
**Say:** "The flow is four steps. An agent pays for a service. The deliverable comes back broken. The payer files a dispute, and the escrow locks the amount. Then a jury settles it."
**Action:** Hover each card left to right, in step order.

### Scene 4: File a real dispute (0:52-1:08)
**Criterion:** Judge path + UX
**Show:** Live feed. Click "File a dispute": the form is prefilled with a real failed delivery. Click "File on chain", toast confirms, redirect to the new dossier.
**Say:** "Filing takes one click. The form ships prefilled with a real failure: paid for a live FX quote, got a five hundred error instead. Filing locks the amount in escrow, on chain, right now."
**Action:** Click File a dispute → File on chain → wait for redirect to the dossier.

### Scene 5: The open jury (1:08-1:55)
**Criterion:** Sponsor-tech centrality: THE money moment
**Show:** The dossier: the case (promise vs delivered side by side), then click "Call the jury". The page waits, then the jury seats land: five validators, each with its model, votes filling in, "4 of 5 concurred", the verdict card: REFUND.
**Say:** "Now the part only GenLayer can do. I call the jury. Five validators each fetch both pages themselves, judge the claim, and vote. Watch the seats. A Gemini model led. Grok agreed. Mistral agreed. Four of five concurred, and the verdict is written on chain: refund. The service was unreachable when it mattered."
**Action:** Click "Call the jury", let the wait breathe ("about a minute" pending state on the button), then hold 3 seconds after the verdict card lands. Do not cut early.
**Note:** for the recording, adjudicate a fresh dispute so the seats land live on camera.

### Scene 6: Agents call it as a tool (1:55-2:15)
**Criterion:** Agent-legibility
**Show:** Scroll landing to "Connect your agent": the MCP config block. Then GET /api/mcp in the address bar: the self-describing tool list.
**Say:** "Humans click. Agents don't have to. The whole loop is an MCP tool: deposit, file, adjudicate, settle. Point any agent at this endpoint and it can run the entire case on its own."
**Action:** Show the config block, then the endpoint JSON, then back.

### Scene 7: Close (2:15-2:30)
**Criterion:** All
**Show:** Landing with feed, GitHub link, contract address. Live URL + repo on screen.
**Say:** "Recourse. The service lied, the jury settled it, and the units came back. Live URL and source on screen."
**Action:** None. Hold 5 seconds on the links.

---

**Time budget:**
| Beat | Allocated | Scenes |
|------|-----------|--------|
| Hook + proof | 32s | 1, 2 |
| Flow + judge path | 36s | 3, 4 |
| The open jury | 47s | 5 |
| Agent surface | 20s | 6 |
| Close | 15s | 7 |
| **Total** | **2:30** | |

**VO word count:** ~285 words. Sits under the 320/3min standard proportionally; the adjudication wait eats screen time without words, which is the honest pacing.

**Submission checklist:**
- [x] Live URL shown: https://tryrecourse.vercel.app
- [x] GitHub shown: https://github.com/A-Raphie/recourse
- [x] Contract address shown: 0xB6d3c089B0AC336EFEe9820Ce9fFddE3573C177e
- [x] Chain shown: GenLayer Studio testnet, explorer link in receipts
- [ ] Demo video: recording gated on Raphie's VO
