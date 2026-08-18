#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ANVIL_PORT="${ANVIL_PORT:-8545}"
POSTGRES_PORT="${POSTGRES_PORT:-55432}"
BACKEND_PORT="${BACKEND_PORT:-18080}"
FRONTEND_PORT="${FRONTEND_PORT:-15174}"
DEMO_TMP="$(mktemp -d)"
INDEXER_TOKEN="local-indexer-token"

info() { printf '[INFO] %s\n' "$*"; }
ok() { printf '[OK]   %s\n' "$*"; }
fail() { printf '[ERROR] %s\n' "$*" >&2; exit 1; }

cleanup() {
  for pid in "${FRONTEND_PID:-}" "${BACKEND_PID:-}" "${ANVIL_PID:-}"; do
    if [[ -n "$pid" ]]; then kill "$pid" 2>/dev/null || true; fi
  done
  rm -r "$DEMO_TMP" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

for command in docker anvil forge cast curl uv npm python3; do
  command -v "$command" >/dev/null || fail "$command is required"
done

port_must_be_free() {
  local port="$1"
  if ss -tln 2>/dev/null | awk '{print $4}' | grep -Eq "(^|:)${port}$"; then
    fail "Port ${port} is already in use"
  fi
}

port_must_be_free "$ANVIL_PORT"
port_must_be_free "$BACKEND_PORT"
port_must_be_free "$FRONTEND_PORT"

info "Starting PostgreSQL"
POSTGRES_PORT="$POSTGRES_PORT" docker compose -f "$ROOT/docker-compose.yml" up -d postgres
for attempt in $(seq 1 30); do
  if POSTGRES_PORT="$POSTGRES_PORT" docker compose -f "$ROOT/docker-compose.yml" exec -T postgres pg_isready -U postgres -d trustwork >/dev/null 2>&1; then
    break
  fi
  [[ "$attempt" -lt 30 ]] || fail "PostgreSQL did not become ready"
  sleep 1
done
ok "PostgreSQL is ready"
if ! POSTGRES_PORT="$POSTGRES_PORT" docker compose -f "$ROOT/docker-compose.yml" exec -T \
  postgres psql -U postgres -Atqc "SELECT 1 FROM pg_database WHERE datname = 'trustwork_demo'" \
  | grep -qx 1; then
  POSTGRES_PORT="$POSTGRES_PORT" docker compose -f "$ROOT/docker-compose.yml" exec -T \
    postgres createdb -U postgres trustwork_demo
fi

info "Starting an isolated Anvil chain"
anvil --host 127.0.0.1 --port "$ANVIL_PORT" --config-out "$DEMO_TMP/anvil.json" >"$DEMO_TMP/anvil.log" 2>&1 &
ANVIL_PID=$!
for attempt in $(seq 1 30); do
  if cast chain-id --rpc-url "http://127.0.0.1:${ANVIL_PORT}" >/dev/null 2>&1; then break; fi
  [[ "$attempt" -lt 30 ]] || fail "Anvil did not become ready"
  sleep 1
done

readarray -t ANVIL_VALUES < <(python3 - "$DEMO_TMP/anvil.json" <<'PY'
import json, sys
data = json.load(open(sys.argv[1], encoding="utf-8"))
print(data["private_keys"][0])
print(data["available_accounts"][1])
PY
)
DEMO_PRIVATE_KEY="${ANVIL_VALUES[0]}"
DEMO_FREELANCER="${ANVIL_VALUES[1]}"

info "Deploying the local test token and TrustWork escrow"
DEPLOY_OUTPUT="$({
  cd "$ROOT/contracts"
  PRIVATE_KEY="$DEMO_PRIVATE_KEY" forge script script/DeployLocal.s.sol:DeployLocal \
    --broadcast --rpc-url "http://127.0.0.1:${ANVIL_PORT}"
} 2>&1)"
ESCROW_ADDRESS="$(sed -nE 's/.*FreelanceEscrow:[[:space:]]+(0x[0-9a-fA-F]+).*/\1/p' <<<"$DEPLOY_OUTPUT" | head -1)"
USDC_ADDRESS="$(sed -nE 's/.*MockUSDC:[[:space:]]+(0x[0-9a-fA-F]+).*/\1/p' <<<"$DEPLOY_OUTPUT" | head -1)"
ADMIN_ADDRESS="$(sed -nE 's/.*Deployer\/Admin:[[:space:]]+(0x[0-9a-fA-F]+).*/\1/p' <<<"$DEPLOY_OUTPUT" | head -1)"
[[ -n "$ESCROW_ADDRESS" && -n "$USDC_ADDRESS" ]] || fail "Could not parse deployed contract addresses"

