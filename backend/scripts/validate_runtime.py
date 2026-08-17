"""Validate deployable RPC and contract configuration before release."""

from web3 import Web3

from app.core.config import settings


def main() -> None:
    web3 = Web3(Web3.HTTPProvider(settings.rpc_url, request_kwargs={"timeout": 10}))
    if not web3.is_connected():
        raise RuntimeError("RPC is unavailable")
    if web3.eth.chain_id != settings.chain_id:
        raise RuntimeError(
            f"RPC chain ID {web3.eth.chain_id} differs from configured {settings.chain_id}"
        )

    for name, address in {
        "escrow": settings.escrow_contract_address,
        "USDC": settings.usdc_contract_address,
    }.items():
        if web3.eth.get_code(Web3.to_checksum_address(address)) in {b"", b"\x00"}:
            raise RuntimeError(f"{name} address has no deployed bytecode")

    print(f"runtime configuration valid on chain {settings.chain_id}")


if __name__ == "__main__":
    main()
