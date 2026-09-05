# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
from dataclasses import dataclass
from genlayer import *


@allow_storage
@dataclass
class Dispute:
    id: str
    payer: str
    provider: str
    service_url: str
    evidence_url: str
    description: str
    amount: u256
    status: str
    refund: bool
    verdict_code: str
    confidence: str


class Recourse(gl.Contract):
    """Post-payment recourse for the agent economy.

    A payer agent files a dispute against a paid service. Validators render
    the service promise and the actual deliverable, judge the claim under
    consensus (eq_principle), and the dispute settles refund-or-deny on-chain.
    """

    disputes: TreeMap[str, Dispute]

    def __init__(self):
        pass

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

Decide whether the deliverable fulfills the promise. Be strict about
total failures (errors, empty or unrelated content) and lenient about
stylistic differences.

Respond in JSON:
{{
    "refund": bool, // true if the payer deserves a refund
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

        payer_hex = gl.message.sender_address.as_hex
        dispute = Dispute(
            id=dispute_id,
            payer=payer_hex,
            provider=provider,
            service_url=service_url,
            evidence_url=evidence_url,
            description=description,
            amount=amount,
            status="filed",
            refund=False,
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

        dispute.refund = bool(verdict["refund"])
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

        dispute.status = "settled"

    @gl.public.view
    def get_dispute(self, dispute_id: str) -> dict:
        if dispute_id not in self.disputes:
            raise gl.vm.UserError("Dispute not found")
        d = self.disputes[dispute_id]
        return {
            "id": d.id,
            "payer": d.payer,
            "provider": d.provider,
            "service_url": d.service_url,
            "evidence_url": d.evidence_url,
            "description": d.description,
            "amount": d.amount,
            "status": d.status,
            "refund": d.refund,
            "verdict_code": d.verdict_code,
            "confidence": d.confidence,
        }

    @gl.public.view
    def get_disputes(self) -> list:
        return [self.get_dispute(d_id) for d_id in self.disputes.keys()]
