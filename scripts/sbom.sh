#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="${1:-$ROOT/artifacts}"
export UV_CACHE_DIR="${UV_CACHE_DIR:-${TMPDIR:-/tmp}/trustwork-uv-cache}"

mkdir -p "$OUTPUT_DIR"
npm sbom --prefix "$ROOT/frontend" --package-lock-only --omit=dev \
  --sbom-format cyclonedx --sbom-type application > "$OUTPUT_DIR/frontend.cdx.json"
uv export --project "$ROOT/backend" --locked --no-dev --format cyclonedx1.5 \
  --output-file "$OUTPUT_DIR/backend.cdx.json" >/dev/null
git -C "$ROOT" submodule status > "$OUTPUT_DIR/solidity-dependencies.txt"

echo "release manifests written to $OUTPUT_DIR"
