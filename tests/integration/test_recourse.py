"""Recourse v3 integration test on the hosted Studio (real consensus).

Run with: gltest tests/integration/test_recourse.py -v -s

Validators actually render the evidence URLs (this repo's raw fixtures),
judge a graduated refund under consensus, and settle the escrow split.
"""

import pytest
from gltest import get_contract_factory, get_default_account
from gltest.assertions import tx_execution_succeeded

MANIFEST_URL = (
    "https://raw.githubusercontent.com/A-Raphie/recourse/master/"
    "evidence/service-manifest.txt"
)
DELIVERABLE_URL = (
    "https://raw.githubusercontent.com/A-Raphie/recourse/master/"
    "evidence/deliverable-error.txt"
)
DISPUTE_ID = "smoke-d-001"
AMOUNT = 400
STAKE = 100
DEPOSIT = 1_000


@pytest.mark.integration
def deploy_contract():
    factory = get_contract_factory("Recourse")
    contract = factory.deploy()
    assert contract.get_disputes(args=[]).call() == []
    return contract


@pytest.mark.integration
def test_dispute_full_flow():
    contract = deploy_contract()

    payer = str(get_default_account().address)

    deposit_result = contract.deposit(args=[DEPOSIT]).transact()
    assert tx_execution_succeeded(deposit_result)

    file_result = contract.file_dispute(
        args=[
            DISPUTE_ID,
            payer,
            MANIFEST_URL,
            DELIVERABLE_URL,
            "Paid for a live FX quote, the deliverable endpoint returned a 500 error",
            AMOUNT,
        ]
    ).transact()
    assert tx_execution_succeeded(file_result)

    stored = contract.get_dispute(args=[DISPUTE_ID]).call()
    assert stored["status"] == "filed"
    assert stored["payer"].lower() == payer.lower()
    assert stored["amount"] == AMOUNT
    assert stored["stake"] == STAKE
    assert stored["refund_pct"] == 0

    balance = contract.get_balance(args=[payer]).call()
    assert balance["available"] == DEPOSIT - AMOUNT - STAKE
    assert balance["locked"] == AMOUNT + STAKE

    adjudicate_result = contract.adjudicate(args=[DISPUTE_ID]).transact()
    assert tx_execution_succeeded(adjudicate_result)

    judged = contract.get_dispute(args=[DISPUTE_ID]).call()
    assert judged["status"] == "adjudicated"
    assert judged["refund_pct"] in (0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100)
    assert len(judged["verdict_code"]) > 0
    print(
        f"VERDICT: refund_pct={judged['refund_pct']} code={judged['verdict_code']} confidence={judged['confidence']}"
    )

    settle_result = contract.settle(args=[DISPUTE_ID]).transact()
    assert tx_execution_succeeded(settle_result)

    settled = contract.get_dispute(args=[DISPUTE_ID]).call()
    assert settled["status"] == "settled"

    refund_units = AMOUNT * judged["refund_pct"] // 100
    stake_back = STAKE if judged["refund_pct"] > 0 else 0

    balance_after = contract.get_balance(args=[payer]).call()
    assert balance_after["available"] == DEPOSIT - AMOUNT - STAKE + refund_units + stake_back
    assert balance_after["locked"] == 0

    stats = contract.get_stats().call()
    assert stats["disputes"] >= 1
    assert stats["total_disputed"] >= AMOUNT
    print(f"STATS: {stats}")

    disputes = contract.get_disputes(args=[]).call()
    assert len(disputes) >= 1
    assert disputes[0]["id"] == DISPUTE_ID
