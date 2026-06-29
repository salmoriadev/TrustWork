import hashlib
from decimal import Decimal
from time import time_ns

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.db.session import get_db
from app.models import (
    Dispute,
    EvidenceFile,
    Job,
    Milestone,
    SwipeAction,
    User,
    UserReputationSnapshot,
)
from app.schemas import (
    DisputeRead,
    EscrowConfigRead,
    EvidenceCreateRequest,
    EvidenceRead,
    IndexerPollRead,
    JobPrepareRead,
    JobPrepareRequest,
    JobRead,
    MatchRead,
    ReputationRead,
    SwipeCreateRequest,
    SwipeRead,
    UserRead,
    UserUpsertRequest,
)
from app.services.event_indexer import EscrowEventIndexer
from app.services.reputation import refresh_all_reputation_snapshots, refresh_reputation_snapshot

router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/escrow/config", response_model=EscrowConfigRead)
def escrow_config() -> EscrowConfigRead:
    return EscrowConfigRead(
        chain_id=settings.chain_id,
        escrow_contract_address=settings.escrow_contract_address,
        usdc_contract_address=settings.usdc_contract_address,
        escrow_arbitrator=settings.escrow_arbitrator,
    )


@router.get("/users/{wallet_address}", response_model=UserRead)
def get_user(wallet_address: str, db: Session = Depends(get_db)) -> User:
    user = db.execute(
        select(User).where(User.wallet_address == wallet_address.lower())
    ).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/users/{wallet_address}", response_model=UserRead)
def upsert_user(
    wallet_address: str,
    payload: UserUpsertRequest,
    db: Session = Depends(get_db),
) -> User:
    if not _looks_like_address(wallet_address):
        raise HTTPException(status_code=422, detail="Invalid wallet")

    wallet = wallet_address.lower()
    user = db.execute(select(User).where(User.wallet_address == wallet)).scalar_one_or_none()
    if user is None:
        user = User(wallet_address=wallet)
        db.add(user)

    user.display_name = payload.display_name
    user.role_preference = payload.role_preference
    user.profile_visibility = payload.profile_visibility
    db.commit()
    db.refresh(user)
    return user


@router.post("/jobs/prepare", response_model=JobPrepareRead)
def prepare_job(payload: JobPrepareRequest) -> JobPrepareRead:
    if not _looks_like_address(payload.freelancer_wallet):
        raise HTTPException(status_code=422, detail="Invalid freelancer wallet")
    if any(amount <= 0 for amount in payload.milestone_amounts_raw):
        raise HTTPException(status_code=422, detail="Milestone amounts must be positive")

    job_id = payload.job_id or time_ns()
    return JobPrepareRead(
        chain_id=settings.chain_id,
        escrow_contract_address=settings.escrow_contract_address,
        usdc_contract_address=settings.usdc_contract_address,
        job_id=job_id,
        freelancer_wallet=payload.freelancer_wallet.lower(),
        milestone_amounts_raw=payload.milestone_amounts_raw,
        total_amount_raw=sum(payload.milestone_amounts_raw),
    )


@router.post("/indexer/poll", response_model=IndexerPollRead)
def poll_indexer() -> IndexerPollRead:
    indexer = EscrowEventIndexer()
    latest_block = indexer.web3.eth.block_number
    indexer.poll_range(settings.indexer_start_block, latest_block)
    return IndexerPollRead(latest_block=latest_block)


@router.post("/swipes", response_model=SwipeRead)
def create_swipe(payload: SwipeCreateRequest, db: Session = Depends(get_db)) -> SwipeAction:
    if not _looks_like_address(payload.actor_wallet):
        raise HTTPException(status_code=422, detail="Invalid actor wallet")

    if payload.target_type == "job" and db.get(Job, payload.target_id) is None:
        raise HTTPException(status_code=404, detail="Target job not found")

    swipe = SwipeAction(
        actor_wallet=payload.actor_wallet.lower(),
        target_type=payload.target_type,
        target_id=payload.target_id,
        direction=payload.direction,
        context=payload.context,
    )
    db.add(swipe)
    db.commit()
    db.refresh(swipe)
    return swipe


@router.get("/matches/{wallet_address}", response_model=list[MatchRead])
def list_matches(wallet_address: str, db: Session = Depends(get_db)) -> list[MatchRead]:
    wallet = wallet_address.lower()
    stmt = (
        select(SwipeAction, Job)
        .join(Job, Job.id == SwipeAction.target_id)
        .options(selectinload(Job.milestones))
        .where(
            SwipeAction.actor_wallet == wallet,
            SwipeAction.target_type == "job",
            SwipeAction.direction.in_(["right", "super"]),
        )
        .order_by(SwipeAction.created_at.desc())
        .limit(25)
    )
    return [MatchRead(swipe=swipe, job=job) for swipe, job in db.execute(stmt).all()]


