# Blog 仓库 HANDOFF

更新时间：2026-04-01 00:43（Asia/Shanghai）

## 先看这 11 句话

1. 这份 handoff 不是只看 git 写出来的，结合了本地仓库状态、服务器实测结果，以及最近几小时的 Codex 会话记录：`~/.codex/sessions/2026/03/31/*.jsonl`。
2. 用户已经明确决定：不要新建仓库，直接把当前 `Blog` 仓库改造成基于 `Innei-dev/Yohaku` 源码的新前端仓库，继续沿用现在这个仓库历史和远端。
3. 当前 `Blog` 仓库已经完成 Yohaku 接管并本地提交，分支仍是 `codex/modify`，现有 `.git` 历史和远端保持不变。
4. 上游拉取与构建已验证：临时克隆目录是 `/tmp/yohaku-import.jBOASL`，上游分支 `main`，确认过的快照 commit 是 `58a53b7`。
5. 本地验证已经通过：`pnpm install` 成功，`NEXT_PUBLIC_API_URL=https://api.418122.xyz/api/v2 NEXT_PUBLIC_GATEWAY_URL=https://api.418122.xyz pnpm --filter @shiro/web build` 成功；接管提交已落在本地 commit `9b0158e feat(blog): 切换到 Yohaku 前端源码`。
6. 服务器已经从源码构建并运行新的 `yohaku` 容器，当前公网 `https://418122.xyz` 和 `https://www.418122.xyz` 都已切到 Yohaku，新前端实际在线。
7. 当前线上返回的是 Yohaku/Next.js 页面，且 `https://api.418122.xyz/api/v2/ping` 返回 `{"data":"pong"}`；切流已完成，不再是“准备切流”的状态。
8. 站点 owner 账号已经不再是初始化占位值，当前已改成：
   - username：`zhenghanoo`
   - email：`z411622h@163.com`
   - password：用户指定值，已实测登录成功
9. 2026-04-01 新排掉了一个真实线上 bug：后台“修改头像后不显示/看起来像保存不了”不是 Mongo 或保存接口坏了，而是后台上传返回旧的 `/objects/...` 路径，而当前服务真正公开的是 `/api/v2/files/...`。
10. 已在服务器 `Caddyfile` 增加 `/objects/* -> /api/v2/files/*` 的兼容转发，并通过 `docker compose up -d --force-recreate caddy` 生效；现在旧头像 URL 在 `https://api.418122.xyz` 和 `https://418122.xyz` 下都返回 `200`。
11. 下一位 agent 如果要继续，最有价值的动作不是重新部署，而是替换线上 placeholder 内容/配置，决定是否 push 当前分支，并考虑是否要从上游根治后台返回旧头像 URL 的问题。

---

## 这份 handoff 的证据来源

### A. 本地仓库与文件

- 当前仓库：`/Users/zhenghan/Documents/GitHub/Blog`
- `git status --short`
- `git branch --show-current`
- `UPSTREAM.md`
- `docs/superpowers/specs/2026-03-31-yohaku-takeover-design.md`
- `docs/superpowers/plans/2026-03-31-yohaku-takeover.md`
- 本文件 `HANDOFF.md`

### B. 本地 Codex 会话记录

重点相关的 session：

- `~/.codex/sessions/2026/03/31/rollout-2026-03-31T14-42-58-019d42a1-94f1-7061-b808-236ff481a09f.jsonl`
- `~/.codex/sessions/2026/03/31/rollout-2026-03-31T17-15-33-019d432d-45b3-7731-85f4-b801566909f0.jsonl`
- `~/.codex/sessions/2026/03/31/rollout-2026-03-31T19-01-06-019d438d-e8fb-71e3-aacb-fd742c7ba568.jsonl`
- `~/.codex/sessions/2026/03/31/rollout-2026-03-31T19-41-46-019d43b3-23d3-7743-b735-7b197494dbcb.jsonl`
- `~/.codex/sessions/2026/03/31/rollout-2026-03-31T22-11-18-019d443c-0a96-71e1-85a9-c9fa54836689.jsonl`

