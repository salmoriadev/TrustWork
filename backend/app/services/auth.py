from __future__ import annotations

import hashlib
import secrets
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Annotated
from urllib.parse import urlparse

import jwt
from eth_account import Account
from eth_account.messages import encode_defunct
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session
from web3 import Web3

from app.core.config import settings
from app.models import AuthChallenge

TOKEN_ISSUER = "trustwork-api"
TOKEN_AUDIENCE = "trustwork-web"
SIGN_IN_STATEMENT = "Sign in to TrustWork's Base Sepolia engineering demo."


@dataclass(frozen=True)
class AuthenticatedWallet:
    address: str
    chain_id: int


bearer_scheme = HTTPBearer(auto_error=False)


def authenticated_wallet(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> AuthenticatedWallet:
    return require_wallet(credentials)


def create_challenge(db: Session, wallet_address: str, chain_id: int) -> tuple[str, str, datetime]:
    wallet = _normalized_wallet(wallet_address)
    if chain_id != settings.chain_id:
        raise HTTPException(status_code=422, detail="Base Sepolia chain ID is required")

    now = datetime.now(UTC)
    expires_at = now + timedelta(seconds=settings.siwe_challenge_ttl_seconds)
    nonce = secrets.token_hex(16)
    message = _build_message(wallet, chain_id, nonce, now, expires_at)
    db.add(
        AuthChallenge(
            wallet_address=wallet.lower(),
            chain_id=chain_id,
            nonce_hash=_sha256(nonce),
            message_hash=_sha256(message),
            domain=settings.siwe_domain,
            origin=settings.siwe_origin,
            expires_at=expires_at,
        )
    )
    db.commit()
    return message, nonce, expires_at


def verify_challenge(db: Session, message: str, signature: str) -> tuple[str, str, datetime, int]:
    fields = _parse_message(message)
    if fields["domain"] != settings.siwe_domain or fields["uri"] != settings.siwe_origin:
        raise HTTPException(status_code=401, detail="SIWE domain or URI is not allowed")
    if int(fields["chain_id"]) != settings.chain_id:
        raise HTTPException(status_code=401, detail="SIWE chain is not allowed")

    challenge = db.execute(
        select(AuthChallenge)
        .where(AuthChallenge.nonce_hash == _sha256(fields["nonce"]))
        .with_for_update()
    ).scalar_one_or_none()
    now = datetime.now(UTC)
    if challenge is None or challenge.used:
        raise HTTPException(status_code=401, detail="Challenge is invalid or already used")
    if challenge.expires_at <= now:
        raise HTTPException(status_code=401, detail="Challenge has expired")
    if challenge.message_hash != _sha256(message):
        raise HTTPException(status_code=401, detail="Challenge message was modified")

    try:
        recovered = Account.recover_message(encode_defunct(text=message), signature=signature)
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid wallet signature") from exc
    if recovered.lower() != challenge.wallet_address:
        raise HTTPException(
            status_code=401, detail="Signature does not match the challenged wallet"
        )

    challenge.used = True
    challenge.used_at = now
    db.commit()

    token_expires_at = now + timedelta(seconds=settings.jwt_ttl_seconds)
    token = jwt.encode(
        {
            "sub": challenge.wallet_address,
            "chain_id": challenge.chain_id,
            "iss": TOKEN_ISSUER,
            "aud": TOKEN_AUDIENCE,
            "iat": now,
            "exp": token_expires_at,
            "jti": secrets.token_hex(16),
        },
        settings.jwt_secret,
        algorithm="HS256",
    )
    return token, challenge.wallet_address, token_expires_at, challenge.chain_id


def require_wallet(
    credentials: HTTPAuthorizationCredentials | None,
) -> AuthenticatedWallet:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Wallet authentication is required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        claims = jwt.decode(
            credentials.credentials,
            settings.jwt_secret,
            algorithms=["HS256"],
            issuer=TOKEN_ISSUER,
            audience=TOKEN_AUDIENCE,
            options={"require": ["sub", "chain_id", "exp", "iat", "iss", "aud", "jti"]},
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token is invalid or expired",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    address = _normalized_wallet(str(claims["sub"]))
    chain_id = int(claims["chain_id"])
    if chain_id != settings.chain_id:
        raise HTTPException(status_code=401, detail="Access token has the wrong chain")
    return AuthenticatedWallet(address=address.lower(), chain_id=chain_id)


def validate_request_origin(request: Request) -> None:
    origin = request.headers.get("origin")
    if not origin or origin.rstrip("/") != settings.siwe_origin.rstrip("/"):
        raise HTTPException(status_code=403, detail="Request origin is not allowed")


def _build_message(
    wallet: str,
    chain_id: int,
    nonce: str,
    issued_at: datetime,
    expires_at: datetime,
) -> str:
    return (
        f"{settings.siwe_domain} wants you to sign in with your Ethereum account:\n"
        f"{wallet}\n\n"
        f"{SIGN_IN_STATEMENT}\n\n"
        f"URI: {settings.siwe_origin}\n"
        "Version: 1\n"
        f"Chain ID: {chain_id}\n"
        f"Nonce: {nonce}\n"
        f"Issued At: {issued_at.isoformat().replace('+00:00', 'Z')}\n"
        f"Expiration Time: {expires_at.isoformat().replace('+00:00', 'Z')}"
    )


def _parse_message(message: str) -> dict[str, str]:
    lines = message.splitlines()
    try:
        if len(lines) != 11 or not lines[0].endswith(
            " wants you to sign in with your Ethereum account:"
        ):
            raise ValueError
        if lines[2] or lines[4] or lines[3] != SIGN_IN_STATEMENT or lines[6] != "Version: 1":
            raise ValueError
        values = {
            "domain": lines[0].removesuffix(" wants you to sign in with your Ethereum account:"),
            "address": lines[1],
            "uri": lines[5].removeprefix("URI: "),
            "chain_id": lines[7].removeprefix("Chain ID: "),
            "nonce": lines[8].removeprefix("Nonce: "),
            "issued_at": lines[9].removeprefix("Issued At: "),
            "expires_at": lines[10].removeprefix("Expiration Time: "),
        }
    except (IndexError, ValueError) as exc:
        raise HTTPException(status_code=401, detail="Malformed EIP-4361 message") from exc
    if not values["nonce"].isalnum() or len(values["nonce"]) < 8:
        raise HTTPException(status_code=401, detail="Malformed EIP-4361 nonce")
    _normalized_wallet(values["address"])
    origin = urlparse(values["uri"])
    if not origin.scheme or not origin.netloc:
        raise HTTPException(status_code=401, detail="Malformed EIP-4361 URI")
    return values


def _normalized_wallet(value: str) -> str:
    if not Web3.is_address(value):
        raise HTTPException(status_code=422, detail="Invalid wallet address")
    return Web3.to_checksum_address(value)


def _sha256(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()
