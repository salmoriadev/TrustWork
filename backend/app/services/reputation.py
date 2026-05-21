from dataclasses import dataclass
from decimal import Decimal


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
