"""One-off diagnostic: dump the raw adjudicate receipt from hosted Studio.

Run with: gltest tests/integration/diagnose_adjudicate.py -v -s
"""

import json

import pytest
from gltest import get_contract_factory, get_default_account

MANIFEST_URL = (
    "https://raw.githubusercontent.com/A-Raphie/recourse/master/"
    "evidence/service-manifest.txt"
)
DELIVERABLE_URL = (
    "https://raw.githubusercontent.com/A-Raphie/recourse/master/"
    "evidence/deliverable-error.txt"
)


@pytest.mark.integration
def test_dump_adjudicate_receipt():
    factory = get_contract_factory("Recourse")
    contract = factory.deploy()
    print("CONTRACT:", contract.address)

    payer = str(get_default_account().address)
    contract.file_dispute(
        args=[
            "diag-001",
            payer,
            MANIFEST_URL,
            DELIVERABLE_URL,
            "Paid for a live FX quote, the deliverable endpoint returned a 500 error",
            1_000,
        ]
    ).transact()
    print("FILED:", json.dumps(contract.get_dispute(args=["diag-001"]).call(), default=str))

    receipt = contract.adjudicate(args=["diag-001"]).transact()
    print("=== RECEIPT KEYS:", list(receipt.keys()))
    cd = receipt.get("consensus_data", {})
    print("=== CONSENSUS KEYS:", list(cd.keys()))
    lr = cd.get("leader_receipt", [])
    print("=== LEADER RECEIPT:", json.dumps(lr, indent=1, default=str)[:3000])
    validators = cd.get("validators", cd.get("validation", []))
    print("=== VALIDATORS:", json.dumps(validators, default=str)[:1500])

    print("AFTER:", json.dumps(contract.get_dispute(args=["diag-001"]).call(), default=str))
