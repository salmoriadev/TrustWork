from functools import lru_cache
from pathlib import Path

from pydantic import AliasChoices, Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from web3 import Web3

BASE_SEPOLIA_USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_environment: str = Field(default="development", alias="APP_ENVIRONMENT")

    database_url: str = Field(
        default="postgresql+psycopg://postgres:postgres@localhost:5432/trustwork",
        alias="DATABASE_URL",
    )
    api_cors_origins_raw: str = Field(default="http://localhost:5173", alias="API_CORS_ORIGINS")
    trusted_hosts_raw: str = Field(default="localhost,127.0.0.1,testserver", alias="TRUSTED_HOSTS")

    chain_id: int = Field(default=84532, alias="CHAIN_ID")
    rpc_url: str = Field(default="https://sepolia.base.org", alias="RPC_URL")
    escrow_contract_address: str = Field(
        default="0x0000000000000000000000000000000000000000",
        alias="ESCROW_CONTRACT_ADDRESS",
    )
    usdc_contract_address: str = Field(
        default="0x0000000000000000000000000000000000000000",
        alias="USDC_CONTRACT_ADDRESS",
    )
    escrow_arbitrator: str = Field(
        default="0x0000000000000000000000000000000000000000",
        alias="ESCROW_ARBITRATOR",
    )
    escrow_abi_path: str = Field(
        default=str(Path(__file__).resolve().parents[1] / "abi" / "FreelanceEscrow.json"),
        alias="ESCROW_ABI_PATH",
    )
    indexer_start_block: int = Field(default=0, alias="INDEXER_START_BLOCK")
    indexer_confirmations: int = Field(default=3, alias="INDEXER_CONFIRMATIONS")
    indexer_replay_window: int = Field(default=12, alias="INDEXER_REPLAY_WINDOW")
    indexer_browser_sync_max_age: int = Field(default=256, alias="INDEXER_BROWSER_SYNC_MAX_AGE")
    indexer_token: str = Field(default="development-indexer-token", alias="INDEXER_TOKEN")
    jwt_secret: str = Field(default="development-jwt-secret-change-me", alias="JWT_SECRET")
    jwt_ttl_seconds: int = Field(default=900, alias="JWT_TTL_SECONDS")
    siwe_challenge_ttl_seconds: int = Field(default=300, alias="SIWE_CHALLENGE_TTL_SECONDS")
    siwe_domain: str = Field(default="localhost:5173", alias="SIWE_DOMAIN")
    siwe_origin: str = Field(default="http://localhost:5173", alias="SIWE_ORIGIN")
    max_job_amount_raw: int = Field(
        default=10_000_000_000,
        validation_alias=AliasChoices("MAX_JOB_AMOUNT_RAW", "MAX_JOB_AMOUNT"),
    )

    @model_validator(mode="after")
    def validate_deployable_environment(self) -> "Settings":
        allowed_environments = {"development", "test", "staging", "production"}
        if self.app_environment not in allowed_environments:
            raise ValueError(f"APP_ENVIRONMENT must be one of {sorted(allowed_environments)}")
        if self.app_environment not in {"staging", "production"}:
            return self

        if self.chain_id <= 0:
            raise ValueError("CHAIN_ID must be a positive integer")

        addresses = {
            "ESCROW_CONTRACT_ADDRESS": self.escrow_contract_address,
            "USDC_CONTRACT_ADDRESS": self.usdc_contract_address,
            "ESCROW_ARBITRATOR": self.escrow_arbitrator,
        }
        for name, address in addresses.items():
            if not Web3.is_address(address) or int(address, 16) == 0:
                raise ValueError(f"{name} must be a non-zero Ethereum address")
        if self.escrow_contract_address.lower() == self.usdc_contract_address.lower():
            raise ValueError("ESCROW_CONTRACT_ADDRESS and USDC_CONTRACT_ADDRESS must differ")
        if not self.rpc_url.startswith("https://"):
            raise ValueError("RPC_URL must use HTTPS in deployable environments")
        if self.app_environment == "production" and any(
            "localhost" in origin or "127.0.0.1" in origin for origin in self.api_cors_origins
        ):
            raise ValueError("API_CORS_ORIGINS cannot contain localhost in production")
        if self.chain_id != 84532:
            raise ValueError("Portfolio deployments must use Base Sepolia chain ID 84532")
        if self.usdc_contract_address.lower() != BASE_SEPOLIA_USDC.lower():
            raise ValueError("Portfolio deployments must use official Base Sepolia USDC")
        if len(self.jwt_secret) < 32:
            raise ValueError("JWT_SECRET must contain at least 32 characters")
        if len(self.indexer_token) < 32:
            raise ValueError("INDEXER_TOKEN must contain at least 32 characters")
        if not self.siwe_origin.startswith("https://"):
            raise ValueError("SIWE_ORIGIN must use HTTPS in deployable environments")
        if "://" in self.siwe_domain:
            raise ValueError("SIWE_DOMAIN must be a host, not a URL")
        return self

    @property
    def api_cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.api_cors_origins_raw.split(",") if origin.strip()]

    @property
    def trusted_hosts(self) -> list[str]:
        return [host.strip() for host in self.trusted_hosts_raw.split(",") if host.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
