# game-jp 部署（东京 47.79.85.174）

与 Apex / United Rails 相同：**静态资源在 game-jp 本机，公网走 Cloudflare Tunnel**，源站不开放 443。

## 服务与端口

| 组件 | 端口 | 说明 |
|------|------|------|
| 静态前台 | `127.0.0.1:5210` | Caddy 托管 `apps/web/dist` |
| Payload CMS | `127.0.0.1:3000` → Caddy `:5211` | 待装 Node 服务后启用 |

初次部署目录：`/opt/dimpuzzle/current`；后续发布使用 `/opt/dimpuzzle/releases/{release_id}`，源站配置直接指向新 release，避免下线页面残留。

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

脚本先运行测试、前台类型检查与构建，再上传到独立 release，验证 Caddy 配置并切换服务。切换失败会恢复旧配置；旧文件保留用于回滚。HTTP/www 与 `index.html` 使用 301 规范化，演示评测及其衍生页返回 410。

## Tunnel

1. 在 Cloudflare Zero Trust 新建 Tunnel（建议名 `dimpuzzle-game-jp`），Public Hostname：
   - `puzzlereviewlab.com`、`www.puzzlereviewlab.com` → `http://127.0.0.1:5210`
   - （可选）`admin.puzzlereviewlab.com` → `http://127.0.0.1:5211`
2. 将隧道 **Token** 写入 game-jp：`/etc/dimpuzzle/tunnel.env`  
   `TUNNEL_TOKEN=eyJ...`
3. `ssh game-jp 'systemctl enable --now dimpuzzle-tunnel'`

生产主域：**puzzlereviewlab.com**（Cloudflare DNS + Tunnel CNAME）。

## 与 Cloudflare Pages

Pages 项目 `dimpuzzle` 可保留作预览；生产以 **game-jp + Tunnel** 为准后，可拆除 Pages 自定义域以免冲突。

GitHub 的 `.github/workflows/deploy.yml` 仅用于手动 Pages 预览，不随 `main` 推送自动运行。手动运行前需配置 `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID`；生产发布仍使用上面的 game-jp 脚本。
