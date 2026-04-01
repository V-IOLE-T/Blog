# VPS 前端回退与运维说明（应急路径）

本文档只描述一件事：当 Vercel 前端异常时，如何**人工**把前端临时回退到 VPS，以及问题修复后如何切回 Vercel。

> 当前正式形态：`Vercel 前端 + VPS API-only`
>
> 默认情况下，**不要**让 VPS 承载前端。只有在 Vercel 明确异常、且需要短期止损时，才进入本文档的回退流程。

## 1. 当前服务器基线

服务器：

- 主机：`43.153.75.156`
- SSH：`ssh -i ~/.ssh/macair4.pem root@43.153.75.156`
- 工作目录：`/opt/mxspace`

当前 VPS 只应承载以下服务：

- `mx-caddy`
- `mx-server`
- `mongo`
- `redis`

默认不应运行：

- `yohaku`

当前关键文件：

- 主 compose：`/opt/mxspace/docker-compose.yml`
- compose override：`/opt/mxspace/docker-compose.override.yml`
- 当前生效的 Caddy 配置：`/opt/mxspace/Caddyfile`
- 前端入口移除前的 Caddy 备份：`/opt/mxspace/Caddyfile.bak-20260401-frontend-detach`
- 前端降级为 rollback profile 前的 compose 备份：`/opt/mxspace/docker-compose.yml.bak-20260401-yohaku-rollback-profile`

## 2. 当前默认约束

为了避免误操作把前端带回 VPS，服务器现在有两个保护：

1. `/opt/mxspace/Caddyfile` 只保留 `api.418122.xyz`，不再监听：
   - `418122.xyz`
   - `www.418122.xyz`
2. `docker-compose.yml` 里的 `yohaku` 已改成：
   - `profiles: [rollback]`
   - 也就是说，普通的 `docker compose up -d` **不会**启动 `yohaku`

### 日常不要做的事

- 不要把 `418122.xyz` / `www.418122.xyz` 手工重新加回当前 `Caddyfile`
- 不要把 `yohaku` 从 `rollback profile` 改回默认 service
- 不要把 VPS 前端重新定义为“主发布路径”
- 不要再使用 `docker compose build yohaku` 作为常规上线方式

## 3. 日常检查命令

确认 VPS 仍是 API-only 形态：

```bash
ssh -i ~/.ssh/macair4.pem root@43.153.75.156 '
  cd /opt/mxspace &&
  docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
'
```

预期：

- 有 `mx-caddy`、`mx-server`、`mongo`、`redis`
- 没有 `yohaku`

确认默认 compose 不会带起前端：

```bash
ssh -i ~/.ssh/macair4.pem root@43.153.75.156 '
  cd /opt/mxspace &&
  docker compose config --services
'
```

预期：

- 可以看到 `yohaku`
- 但它只应在 `rollback` profile 中使用，不应因普通 `docker compose up -d` 被带起

确认公网前端不经过 VPS：

```bash
curl -I -sS https://418122.xyz/
curl -I -sS https://418122.xyz/en
curl -I -sS https://418122.xyz/dashboard
```

预期：

- 返回 `server: Vercel`

确认强制命中 VPS 时，前端 host 不可用：

```bash
curl -k -I -sS --resolve 418122.xyz:443:43.153.75.156 https://418122.xyz/
curl -k -I -sS --resolve www.418122.xyz:443:43.153.75.156 https://www.418122.xyz/
```

预期：

- TLS 握手失败，或至少不能返回前端 HTML

## 4. 什么时候允许回退到 VPS 前端

只有在下面条件成立时，才建议回退：

1. Vercel 前端生产环境明确不可用
2. 已确认问题不在 `api.418122.xyz`
3. 短时间内无法通过重新部署 Vercel 恢复
4. 需要先让用户有一个可用前台页面

若只是单页、单功能或单次发布异常，优先修复 Vercel，不要立刻回退 VPS。

## 5. 应急回退到 VPS 前端

### 步骤 1：恢复 apex/www 的 Caddy 站点块

最稳妥的方法是先恢复之前备份的配置，再按当前 API 路由规则复核。

```bash
ssh -i ~/.ssh/macair4.pem root@43.153.75.156 '
  set -e
  cd /opt/mxspace
  cp Caddyfile.bak-20260401-frontend-detach Caddyfile
  docker run --rm \
    -v /opt/mxspace/Caddyfile:/etc/caddy/Caddyfile:ro \
    caddy:2-alpine \
    caddy validate --config /etc/caddy/Caddyfile
'
```

### 步骤 2：只用 rollback profile 启动前端