说明：

- 这几份 transcript 覆盖了“清空旧仓库”“确认用户有 Yohaku 私有仓库权限”“决定直接用私有源码接管 Blog 仓库”“服务器源码构建”“最后切流与验证”。
- 下文凡是标注成“来自会话记录”的结论，表示不是只靠 git 倒推，而是能在本地 transcript 中找到真实上下文。

### C. 服务器实时验证

通过 SSH 直连服务器完成的真实检查：

- SSH：`ssh -i ~/.ssh/macair4.pem root@43.153.75.156`
- 容器状态：`docker ps`
- 本机直连 Yohaku：`curl -I -s http://127.0.0.1:2323`
- Caddy / yohaku 日志：`docker logs`
- 公网 smoke test：
  - `curl -I -s https://418122.xyz`
  - `curl -I -s https://www.418122.xyz`
  - `curl -s https://api.418122.xyz/api/v2/ping`

---

## 用户已经明确确认过的关键决策

这些不是推断，是对话里明确说过的：

- 用户对 `Innei-dev/Yohaku` 私有仓库有权限。
- 用户明确不要新建单独新仓库，而是直接基于当前 `Blog` 仓库历史和远端接管。
- 用户同意直接通过 SSH 连服务器操作，不再依赖腾讯云控制台作为主路径。
- 用户不要求先迁移旧博客真实内容，接受先让站点以占位数据跑起来。
- 用户要求 handoff 不能只看 git，必须结合最近几小时的对话记录。

---

## 按最近几小时的真实进展还原

### 阶段 1：旧 Blog 仓库已经不是业务代码仓，而是接管入口

更早的会话里，旧业务文件已经被整仓删除，并曾提交到当前分支：

- 分支：`codex/modify`
- 旧最近 commit：`b5fae84`
- 提交信息：`chore(repo): 清空旧博客业务文件`

这意味着现在的 `Blog` 仓库不是“继续修旧站”，而是承接新的 Yohaku 前端。

### 阶段 2：决策从“修旧镜像”切到“直接拉私有 Yohaku 源码”

来自会话记录的关键判断：

- 旧版 `innei/shiro:1.2.3` 已被怀疑与当前 `MixSpace Core` 接口契约不兼容。
- 用户同意改走更直接的方案：
  - 保留现有 `MixSpace Core`
  - 不再围着老镜像修补
  - 直接基于私有 `Innei-dev/Yohaku` 源码构建新版前端

### 阶段 3：本地仓库已被 Yohaku 源码快照替换并提交

已经完成的事情：

- 只读验证了 `git@github.com:Innei-dev/Yohaku.git`
- 将私有仓库克隆到临时目录：
  - `/tmp/yohaku-import.jBOASL`
- 确认上游：
  - branch: `main`
  - commit: `58a53b7`
- 通过 `rsync` 把 Yohaku 工作树同步到当前 `Blog` 仓库，同时保留本地 `.git` 历史和远端
- 新增 `UPSTREAM.md` 记录上游来源

后续收口已经完成：

- 当前分支：`codex/modify`
- 接管提交：`9b0158e feat(blog): 切换到 Yohaku 前端源码`
- 当前 `git status --short` 为空，工作树干净

### 阶段 4：本地构建验证已经完成

已真实跑通过的本地命令：

```bash
pnpm install
NEXT_PUBLIC_API_URL=https://api.418122.xyz/api/v2 \
NEXT_PUBLIC_GATEWAY_URL=https://api.418122.xyz \
pnpm --filter @shiro/web build
```

结果：

- 依赖安装成功
- `@shiro/web` 构建成功
- 这说明本地接管后的代码至少在当前环境下可构建

额外观察：

- `pnpm-workspace.yaml` 里有 `haklex/*`，但快照里没有 `haklex` 目录；当前安装和构建并未因此失败。
- `.gitmodules` 提到 `reporter-assets`，但当前构建也未被它阻塞。

### 阶段 5：服务器已经切到源码构建的 Yohaku

