"""Recourse integration test on the hosted Studio (real consensus).

Run with: gltest tests/integration/test_recourse.py -v -s

Validators actually render the evidence URLs (this repo's raw fixtures),
judge with a real LLM under eq_principle consensus, and settle on-chain.
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

    deposit_result = contract.deposit(args=[1_000]).transact()
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
    assert stored["refund"] is False

    balance = contract.get_balance(args=[payer]).call()
    assert balance["available"] == 1_000 - AMOUNT
    assert balance["locked"] == AMOUNT

    adjudicate_result = contract.adjudicate(args=[DISPUTE_ID]).transact()
    assert tx_execution_succeeded(adjudicate_result)

    judged = contract.get_dispute(args=[DISPUTE_ID]).call()
    assert judged["status"] == "adjudicated"
    assert isinstance(judged["refund"], bool)
    assert len(judged["verdict_code"]) > 0
    print(f"VERDICT: refund={judged['refund']} code={judged['verdict_code']} confidence={judged['confidence']}")

    settle_result = contract.settle(args=[DISPUTE_ID]).transact()
    assert tx_execution_succeeded(settle_result)

    settled = contract.get_dispute(args=[DISPUTE_ID]).call()
    assert settled["status"] == "settled"

    balance_after = contract.get_balance(args=[payer]).call()
    if judged["refund"]:
        assert balance_after["available"] == 1_000
        assert balance_after["locked"] == 0
    else:
        assert balance_after["available"] == 1_000 - AMOUNT
        assert balance_after["locked"] == 0
        provider_balance = contract.get_balance(args=[payer]).call()
        assert provider_balance is not None

    stats = contract.get_stats().call()
    assert stats["disputes"] >= 1
    assert stats["total_disputed"] >= AMOUNT
    print(f"STATS: {stats}")

    disputes = contract.get_disputes(args=[]).call()
    assert len(disputes) >= 1
    assert disputes[0]["id"] == DISPUTE_ID
