from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Dispute, DisputeStatus, Job, JobStatus, Milestone, MilestoneStatus
from tests.conftest import (
    CLIENT_WALLET,
    CONTRACT_ADDRESS,
    FREELANCER_WALLET,
    OTHER_CLIENT_WALLET,
    TOKEN_ADDRESS,
)


def test_reputation_refresh_calculates_public_snapshot(
    client: TestClient,
    db_session: Session,
) -> None:
    direct_job = _create_job(db_session, 920001, CLIENT_WALLET, JobStatus.completed, 1_000_000_000)
    disputed_job = _create_job(db_session, 920002, CLIENT_WALLET, JobStatus.resolved, 500_000_000)
    repeat_job = _create_job(db_session, 920003, CLIENT_WALLET, JobStatus.completed, 250_000_000)
    other_job = _create_job(db_session, 920004, OTHER_CLIENT_WALLET, JobStatus.funded, 0)

    _create_milestone(db_session, direct_job, 0, MilestoneStatus.released)
    disputed_milestone = _create_milestone(db_session, disputed_job, 0, MilestoneStatus.resolved)
    _create_milestone(db_session, repeat_job, 0, MilestoneStatus.released)
    _create_milestone(db_session, other_job, 0, MilestoneStatus.submitted)
    db_session.flush()
    db_session.add(
        Dispute(
            job_id=disputed_job.id,
            milestone_id=disputed_milestone.id,
            onchain_dispute_id=Decimal(1),
            opened_by_wallet=CLIENT_WALLET,
            arbitrator_wallet="0x00000000000000000000000000000000000000ff",
            freelancer_share_bps=5000,
            status=DisputeStatus.resolved,
        )
    )
    db_session.flush()

    response = client.post(f"/reputation/{FREELANCER_WALLET}/refresh")
    assert response.status_code == 200
    payload = response.json()
    assert "verified_volume_raw" not in payload
    assert payload["completed_jobs"] == 3
    assert payload["verified_volume_tier"] == "1k_10k"
    assert payload["direct_approval_rate_bps"] == 6666
    assert payload["dispute_rate_bps"] == 3333
    assert payload["repeat_client_count"] == 1

    get_response = client.get(f"/reputation/{FREELANCER_WALLET}")
    assert get_response.status_code == 200
    assert get_response.json() == payload


def test_reputation_rejects_invalid_wallet(client: TestClient) -> None:
    assert client.get("/reputation/not-a-wallet").status_code == 422
    assert client.post("/reputation/not-a-wallet/refresh").status_code == 422


def _create_job(
    db_session: Session,
    onchain_job_id: int,
    client_wallet: str,
    status: JobStatus,
    released_amount_raw: int,
) -> Job:
    job = Job(
        chain_id=31337,
        contract_address=CONTRACT_ADDRESS,
        onchain_job_id=Decimal(onchain_job_id),
        client_wallet=client_wallet,
        freelancer_wallet=FREELANCER_WALLET,
        token_address=TOKEN_ADDRESS,
        title=f"Reputation test {onchain_job_id}",
        total_amount_raw=Decimal(1_000_000_000),
        released_amount_raw=Decimal(released_amount_raw),
        status=status,
    )
    db_session.add(job)
    db_session.flush()
    return job


def _create_milestone(
    db_session: Session,
    job: Job,
    sequence: int,
    status: MilestoneStatus,
) -> Milestone:
    milestone = Milestone(
        job_id=job.id,
        onchain_milestone_id=Decimal(sequence + 1),
        sequence=sequence,
        title=f"Milestone {sequence}",
        amount_raw=Decimal(1_000_000_000),
        status=status,
    )
    db_session.add(milestone)
    db_session.flush()
    return milestone
