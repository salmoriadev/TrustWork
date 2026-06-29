from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db.session import get_db
from app.models import Job, UserReputationSnapshot
from app.schemas import JobRead, ReputationRead

router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


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
