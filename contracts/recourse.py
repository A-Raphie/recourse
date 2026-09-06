# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
from dataclasses import dataclass
from genlayer import *


@allow_storage
@dataclass
class Dispute:
    id: str
    seq: u256
    payer: str
    provider: str
    service_url: str
    evidence_url: str
    description: str
    amount: u256
    stake: u256
    status: str
    refund_pct: u256
    verdict_code: str
    confidence: str


REASON_CODES = ("service_unavailable", "wrong_content", "not_as_promised", "fulfilled")
DISPUTE_STAKE = 100


class Recourse(gl.Contract):
    """Post-payment recourse for the agent economy.

    Agents route disputed value through this contract: deposit credits a
    party's balance, filing a dispute locks the disputed amount PLUS a fixed
    anti-spam stake, and the GenLayer validator jury settles a graduated
    refund (0-100 percent). On settle the escrow splits between payer and
    provider; the stake returns to honest filers and is slashed to the
    validator pool when a dispute is dismissed (refund_pct is 0).
    Amounts are ledger units for the hackathon demo, not live token transfers.
    """

    disputes: TreeMap[str, Dispute]
    balances: TreeMap[str, u256]
    locked: TreeMap[str, u256]
    validator_pool: u256
    dispute_count: u256

    def __init__(self):
        self.dispute_count = 0
        self.validator_pool = 0

    def _judge(self, service_url: str, evidence_url: str, description: str) -> dict:
        def judge() -> str:
            service_page = gl.nondet.web.render(service_url, mode="text")
            evidence_page = gl.nondet.web.render(evidence_url, mode="text")

            task = f"""
You are an impartial dispute judge for machine-to-machine commerce.
A payer paid a provider for a service and now disputes the charge.

The service was promised as described here:
{service_page}

The payer's claim:
{description}

The actual deliverable or response the payer received:
{evidence_page}

Decide how much of the charge the payer deserves back. Be strict about
total failures (errors, empty or unrelated content) and lenient about
stylistic differences. A total failure earns 100; a fulfilled promise
earns 0; a partial delivery earns the gap.

Respond in JSON:
{{
    "refund_pct": int, // percent of the charge to refund, exactly one of: 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100
    "reason_code": str, // exactly one of: "service_unavailable", "wrong_content", "not_as_promised", "fulfilled"
    "confidence": str // "low", "medium" or "high"
}}
It is mandatory that you respond only using the JSON format above,
nothing else. Don't include any other words or characters,
your output must be only JSON without any formatting prefix or suffix.
This result should be perfectly parsable by a JSON parser without errors.
            """
            result = gl.nondet.exec_prompt(task, response_format="json")
            return json.dumps(result, sort_keys=True)

        verdict_json = json.loads(gl.eq_principle.strict_eq(judge))
        return verdict_json

    @gl.public.write
    def deposit(self, amount: u256) -> None:
        if amount == 0:
            raise gl.vm.UserError("Amount must be positive")
        sender = gl.message.sender_address.as_hex
        if sender not in self.balances:
            self.balances[sender] = 0
        self.balances[sender] += amount

    @gl.public.write
    def withdraw(self, amount: u256) -> None:
        if amount == 0:
            raise gl.vm.UserError("Amount must be positive")
        sender = gl.message.sender_address.as_hex
        available = self.balances.get(sender, 0)
        if available < amount:
            raise gl.vm.UserError("Insufficient balance")
        self.balances[sender] = available - amount

    @gl.public.write
    def file_dispute(
        self,
        dispute_id: str,
        provider: str,
        service_url: str,
        evidence_url: str,
        description: str,
        amount: u256,
    ) -> None:
        if dispute_id in self.disputes:
            raise gl.vm.UserError("Dispute id already exists")
        if amount == 0:
            raise gl.vm.UserError("Amount must be positive")

        payer = gl.message.sender_address.as_hex
        available = self.balances.get(payer, 0)
        needed = amount + DISPUTE_STAKE
        if available < needed:
            raise gl.vm.UserError("Insufficient balance, deposit amount plus stake")

        self.balances[payer] = available - needed
        if payer not in self.locked:
            self.locked[payer] = 0
        self.locked[payer] += needed

        self.dispute_count += 1
        dispute = Dispute(
            id=dispute_id,
            seq=self.dispute_count,
            payer=payer,
            provider=provider,
            service_url=service_url,
            evidence_url=evidence_url,
            description=description,
            amount=amount,
            stake=DISPUTE_STAKE,
            status="filed",
            refund_pct=0,
            verdict_code="",
            confidence="",
        )
        self.disputes[dispute_id] = dispute

    @gl.public.write
    def adjudicate(self, dispute_id: str) -> None:
        if dispute_id not in self.disputes:
            raise gl.vm.UserError("Dispute not found")
        dispute = self.disputes[dispute_id]
        if dispute.status != "filed":
            raise gl.vm.UserError("Dispute already adjudicated")

        verdict = self._judge(
            dispute.service_url, dispute.evidence_url, dispute.description
        )

        pct = int(verdict["refund_pct"])
        if pct < 0 or pct > 100:
            raise gl.vm.UserError("Refund percent out of range")

        dispute.refund_pct = pct
        dispute.verdict_code = str(verdict["reason_code"])
        dispute.confidence = str(verdict["confidence"])
        dispute.status = "adjudicated"

    @gl.public.write
    def settle(self, dispute_id: str) -> None:
        if dispute_id not in self.disputes:
            raise gl.vm.UserError("Dispute not found")
        dispute = self.disputes[dispute_id]
        if dispute.status != "adjudicated":
            raise gl.vm.UserError("Dispute not adjudicated")

        payer = dispute.payer
        provider = dispute.provider
        locked_left = self.locked.get(payer, 0)
        if locked_left < dispute.amount + dispute.stake:
            raise gl.vm.UserError("Escrow state inconsistent")

        self.locked[payer] = locked_left - dispute.amount - dispute.stake

        refund_units = dispute.amount * dispute.refund_pct // 100
        keep_units = dispute.amount - refund_units

        if refund_units > 0:
            if payer not in self.balances:
                self.balances[payer] = 0
            self.balances[payer] += refund_units
        if keep_units > 0:
            if provider not in self.balances:
                self.balances[provider] = 0
            self.balances[provider] += keep_units

        # anti-spam stake: returned to honest filers, slashed to the
        # validator pool when the dispute is dismissed entirely
        if dispute.refund_pct > 0:
            if payer not in self.balances:
                self.balances[payer] = 0
            self.balances[payer] += dispute.stake
        else:
            self.validator_pool += dispute.stake

        dispute.status = "settled"

    @gl.public.view
    def get_balance(self, account: str) -> dict:
        addr = Address(account).as_hex
        return {
            "available": self.balances.get(addr, 0),
            "locked": self.locked.get(addr, 0),
        }

    @gl.public.view
    def get_dispute(self, dispute_id: str) -> dict:
        if dispute_id not in self.disputes:
            raise gl.vm.UserError("Dispute not found")
        d = self.disputes[dispute_id]
        return {
            "id": d.id,
            "seq": d.seq,
            "payer": d.payer,
            "provider": d.provider,
            "service_url": d.service_url,
            "evidence_url": d.evidence_url,
            "description": d.description,
            "amount": d.amount,
            "stake": d.stake,
            "status": d.status,
            "refund_pct": d.refund_pct,
            "verdict_code": d.verdict_code,
            "confidence": d.confidence,
        }

    @gl.public.view
    def get_disputes(self) -> list:
        return [self.get_dispute(d_id) for d_id in self.disputes.keys()]

    @gl.public.view
    def get_disputes_by_party(self, account: str) -> list:
        addr = Address(account).as_hex
        out = []
        for d_id in self.disputes.keys():
            d = self.get_dispute(d_id)
            if d["payer"].lower() == addr.lower() or d["provider"].lower() == addr.lower():
                out.append(d)
        return out

    @gl.public.view
    def get_stats(self) -> dict:
        filed = 0
        adjudicated = 0
        settled = 0
        refunded = 0
        denied = 0
        total_disputed = 0
        total_refunded = 0
        for d_id in self.disputes.keys():
            d = self.disputes[d_id]
            total_disputed += d.amount
            if d.status == "filed":
                filed += 1
            elif d.status == "adjudicated":
                adjudicated += 1
            elif d.status == "settled":
                settled += 1
                if d.refund_pct > 0:
                    refunded += 1
                    total_refunded += d.amount * d.refund_pct // 100
                else:
                    denied += 1
        return {
            "disputes": filed + adjudicated + settled,
            "filed": filed,
            "adjudicated": adjudicated,
            "settled": settled,
            "refunded": refunded,
            "denied": denied,
            "total_disputed": total_disputed,
            "total_refunded": total_refunded,
            "validator_pool": self.validator_pool,
        }