服务器现状已真实执行并验证：

- 机器：`43.153.75.156`
- SSH：
  - `ssh -i ~/.ssh/macair4.pem root@43.153.75.156`
- 当前主目录：
  - `/opt/mxspace`
- 上传的源码目录：
  - `/opt/yohaku-src`

之前已经做过：

- 备份：
  - `/opt/backups/yohaku-20260331/docker-compose.yml.bak`
  - `/opt/backups/yohaku-20260331/Caddyfile.bak`
- 服务器 compose 已改成从源码构建 `yohaku`

当前确认过的 `yohaku` 运行方式：

- image: `blog-yohaku:latest`
- build context: `/opt/yohaku-src`
- 端口：
  - `127.0.0.1:2323:2323`
- 关键 env：
  - `NEXT_PUBLIC_API_URL=https://api.418122.xyz/api/v2`
  - `NEXT_PUBLIC_GATEWAY_URL=https://api.418122.xyz`
  - `API_URL=http://app:2333/api/v2`

已执行且成功的服务重建命令：

```bash
ssh -i ~/.ssh/macair4.pem root@43.153.75.156 \
  'cd /opt/mxspace && docker compose up -d --build yohaku'
```

### 阶段 6：根域名已经切流成功

本轮最后确认下来的真实状态：

- `docker ps` 显示：
  - `yohaku`：`blog-yohaku:latest`
  - `mx-caddy`
  - `mx-server`
  - `mongo`
  - `redis`
- `curl -I -s http://127.0.0.1:2323` 返回 `HTTP/1.1 200 OK`
- `curl -I -s https://418122.xyz` 返回：
  - `HTTP/2 200`
  - `x-powered-by: Next.js`
  - `x-middleware-rewrite: /zh`
  - `via: 1.1 Caddy`
- `curl -I -s https://www.418122.xyz` 也返回同样的 Next.js 头
- `curl -s https://api.418122.xyz/api/v2/ping` 返回：

```json
{"data":"pong"}
```

公网根域名当前返回的 HTML 已经是 Yohaku/Next.js 页面，不再是旧 Astro 静态站。

---

## 刚刚这个会话里最关键的坑

### 症状

一开始看起来像是：

- 宿主机 `/opt/mxspace/Caddyfile` 已经被改成了：

```caddy
418122.xyz, www.418122.xyz {
  encode gzip zstd
  reverse_proxy yohaku:2323
}
```

- 但公网和源站实际返回的仍是旧静态站 HTML。

### 真正根因

`mx-caddy` 使用的是“单文件 bind mount”：

- `/opt/mxspace/Caddyfile:/etc/caddy/Caddyfile:ro`

而之前修改 Caddyfile 用的是类似 `perl -0pi` 这种“原子替换文件 inode”的方式。

结果是：

- 宿主机路径已经变成新文件
- 但容器里仍然挂着旧 inode
- 所以 `docker exec mx-caddy cat /etc/caddy/Caddyfile` 看到的还是老配置

### 有效修复

不要只 `caddy reload`。

正确做法是强制重建 `mx-caddy` 容器，让它重新挂到新的宿主机文件 inode：

```bash
ssh -i ~/.ssh/macair4.pem root@43.153.75.156 '
  cd /opt/mxspace &&
  docker compose up -d --force-recreate caddy
'
```

重建之后再看：

- 容器内 `/etc/caddy/Caddyfile` 已变成 `reverse_proxy yohaku:2323`
- 公网随即返回 Yohaku/Next.js 页面

### 对下一位 agent 的直接结论

如果以后还要改 `/opt/mxspace/Caddyfile`：

- 最稳妥的方式是改完后 `docker compose up -d --force-recreate caddy`
- 不要假设“宿主机文件已变更 = 容器内单文件挂载已同步”

---

## 当前本地仓库状态

- 路径：`/Users/zhenghan/Documents/GitHub/Blog`
- 分支：`codex/modify`
- 当前远端仍是原 Blog 远端，没有改 repo：
  - `origin = https://github.com/V-IOLE-T/Blog.git`
