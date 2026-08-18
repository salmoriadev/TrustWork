from collections.abc import Callable
from datetime import timedelta

from eth_account import Account
from eth_account.messages import encode_defunct
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import SwipeAction
from tests.conftest import CLIENT_PRIVATE_KEY, CLIENT_WALLET, OTHER_CLIENT_WALLET


def test_siwe_challenge_verification_and_nonce_replay(client: TestClient) -> None:
    origin = {"Origin": settings.siwe_origin}
    challenge_response = client.post(
        "/auth/challenge",
        json={"wallet_address": CLIENT_WALLET, "chain_id": settings.chain_id},
        headers=origin,
    )
    assert challenge_response.status_code == 200
    challenge = challenge_response.json()
    signature = (
        "0x"
        + Account.sign_message(
            encode_defunct(text=challenge["message"]), private_key=CLIENT_PRIVATE_KEY
        ).signature.hex()
    )

    verified = client.post(
        "/auth/verify",
        json={"message": challenge["message"], "signature": signature},
        headers=origin,
    )
    assert verified.status_code == 200
    assert verified.json()["wallet_address"] == CLIENT_WALLET
    assert verified.json()["access_token"]

    replay = client.post(
        "/auth/verify",
        json={"message": challenge["message"], "signature": signature},
        headers=origin,
    )
    assert replay.status_code == 401


def test_siwe_rejects_wrong_origin_and_chain(client: TestClient) -> None:
    wrong_origin = client.post(
        "/auth/challenge",
        json={"wallet_address": CLIENT_WALLET, "chain_id": settings.chain_id},
        headers={"Origin": "https://attacker.example"},
    )
    assert wrong_origin.status_code == 403

    missing_origin = client.post(
        "/auth/challenge",
        json={"wallet_address": CLIENT_WALLET, "chain_id": settings.chain_id},
    )
    assert missing_origin.status_code == 403

    wrong_chain = client.post(
        "/auth/challenge",
        json={"wallet_address": CLIENT_WALLET, "chain_id": 1},
        headers={"Origin": settings.siwe_origin},
    )
    assert wrong_chain.status_code == 422


def test_expired_bearer_token_is_rejected(
    client: TestClient,
    auth_headers: Callable[..., dict[str, str]],
) -> None:
    response = client.put(
        f"/users/{CLIENT_WALLET}",
        json={"display_name": "Expired", "role_preference": "both"},
        headers=auth_headers(CLIENT_WALLET, timedelta(seconds=-1)),
    )
    assert response.status_code == 401


def test_mutation_actor_is_derived_from_token(
    client: TestClient,
    persisted_job,
    db_session: Session,
    auth_headers: Callable[..., dict[str, str]],
) -> None:
    response = client.post(
        "/swipes",
        json={
            "target_type": "job",
            "target_id": str(persisted_job.id),
            "direction": "right",
            "context": {"claimed_actor": OTHER_CLIENT_WALLET},
        },
        headers=auth_headers(CLIENT_WALLET),
    )
    assert response.status_code == 200
    swipe = db_session.execute(select(SwipeAction)).scalar_one()
    assert swipe.actor_wallet == CLIENT_WALLET

    mismatch = client.put(
        f"/users/{OTHER_CLIENT_WALLET}",
        json={"display_name": "Nope", "role_preference": "both"},
        headers=auth_headers(CLIENT_WALLET),
    )
    assert mismatch.status_code == 403


def test_evidence_endpoint_rejects_content_and_claimed_uploader(
    client: TestClient,
    persisted_job,
    auth_headers: Callable[..., dict[str, str]],
) -> None:
    response = client.post(
        "/evidence",
        json={
            "job_id": str(persisted_job.id),
            "digest": "0x" + "1" * 64,
            "file_name": "delivery.txt",
            "content_type": "text/plain",
            "size_bytes": 4,
            "body": "must never cross the boundary",
            "uploader_wallet": OTHER_CLIENT_WALLET,
        },
        headers=auth_headers(CLIENT_WALLET),
    )
    assert response.status_code == 422
