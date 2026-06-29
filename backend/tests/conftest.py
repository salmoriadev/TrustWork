from collections.abc import Generator
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.session import engine, get_db
from app.main import app
from app.models import Job, JobStatus

CLIENT_WALLET = "0x00000000000000000000000000000000000000aa"
FREELANCER_WALLET = "0x00000000000000000000000000000000000000bb"
OTHER_CLIENT_WALLET = "0x00000000000000000000000000000000000000cc"
CONTRACT_ADDRESS = "0x00000000000000000000000000000000000000dd"
TOKEN_ADDRESS = "0x00000000000000000000000000000000000000ee"


@pytest.fixture(scope="session", autouse=True)
def create_schema() -> None:
    Base.metadata.create_all(bind=engine)


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, autoflush=False, expire_on_commit=False)
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def persisted_job(db_session: Session) -> Job:
    job = Job(
        chain_id=31337,
        contract_address=CONTRACT_ADDRESS,
        onchain_job_id=Decimal(910001),
        client_wallet=CLIENT_WALLET,
        freelancer_wallet=FREELANCER_WALLET,
        token_address=TOKEN_ADDRESS,
        title="Backend test job",
        public_summary="A testable escrow job.",
        total_amount_raw=Decimal(1_000_000_000),
        released_amount_raw=Decimal(0),
        status=JobStatus.funded,
    )
    db_session.add(job)
    db_session.flush()
    return job
