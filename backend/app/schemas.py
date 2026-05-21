from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class MilestoneRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    onchain_milestone_id: Decimal
    sequence: int
    title: str | None
    amount_raw: Decimal
    evidence_hash: str | None
    submitted_at: datetime | None
    review_deadline: datetime | None
    status: str


class JobRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    chain_id: int
    contract_address: str
    onchain_job_id: Decimal
    client_wallet: str
    freelancer_wallet: str
    token_address: str
    title: str | None
    public_summary: str | None
    total_amount_raw: Decimal
    released_amount_raw: Decimal
    status: str
    milestones: list[MilestoneRead] = []


class ReputationRead(BaseModel):
    wallet_address: str
    completed_jobs: int
    verified_volume_tier: str
    direct_approval_rate_bps: int
    dispute_rate_bps: int
    repeat_client_count: int
    updated_at: datetime | None = None