- 最近关键 commit：
  - `9b0158e feat(blog): 切换到 Yohaku 前端源码`
  - `b5fae84 chore(repo): 清空旧博客业务文件`
- 当前 `git status --short` 为空，工作树干净

也就是说：

- 本地真实代码已经到位
- git 历史里已经记录了这次接管
- 是否推送到原远端，还需要按用户意图决定

---

## 当前服务器状态

### 服务

`docker ps` 最近一次确认结果：

- `yohaku` -> `blog-yohaku:latest`
- `mx-caddy` -> `caddy:2-alpine`
- `mx-server` -> `innei/mx-server:latest`
- `mongo` -> `mongo:7`
- `redis` -> `redis:alpine`

### 路径

- compose / Caddy：
  - `/opt/mxspace/docker-compose.yml`
  - `/opt/mxspace/Caddyfile`
- 源码：
  - `/opt/yohaku-src`
- 备份：
  - `/opt/backups/yohaku-20260331/`

### 现在公网是什么

现在公网已经是：

- `418122.xyz` -> Caddy -> `yohaku:2323`
- `www.418122.xyz` -> Caddy -> `yohaku:2323`
- `api.418122.xyz` -> Caddy -> `app:2333`

### 当前站点内容性质

当前首页不是旧个人 Astro 站，也不是空白错误页。

当前返回的是：

- Yohaku / Next.js
- 站点标题为“我的小世界呀 - 哈喽~欢迎光临”
- 使用的是之前已接受的“最小占位 / placeholder”思路

---

## 2026-04-01 新增进展：账号与头像

### Owner 账号已经替换成用户指定值

已完成并验证：

- username：`zhenghanoo`
- email：`z411622h@163.com`
- password：用户指定值，已通过 `POST /api/v2/auth/sign-in/username` 实测登录成功

数据库结构里相关文档当前对应关系：

- `readers._id = ObjectId("69cbbe672b60836536a13af5")`
- `owner_profiles.readerId = ObjectId("69cbbe672b60836536a13af5")`
- `accounts.userId = ObjectId("69cbbe672b60836536a13af5")`

### 头像 bug 的根因、有效修复、以及什么没用

用户报告的现象：

- 在后台设定页上传 / 修改头像后，头像一直显示不出来，看起来也像“没保存”

真实复现证据：

- 后台设定页上传头像后，`头像 URL` 输入框会被自动写成：
  - `https://api.418122.xyz/objects/avatar/<name>`
- `mx-server` 日志会出现：
  - `Cannot GET /objects/avatar/<name>`
- 但文件本体其实已经成功落盘：
  - `/root/.mx-space/static/avatar/<name>`
- 同一个文件用真正公开路由访问是通的：
  - `https://api.418122.xyz/api/v2/files/avatar/<name>` -> `200`

结论：

- 保存动作本身是好的，`readers.image` 会被更新
- 真正坏的是“后台上传返回的 URL 还是旧 `/objects/...`，而当前后端公开下载路由已经是 `/api/v2/files/...`”
- 所以用户感知成“保存不了”，本质上更接近“保存了一个当前环境里 404 的旧资源地址”

已经验证无效或不是根因的方向：

- 不是 Mongo 没写入
- 不是文件没上传
- 不是 Yohaku 前端首页组件不显示头像
- 不是 Caddy 基础切流没成功

这次已采用、且已经验证有效的最小修复：

- 在服务器 `/opt/mxspace/Caddyfile` 的两个站点块里都增加：
  - `/objects/*` -> `uri replace /objects /api/v2/files` -> `reverse_proxy app:2333`
- 然后执行：

```bash
ssh -i ~/.ssh/macair4.pem root@43.153.75.156 '
  cd /opt/mxspace &&
  docker compose up -d --force-recreate caddy
'
```

修复后的验证结果：

