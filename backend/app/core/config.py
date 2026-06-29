from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

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
    max_job_amount_raw: int = Field(default=10_000_000_000, alias="MAX_JOB_AMOUNT_RAW")

    @property
    def api_cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.api_cors_origins_raw.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
