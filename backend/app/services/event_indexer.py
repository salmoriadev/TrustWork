from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

from redis import Redis
from sqlalchemy.dialects.postgresql import insert
from web3 import Web3
from web3.contract import Contract

from app.core.config import settings
from app.db.session import SessionLocal
from app.models import IndexedEvent
from app.services.event_projector import apply_event


class EscrowEventIndexer:
    def __init__(self) -> None:
        self.web3 = Web3(Web3.HTTPProvider(settings.rpc_url))
        self.contract = self._load_contract()
        self.redis = Redis.from_url(settings.redis_url, decode_responses=True)

    def _load_contract(self) -> Contract:
        artifact_path = Path(settings.escrow_abi_path)
        artifact = json.loads(artifact_path.read_text(encoding="utf-8"))
        abi = artifact["abi"] if "abi" in artifact else artifact
        return self.web3.eth.contract(
            address=Web3.to_checksum_address(settings.escrow_contract_address),
            abi=abi,
        )

    def poll_forever(self, interval_seconds: int = 8) -> None:
        next_block = settings.indexer_start_block
        while True:
            latest_safe_block = self.web3.eth.block_number - settings.indexer_confirmations
            if latest_safe_block >= next_block:
                self.poll_range(next_block, latest_safe_block)
                next_block = latest_safe_block + 1
            time.sleep(interval_seconds)

    def poll_range(self, from_block: int, to_block: int) -> None:
        event_filter = {
            "fromBlock": from_block,
            "toBlock": to_block,
            "address": settings.escrow_contract_address,
        }
        for raw_log in self.web3.eth.get_logs(event_filter):
            event = self._decode_log(raw_log)
            if event is not None:
                self._persist_event(event)

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
                    "tx_hash": decoded["transactionHash"].hex(),
                    "log_index": decoded["logIndex"],
                }
            except Exception:
                continue
        return None

    def _persist_event(self, event: dict[str, Any]) -> None:
        payload = _json_safe(event["args"])
        stmt = (
            insert(IndexedEvent)
            .values(
                chain_id=settings.chain_id,
                contract_address=settings.escrow_contract_address.lower(),
                block_number=event["block_number"],
                tx_hash=event["tx_hash"],
                log_index=event["log_index"],
                event_name=event["event_name"],
                payload=payload,
            )
            .on_conflict_do_nothing(
                constraint="uq_indexed_events_log",
            )
        )

        with SessionLocal() as db:
            result = db.execute(stmt)
            if result.rowcount:
                apply_event(
                    db,
                    chain_id=settings.chain_id,
                    contract_address=settings.escrow_contract_address,
                    event_name=event["event_name"],
                    payload=payload,
                )
            db.commit()

        if result.rowcount:
            self.redis.publish(
                "escrow.events",
                json.dumps(
                    {
                        "event": event["event_name"],
                        "blockNumber": event["block_number"],
                        "txHash": event["tx_hash"],
                        "payload": payload,
                    }
                ),
            )


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


if __name__ == "__main__":
    EscrowEventIndexer().poll_forever()
