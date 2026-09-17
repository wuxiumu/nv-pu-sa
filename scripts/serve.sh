#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-8788}"
HOST="${HOST:-127.0.0.1}"
cd "$ROOT"

if command -v lsof >/dev/null 2>&1; then
  if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "错误: 端口 ${PORT} 已被占用。" >&2
    echo "当前占用进程:" >&2
    lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >&2 || true
    echo >&2
    echo "处理方式任选其一:" >&2
    echo "  1) 直接打开已在跑的服务: http://${HOST}:${PORT}/" >&2
    echo "  2) 结束占用后重试: kill \$(lsof -t -nP -iTCP:${PORT} -sTCP:LISTEN)" >&2
    echo "  3) 换端口启动: PORT=8789 ./scripts/serve.sh" >&2
    exit 1
  fi
fi

echo "nv-pu-sa → http://${HOST}:${PORT}/"
echo "root: $ROOT"
exec python3 -m http.server "$PORT" --bind "$HOST"
