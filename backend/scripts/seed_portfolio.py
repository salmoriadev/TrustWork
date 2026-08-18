"""Attach public English portfolio metadata to already-indexed Base Sepolia jobs."""

import json
import os
from decimal import Decimal

from sqlalchemy import select

from app.core.config import settings
from app.db.session import SessionLocal
from app.models import Job


def main() -> None:
    entries = json.loads(os.environ.get("SEED_JOBS_JSON", "[]"))
    if not isinstance(entries, list):
        raise ValueError("SEED_JOBS_JSON must be a JSON array")

    with SessionLocal() as db:
        for entry in entries:
            if set(entry) != {"onchain_job_id", "title", "public_summary"}:
                raise ValueError(
                    "Each seed entry requires onchain_job_id, title, and public_summary"
                )
            job = db.execute(
                select(Job).where(
                    Job.chain_id == settings.chain_id,
                    Job.contract_address == settings.escrow_contract_address.lower(),
                    Job.onchain_job_id == Decimal(str(entry["onchain_job_id"])),
                )
            ).scalar_one_or_none()
            if job is None:
                raise ValueError(f"Indexed job {entry['onchain_job_id']} does not exist")
            job.title = str(entry["title"])[:180]
            job.public_summary = str(entry["public_summary"])
        db.commit()


if __name__ == "__main__":
    main()
