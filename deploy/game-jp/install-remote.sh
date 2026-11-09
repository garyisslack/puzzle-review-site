#!/usr/bin/env bash
# 在 game-jp 上以 root 执行一次（也可由本机 ssh game-jp 'bash -s' < install-remote.sh）
set -euo pipefail

install -d -m 755 /opt/dimpuzzle/current
install -d -m 755 /etc/dimpuzzle

if [[ ! -f /etc/dimpuzzle/Caddyfile ]]; then
  echo '将 deploy/game-jp/Caddyfile 复制到 /etc/dimpuzzle/Caddyfile 后再运行本脚本' >&2
  exit 1
fi

for unit in dimpuzzle-static dimpuzzle-tunnel; do
  install -m 644 "/etc/dimpuzzle/${unit}.service" "/etc/systemd/system/${unit}.service"
done

systemctl daemon-reload
systemctl enable --now dimpuzzle-static.service

if [[ -f /etc/dimpuzzle/tunnel.env ]]; then
  systemctl enable --now dimpuzzle-tunnel.service
else
  echo '未找到 /etc/dimpuzzle/tunnel.env，跳过 tunnel。写入 TUNNEL_TOKEN=... 后执行: systemctl enable --now dimpuzzle-tunnel'
fi

curl -fsS http://127.0.0.1:5210/ >/dev/null && echo 'dimpuzzle static OK on :5210'
