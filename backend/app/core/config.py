from functools import lru_cache

from pydantic import AliasChoices, Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from web3 import Web3


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_environment: str = Field(default="development", alias="APP_ENVIRONMENT")

    database_url: str = Field(
        default="postgresql+psycopg://postgres:postgres@localhost:5432/freelance_escrow",
        alias="DATABASE_URL",
    )
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")
    api_cors_origins_raw: str = Field(default="http://localhost:5173", alias="API_CORS_ORIGINS")

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
        default="../contracts/out/FreelanceEscrow.sol/FreelanceEscrow.json"
    )
    indexer_start_block: int = Field(default=0, alias="INDEXER_START_BLOCK")
    indexer_confirmations: int = 3
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
        return self

    @property
    def api_cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.api_cors_origins_raw.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
