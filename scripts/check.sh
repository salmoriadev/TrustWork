#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export UV_CACHE_DIR="${UV_CACHE_DIR:-${TMPDIR:-/tmp}/trustwork-uv-cache}"

uv run --project "$ROOT/backend" --extra dev --locked ruff check "$ROOT/backend/app" "$ROOT/backend/tests"
uv run --project "$ROOT/backend" --extra dev --locked pytest "$ROOT/backend/tests"
uv run --project "$ROOT/backend" --extra dev --locked pip-audit
"$ROOT/scripts/generate-api-schema.sh"
git -C "$ROOT" diff --exit-code -- backend/openapi.json frontend/src/lib/api.generated.ts
npm run lint --prefix "$ROOT/frontend"
npm test --prefix "$ROOT/frontend"
npm run build --prefix "$ROOT/frontend"
VITE_API_BASE_URL=https://api.trustwork.example \
VITE_RPC_URL=https://sepolia.base.org \
VITE_CHAIN_ID=84532 \
VITE_ESCROW_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000001 \
VITE_USDC_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000002 \
VITE_WALLETCONNECT_PROJECT_ID=local-production-check \
VITE_ENABLE_DEMO_DATA=false \
  npm run build:production --prefix "$ROOT/frontend"
if grep -R -E "Northstar Labs|Checkout USDC para SaaS" "$ROOT/frontend/dist"; then
  echo "production bundle contains demo fixtures" >&2
  exit 1
fi
npm audit --prefix "$ROOT/frontend" --omit=dev --audit-level=high
npm run test:e2e --prefix "$ROOT/frontend"
npm run lighthouse --prefix "$ROOT/frontend"
forge fmt --check --root "$ROOT/contracts"
forge test --root "$ROOT/contracts"

if [[ "${VALIDATE_CHAIN:-0}" == "1" ]]; then
  uv run --project "$ROOT/backend" --locked python "$ROOT/backend/scripts/validate_runtime.py"
fi
