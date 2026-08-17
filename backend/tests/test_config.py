import pytest
from pydantic import ValidationError

from app.core.config import Settings


def production_settings(**overrides: object) -> Settings:
    values = {
        "APP_ENVIRONMENT": "production",
        "CHAIN_ID": 8453,
        "RPC_URL": "https://mainnet.base.org",
        "ESCROW_CONTRACT_ADDRESS": "0x0000000000000000000000000000000000000001",
        "USDC_CONTRACT_ADDRESS": "0x0000000000000000000000000000000000000002",
        "ESCROW_ARBITRATOR": "0x0000000000000000000000000000000000000003",
        "API_CORS_ORIGINS": "https://app.trustwork.example",
    }
    values.update(overrides)
    return Settings(_env_file=None, **values)


def test_accepts_complete_production_configuration() -> None:
    assert production_settings().app_environment == "production"


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("ESCROW_CONTRACT_ADDRESS", "0x0000000000000000000000000000000000000000"),
        ("USDC_CONTRACT_ADDRESS", "replace-me"),
        ("RPC_URL", "http://mainnet.base.org"),
        ("API_CORS_ORIGINS", "http://localhost:5173"),
    ],
)
def test_rejects_unsafe_production_configuration(field: str, value: object) -> None:
    with pytest.raises(ValidationError):
        production_settings(**{field: value})