info "Creating and funding a clearly local demo job"
(
  cd "$ROOT/contracts"
  PRIVATE_KEY="$DEMO_PRIVATE_KEY" \
  DEMO_FREELANCER="$DEMO_FREELANCER" \
  ESCROW_CONTRACT_ADDRESS="$ESCROW_ADDRESS" \
  USDC_CONTRACT_ADDRESS="$USDC_ADDRESS" \
  forge script script/CreateDemoJob.s.sol:CreateDemoJob \
    --broadcast --rpc-url "http://127.0.0.1:${ANVIL_PORT}" >/dev/null
)

DATABASE_URL="postgresql+psycopg://postgres:postgres@127.0.0.1:${POSTGRES_PORT}/trustwork_demo"
info "Applying database migrations"
(
  cd "$ROOT/backend"
  DATABASE_URL="$DATABASE_URL" uv run --locked alembic upgrade head
)

info "Starting the TrustWork API"
(
  cd "$ROOT/backend"
  APP_ENVIRONMENT=development \
  DATABASE_URL="$DATABASE_URL" \
  CHAIN_ID=31337 \
  RPC_URL="http://127.0.0.1:${ANVIL_PORT}" \
  ESCROW_CONTRACT_ADDRESS="$ESCROW_ADDRESS" \
  USDC_CONTRACT_ADDRESS="$USDC_ADDRESS" \
  ESCROW_ARBITRATOR="$ADMIN_ADDRESS" \
  API_CORS_ORIGINS="http://localhost:${FRONTEND_PORT},http://127.0.0.1:${FRONTEND_PORT}" \
  SIWE_DOMAIN="localhost:${FRONTEND_PORT}" \
  SIWE_ORIGIN="http://localhost:${FRONTEND_PORT}" \
  INDEXER_CONFIRMATIONS=0 \
  INDEXER_TOKEN="$INDEXER_TOKEN" \
  uv run --locked uvicorn app.main:app --host 127.0.0.1 --port "$BACKEND_PORT"
) >"$DEMO_TMP/backend.log" 2>&1 &
BACKEND_PID=$!
for attempt in $(seq 1 45); do
  if curl -fsS "http://127.0.0.1:${BACKEND_PORT}/health/live" >/dev/null 2>&1; then break; fi
  [[ "$attempt" -lt 45 ]] || { sed -n '1,160p' "$DEMO_TMP/backend.log" >&2; fail "API did not become ready"; }
  sleep 1
done
if ! curl -fsS -X POST -H "X-Indexer-Token: ${INDEXER_TOKEN}" \
  "http://127.0.0.1:${BACKEND_PORT}/indexer/reconcile" >/dev/null; then
  sleep 1
  sed -n '1,200p' "$DEMO_TMP/backend.log" >&2
  fail "The local index reconciliation failed"
fi
ok "The local job is indexed"

info "Starting the frontend"
(
  cd "$ROOT/frontend"
  VITE_API_BASE_URL="http://127.0.0.1:${BACKEND_PORT}" \
  VITE_RPC_URL="http://127.0.0.1:${ANVIL_PORT}" \
  VITE_CHAIN_ID=31337 \
  VITE_ESCROW_CONTRACT_ADDRESS="$ESCROW_ADDRESS" \
  VITE_USDC_CONTRACT_ADDRESS="$USDC_ADDRESS" \
  VITE_ENABLE_DEMO_DATA=false \
  npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT"
) >"$DEMO_TMP/frontend.log" 2>&1 &
FRONTEND_PID=$!
for attempt in $(seq 1 45); do
  if curl -fsS "http://127.0.0.1:${FRONTEND_PORT}/app" >/dev/null 2>&1; then break; fi
  [[ "$attempt" -lt 45 ]] || { sed -n '1,160p' "$DEMO_TMP/frontend.log" >&2; fail "Frontend did not become ready"; }
  sleep 1
done

printf '\nTrustWork local demo is ready\n'
printf '  Landing:     http://localhost:%s/\n' "$FRONTEND_PORT"
printf '  Marketplace: http://localhost:%s/app\n' "$FRONTEND_PORT"
printf '  API:         http://127.0.0.1:%s\n' "$BACKEND_PORT"
printf '  Escrow:      %s\n' "$ESCROW_ADDRESS"
printf '\nThis is an isolated local chain. Press Ctrl+C to stop the app processes.\n'
wait
