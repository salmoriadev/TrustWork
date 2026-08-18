import hashlib
from collections.abc import Callable
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Job, JobStatus, Milestone, MilestoneStatus
from tests.conftest import (
    CLIENT_WALLET,
    CONTRACT_ADDRESS,
    FREELANCER_WALLET,
    TOKEN_ADDRESS,
)


def test_user_swipe_match_and_evidence_flow(
    client: TestClient,
    persisted_job,
    auth_headers: Callable[..., dict[str, str]],
) -> None:
    headers = auth_headers()
    profile_response = client.put(
        f"/users/{CLIENT_WALLET}",
        json={
            "display_name": "Client Tester",
            "role_preference": "client",
            "profile_visibility": "public",
        },
        headers=headers,
    )
    assert profile_response.status_code == 200
    assert profile_response.json()["wallet_address"] == CLIENT_WALLET

    swipe_response = client.post(
        "/swipes",
        json={
            "target_type": "job",
            "target_id": str(persisted_job.id),
            "direction": "right",
            "context": {"source": "pytest"},
        },
        headers=headers,
    )
    assert swipe_response.status_code == 200

    matches_response = client.get(f"/matches/{CLIENT_WALLET}", headers=headers)
    assert matches_response.status_code == 200
    matches = matches_response.json()
    assert len(matches) == 1
    assert matches[0]["job"]["id"] == str(persisted_job.id)

    body = b"Private delivery note"
    digest = "0x" + hashlib.sha256(body).hexdigest()
    evidence_response = client.post(
        "/evidence",
        json={
            "job_id": str(persisted_job.id),
            "digest": digest,
            "file_name": "delivery.txt",
            "content_type": "text/plain",
            "size_bytes": len(body),
        },
        headers=headers,
    )
    assert evidence_response.status_code == 200
    evidence = evidence_response.json()
    assert evidence["sha256_hash"] == digest
    assert evidence["file_name"] == "delivery.txt"

    list_response = client.get(f"/jobs/{persisted_job.id}/evidence")
    assert list_response.status_code == 200
    assert [item["id"] for item in list_response.json()] == [evidence["id"]]


def test_rejects_invalid_wallet_for_user_update(
    client: TestClient, auth_headers: Callable[..., dict[str, str]]
) -> None:
    response = client.put(
        "/users/not-a-wallet",
        json={"display_name": "Bad", "role_preference": "both", "profile_visibility": "public"},
        headers=auth_headers(),
    )
    assert response.status_code == 422


def test_evidence_reference_must_belong_to_the_selected_job(
    client: TestClient,
    persisted_job,
    db_session: Session,
    auth_headers: Callable[..., dict[str, str]],
) -> None:
    other_job = Job(
        chain_id=31337,
        contract_address=CONTRACT_ADDRESS,
        onchain_job_id=Decimal(910002),
        client_wallet=CLIENT_WALLET,
        freelancer_wallet=FREELANCER_WALLET,
        token_address=TOKEN_ADDRESS,
        total_amount_raw=Decimal(1_000_000),
        released_amount_raw=Decimal(0),
        status=JobStatus.funded,
    )
    db_session.add(other_job)
    db_session.flush()
    other_milestone = Milestone(
        job_id=other_job.id,
        onchain_milestone_id=Decimal(1),
        sequence=0,
        amount_raw=Decimal(1_000_000),
        status=MilestoneStatus.pending,
    )
    db_session.add(other_milestone)
    db_session.flush()

    response = client.post(
        "/evidence",
        json={
            "job_id": str(persisted_job.id),
            "milestone_id": str(other_milestone.id),
            "digest": "0x" + "2" * 64,
            "file_name": "proof.txt",
            "content_type": "text/plain",
            "size_bytes": 5,
        },
        headers=auth_headers(),
    )
    assert response.status_code == 404


def test_prepare_job_preserves_uint256_string(
    client: TestClient, auth_headers: Callable[..., dict[str, str]]
) -> None:
    job_id = "18446744073709551617"
    response = client.post(
        "/jobs/prepare",
        json={
            "freelancer_wallet": "0x00000000000000000000000000000000000000bb",
            "milestone_amounts_raw": ["1200000001", "800000000"],
            "job_id": job_id,
        },
        headers=auth_headers(),
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["job_id"] == job_id
    assert payload["milestone_amounts_raw"] == ["1200000001", "800000000"]
    assert payload["total_amount_raw"] == "2000000001"


def test_prepare_job_rejects_non_decimal_uint256(
    client: TestClient, auth_headers: Callable[..., dict[str, str]]
) -> None:
    response = client.post(
        "/jobs/prepare",
        json={
            "freelancer_wallet": "0x00000000000000000000000000000000000000bb",
            "milestone_amounts_raw": ["1.5"],
        },
        headers=auth_headers(),
    )

    assert response.status_code == 422


def test_prepare_job_rejects_uint256_overflow(
    client: TestClient, auth_headers: Callable[..., dict[str, str]]
) -> None:
    response = client.post(
        "/jobs/prepare",
        json={
            "freelancer_wallet": "0x00000000000000000000000000000000000000bb",
            "milestone_amounts_raw": ["1"],
            "job_id": str(2**256),
        },
        headers=auth_headers(),
    )

    assert response.status_code == 422


def test_prepare_job_rejects_zero_job_id(
    client: TestClient, auth_headers: Callable[..., dict[str, str]]
) -> None:
    response = client.post(
        "/jobs/prepare",
        json={
            "freelancer_wallet": "0x00000000000000000000000000000000000000bb",
            "milestone_amounts_raw": ["1"],
            "job_id": "0",
        },
        headers=auth_headers(),
    )

    assert response.status_code == 422