- `https://api.418122.xyz/objects/avatar/u14l0nhwhlu09rq5sd.png` -> `200`
- `https://418122.xyz/objects/avatar/u14l0nhwhlu09rq5sd.png` -> `200`
- 后台页面里的该头像资源 `naturalWidth` 已大于 `0`
- 调试过程中临时写入的测试头像已恢复回原来的占位头像，避免污染正式资料

给下一位 agent 的直接建议：

- 如果用户之后再次在后台改头像，当前线上已经能正常显示旧 `/objects/...` 路径，不会再出现“明明上传了但一直裂图”
- 真正的长期方案不是再修 Caddy，而是找到上游 `mx-server` / admin 为何仍返回旧 `/objects/...` URL，并在源码或镜像层修正
- 在长期方案落地前，保留这个 Caddy 兼容映射是对的

---

## 什么有效

这些路径已被真实验证有效：

- 直接从私有 `git@github.com:Innei-dev/Yohaku.git` 拉源码，而不是继续围着旧镜像修补。
- 用 `rsync` 把 Yohaku 快照同步到当前 `Blog` 仓库，同时保留 `.git` 和原远端。
- 本地先做一次 `pnpm install` 和 `pnpm --filter @shiro/web build`，能提前排掉很多无谓线上问题。
- 服务器上把 `yohaku` 改成从 `/opt/yohaku-src` 源码构建，是有效路径。
- 先本机验证 `http://127.0.0.1:2323` 返回 `200`，再切 Caddy，是对的。
- 切完后用公网 `curl` 和日志双重验证，而不是只看容器状态。
- 对单文件 bind mount 的 Caddy 配置，改完后重建容器，是有效做法。

---

## 什么没用，或者不要再浪费时间

- 不要再把这件事理解成“从零部署 MixSpace”。Core 和 API 早就存在并可用。
- 不要再把根域名当成静态站去挂 `/srv`，当前目标已经是 Yohaku 动态前端。
- 不要再花大量时间修老的 `innei/shiro:1.2.3` 镜像。
- 不要只改宿主机 Caddyfile 然后 `caddy reload` 就以为切流完成；单文件 bind mount 会坑你。
- 不要再从 Cloudflare / nameserver / 腾讯云基础 onboarding 重新开始。

---

## 下一个 agent 最应该做什么

### 如果目标是“把这次接管收口到远端”

优先做这个：

1. 复核本地 `git status`
2. 确认是否要把 `codex/modify` 推到原 `origin`
3. 除非用户明确同意，否则不要擅自 push

### 如果目标是“继续让线上更像正式站”

优先做这个：

1. 替换当前 placeholder 站点文案、owner、主题配置
2. 决定是否迁移旧内容
3. 再做 SEO / 资源 / 域名细节收尾

### 如果只是排障

优先复核这些命令：

```bash
ssh -i ~/.ssh/macair4.pem root@43.153.75.156 'docker ps'
ssh -i ~/.ssh/macair4.pem root@43.153.75.156 'curl -I -s http://127.0.0.1:2323'
curl -I -s https://418122.xyz
curl -I -s https://www.418122.xyz
curl -s https://api.418122.xyz/api/v2/ping
ssh -i ~/.ssh/macair4.pem root@43.153.75.156 'docker logs --tail 80 yohaku'
ssh -i ~/.ssh/macair4.pem root@43.153.75.156 'docker logs --tail 80 mx-caddy'
```

---

## 对接手者的最短结论

这件事现在已经不再是“要不要接管 Yohaku”，也不再是“服务器能不能跑起来”。

当前真实状态是：

- 私有 Yohaku 源码已经进了当前 `Blog` 仓库工作树
- 本地接管 commit 已存在，且工作树干净
- 本地构建通过
- 服务器源码构建通过
- 根域名已经切到 Yohaku
- API 正常
- 后台头像旧路径兼容已修复
- 最大未收口项是：
  - 线上仍是 placeholder 内容，还不是最终正式内容
  - 当前分支是否 push 到原远端还没最终决定
  - 后台上传头像为什么仍返回旧 `/objects/...` 路径，还没有从上游根治

如果时间有限，只看本文件就足够继续。
