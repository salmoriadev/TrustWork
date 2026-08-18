import logging
import secrets
from decimal import Decimal
from time import time_ns
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session, selectinload
from web3 import Web3

from app.core.config import settings
from app.db.session import get_db
from app.models import (
    Dispute,
    EvidenceFile,
    Job,
    JobStatus,
    Milestone,
    MilestoneStatus,
    SwipeAction,
    User,
    UserReputationSnapshot,
)
from app.schemas import (
    AuthChallengeRead,
    AuthChallengeRequest,
    AuthTokenRead,
    AuthVerifyRequest,
    DisputeRead,
    EscrowConfigRead,
    EvidenceCreateRequest,
    EvidenceRead,
    FunnelMetricsRead,
    IndexerPollRead,
    IndexerSyncRequest,
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
from app.services.auth import (
    AuthenticatedWallet,
    authenticated_wallet,
    create_challenge,
    validate_request_origin,
    verify_challenge,
)
from app.services.event_indexer import EscrowEventIndexer
from app.services.reputation import refresh_all_reputation_snapshots, refresh_reputation_snapshot

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/health/live")
def health_live() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/health")
def health_compatibility() -> dict[str, str]:
    return health_live()


@router.get("/health/ready")
def health_ready(db: Session = Depends(get_db)) -> dict[str, str | int]:
    checks: dict[str, str | int] = {"database": "unavailable", "rpc": "unavailable"}
    try:
        db.execute(text("SELECT 1"))
        checks["database"] = "ok"
        EscrowEventIndexer.validate_abi()
        web3 = Web3(Web3.HTTPProvider(settings.rpc_url, request_kwargs={"timeout": 5}))
        rpc_chain_id = web3.eth.chain_id
        if rpc_chain_id != settings.chain_id:
            raise RuntimeError(f"RPC chain ID {rpc_chain_id} does not match {settings.chain_id}")
        code = web3.eth.get_code(Web3.to_checksum_address(settings.escrow_contract_address))
        if not code:
            raise RuntimeError("Configured escrow address has no bytecode")
        checks.update({"rpc": "ok", "chain_id": rpc_chain_id, "bytecode": "ok", "abi": "ok"})
    except Exception as exc:
        logger.warning("Readiness check failed: %s", type(exc).__name__)
        raise HTTPException(status_code=503, detail=checks) from exc
    return {"status": "ready", **checks}


@router.post("/auth/challenge", response_model=AuthChallengeRead)
def auth_challenge(
    payload: AuthChallengeRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> AuthChallengeRead:
    validate_request_origin(request)
    message, nonce, expires_at = create_challenge(db, payload.wallet_address, payload.chain_id)
    return AuthChallengeRead(message=message, nonce=nonce, expires_at=expires_at)


@router.post("/auth/verify", response_model=AuthTokenRead)
def auth_verify(
    payload: AuthVerifyRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> AuthTokenRead:
    validate_request_origin(request)
    token, wallet, expires_at, chain_id = verify_challenge(db, payload.message, payload.signature)
    return AuthTokenRead(
        access_token=token,
        expires_at=expires_at,
        wallet_address=wallet,
        chain_id=chain_id,
    )


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
    actor: Annotated[AuthenticatedWallet, Depends(authenticated_wallet)],
    db: Session = Depends(get_db),
) -> User:
    if not _looks_like_address(wallet_address):
        raise HTTPException(status_code=422, detail="Invalid wallet")

    wallet = wallet_address.lower()
    _enforce_actor(actor, wallet)
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
def prepare_job(
    payload: JobPrepareRequest,
    _actor: Annotated[AuthenticatedWallet, Depends(authenticated_wallet)],
) -> JobPrepareRead:
    if not _looks_like_address(payload.freelancer_wallet):
        raise HTTPException(status_code=422, detail="Invalid freelancer wallet")
    try:
        milestone_amounts = [int(amount) for amount in payload.milestone_amounts_raw]
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="Milestone amounts must be integers") from exc
    if any(amount <= 0 for amount in milestone_amounts):
        raise HTTPException(status_code=422, detail="Milestone amounts must be positive")

    total = sum(milestone_amounts)
    if total > settings.max_job_amount_raw:
        raise HTTPException(
            status_code=422,
            detail=f"Total amount {total} exceeds max job amount {settings.max_job_amount_raw}",
        )

    job_id = payload.job_id if payload.job_id is not None else str(time_ns())
    return JobPrepareRead(
        chain_id=settings.chain_id,
        escrow_contract_address=settings.escrow_contract_address,
        usdc_contract_address=settings.usdc_contract_address,
        job_id=job_id,
        freelancer_wallet=payload.freelancer_wallet.lower(),
        milestone_amounts_raw=[str(amount) for amount in milestone_amounts],
        total_amount_raw=str(total),
    )


@router.post("/indexer/sync", response_model=IndexerPollRead)
def sync_indexer(
    payload: IndexerSyncRequest,
    _actor: Annotated[AuthenticatedWallet, Depends(authenticated_wallet)],
) -> IndexerPollRead:
    indexer = EscrowEventIndexer()
    try:
        indexed_through = indexer.sync_receipt(payload.transaction_hash, payload.receipt_block)
    except (ValueError, KeyError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return IndexerPollRead(
        latest_block=indexer.web3.eth.block_number,
        indexed_through=indexed_through,
    )


@router.post("/indexer/reconcile", response_model=IndexerPollRead)
def reconcile_indexer(
    indexer_token: Annotated[str | None, Header(alias="X-Indexer-Token")] = None,
) -> IndexerPollRead:
    if not indexer_token or not secrets.compare_digest(indexer_token, settings.indexer_token):
        raise HTTPException(status_code=401, detail="Invalid indexer token")
    indexer = EscrowEventIndexer()
    indexed_through = indexer.poll_confirmed()
    return IndexerPollRead(
        latest_block=indexer.web3.eth.block_number,
        indexed_through=indexed_through,
    )


@router.post("/swipes", response_model=SwipeRead)
def create_swipe(
    payload: SwipeCreateRequest,
    actor: Annotated[AuthenticatedWallet, Depends(authenticated_wallet)],
    db: Session = Depends(get_db),
) -> SwipeAction:
    if payload.target_type == "job" and db.get(Job, payload.target_id) is None:
        raise HTTPException(status_code=404, detail="Target job not found")

    swipe = SwipeAction(
        actor_wallet=actor.address,
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
def list_matches(
    wallet_address: str,
    actor: Annotated[AuthenticatedWallet, Depends(authenticated_wallet)],
    db: Session = Depends(get_db),
) -> list[MatchRead]:
    wallet = wallet_address.lower()
    _enforce_actor(actor, wallet)
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
    actor: Annotated[AuthenticatedWallet, Depends(authenticated_wallet)],
    db: Session = Depends(get_db),
) -> EvidenceFile:
    job = db.get(Job, payload.job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    if actor.address not in {job.client_wallet.lower(), job.freelancer_wallet.lower()}:
        raise HTTPException(status_code=403, detail="Only job participants can register evidence")
    if payload.milestone_id:
        milestone = db.get(Milestone, payload.milestone_id)
        if milestone is None or milestone.job_id != job.id:
            raise HTTPException(status_code=404, detail="Milestone not found for this job")
    if payload.dispute_id:
        dispute = db.get(Dispute, payload.dispute_id)
        if dispute is None or dispute.job_id != job.id:
            raise HTTPException(status_code=404, detail="Dispute not found for this job")

    safe_name = payload.file_name.replace("/", "_").replace("\\", "_").strip()
    evidence = EvidenceFile(
        job_id=payload.job_id,
        milestone_id=payload.milestone_id,
        dispute_id=payload.dispute_id,
        uploader_wallet=actor.address,
        file_name=safe_name,
        sha256_hash=payload.digest.lower(),
        content_type=payload.content_type,
        size_bytes=payload.size_bytes,
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
        select(Job).options(selectinload(Job.milestones)).order_by(Job.created_at.desc()).limit(25)
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
def refresh_reputation(
    wallet_address: str,
    actor: Annotated[AuthenticatedWallet, Depends(authenticated_wallet)],
    db: Session = Depends(get_db),
) -> ReputationRead:
    if not _looks_like_address(wallet_address):
        raise HTTPException(status_code=422, detail="Invalid wallet")
    _enforce_actor(actor, wallet_address)
    snapshot = refresh_reputation_snapshot(db, actor.address)
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
def refresh_all_reputations(
    indexer_token: Annotated[str | None, Header(alias="X-Indexer-Token")] = None,
    db: Session = Depends(get_db),
) -> list[ReputationRead]:
    if not indexer_token or not secrets.compare_digest(indexer_token, settings.indexer_token):
        raise HTTPException(status_code=401, detail="Invalid indexer token")
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


@router.get("/metrics/funnel", response_model=FunnelMetricsRead)
def funnel_metrics(db: Session = Depends(get_db)) -> FunnelMetricsRead:
    total_swipes = db.execute(select(func.count(SwipeAction.id))).scalar_one()
    total_matches = db.execute(
        select(func.count(SwipeAction.id)).where(
            SwipeAction.target_type == "job", SwipeAction.direction.in_(["right", "super"])
        )
    ).scalar_one()
    jobs_created = db.execute(
        select(func.count(Job.id)).where(Job.status != JobStatus.created)
    ).scalar_one()
    jobs_funded = db.execute(
        select(func.count(Job.id)).where(Job.status.in_([JobStatus.funded, JobStatus.in_progress]))
    ).scalar_one()
    jobs_completed = db.execute(
        select(func.count(Job.id)).where(Job.status.in_([JobStatus.completed, JobStatus.resolved]))
    ).scalar_one()
    jobs_disputed = db.execute(
        select(func.count(Job.id)).where(Job.status == JobStatus.disputed)
    ).scalar_one()
    milestones_approved = db.execute(
        select(func.count(Milestone.id)).where(
            Milestone.status.in_([MilestoneStatus.released, MilestoneStatus.resolved])
        )
    ).scalar_one()
    disputes_opened = db.execute(select(func.count(Dispute.id))).scalar_one()
    return FunnelMetricsRead(
        total_swipes=total_swipes,
        total_matches=total_matches,
        jobs_created=jobs_created,
        jobs_funded=jobs_funded,
        jobs_completed=jobs_completed,
        jobs_disputed=jobs_disputed,
        milestones_approved=milestones_approved,
        disputes_opened=disputes_opened,
    )


def _looks_like_address(value: str) -> bool:
    return Web3.is_address(value)


def _enforce_actor(actor: AuthenticatedWallet, wallet_address: str) -> None:
    if actor.address != wallet_address.lower():
        raise HTTPException(status_code=403, detail="Authenticated wallet does not match actor")


def _uuid_or_404(value: str, detail: str):
    try:
        from uuid import UUID

        return UUID(value)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=detail) from exc
