from datetime import datetime
from decimal import Decimal
from typing import Annotated
from uuid import UUID

from pydantic import AfterValidator, BaseModel, ConfigDict, Field

UINT256_MAX = 2**256 - 1


def validate_uint256(value: str) -> str:
    if int(value) > UINT256_MAX:
        raise ValueError("value exceeds uint256")
    return value


Uint256String = Annotated[
    str,
    Field(pattern=r"^(0|[1-9][0-9]*)$", max_length=78),
    AfterValidator(validate_uint256),
]

PositiveUint256String = Annotated[
    str,
    Field(pattern=r"^[1-9][0-9]*$", max_length=78),
    AfterValidator(validate_uint256),
]


class EscrowConfigRead(BaseModel):
    chain_id: int
    escrow_contract_address: str
    usdc_contract_address: str
    escrow_arbitrator: str


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    wallet_address: str
    display_name: str | None
    role_preference: str | None
    profile_visibility: str
    created_at: datetime
    updated_at: datetime


class UserUpsertRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    display_name: str | None = Field(default=None, max_length=120)
    role_preference: str | None = Field(default="both", pattern="^(client|freelancer|both)$")
    profile_visibility: str = Field(default="public", pattern="^public$")


class SwipeCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    target_type: str = Field(pattern="^(job|freelancer)$")
    target_id: UUID
    direction: str = Field(pattern="^(left|right|super)$")
    context: dict = Field(default_factory=dict)


class SwipeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    actor_wallet: str
    target_type: str
    target_id: UUID
    direction: str
    context: dict
    created_at: datetime


class EvidenceCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    job_id: UUID
    digest: str = Field(pattern=r"^0x[0-9a-fA-F]{64}$")
    file_name: str = Field(min_length=1, max_length=180)
    milestone_id: UUID | None = None
    dispute_id: UUID | None = None
    content_type: str = Field(default="application/octet-stream", min_length=1, max_length=255)
    size_bytes: int = Field(ge=0, le=25_000_000)


class EvidenceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    job_id: UUID
    milestone_id: UUID | None
    dispute_id: UUID | None
    uploader_wallet: str
    file_name: str
    sha256_hash: str
    content_type: str
    size_bytes: int
    created_at: datetime


class JobPrepareRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    freelancer_wallet: str = Field(min_length=42, max_length=42)
    milestone_amounts_raw: list[Uint256String] = Field(min_length=1)
    job_id: PositiveUint256String | None = None


class JobPrepareRead(BaseModel):
    chain_id: int
    escrow_contract_address: str
    usdc_contract_address: str
    job_id: Uint256String
    freelancer_wallet: str
    milestone_amounts_raw: list[Uint256String]
    total_amount_raw: Uint256String


class IndexerPollRead(BaseModel):
    latest_block: int
    indexed_through: int


class IndexerSyncRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    transaction_hash: str = Field(pattern=r"^0x[0-9a-fA-F]{64}$")
    receipt_block: int = Field(ge=0)


class AuthChallengeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    wallet_address: str = Field(min_length=42, max_length=42)
    chain_id: int


class AuthChallengeRead(BaseModel):
    message: str
    nonce: str
    expires_at: datetime


class AuthVerifyRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    message: str = Field(min_length=80, max_length=4096)
    signature: str = Field(pattern=r"^0x[0-9a-fA-F]{130}$")


class AuthTokenRead(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime
    wallet_address: str
    chain_id: int


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


class MatchRead(BaseModel):
    job: JobRead
    swipe: SwipeRead


class DisputeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    job_id: UUID
    milestone_id: UUID
    onchain_dispute_id: Decimal
    opened_by_wallet: str
    arbitrator_wallet: str
    evidence_hash: str | None
    freelancer_share_bps: int | None
    status: str
    opened_at: datetime
    resolved_at: datetime | None


class ReputationRead(BaseModel):
    wallet_address: str
    completed_jobs: int
    verified_volume_tier: str
    direct_approval_rate_bps: int
    dispute_rate_bps: int
    repeat_client_count: int
    updated_at: datetime | None = None


class FunnelMetricsRead(BaseModel):
    total_swipes: int
    total_matches: int
    jobs_created: int
    jobs_funded: int
    jobs_completed: int
    jobs_disputed: int
    milestones_approved: int
    disputes_opened: int
