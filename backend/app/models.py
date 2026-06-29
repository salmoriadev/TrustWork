import enum
from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import (
    BigInteger,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy import (
    Enum as SqlEnum,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def enum_values(enum_class: type[enum.Enum]) -> list[str]:
    return [item.value for item in enum_class]


class JobStatus(enum.StrEnum):
    created = "Created"
    funded = "Funded"
    in_progress = "InProgress"
    completed = "Completed"
    cancelled = "Cancelled"
    disputed = "Disputed"
    resolved = "Resolved"


class MilestoneStatus(enum.StrEnum):
    pending = "Pending"
    submitted = "Submitted"
    approved = "Approved"
    released = "Released"
    revision_requested = "RevisionRequested"
    disputed = "Disputed"
    resolved = "Resolved"


class DisputeStatus(enum.StrEnum):
    opened = "Opened"
    resolved = "Resolved"


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    wallet_address: Mapped[str] = mapped_column(String(42), unique=True, index=True)
    display_name: Mapped[str | None] = mapped_column(String(120))
    role_preference: Mapped[str | None] = mapped_column(String(32))
    profile_visibility: Mapped[str] = mapped_column(String(32), default="public")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Job(Base):
    __tablename__ = "jobs"
    __table_args__ = (
        UniqueConstraint("chain_id", "contract_address", "onchain_job_id", name="uq_jobs_onchain"),
        Index("ix_jobs_client_wallet", "client_wallet"),
        Index("ix_jobs_freelancer_wallet", "freelancer_wallet"),
        Index("ix_jobs_status", "status"),
    )

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    chain_id: Mapped[int] = mapped_column(BigInteger)
    contract_address: Mapped[str] = mapped_column(String(42))
    onchain_job_id: Mapped[Decimal] = mapped_column(Numeric(78, 0))
    client_wallet: Mapped[str] = mapped_column(String(42))
    freelancer_wallet: Mapped[str] = mapped_column(String(42))
    token_address: Mapped[str] = mapped_column(String(42))
    title: Mapped[str | None] = mapped_column(String(180))
    public_summary: Mapped[str | None] = mapped_column(Text)
    private_description: Mapped[str | None] = mapped_column(Text)
    metadata_hash: Mapped[str | None] = mapped_column(String(66))
    total_amount_raw: Mapped[Decimal] = mapped_column(Numeric(78, 0))
    released_amount_raw: Mapped[Decimal] = mapped_column(Numeric(78, 0), default=0)
    status: Mapped[JobStatus] = mapped_column(
        SqlEnum(JobStatus, name="job_status", values_callable=enum_values, native_enum=True),
        default=JobStatus.created,
    )
    onchain_created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    funded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    milestones: Mapped[list["Milestone"]] = relationship(back_populates="job")
    disputes: Mapped[list["Dispute"]] = relationship(back_populates="job")


class Milestone(Base):
    __tablename__ = "milestones"
    __table_args__ = (
        UniqueConstraint("job_id", "onchain_milestone_id", name="uq_milestones_onchain"),
        Index("ix_milestones_status", "status"),
    )

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    job_id: Mapped[UUID] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"))
    onchain_milestone_id: Mapped[Decimal] = mapped_column(Numeric(78, 0))
    sequence: Mapped[int] = mapped_column(BigInteger)
    title: Mapped[str | None] = mapped_column(String(180))
    acceptance_criteria_private: Mapped[str | None] = mapped_column(Text)
    amount_raw: Mapped[Decimal] = mapped_column(Numeric(78, 0))
    evidence_hash: Mapped[str | None] = mapped_column(String(66))
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    review_deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[MilestoneStatus] = mapped_column(
        SqlEnum(
            MilestoneStatus,
            name="milestone_status",
            values_callable=enum_values,
            native_enum=True,
        ),
        default=MilestoneStatus.pending,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    job: Mapped[Job] = relationship(back_populates="milestones")
    disputes: Mapped[list["Dispute"]] = relationship(back_populates="milestone")


class Dispute(Base):
    __tablename__ = "disputes"
    __table_args__ = (UniqueConstraint("job_id", "onchain_dispute_id", name="uq_disputes_onchain"),)

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    job_id: Mapped[UUID] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"))
    milestone_id: Mapped[UUID] = mapped_column(ForeignKey("milestones.id", ondelete="CASCADE"))
    onchain_dispute_id: Mapped[Decimal] = mapped_column(Numeric(78, 0))
    opened_by_wallet: Mapped[str] = mapped_column(String(42))
    arbitrator_wallet: Mapped[str] = mapped_column(String(42))
    evidence_hash: Mapped[str | None] = mapped_column(String(66))
    freelancer_share_bps: Mapped[int | None] = mapped_column(BigInteger)
    status: Mapped[DisputeStatus] = mapped_column(
        SqlEnum(
            DisputeStatus,
            name="dispute_status",
            values_callable=enum_values,
            native_enum=True,
        ),
        default=DisputeStatus.opened,
    )
    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    job: Mapped[Job] = relationship(back_populates="disputes")
    milestone: Mapped[Milestone] = relationship(back_populates="disputes")


class IndexedEvent(Base):
    __tablename__ = "indexed_events"
    __table_args__ = (
        UniqueConstraint(
            "chain_id",
            "contract_address",
            "block_number",
            "tx_hash",
            "log_index",
            name="uq_indexed_events_log",
        ),
        Index("ix_indexed_events_name", "event_name"),
        Index("ix_indexed_events_block", "block_number"),
    )

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    chain_id: Mapped[int] = mapped_column(BigInteger)
    contract_address: Mapped[str] = mapped_column(String(42))
    block_number: Mapped[int] = mapped_column(BigInteger)
    tx_hash: Mapped[str] = mapped_column(String(66))
    log_index: Mapped[int] = mapped_column(BigInteger)
    event_name: Mapped[str] = mapped_column(String(80))
    payload: Mapped[dict] = mapped_column(JSONB)
    processed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class UserReputationSnapshot(Base):
    __tablename__ = "user_reputation_snapshots"

    wallet_address: Mapped[str] = mapped_column(String(42), primary_key=True)
    completed_jobs: Mapped[int] = mapped_column(BigInteger, default=0)
    verified_volume_raw: Mapped[Decimal] = mapped_column(Numeric(78, 0), default=0)
    verified_volume_tier: Mapped[str] = mapped_column(String(32), default="new")
    direct_approval_rate_bps: Mapped[int] = mapped_column(BigInteger, default=0)
    dispute_rate_bps: Mapped[int] = mapped_column(BigInteger, default=0)
    repeat_client_count: Mapped[int] = mapped_column(BigInteger, default=0)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
