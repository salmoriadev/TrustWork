#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export UV_CACHE_DIR="${UV_CACHE_DIR:-${TMPDIR:-/tmp}/trustwork-uv-cache}"

for command in git npm uv forge; do
  command -v "$command" >/dev/null || {
    echo "missing required command: $command" >&2
    exit 1
  }
done

git -C "$ROOT" submodule update --init --recursive
uv sync --project "$ROOT/backend" --extra dev --locked
npm ci --prefix "$ROOT/frontend"
forge build --root "$ROOT/contracts"

echo "bootstrap complete"
