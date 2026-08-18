from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

from sqlalchemy import delete, select, update
from sqlalchemy.dialects.postgresql import insert
from web3 import Web3
from web3.contract import Contract
from web3.exceptions import MismatchedABI

from app.core.config import settings
from app.db.session import SessionLocal
from app.models import (
    Dispute,
    EvidenceFile,
    IndexedEvent,
    IndexerCursor,
    Job,
    JobStatus,
    Milestone,
    SwipeAction,
    UserReputationSnapshot,
)
from app.services.event_projector import apply_event
from app.services.reputation import refresh_all_reputation_snapshots


class EscrowEventIndexer:
    def __init__(self, web3: Web3 | None = None) -> None:
        self.web3 = web3 or Web3(Web3.HTTPProvider(settings.rpc_url, request_kwargs={"timeout": 8}))
        self.contract = self._load_contract()

    @staticmethod
    def validate_abi() -> None:
        artifact_path = Path(settings.escrow_abi_path)
        if not artifact_path.is_file():
            raise RuntimeError(f"Escrow ABI is missing: {artifact_path}")
        artifact = json.loads(artifact_path.read_text(encoding="utf-8"))
        abi = artifact.get("abi", artifact) if isinstance(artifact, dict) else artifact
        if not isinstance(abi, list) or not any(item.get("type") == "event" for item in abi):
            raise RuntimeError("Escrow ABI does not contain events")

    def _load_contract(self) -> Contract:
        self.validate_abi()
        artifact = json.loads(Path(settings.escrow_abi_path).read_text(encoding="utf-8"))
        abi = artifact["abi"] if isinstance(artifact, dict) and "abi" in artifact else artifact
        return self.web3.eth.contract(
            address=Web3.to_checksum_address(settings.escrow_contract_address),
            abi=abi,
        )

    def poll_forever(self, interval_seconds: int = 8) -> None:
        while True:
            self.poll_confirmed()
            time.sleep(interval_seconds)

    def poll_confirmed(self) -> int:
        latest_block = self.web3.eth.block_number
        latest_safe_block = max(0, latest_block - settings.indexer_confirmations)
        contract = settings.escrow_contract_address.lower()
        with SessionLocal() as db:
            cursor = db.execute(
                select(IndexerCursor).where(
                    IndexerCursor.chain_id == settings.chain_id,
                    IndexerCursor.contract_address == contract,
                )
            ).scalar_one_or_none()
            last_block = cursor.last_finalized_block if cursor else settings.indexer_start_block - 1

        replay_from = cursor_replay_start(last_block)
        if latest_safe_block < replay_from:
            return last_block
        self.poll_range(replay_from, latest_safe_block, advance_cursor=True)
        return latest_safe_block

    def sync_receipt(self, transaction_hash: str, receipt_block: int) -> int:
        latest_block = self.web3.eth.block_number
        too_old = latest_block - receipt_block > settings.indexer_browser_sync_max_age
        if receipt_block > latest_block or too_old:
            raise ValueError("Receipt block is outside the browser synchronization window")
        receipt = self.web3.eth.get_transaction_receipt(transaction_hash)
        if receipt["blockNumber"] != receipt_block or receipt["status"] != 1:
            raise ValueError(
                "Transaction receipt does not match a successful confirmed transaction"
            )
        transaction = self.web3.eth.get_transaction(transaction_hash)
        wrong_contract = (
            not transaction.get("to")
            or transaction["to"].lower() != settings.escrow_contract_address.lower()
        )
        if wrong_contract:
            raise ValueError("Transaction does not target the configured escrow contract")
        self.poll_range(receipt_block, receipt_block, advance_cursor=False)
        return receipt_block

    def poll_range(self, from_block: int, to_block: int, *, advance_cursor: bool = False) -> int:
        if from_block < 0 or to_block < from_block:
            raise ValueError("Invalid block range")
        event_filter = {
            "fromBlock": from_block,
            "toBlock": to_block,
            "address": Web3.to_checksum_address(settings.escrow_contract_address),
        }
        events = [
            event
            for raw_log in self.web3.eth.get_logs(event_filter)
            if (event := self._decode_log(raw_log)) is not None
        ]
        reorg_detected = self._drop_orphaned_events(from_block, to_block, events)
        persisted = 0
        for event in events:
            if self._persist_event(event):
                persisted += 1
        if reorg_detected:
            self._rebuild_projection()
        if advance_cursor:
            self._advance_cursor(to_block)
        return persisted

    def _drop_orphaned_events(
        self,
        from_block: int,
        to_block: int,
        canonical_events: list[dict[str, Any]],
    ) -> bool:
        canonical_keys = {_event_key(event) for event in canonical_events}
        contract = settings.escrow_contract_address.lower()
        with SessionLocal() as db:
            stored_events = list(
                db.execute(
                    select(IndexedEvent).where(
                        IndexedEvent.chain_id == settings.chain_id,
                        IndexedEvent.contract_address == contract,
                        IndexedEvent.block_number.between(from_block, to_block),
                    )
                ).scalars()
            )
            stale_ids = [
                event.id for event in stored_events if _event_key(event) not in canonical_keys
            ]
            if not stale_ids:
                return False
            db.execute(delete(IndexedEvent).where(IndexedEvent.id.in_(stale_ids)))
            db.commit()
            return True

    def _rebuild_projection(self) -> None:
        contract = settings.escrow_contract_address.lower()
        with SessionLocal() as db:
            events = list(
                db.execute(
                    select(IndexedEvent)
                    .where(
                        IndexedEvent.chain_id == settings.chain_id,
                        IndexedEvent.contract_address == contract,
                    )
                    .order_by(IndexedEvent.block_number, IndexedEvent.log_index)
                ).scalars()
            )
            canonical_job_ids = {
                str(event.payload["jobId"])
                for event in events
                if event.event_name == "JobCreated" and "jobId" in event.payload
            }
            jobs = list(
                db.execute(
                    select(Job).where(
                        Job.chain_id == settings.chain_id,
                        Job.contract_address == contract,
                    )
                ).scalars()
            )
            job_ids = [job.id for job in jobs]
            orphan_ids = [
                job.id
                for job in jobs
                if str(job.onchain_job_id.quantize(1)) not in canonical_job_ids
            ]
            if job_ids:
                db.execute(
                    update(EvidenceFile)
                    .where(EvidenceFile.job_id.in_(job_ids))
                    .values(milestone_id=None, dispute_id=None)
                )
                db.execute(delete(Dispute).where(Dispute.job_id.in_(job_ids)))
                db.execute(delete(Milestone).where(Milestone.job_id.in_(job_ids)))
            if orphan_ids:
                db.execute(delete(EvidenceFile).where(EvidenceFile.job_id.in_(orphan_ids)))
                db.execute(delete(SwipeAction).where(SwipeAction.target_id.in_(orphan_ids)))
                db.execute(delete(Job).where(Job.id.in_(orphan_ids)))

            for job in jobs:
                if job.id in orphan_ids:
                    continue
                job.released_amount_raw = 0
                job.status = JobStatus.created
                job.funded_at = None
                job.completed_at = None
                job.cancelled_at = None
            db.execute(delete(UserReputationSnapshot))
            db.flush()
            for event in events:
                apply_event(
                    db,
                    chain_id=event.chain_id,
                    contract_address=event.contract_address,
                    event_name=event.event_name,
                    payload=event.payload,
                )
            db.commit()

        with SessionLocal() as db:
            refresh_all_reputation_snapshots(db)

    def _decode_log(self, raw_log: dict[str, Any]) -> dict[str, Any] | None:
        for event_abi in self.contract.abi:
            if event_abi.get("type") != "event":
                continue
            event_factory = getattr(self.contract.events, event_abi["name"])
            try:
                decoded = event_factory().process_log(raw_log)
                return {
                    "event_name": decoded["event"],
                    "args": dict(decoded["args"]),
                    "block_number": decoded["blockNumber"],
                    "block_hash": decoded["blockHash"].hex(),
                    "tx_hash": decoded["transactionHash"].hex(),
                    "log_index": decoded["logIndex"],
                }
            except (KeyError, MismatchedABI, TypeError, ValueError):
                continue
        return None

    def _persist_event(self, event: dict[str, Any]) -> bool:
        payload = _json_safe(event["args"])
        stmt = (
            insert(IndexedEvent)
            .values(
                chain_id=settings.chain_id,
                contract_address=settings.escrow_contract_address.lower(),
                block_number=event["block_number"],
                block_hash=event["block_hash"],
                tx_hash=event["tx_hash"],
                log_index=event["log_index"],
                event_name=event["event_name"],
                payload=payload,
            )
            .on_conflict_do_nothing(constraint="uq_indexed_events_log")
        )
        with SessionLocal() as db:
            result = db.execute(stmt)
            inserted = bool(result.rowcount)
            if inserted:
                apply_event(
                    db,
                    chain_id=settings.chain_id,
                    contract_address=settings.escrow_contract_address,
                    event_name=event["event_name"],
                    payload=payload,
                )
            db.commit()
        return inserted

    def _advance_cursor(self, block_number: int) -> None:
        contract = settings.escrow_contract_address.lower()
        with SessionLocal() as db:
            cursor = db.execute(
                select(IndexerCursor).where(
                    IndexerCursor.chain_id == settings.chain_id,
                    IndexerCursor.contract_address == contract,
                )
            ).scalar_one_or_none()
            if cursor is None:
                cursor = IndexerCursor(
                    chain_id=settings.chain_id,
                    contract_address=contract,
                    last_finalized_block=block_number,
                )
                db.add(cursor)
            else:
                cursor.last_finalized_block = max(cursor.last_finalized_block, block_number)
            db.commit()


def _json_safe(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: _json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe(item) for item in value]
    if isinstance(value, bytes):
        return "0x" + value.hex()
    if hasattr(value, "hex") and callable(value.hex):
        return value.hex()
    return value


def _event_key(event: IndexedEvent | dict[str, Any]) -> tuple[int, str, str, int]:
    if isinstance(event, dict):
        return (
            int(event["block_number"]),
            str(event["block_hash"]).lower(),
            str(event["tx_hash"]).lower(),
            int(event["log_index"]),
        )
    return (
        event.block_number,
        event.block_hash.lower(),
        event.tx_hash.lower(),
        event.log_index,
    )


def cursor_replay_start(last_finalized_block: int) -> int:
    return max(
        settings.indexer_start_block,
        last_finalized_block - settings.indexer_replay_window + 1,
    )


if __name__ == "__main__":
    EscrowEventIndexer().poll_forever()
