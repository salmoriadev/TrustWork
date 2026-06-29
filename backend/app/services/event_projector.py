from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Dispute, DisputeStatus, Job, JobStatus, Milestone, MilestoneStatus


def apply_event(
    db: Session,
    *,
    chain_id: int,
    contract_address: str,
    event_name: str,
    payload: dict[str, Any],
) -> None:
    contract = contract_address.lower()

    if event_name == "JobCreated":
        job = _get_job(db, chain_id, contract, payload["jobId"])
        if job is None:
            db.add(
                Job(
                    chain_id=chain_id,
                    contract_address=contract,
                    onchain_job_id=_decimal(payload["jobId"]),
                    client_wallet=payload["client"].lower(),
                    freelancer_wallet=payload["freelancer"].lower(),
                    token_address=payload["token"].lower(),
                    total_amount_raw=_decimal(payload["totalAmount"]),
                    released_amount_raw=Decimal(0),
                    status=JobStatus.created,
                )
            )
        return

    if event_name == "MilestoneCreated":
        job = _get_job(db, chain_id, contract, payload["jobId"])
        if job is None:
            return
        milestone = _get_milestone(db, job, payload["milestoneId"])
        if milestone is None:
            db.add(
                Milestone(
                    job_id=job.id,
                    onchain_milestone_id=_decimal(payload["milestoneId"]),
                    sequence=int(payload["sequence"]),
                    amount_raw=_decimal(payload["amount"]),
                    status=MilestoneStatus.pending,
                )
            )
        return

    if event_name == "JobFunded":
        if job := _get_job(db, chain_id, contract, payload["jobId"]):
            job.status = JobStatus.funded
            job.funded_at = datetime.now(UTC)
        return

    if event_name == "MilestoneSubmitted":
        job = _get_job(db, chain_id, contract, payload["jobId"])
        if job and (milestone := _get_milestone(db, job, payload["milestoneId"])):
            job.status = JobStatus.in_progress
            milestone.status = MilestoneStatus.submitted
            milestone.evidence_hash = payload["evidenceHash"]
            milestone.submitted_at = _from_unix(payload["submittedAt"])
            milestone.review_deadline = _from_unix(payload["reviewDeadline"])
        return

    if event_name == "MilestoneApproved":
        job = _get_job(db, chain_id, contract, payload["jobId"])
        if job and (milestone := _get_milestone(db, job, payload["milestoneId"])):
            milestone.status = MilestoneStatus.released
            job.released_amount_raw += _decimal(payload["grossAmount"])
            _refresh_job_status(job)
        return

    if event_name == "RevisionRequested":
        job = _get_job(db, chain_id, contract, payload["jobId"])
        if job and (milestone := _get_milestone(db, job, payload["milestoneId"])):
            milestone.status = MilestoneStatus.revision_requested
            milestone.review_deadline = None
        return

    if event_name == "DisputeOpened":
        job = _get_job(db, chain_id, contract, payload["jobId"])
        if job and (milestone := _get_milestone(db, job, payload["milestoneId"])):
            job.status = JobStatus.disputed
            milestone.status = MilestoneStatus.disputed
            dispute = _get_dispute(db, job, payload["disputeId"])
            if dispute is None:
                db.add(
                    Dispute(
                        job_id=job.id,
                        milestone_id=milestone.id,
                        onchain_dispute_id=_decimal(payload["disputeId"]),
                        opened_by_wallet=payload["openedBy"].lower(),
                        arbitrator_wallet=payload["arbitrator"].lower(),
                        evidence_hash=payload["evidenceHash"],
                        status=DisputeStatus.opened,
                    )
                )
        return

    if event_name == "DisputeResolved":
        job = _get_job(db, chain_id, contract, payload["jobId"])
        if job and (milestone := _get_milestone(db, job, payload["milestoneId"])):
            milestone.status = MilestoneStatus.resolved
            milestone.evidence_hash = payload["evidenceHash"]
            job.released_amount_raw += _decimal(payload["freelancerGrossAmount"]) + _decimal(
                payload["clientRefundAmount"]
            )
            dispute = _get_dispute(db, job, payload["disputeId"])
            if dispute:
                dispute.status = DisputeStatus.resolved
                dispute.evidence_hash = payload["evidenceHash"]
                dispute.freelancer_share_bps = int(payload["freelancerShareBps"])
                dispute.resolved_at = datetime.now(UTC)
            _refresh_job_status(job, had_dispute=True)
        return

    if event_name == "JobCancelled":
        if job := _get_job(db, chain_id, contract, payload["jobId"]):
            job.status = JobStatus.cancelled
            job.released_amount_raw = job.total_amount_raw
            job.cancelled_at = datetime.now(UTC)


def _get_job(
    db: Session,
    chain_id: int,
    contract_address: str,
    onchain_job_id: int | str | Decimal,
) -> Job | None:
    stmt = select(Job).where(
        Job.chain_id == chain_id,
        Job.contract_address == contract_address,
        Job.onchain_job_id == _decimal(onchain_job_id),
    )
    return db.execute(stmt).scalar_one_or_none()


def _get_milestone(
    db: Session,
    job: Job,
    onchain_milestone_id: int | str | Decimal,
) -> Milestone | None:
    stmt = select(Milestone).where(
        Milestone.job_id == job.id,
        Milestone.onchain_milestone_id == _decimal(onchain_milestone_id),
    )
    return db.execute(stmt).scalar_one_or_none()


def _get_dispute(
    db: Session,
    job: Job,
    onchain_dispute_id: int | str | Decimal,
) -> Dispute | None:
    stmt = select(Dispute).where(
        Dispute.job_id == job.id,
        Dispute.onchain_dispute_id == _decimal(onchain_dispute_id),
    )
    return db.execute(stmt).scalar_one_or_none()


def _refresh_job_status(job: Job, had_dispute: bool = False) -> None:
    final_statuses = {MilestoneStatus.released, MilestoneStatus.resolved}
    if job.milestones and all(milestone.status in final_statuses for milestone in job.milestones):
        job.status = (
            JobStatus.resolved if had_dispute or bool(job.disputes) else JobStatus.completed
        )
        job.completed_at = datetime.now(UTC)
    else:
        job.status = JobStatus.in_progress


def _decimal(value: int | str | Decimal) -> Decimal:
    return Decimal(str(value))


def _from_unix(value: int | str) -> datetime:
    return datetime.fromtimestamp(int(value), tz=UTC)
