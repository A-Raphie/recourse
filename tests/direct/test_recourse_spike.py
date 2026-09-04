"""Spike tests for the Recourse dispute flow: file, adjudicate, settle."""

import json

from tests.direct.conftest import to_hex

SERVICE_URL = "https://provider.example/api/fx-rates"
EVIDENCE_URL = "https://payer.example/deliverables/resp-001"

SERVICE_BODY = "Real-time FX rate API. Returns live USD/EUR quotes as JSON on every request."
BAD_EVIDENCE_BODY = "Internal Server Error. Error code 500. No data available."
GOOD_EVIDENCE_BODY = '{"base": "USD", "quote": "EUR", "rate": 0.9137, "ts": "2026-09-04T12:00:00Z"}'

JUDGE_PROMPT_PATTERN = r".*impartial dispute judge.*"


def test_file_then_view(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/recourse.py")
    direct_vm.sender = direct_alice

    contract.file_dispute(
        dispute_id="d-001",
        provider=to_hex(direct_alice),
        service_url=SERVICE_URL,
        evidence_url=EVIDENCE_URL,
        description="API returned an error instead of the paid FX quote",
        amount=1_000,
    )

    d = contract.get_dispute("d-001")
    assert d["status"] == "filed"
    assert d["refund"] is False
    assert d["payer"] == to_hex(direct_alice)
    assert d["amount"] == 1_000


def test_adjudicate_refunds_bad_deliverable(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/recourse.py")
    direct_vm.sender = direct_alice
    contract.file_dispute(
        "d-001", to_hex(direct_alice), SERVICE_URL, EVIDENCE_URL,
        "API returned an error instead of the paid FX quote", 1_000,
    )

    direct_vm.mock_web(r".*provider\.example.*", {"status": 200, "body": SERVICE_BODY})
    direct_vm.mock_web(r".*payer\.example.*", {"status": 200, "body": BAD_EVIDENCE_BODY})
    direct_vm.mock_llm(
        JUDGE_PROMPT_PATTERN,
        json.dumps({"refund": True, "reason": "Deliverable is a 500 error, not the promised quote", "confidence": "high"}),
    )

    contract.adjudicate("d-001")

    d = contract.get_dispute("d-001")
    assert d["status"] == "adjudicated"
    assert d["refund"] is True
    assert "500" in d["verdict_reason"]


def test_adjudicate_denies_fulfilled_service(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/recourse.py")
    direct_vm.sender = direct_alice
    contract.file_dispute(
        "d-002", to_hex(direct_alice), SERVICE_URL, EVIDENCE_URL,
        "Rate was 0.9137 but I expected 0.92", 500,
    )

    direct_vm.mock_web(r".*provider\.example.*", {"status": 200, "body": SERVICE_BODY})
    direct_vm.mock_web(r".*payer\.example.*", {"status": 200, "body": GOOD_EVIDENCE_BODY})
    direct_vm.mock_llm(
        JUDGE_PROMPT_PATTERN,
        json.dumps({"refund": False, "reason": "Deliverable matches the promised live quote", "confidence": "high"}),
    )

    contract.adjudicate("d-002")

    d = contract.get_dispute("d-002")
    assert d["status"] == "adjudicated"
    assert d["refund"] is False


def test_settle_after_adjudication(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/recourse.py")
    direct_vm.sender = direct_alice
    contract.file_dispute(
        "d-001", to_hex(direct_alice), SERVICE_URL, EVIDENCE_URL,
        "API returned an error instead of the paid FX quote", 1_000,
    )

    direct_vm.mock_web(r".*provider\.example.*", {"status": 200, "body": SERVICE_BODY})
    direct_vm.mock_web(r".*payer\.example.*", {"status": 200, "body": BAD_EVIDENCE_BODY})
    direct_vm.mock_llm(
        JUDGE_PROMPT_PATTERN,
        json.dumps({"refund": True, "reason": "Deliverable is a 500 error", "confidence": "high"}),
    )
    contract.adjudicate("d-001")
    contract.settle("d-001")

    d = contract.get_dispute("d-001")
    assert d["status"] == "settled"
    assert d["refund"] is True

    with direct_vm.expect_revert("Dispute not adjudicated"):
        contract.settle("d-001")


def test_double_adjudicate_fails(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/recourse.py")
    direct_vm.sender = direct_alice
    contract.file_dispute(
        "d-001", to_hex(direct_alice), SERVICE_URL, EVIDENCE_URL,
        "API returned an error instead of the paid FX quote", 1_000,
    )

    direct_vm.mock_web(r".*provider\.example.*", {"status": 200, "body": SERVICE_BODY})
    direct_vm.mock_web(r".*payer\.example.*", {"status": 200, "body": BAD_EVIDENCE_BODY})
    direct_vm.mock_llm(
        JUDGE_PROMPT_PATTERN,
        json.dumps({"refund": True, "reason": "Deliverable is a 500 error", "confidence": "high"}),
    )
    contract.adjudicate("d-001")

    with direct_vm.expect_revert("Dispute already adjudicated"):
        contract.adjudicate("d-001")


def test_duplicate_dispute_id_fails(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/recourse.py")
    direct_vm.sender = direct_alice

    contract.file_dispute(
        "d-001", to_hex(direct_alice), SERVICE_URL, EVIDENCE_URL, "claim", 100,
    )
    with direct_vm.expect_revert("Dispute id already exists"):
        contract.file_dispute(
            "d-001", to_hex(direct_alice), SERVICE_URL, EVIDENCE_URL, "claim", 100,
        )
