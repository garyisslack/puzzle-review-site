#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

pnpm test
pnpm --filter @puzzle/web build

tar czf - -C apps/web/dist . | ssh game-jp 'mkdir -p /opt/dimpuzzle/current && tar xzf - -C /opt/dimpuzzle/current'

echo "Synced to game-jp:/opt/dimpuzzle/current"
ssh game-jp 'systemctl is-active dimpuzzle-static && curl -fsS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:5210/'