```bash
ssh -i ~/.ssh/macair4.pem root@43.153.75.156 '
  set -e
  cd /opt/mxspace
  docker compose --profile rollback up -d yohaku
  docker compose up -d --force-recreate caddy
'
```

### 步骤 3：确认 VPS 前端真的起来了

```bash
ssh -i ~/.ssh/macair4.pem root@43.153.75.156 '
  docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
'

ssh -i ~/.ssh/macair4.pem root@43.153.75.156 '
  curl -I -s http://127.0.0.1:2323
'
```

预期：

- `yohaku` 在运行
- `127.0.0.1:2323` 返回 `200`

### 步骤 4：再决定是否把公网流量切回 VPS

只有在确认 `yohaku` 容器本身可用后，才去改 DNS 或代理，把：

- `418122.xyz`
- `www.418122.xyz`

切回 VPS。

### 步骤 5：回退后的验收

```bash
curl -I -sS https://418122.xyz/
curl -I -sS https://www.418122.xyz/
curl -I -sS https://api.418122.xyz/api/v2/ping
```

至少确认：

- 两个前端域名返回 `200`
- 页面能正常渲染
- API 仍正常
- owner 登录正常
- 前台 `Console` 按钮仍能跳到 `https://api.418122.xyz/proxy/qaqdmin`

## 6. 从 VPS 前端恢复回 Vercel

当 Vercel 修好后，应尽快恢复主路径。

### 步骤 1：先确认 Vercel 已恢复

至少确认：

- Vercel Deployment 状态为 `Ready`
- `https://418122.xyz/`、`/dashboard` 在 Vercel 上可正常访问
- 前台与后台关键链路正常

### 步骤 2：把公网流量切回 Vercel

在 DNS 或上游代理侧恢复：

- `418122.xyz`
- `www.418122.xyz`

到 Vercel 的正式指向。

### 步骤 3：把 VPS 再次降回 API-only

```bash
ssh -i ~/.ssh/macair4.pem root@43.153.75.156 '
  set -e
  cd /opt/mxspace
  cat > Caddyfile <<\"EOF\"
api.418122.xyz {
  encode gzip zstd

  @objects path /objects/*
  handle @objects {
    uri replace /objects /api/v2/files
    reverse_proxy app:2333
  }

  @files path /files/*
  handle @files {
    uri replace /files /api/v2/files
    reverse_proxy app:2333
  }

  reverse_proxy app:2333
}
EOF

  docker run --rm \
    -v /opt/mxspace/Caddyfile:/etc/caddy/Caddyfile:ro \
    caddy:2-alpine \
    caddy validate --config /etc/caddy/Caddyfile

  docker compose up -d --force-recreate caddy
  docker compose stop yohaku
  docker rm -f yohaku >/dev/null 2>&1 || true
'
```

### 步骤 4：恢复后的验收

```bash
curl -I -sS https://418122.xyz/
curl -I -sS https://418122.xyz/dashboard
curl -I -sS https://api.418122.xyz/api/v2/ping
curl -k -I -sS --resolve 418122.xyz:443:43.153.75.156 https://418122.xyz/
```

预期：

- 前端域名返回 `server: Vercel`
- API 正常
- 强制命中 VPS 时不再能拿到前端页面

## 7. 最常见的误操作

### 误操作 1：在 VPS 上直接 `docker compose up -d --build yohaku`

问题：

- 会把前端重新放回 VPS
- 容易让“当前主路径到底是 Vercel 还是 VPS”重新混乱

正确做法：

- 默认不要做
- 只有在明确执行“应急回退”时，才用：
  - `docker compose --profile rollback up -d yohaku`

### 误操作 2：恢复旧 Caddy 但忘了改 DNS

问题：

- VPS 已经能接前端，但公网可能仍走 Vercel
- 最终会形成“双活错觉”，排障非常痛苦

正确做法：

- 先确认是要回退
- 然后按顺序做：
  - 恢复 Caddy
  - 启动 `rollback` profile
  - 验证本机 2323
  - 最后再改公网流量

### 误操作 3：Vercel 恢复后没把 VPS 再降回 API-only

问题：

- 会留下“旧前端入口仍活着”的暗雷
- 后续可能再次出现“有时像走 Vercel、有时像走 VPS”的混合现象

正确做法：

- 切回 Vercel 后，立即执行本文第 6 节，把 VPS 恢复成 API-only

## 8. 一句话运维原则

- 正常情况下：`Vercel 前端 + VPS API-only`
- 需要救火时：`rollback profile + 恢复 apex/www Caddy + 人工切流`
- 救火结束后：**立刻**把 VPS 再降回 API-only
