#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-8788}"
HOST="${HOST:-127.0.0.1}"
cd "$ROOT"
echo "nv-pu-sa → http://${HOST}:${PORT}/"
echo "root: $ROOT"
exec python3 -m http.server "$PORT" --bind "$HOST"
