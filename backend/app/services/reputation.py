from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import Job, JobStatus, MilestoneStatus, UserReputationSnapshot


@dataclass(frozen=True)
class ReputationMetrics:
    completed_jobs: int
    verified_volume_raw: Decimal
    verified_volume_tier: str
    direct_approval_rate_bps: int
    dispute_rate_bps: int
    repeat_client_count: int


def volume_tier(amount_raw: Decimal, decimals: int = 6) -> str:
    amount = amount_raw / Decimal(10**decimals)
    if amount >= 100_000:
        return "100k_plus"
    if amount >= 50_000:
        return "50k_100k"
    if amount >= 10_000:
        return "10k_50k"
    if amount >= 1_000:
        return "1k_10k"
    if amount > 0:
        return "under_1k"
    return "new"


def bps(numerator: int, denominator: int) -> int:
    if denominator == 0:
        return 0
    return int((Decimal(numerator) * Decimal(10_000)) / Decimal(denominator))


def build_metrics(
    completed_jobs: int,
    verified_volume_raw: Decimal,
    directly_approved_milestones: int,
    finalized_milestones: int,
    disputed_milestones: int,
    repeat_client_count: int,
) -> ReputationMetrics:
    return ReputationMetrics(
        completed_jobs=completed_jobs,
        verified_volume_raw=verified_volume_raw,
        verified_volume_tier=volume_tier(verified_volume_raw),
        direct_approval_rate_bps=bps(directly_approved_milestones, finalized_milestones),
        dispute_rate_bps=bps(disputed_milestones, finalized_milestones),
        repeat_client_count=repeat_client_count,
    )


def refresh_reputation_snapshot(db: Session, wallet_address: str) -> UserReputationSnapshot:
    wallet = wallet_address.lower()
    metrics = calculate_wallet_metrics(db, wallet)
    snapshot = db.get(UserReputationSnapshot, wallet)
    if snapshot is None:
        snapshot = UserReputationSnapshot(wallet_address=wallet)
        db.add(snapshot)

    snapshot.completed_jobs = metrics.completed_jobs
    snapshot.verified_volume_raw = metrics.verified_volume_raw
    snapshot.verified_volume_tier = metrics.verified_volume_tier
    snapshot.direct_approval_rate_bps = metrics.direct_approval_rate_bps
    snapshot.dispute_rate_bps = metrics.dispute_rate_bps
    snapshot.repeat_client_count = metrics.repeat_client_count
    snapshot.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(snapshot)
    return snapshot


def refresh_all_reputation_snapshots(db: Session) -> list[UserReputationSnapshot]:
    wallets = {
        wallet
        for wallet in db.execute(select(Job.freelancer_wallet).distinct()).scalars().all()
        if wallet
    }
    return [refresh_reputation_snapshot(db, wallet) for wallet in sorted(wallets)]


def calculate_wallet_metrics(db: Session, wallet_address: str) -> ReputationMetrics:
    wallet = wallet_address.lower()
    jobs = list(
        db.execute(
            select(Job)
            .options(selectinload(Job.milestones), selectinload(Job.disputes))
            .where(Job.freelancer_wallet == wallet)
        )
        .scalars()
        .all()
    )

    completed_statuses = {JobStatus.completed, JobStatus.resolved}
    completed_jobs = [job for job in jobs if job.status in completed_statuses]
    finalized_statuses = {MilestoneStatus.released, MilestoneStatus.resolved}
    directly_approved_milestones = 0
    finalized_milestones = 0
    disputed_milestones = 0

    for job in jobs:
        disputed_ids = {dispute.milestone_id for dispute in job.disputes}
        for milestone in job.milestones:
            if milestone.status in finalized_statuses:
                finalized_milestones += 1
            if milestone.status == MilestoneStatus.released and milestone.id not in disputed_ids:
                directly_approved_milestones += 1
            if milestone.status in {MilestoneStatus.disputed, MilestoneStatus.resolved} or (
                milestone.id in disputed_ids
            ):
                disputed_milestones += 1

    client_counts: dict[str, int] = {}
    for job in completed_jobs:
        client_counts[job.client_wallet] = client_counts.get(job.client_wallet, 0) + 1

    return build_metrics(
        completed_jobs=len(completed_jobs),
        verified_volume_raw=sum((job.released_amount_raw for job in completed_jobs), Decimal(0)),
        directly_approved_milestones=directly_approved_milestones,
        finalized_milestones=finalized_milestones,
        disputed_milestones=disputed_milestones,
        repeat_client_count=sum(1 for count in client_counts.values() if count > 1),
    )
