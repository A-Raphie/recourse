# Recourse

**Chargebacks for the agent economy.** An agent pays a provider, the deliverable comes back broken, and until now that was the end of the story. Recourse is a GenLayer intelligent contract where the payer files a dispute with pinned evidence, a jury of validators judges the claim under consensus, and the escrowed amount settles refund-or-deny on-chain.

- **Live:** https://tryrecourse.vercel.app
- **Contract:** `0xB6d3c089B0AC336EFEe9820Ce9fFddE3573C177e` (GenLayer Studio testnet, chain 61999)
- **MCP endpoint:** `https://tryrecourse.vercel.app/api/mcp` (GET self-describes; `llms.txt` at the root)
- **Track:** Agentic Commerce Infrastructure · GenLayer Agent Tank

## The 90-second judge path

1. Open the [live feed](https://tryrecourse.vercel.app). The stats strip and every table row are live chain state, no wallet needed.
2. Click **File a dispute**. The form ships prefilled with a real failed delivery. **File on chain** locks the amount in escrow.
3. On the dossier, click **Call the jury**. Five validators each render both evidence URLs, judge under consensus, and vote. About a minute. The seats show model names and votes from the consensus receipt.
4. Settle: on refund the escrow returns to the payer; on deny it releases to the provider. Every step has an on-chain receipt.

Agents skip the UI entirely: point any MCP client at `/api/mcp` and call `deposit`, `file_dispute`, `adjudicate`, `settle`.

## How it works

```
payer agent            Recourse (GenLayer)              provider
    |  deposit escrow units   |                             |
    |  file_dispute(evidence) |  amount LOCKED              |
    |                         |  validators render both URLs |
    |                         |  judge under eq_principle    |
    |  settle                 |                             |
    |  <--- refund -----------|  or -- release ------------> |
```

- **Contract** (`contracts/recourse.py`): escrow ledger (`deposit`, `locked`, settle transfers), dispute lifecycle with state guards, views for stats and per-party feeds. Python on GenVM.
- **Consensus**: adjudication runs the judge prompt inside `eq_principle.strict_eq` - validators must agree byte-for-byte on the verdict. The verdict surface is deliberately tiny (refund boolean + reason code enum + confidence) because free-text LLM output never agrees across heterogeneous model families. We proved the failure mode live: prose verdicts produce validator `disagree` votes and the transaction silently commits nothing. The UI maps reason codes to human sentences.
- **Evidence**: both URLs are rendered by validators at adjudication time. The dossier shows the same content with source links.
- **Jury transparency**: validator seats, model names, and votes come from the adjudication receipt's consensus record. Receipts are indexed out-of-band (`data/txindex-bundled.json` plus in-session capture) because the chain does not expose tx hashes to contract reads; the chain receipt is always the source of truth.
- **Agent surface**: `/api/mcp` is a hand-rolled JSON-RPC 2.0 streamable-http server (8 tools, GET self-describes). The seller rail (`/api/sell/fx-quote`) is wrapped with the real x402 protocol on Base Sepolia.

## Honest disclosures

| Area | State |
|---|---|
| Escrow units | Ledger entries on the Studio testnet, not live token transfers. The unit economics are real state transitions; the currency is symbolic. |
| x402 rail | The seller endpoint ships the real x402 protocol on Base Sepolia (mode `X402_MODE=real`, requires funded test wallets). The deployed demo runs `symbolic` mode, which serves the same endpoint without payment enforcement. |
| Receipts index | Tx hashes are tracked out-of-band (bundled index + in-session capture). Chain receipts are the source of truth. |
| Demo disputes | All ledger content comes from real runs (agent-driven and UI-driven), none seeded by hand. |

## Tests

- 11 direct-mode contract tests (escrow both paths, guards, stats) - `pytest tests/direct/ -v`
- Integration on the hosted Studio: deposit, file, consensus adjudication, settle - `gltest tests/integration/test_recourse.py -v` (about 110s)
- MCP flow verified live end to end against the deployed endpoint.

## Stack

Python intelligent contracts on GenVM · genlayer-js · Next.js 16 + Tailwind v4 · hand-rolled MCP JSON-RPC · x402 · Vercel.

---

Recourse · built by [Raphie](https://x.com/a_raphie) for the GenLayer Agent Tank
