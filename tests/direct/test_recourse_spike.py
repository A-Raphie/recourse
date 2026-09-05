"""Spike tests for the Recourse v2 flow: deposit, file, adjudicate, settle."""

import json

from tests.direct.conftest import to_hex

SERVICE_URL = "https://provider.example/api/fx-rates"
EVIDENCE_URL = "https://payer.example/deliverables/resp-001"

SERVICE_BODY = "Real-time FX rate API. Returns live USD/EUR quotes as JSON on every request."
BAD_EVIDENCE_BODY = "Internal Server Error. Error code 500. No data available."
GOOD_EVIDENCE_BODY = '{"base": "USD", "quote": "EUR", "rate": 0.9137, "ts": "2026-09-04T12:00:00Z"}'

JUDGE_PROMPT_PATTERN = r".*impartial dispute judge.*"


def _mock_bad_deliverable(vm):
    vm.mock_web(r".*provider\.example.*", {"status": 200, "body": SERVICE_BODY})
    vm.mock_web(r".*payer\.example.*", {"status": 200, "body": BAD_EVIDENCE_BODY})
    vm.mock_llm(
        JUDGE_PROMPT_PATTERN,
        json.dumps({"refund": True, "reason_code": "service_unavailable", "confidence": "high"}),
    )


def _mock_fulfilled(vm):
    vm.mock_web(r".*provider\.example.*", {"status": 200, "body": SERVICE_BODY})
    vm.mock_web(r".*payer\.example.*", {"status": 200, "body": GOOD_EVIDENCE_BODY})
    vm.mock_llm(
        JUDGE_PROMPT_PATTERN,
        json.dumps({"refund": False, "reason_code": "fulfilled", "confidence": "high"}),
    )


def _deposit_and_file(vm, contract, payer, provider, dispute_id="d-001", amount=400):
    vm.sender = payer
    contract.deposit(amount=1_000)
    contract.file_dispute(
        dispute_id=dispute_id,
        provider=to_hex(provider),
        service_url=SERVICE_URL,
        evidence_url=EVIDENCE_URL,
        description="API returned an error instead of the paid FX quote",
        amount=amount,
    )


def test_deposit_and_balance(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/recourse.py")
    direct_vm.sender = direct_alice
    contract.deposit(amount=1_000)

    b = contract.get_balance(to_hex(direct_alice))
    assert b["available"] == 1_000
    assert b["locked"] == 0


def test_withdraw(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/recourse.py")
    direct_vm.sender = direct_alice
    contract.deposit(amount=1_000)
    contract.withdraw(amount=300)

    assert contract.get_balance(to_hex(direct_alice))["available"] == 700

    with direct_vm.expect_revert("Insufficient balance"):
        contract.withdraw(amount=10_000)


def test_file_locks_amount(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/recourse.py")
    _deposit_and_file(direct_vm, contract, direct_alice, direct_bob)

    b = contract.get_balance(to_hex(direct_alice))
    assert b["available"] == 600
    assert b["locked"] == 400

    d = contract.get_dispute("d-001")
    assert d["status"] == "filed"
    assert d["seq"] == 1
    assert d["amount"] == 400


def test_file_requires_deposit(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/recourse.py")
    direct_vm.sender = direct_alice

    with direct_vm.expect_revert("Insufficient balance, deposit first"):
        contract.file_dispute(
            dispute_id="d-001",
            provider=to_hex(direct_bob),
            service_url=SERVICE_URL,
            evidence_url=EVIDENCE_URL,
            description="claim",
            amount=400,
        )


def test_file_requires_positive_amount(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/recourse.py")
    direct_vm.sender = direct_alice
    contract.deposit(amount=1_000)

    with direct_vm.expect_revert("Amount must be positive"):
        contract.file_dispute(
            dispute_id="d-001",
            provider=to_hex(direct_bob),
            service_url=SERVICE_URL,
            evidence_url=EVIDENCE_URL,
            description="claim",
            amount=0,
        )


def test_duplicate_dispute_id_fails(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/recourse.py")
    _deposit_and_file(direct_vm, contract, direct_alice, direct_bob)

    with direct_vm.expect_revert("Dispute id already exists"):
        _deposit_and_file(direct_vm, contract, direct_alice, direct_bob, dispute_id="d-001", amount=100)


def test_adjudicate_and_settle_refund_returns_funds(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/recourse.py")
    _deposit_and_file(direct_vm, contract, direct_alice, direct_bob)

    _mock_bad_deliverable(direct_vm)
    contract.adjudicate("d-001")

    d = contract.get_dispute("d-001")
    assert d["status"] == "adjudicated"
    assert d["refund"] is True
    assert d["verdict_code"] == "service_unavailable"

    contract.settle("d-001")

    d = contract.get_dispute("d-001")
    assert d["status"] == "settled"

    b = contract.get_balance(to_hex(direct_alice))
    assert b["available"] == 1_000
    assert b["locked"] == 0


def test_settle_deny_releases_to_provider(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/recourse.py")
    _deposit_and_file(direct_vm, contract, direct_alice, direct_bob, dispute_id="d-002")

    _mock_fulfilled(direct_vm)
    contract.adjudicate("d-002")

    d = contract.get_dispute("d-002")
    assert d["refund"] is False
    assert d["verdict_code"] == "fulfilled"

    contract.settle("d-002")

    bob = contract.get_balance(to_hex(direct_bob))
    assert bob["available"] == 400
    alice = contract.get_balance(to_hex(direct_alice))
    assert alice["locked"] == 0
    assert alice["available"] == 600


def test_double_adjudicate_fails(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/recourse.py")
    _deposit_and_file(direct_vm, contract, direct_alice, direct_bob)

    _mock_bad_deliverable(direct_vm)
    contract.adjudicate("d-001")

    with direct_vm.expect_revert("Dispute already adjudicated"):
        contract.adjudicate("d-001")


def test_double_settle_fails(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/recourse.py")
    _deposit_and_file(direct_vm, contract, direct_alice, direct_bob)

    _mock_bad_deliverable(direct_vm)
    contract.adjudicate("d-001")
    contract.settle("d-001")

    with direct_vm.expect_revert("Dispute not adjudicated"):
        contract.settle("d-001")


def test_stats_and_party_views(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/recourse.py")
    _deposit_and_file(direct_vm, contract, direct_alice, direct_bob, dispute_id="d-001", amount=400)

    _mock_bad_deliverable(direct_vm)
    contract.adjudicate("d-001")
    contract.settle("d-001")

    _deposit_and_file(direct_vm, contract, direct_alice, direct_bob, dispute_id="d-002", amount=100)

    stats = contract.get_stats()
    assert stats["disputes"] == 2
    assert stats["filed"] == 1
    assert stats["settled"] == 1
    assert stats["refunded"] == 1
    assert stats["total_disputed"] == 500
    assert stats["total_refunded"] == 400

    mine = contract.get_disputes_by_party(to_hex(direct_bob))
    assert len(mine) == 2
