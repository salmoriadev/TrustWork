from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class EscrowConfigRead(BaseModel):
    chain_id: int
    escrow_contract_address: str
    usdc_contract_address: str
    escrow_arbitrator: str


class JobPrepareRequest(BaseModel):
    freelancer_wallet: str = Field(min_length=42, max_length=42)
    milestone_amounts_raw: list[int] = Field(min_length=1)
    job_id: int | None = None


class JobPrepareRead(BaseModel):
    chain_id: int
    escrow_contract_address: str
    usdc_contract_address: str
    job_id: int
    freelancer_wallet: str
    milestone_amounts_raw: list[int]
    total_amount_raw: int


class IndexerPollRead(BaseModel):
    latest_block: int


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
