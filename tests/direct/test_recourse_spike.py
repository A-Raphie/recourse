"""Direct tests for Recourse v3: staking, graduated refunds, slashing."""

import json

from tests.direct.conftest import to_hex

SERVICE_URL = "https://provider.example/api/fx-rates"
EVIDENCE_URL = "https://payer.example/deliverables/resp-001"

SERVICE_BODY = "Real-time FX rate API. Returns live USD/EUR quotes as JSON on every request."
BAD_EVIDENCE_BODY = "Internal Server Error. Error code 500. No data available."
PARTIAL_EVIDENCE_BODY = '{"records": [600 of 1000 requested rows], "status": "truncated"}'
GOOD_EVIDENCE_BODY = '{"base": "USD", "quote": "EUR", "rate": 0.9137, "ts": "2026-09-04T12:00:00Z"}'

JUDGE_PROMPT_PATTERN = r".*impartial dispute judge.*"


def _mock(vm, pct: int, code: str, evidence: str):
    vm.mock_web(r".*provider\.example.*", {"status": 200, "body": SERVICE_BODY})
    vm.mock_web(r".*payer\.example.*", {"status": 200, "body": evidence})
    vm.mock_llm(
        JUDGE_PROMPT_PATTERN,
        json.dumps({"refund_pct": pct, "reason_code": code, "confidence": "high"}),
    )


def _mock_total_failure(vm):
    _mock(vm, 100, "service_unavailable", BAD_EVIDENCE_BODY)


def _mock_partial(vm):
    _mock(vm, 40, "not_as_promised", PARTIAL_EVIDENCE_BODY)


def _mock_fulfilled(vm):
    _mock(vm, 0, "fulfilled", GOOD_EVIDENCE_BODY)


def _deposit_and_file(vm, contract, payer, provider, dispute_id="d-001", amount=400, deposit=2_000):
    vm.sender = payer
    contract.deposit(amount=deposit)
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


def test_file_locks_amount_plus_stake(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/recourse.py")
    _deposit_and_file(direct_vm, contract, direct_alice, direct_bob, deposit=1_000)

    b = contract.get_balance(to_hex(direct_alice))
    assert b["available"] == 1_000 - 400 - 100
    assert b["locked"] == 500

    d = contract.get_dispute("d-001")
    assert d["status"] == "filed"
    assert d["stake"] == 100
    assert d["amount"] == 400


def test_file_requires_amount_plus_stake(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/recourse.py")
    direct_vm.sender = direct_alice
    contract.deposit(amount=450)

    with direct_vm.expect_revert("Insufficient balance, deposit amount plus stake"):
        contract.file_dispute(
            dispute_id="d-001",
            provider=to_hex(direct_bob),
            service_url=SERVICE_URL,
            evidence_url=EVIDENCE_URL,
            description="claim",
            amount=400,
        )


def test_duplicate_dispute_id_fails(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/recourse.py")
    _deposit_and_file(direct_vm, contract, direct_alice, direct_bob)

    with direct_vm.expect_revert("Dispute id already exists"):
        _deposit_and_file(direct_vm, contract, direct_alice, direct_bob, dispute_id="d-001", amount=100)


def test_full_refund_returns_amount_and_stake(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/recourse.py")
    _deposit_and_file(direct_vm, contract, direct_alice, direct_bob, dispute_id="d-full", deposit=1_000)

    _mock_total_failure(direct_vm)
    contract.adjudicate("d-full")

    d = contract.get_dispute("d-full")
    assert d["status"] == "adjudicated"
    assert d["refund_pct"] == 100
    assert d["verdict_code"] == "service_unavailable"

    contract.settle("d-full")

    d = contract.get_dispute("d-full")
    assert d["status"] == "settled"

    b = contract.get_balance(to_hex(direct_alice))
    assert b["available"] == 1_000
    assert b["locked"] == 0

    stats = contract.get_stats()
    assert stats["validator_pool"] == 0


def test_partial_refund_splits_escrow(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/recourse.py")
    _deposit_and_file(direct_vm, contract, direct_alice, direct_bob, dispute_id="d-part", amount=400, deposit=1_000)

    _mock_partial(direct_vm)
    contract.adjudicate("d-part")

    d = contract.get_dispute("d-part")
    assert d["refund_pct"] == 40
    assert d["verdict_code"] == "not_as_promised"

    contract.settle("d-part")

    alice = contract.get_balance(to_hex(direct_alice))
    assert alice["available"] == 500 + 160 + 100
    assert alice["locked"] == 0

    bob = contract.get_balance(to_hex(direct_bob))
    assert bob["available"] == 240


def test_dismissed_dispute_slashes_stake_to_pool(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/recourse.py")
    _deposit_and_file(direct_vm, contract, direct_alice, direct_bob, dispute_id="d-deny", deposit=1_000)

    _mock_fulfilled(direct_vm)
    contract.adjudicate("d-deny")

    d = contract.get_dispute("d-deny")
    assert d["refund_pct"] == 0
    assert d["verdict_code"] == "fulfilled"

    contract.settle("d-deny")

    bob = contract.get_balance(to_hex(direct_bob))
    assert bob["available"] == 400

    alice = contract.get_balance(to_hex(direct_alice))
    assert alice["available"] == 1_000 - 500

    stats = contract.get_stats()
    assert stats["validator_pool"] == 100


def test_out_of_range_pct_reverts(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/recourse.py")
    _deposit_and_file(direct_vm, contract, direct_alice, direct_bob, dispute_id="d-bad")

    direct_vm.mock_web(r".*provider\.example.*", {"status": 200, "body": SERVICE_BODY})
    direct_vm.mock_web(r".*payer\.example.*", {"status": 200, "body": BAD_EVIDENCE_BODY})
    direct_vm.mock_llm(
        JUDGE_PROMPT_PATTERN,
        json.dumps({"refund_pct": 150, "reason_code": "service_unavailable", "confidence": "high"}),
    )

    with direct_vm.expect_revert("Refund percent out of range"):
        contract.adjudicate("d-bad")


def test_double_adjudicate_and_settle_fail(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/recourse.py")
    _deposit_and_file(direct_vm, contract, direct_alice, direct_bob)

    _mock_total_failure(direct_vm)
    contract.adjudicate("d-001")

    with direct_vm.expect_revert("Dispute already adjudicated"):
        contract.adjudicate("d-001")

    contract.settle("d-001")
    with direct_vm.expect_revert("Dispute not adjudicated"):
        contract.settle("d-001")


def test_stats_and_party_views(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/recourse.py")
    _deposit_and_file(direct_vm, contract, direct_alice, direct_bob, dispute_id="d-001", amount=400, deposit=1_000)

    _mock_total_failure(direct_vm)
    contract.adjudicate("d-001")
    contract.settle("d-001")

    _deposit_and_file(direct_vm, contract, direct_alice, direct_bob, dispute_id="d-002", amount=100, deposit=1_000)

    stats = contract.get_stats()
    assert stats["disputes"] == 2
    assert stats["filed"] == 1
    assert stats["settled"] == 1
    assert stats["refunded"] == 1
    assert stats["total_disputed"] == 500
    assert stats["total_refunded"] == 400

    mine = contract.get_disputes_by_party(to_hex(direct_bob))
    assert len(mine) == 2
