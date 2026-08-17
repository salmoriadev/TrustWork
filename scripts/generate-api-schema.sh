#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export UV_CACHE_DIR="${UV_CACHE_DIR:-${TMPDIR:-/tmp}/trustwork-uv-cache}"

uv run --project "$ROOT/backend" --locked python \
  "$ROOT/backend/scripts/export_openapi.py" "$ROOT/backend/openapi.json"
npm run api:generate --prefix "$ROOT/frontend"

echo "OpenAPI schema and TypeScript contract generated"