@router.post("/evidence", response_model=EvidenceRead)
def create_evidence(
    payload: EvidenceCreateRequest,
    db: Session = Depends(get_db),
) -> EvidenceFile:
    if not _looks_like_address(payload.uploader_wallet):
        raise HTTPException(status_code=422, detail="Invalid uploader wallet")
    if db.get(Job, payload.job_id) is None:
        raise HTTPException(status_code=404, detail="Job not found")
    if payload.milestone_id and db.get(Milestone, payload.milestone_id) is None:
        raise HTTPException(status_code=404, detail="Milestone not found")
    if payload.dispute_id and db.get(Dispute, payload.dispute_id) is None:
        raise HTTPException(status_code=404, detail="Dispute not found")

    body_bytes = payload.body.encode("utf-8")
    sha256_hash = hashlib.sha256(body_bytes).hexdigest()
    safe_name = payload.file_name.replace("/", "_").replace("\\", "_")
    evidence = EvidenceFile(
        job_id=payload.job_id,
        milestone_id=payload.milestone_id,
        dispute_id=payload.dispute_id,
        uploader_wallet=payload.uploader_wallet.lower(),
        storage_uri=f"local://evidence/{sha256_hash}/{safe_name}",
        sha256_hash=sha256_hash,
        content_type=payload.content_type,
        size_bytes=len(body_bytes),
        visibility=payload.visibility,
    )
    db.add(evidence)
    db.commit()
    db.refresh(evidence)
    return evidence


@router.get("/jobs/{job_id}/evidence", response_model=list[EvidenceRead])
def list_job_evidence(job_id: str, db: Session = Depends(get_db)) -> list[EvidenceFile]:
    job_uuid = _uuid_or_404(job_id, "Invalid job id")
    stmt = (
        select(EvidenceFile)
        .where(EvidenceFile.job_id == job_uuid)
        .order_by(EvidenceFile.created_at.desc())
    )
    return list(db.execute(stmt).scalars().all())


@router.get("/disputes", response_model=list[DisputeRead])
def list_disputes(db: Session = Depends(get_db)) -> list[Dispute]:
    stmt = select(Dispute).order_by(Dispute.opened_at.desc()).limit(50)
    return list(db.execute(stmt).scalars().all())


@router.get("/disputes/{dispute_id}/evidence", response_model=list[EvidenceRead])
def list_dispute_evidence(dispute_id: str, db: Session = Depends(get_db)) -> list[EvidenceFile]:
    dispute_uuid = _uuid_or_404(dispute_id, "Invalid dispute id")
    stmt = (
        select(EvidenceFile)
        .where(EvidenceFile.dispute_id == dispute_uuid)
        .order_by(EvidenceFile.created_at.desc())
    )
    return list(db.execute(stmt).scalars().all())


@router.get("/jobs", response_model=list[JobRead])
def list_jobs(db: Session = Depends(get_db)) -> list[Job]:
    stmt = (
        select(Job)
        .options(selectinload(Job.milestones))
        .order_by(Job.created_at.desc())
        .limit(25)
    )
    return list(db.execute(stmt).scalars().all())


@router.get("/jobs/{onchain_job_id}", response_model=JobRead)
def get_job(onchain_job_id: int, db: Session = Depends(get_db)) -> Job:
    stmt = (
        select(Job)
        .options(selectinload(Job.milestones))
        .where(Job.onchain_job_id == Decimal(onchain_job_id))
    )
    job = db.execute(stmt).scalar_one_or_none()
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/reputation/{wallet_address}", response_model=ReputationRead)
def get_reputation(wallet_address: str, db: Session = Depends(get_db)) -> ReputationRead:
    if not _looks_like_address(wallet_address):
        raise HTTPException(status_code=422, detail="Invalid wallet")
    wallet = wallet_address.lower()
    snapshot = db.get(UserReputationSnapshot, wallet)
    if snapshot is None:
        return ReputationRead(
            wallet_address=wallet,
            completed_jobs=0,
            verified_volume_tier="new",
            direct_approval_rate_bps=0,
            dispute_rate_bps=0,
            repeat_client_count=0,
        )
    return ReputationRead(
        wallet_address=snapshot.wallet_address,
        completed_jobs=snapshot.completed_jobs,
        verified_volume_tier=snapshot.verified_volume_tier,
        direct_approval_rate_bps=snapshot.direct_approval_rate_bps,
        dispute_rate_bps=snapshot.dispute_rate_bps,
        repeat_client_count=snapshot.repeat_client_count,
        updated_at=snapshot.updated_at,
    )


@router.post("/reputation/{wallet_address}/refresh", response_model=ReputationRead)
def refresh_reputation(wallet_address: str, db: Session = Depends(get_db)) -> ReputationRead:
    if not _looks_like_address(wallet_address):
        raise HTTPException(status_code=422, detail="Invalid wallet")
    snapshot = refresh_reputation_snapshot(db, wallet_address)
    return ReputationRead(
        wallet_address=snapshot.wallet_address,
        completed_jobs=snapshot.completed_jobs,
        verified_volume_tier=snapshot.verified_volume_tier,
        direct_approval_rate_bps=snapshot.direct_approval_rate_bps,
        dispute_rate_bps=snapshot.dispute_rate_bps,
        repeat_client_count=snapshot.repeat_client_count,
        updated_at=snapshot.updated_at,
    )


@router.post("/reputation/refresh-all", response_model=list[ReputationRead])
def refresh_all_reputations(db: Session = Depends(get_db)) -> list[ReputationRead]:
    snapshots = refresh_all_reputation_snapshots(db)
    return [
        ReputationRead(
            wallet_address=snapshot.wallet_address,
            completed_jobs=snapshot.completed_jobs,
            verified_volume_tier=snapshot.verified_volume_tier,
            direct_approval_rate_bps=snapshot.direct_approval_rate_bps,
            dispute_rate_bps=snapshot.dispute_rate_bps,
            repeat_client_count=snapshot.repeat_client_count,
            updated_at=snapshot.updated_at,
        )
        for snapshot in snapshots
    ]


def _looks_like_address(value: str) -> bool:
    return value.startswith("0x") and len(value) == 42


def _uuid_or_404(value: str, detail: str):
    try:
        from uuid import UUID

        return UUID(value)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=detail) from exc
