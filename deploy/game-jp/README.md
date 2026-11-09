# game-jp 部署（东京 47.79.85.174）

与 Apex / United Rails 相同：**静态资源在 game-jp 本机，公网走 Cloudflare Tunnel**，源站不开放 443。

## 服务与端口

| 组件 | 端口 | 说明 |
|------|------|------|
| 静态前台 | `127.0.0.1:5210` | Caddy 托管 `apps/web/dist` |
| Payload CMS | `127.0.0.1:3000` → Caddy `:5211` | 待装 Node 服务后启用 |

文件目录：`/opt/dimpuzzle/current`

## 初次安装（game-jp）

```bash
# 本机
scp deploy/game-jp/Caddyfile game-jp:/etc/dimpuzzle/Caddyfile
scp deploy/game-jp/dimpuzzle-static.service game-jp:/etc/dimpuzzle/dimpuzzle-static.service
scp deploy/game-jp/dimpuzzle-tunnel.service game-jp:/etc/dimpuzzle/dimpuzzle-tunnel.service
ssh game-jp 'bash -s' < deploy/game-jp/install-remote.sh
```

## 发布前台

```bash
./deploy/game-jp/sync-web.sh
```

## Tunnel

1. 在 Cloudflare Zero Trust 新建 Tunnel（建议名 `dimpuzzle-game-jp`），Public Hostname：
   - `dimpuzzle.com`、`www.dimpuzzle.com` → `http://127.0.0.1:5210`
   - （可选）`admin.dimpuzzle.com` → `http://127.0.0.1:5211`
2. 将隧道 **Token** 写入 game-jp：`/etc/dimpuzzle/tunnel.env`  
   `TUNNEL_TOKEN=eyJ...`
3. `ssh game-jp 'systemctl enable --now dimpuzzle-tunnel'`

账号里若尚无 `dimpuzzle.com` 站点，需先把域名接入 Cloudflare DNS，或改用已接入的 `puzzlereviewlab.com`。

## 与 Cloudflare Pages

Pages 项目 `dimpuzzle` 可保留作预览；生产以 **game-jp + Tunnel** 为准后，可拆除 Pages 自定义域以免冲突。
