from decimal import Decimal
from time import time_ns

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.db.session import get_db
from app.models import Job, UserReputationSnapshot
from app.schemas import (
    EscrowConfigRead,
    IndexerPollRead,
    JobPrepareRead,
    JobPrepareRequest,
    JobRead,
    ReputationRead,
)
from app.services.event_indexer import EscrowEventIndexer

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


def _looks_like_address(value: str) -> bool:
    return value.startswith("0x") and len(value) == 42
