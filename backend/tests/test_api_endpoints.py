import hashlib

from fastapi.testclient import TestClient

from tests.conftest import CLIENT_WALLET


def test_user_swipe_match_and_evidence_flow(client: TestClient, persisted_job) -> None:
    profile_response = client.put(
        f"/users/{CLIENT_WALLET}",
        json={
            "display_name": "Client Tester",
            "role_preference": "client",
            "profile_visibility": "public",
        },
    )
    assert profile_response.status_code == 200
    assert profile_response.json()["wallet_address"] == CLIENT_WALLET

    swipe_response = client.post(
        "/swipes",
        json={
            "actor_wallet": CLIENT_WALLET,
            "target_type": "job",
            "target_id": str(persisted_job.id),
            "direction": "right",
            "context": {"source": "pytest"},
        },
    )
    assert swipe_response.status_code == 200

    matches_response = client.get(f"/matches/{CLIENT_WALLET}")
    assert matches_response.status_code == 200
    matches = matches_response.json()
    assert len(matches) == 1
    assert matches[0]["job"]["id"] == str(persisted_job.id)

    body = "Private delivery note"
    evidence_response = client.post(
        "/evidence",
        json={
            "job_id": str(persisted_job.id),
            "uploader_wallet": CLIENT_WALLET,
            "body": body,
            "file_name": "delivery.txt",
            "visibility": "participants",
        },
    )
    assert evidence_response.status_code == 200
    evidence = evidence_response.json()
    assert evidence["sha256_hash"] == hashlib.sha256(body.encode("utf-8")).hexdigest()
    assert evidence["storage_uri"].endswith("/delivery.txt")

    list_response = client.get(f"/jobs/{persisted_job.id}/evidence")
    assert list_response.status_code == 200
    assert [item["id"] for item in list_response.json()] == [evidence["id"]]


def test_rejects_invalid_wallet_for_user_update(client: TestClient) -> None:
    response = client.put(
        "/users/not-a-wallet",
        json={"display_name": "Bad", "role_preference": "both", "profile_visibility": "public"},
    )
    assert response.status_code == 422


def test_prepare_job_preserves_uint256_string(client: TestClient) -> None:
    job_id = "18446744073709551617"
    response = client.post(
        "/jobs/prepare",
        json={
            "freelancer_wallet": "0x00000000000000000000000000000000000000bb",
            "milestone_amounts_raw": ["1200000001", "800000000"],
            "job_id": job_id,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["job_id"] == job_id
    assert payload["milestone_amounts_raw"] == ["1200000001", "800000000"]
    assert payload["total_amount_raw"] == "2000000001"


def test_prepare_job_rejects_non_decimal_uint256(client: TestClient) -> None:
    response = client.post(
        "/jobs/prepare",
        json={
            "freelancer_wallet": "0x00000000000000000000000000000000000000bb",
            "milestone_amounts_raw": ["1.5"],
        },
    )

    assert response.status_code == 422


def test_prepare_job_rejects_uint256_overflow(client: TestClient) -> None:
    response = client.post(
        "/jobs/prepare",
        json={
            "freelancer_wallet": "0x00000000000000000000000000000000000000bb",
            "milestone_amounts_raw": ["1"],
            "job_id": str(2**256),
        },
    )

    assert response.status_code == 422


def test_prepare_job_rejects_zero_job_id(client: TestClient) -> None:
    response = client.post(
        "/jobs/prepare",
        json={
            "freelancer_wallet": "0x00000000000000000000000000000000000000bb",
            "milestone_amounts_raw": ["1"],
            "job_id": "0",
        },
    )

    assert response.status_code == 422
