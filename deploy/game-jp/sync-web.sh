#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

pnpm test
pnpm --filter @puzzle/web typecheck
pnpm --filter @puzzle/web build

# 发布到独立目录，避免被移除的演示页/薄榜单残留在旧目录中。
release_id="$(date -u +%Y%m%dT%H%M%SZ)-$$"
release_dir="/opt/dimpuzzle/releases/$release_id"
ssh game-jp "mkdir -p '$release_dir'"
tar czf - -C apps/web/dist . | ssh game-jp "tar xzf - -C '$release_dir'"
sed "s|/opt/dimpuzzle/current|$release_dir|g" deploy/game-jp/Caddyfile | ssh game-jp "cat > '$release_dir/Caddyfile'"
ssh game-jp bash -s -- "$release_dir" <<'REMOTE'
set -euo pipefail
release_dir="$1"
config=/etc/dimpuzzle/Caddyfile
backup="/etc/dimpuzzle/Caddyfile.previous-$(basename "$release_dir")"
/usr/local/bin/caddy validate --config "$release_dir/Caddyfile" --adapter caddyfile
cp "$config" "$backup"
rollback() {
  cp "$backup" "$config"
  systemctl restart dimpuzzle-static
}
trap rollback ERR
cp "$release_dir/Caddyfile" "$config"
systemctl restart dimpuzzle-static
systemctl is-active --quiet dimpuzzle-static
curl --retry 3 --retry-delay 1 --retry-connrefused -fsS -o /dev/null http://127.0.0.1:5210/
status="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:5210/reviews/prism-pocket-sort/)"
[ "$status" = 410 ]
trap - ERR
printf '已发布：%s\n' "$release_dir"
REMOTE
