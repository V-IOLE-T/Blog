# Blog 仓库 HANDOFF

更新时间：2026-04-01 17:13（Asia/Shanghai）

> 重要：本文件末尾新增了 `## [2026-04-01 17:13] GitHub Actions -> Vercel 已跑通，待完成域名 cutover`。
> 该节是当前“可重复部署收口”的最新权威状态；若与前文冲突，以该节为准。

## 先看这 14 句话

1. 这份 handoff 不是只看 git 写出来的，结合了本地仓库状态、服务器实测结果，以及最近几小时的 Codex 会话记录：`~/.codex/sessions/2026/03/31/*.jsonl`。
2. 用户已经明确决定：不要新建仓库，直接把当前 `Blog` 仓库改造成基于 `Innei-dev/Yohaku` 源码的新前端仓库，继续沿用现在这个仓库历史和远端。
3. 当前 `Blog` 仓库已经完成 Yohaku 接管并继续沿用原 `.git` 历史和远端；当前分支仍是 `codex/modify`，最新本地 HEAD 是 `83dec24`。
4. 上游拉取与构建已验证：临时克隆目录是 `/tmp/yohaku-import.jBOASL`，上游分支 `main`，确认过的快照 commit 是 `58a53b7`。
5. 本地验证已经通过：`pnpm install` 成功，`NEXT_PUBLIC_API_URL=https://api.418122.xyz/api/v2 NEXT_PUBLIC_GATEWAY_URL=https://api.418122.xyz pnpm --filter @shiro/web build` 成功；接管提交已落在本地 commit `9b0158e feat(blog): 切换到 Yohaku 前端源码`。
6. 服务器已经从源码构建并运行新的 `yohaku` 容器，当前公网 `https://418122.xyz` 和 `https://www.418122.xyz` 都已切到 Yohaku，新前端实际在线。
7. 当前线上返回的是 Yohaku/Next.js 页面，且 `https://api.418122.xyz/api/v2/ping` 返回 `{"data":"pong"}`；切流已完成，不再是“准备切流”的状态。
8. 站点 owner 账号已经不再是初始化占位值，当前已改成：
   - username：`zhenghanoo`
   - email：`z411622h@163.com`
   - password：用户指定值，已实测登录成功
9. 2026-04-01 已确认并完成“头像上传仍返回旧 URL”的根因修复：根因不在本仓库，也不在 Mongo，而在上游 `mx-space/core` 仍把上传结果解析成旧 `/objects/...` 路径。
10. 服务器 `app` 已不再跑 `innei/mx-server:latest`，而是通过 `/opt/mx-core-src` 源码构建并运行修复后的镜像 `blog-mx-server:11.0.7-avatar-fix`；真实上传 `POST /api/v2/files/upload?type=avatar` 已返回 `https://api.418122.xyz/files/avatar/...`。
11. 仅修后端还不够，这轮还额外补了入口层：服务器 `Caddyfile` 现在同时兼容 `/objects/*` 和 `/files/*` 转发到 `/api/v2/files/*`，并已通过 `docker compose up -d --force-recreate caddy` 生效；旧路径兼容仍保留，新路径也已实测 `200` 可访问。
12. 当前本地仓库现在是干净的：`git status --short` 无输出；并且 `origin/codex/modify` 已存在，之前 handoff 里“还有 3 个未提交文件”“是否 push 仍待决定”的描述已经过期。
13. 当前线上公开聚合数据里，`seo.title = "OO's blog"`、`seo.description = "Welcome!"`；这些值不是代码里写死的，而是用户已通过现有 WebUI 改过。
14. 但首页 Hero 区域仍然使用 `theme.config.hero.description = "An initialized placeholder site for Mix Space Core and Shiro."`；用户明确反馈：当前 WebUI 里没找到这个字段，所以“首页可配置内容的轻量编辑入口”仍未完成，是最新待办。

---

## 这份 handoff 的证据来源

### A. 本地仓库与文件

- 当前仓库：`/Users/zhenghan/Documents/GitHub/Blog`
- `git status --short`
- `git branch --show-current`
- `git rev-parse --short HEAD`
- `git log --oneline --all --decorate --max-count 10`
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

### D. 2026-04-01 上午新增的线上 / 本地核对

- `curl -sS -m 20 https://api.418122.xyz/api/v2/aggregate/site`
- `curl -sS -m 20 'https://api.418122.xyz/api/v2/aggregate?theme=shiro'`
- `curl -sS -m 20 https://418122.xyz`
- `curl -sS -m 20 https://418122.xyz/dashboard`
- 当前仓库内对以下位置的代码阅读：
  - `apps/web/src/routes/vue/index.tsx`
  - `apps/web/src/app/(dashboard)/dashboard/[[...catch_all]]/router.tsx`
  - `apps/web/src/app/[locale]/(home)/components/Hero.tsx`
  - `apps/web/src/app/layout.tsx`
  - `apps/web/src/app.default.theme-config.ts`
  - `apps/web/src/app.config.d.ts`
  - `apps/web/src/providers/root/index.tsx`
  - `apps/web/src/providers/root/aggregation-data-provider.tsx`
  - `apps/web/node_modules/@mx-space/api-client/dist/index.d.mts`

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
- 当前 `git status --short` 有 1 个已修改文件和 2 个未跟踪文件：
  - `HANDOFF.md`
  - `docs/superpowers/plans/2026-04-01-avatar-upload-url-root-cause-fix.md`
  - `patches/mx-space-core-avatar-files-route.patch`

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

## [2026-04-16 00:18] 轻管理速记已支持 AI 翻译入口

> 本节晚于前文所有记录；若与 earlier recently / dashboard 描述冲突，以本节为准。

### 当前目标

把轻管理里的 `速记` 卡片升级成可直接触发 AI 翻译的入口，不再要求站长跳去完整后台才能给 recently 生成英文 / 日文翻译。

### 这次改了什么

- 在 [apps/web/src/routes/site/recently-section.tsx](/Users/zhenghan/Documents/GitHub/Blog/apps/web/src/routes/site/recently-section.tsx) 中：
  - 列表项读取 `availableTranslations`
  - 卡片底部新增常驻状态徽标：
    - `EN 已翻译 / 未翻译`
    - `JA 已翻译 / 未翻译`
  - 站长操作区新增统一的 `AI 翻译` 按钮
  - 点击后会调用后端 recently 翻译生成接口
  - 采用“单条速记 + 单个语言”的 pending 目标来避免重复提交
- 新增 [apps/web/src/routes/site/recently-translation.ts](/Users/zhenghan/Documents/GitHub/Blog/apps/web/src/routes/site/recently-translation.ts)
  - 封装 EN / JA 语言定义
  - 状态推导
  - 菜单文案
  - success toast 文案
  - pending target 判断
- 新增 / 更新测试：
  - [apps/web/src/routes/site/recently-translation.test.ts](/Users/zhenghan/Documents/GitHub/Blog/apps/web/src/routes/site/recently-translation.test.ts)
  - [apps/web/src/routes/site/recently-section.test.tsx](/Users/zhenghan/Documents/GitHub/Blog/apps/web/src/routes/site/recently-section.test.tsx)

### 这次验证过什么

已真实执行：

```bash
pnpm --filter @shiro/web exec vitest run src/routes/site/recently-translation.test.ts src/routes/site/recently-section.test.tsx
```

结果：

- `2` 个 test files
- `9` 个 tests
- 全部通过

已真实执行：

```bash
NEXT_PUBLIC_API_URL=https://api.418122.xyz/api/v2 \
NEXT_PUBLIC_GATEWAY_URL=https://api.418122.xyz \
pnpm --filter @shiro/web build
```

结果：

- `next build` 成功
- recently 轻管理改动没有阻塞生产构建

### 接口与行为说明

- 当前前端触发的是后端已有 recently 翻译生成路由：
  - `GET /api/v2/ai/translations/article/:id/generate?lang=en|ja`
- 前端通过：
  - `apiClient.ai.proxy(\`translations/article/${itemId}/generate\`).get({ params: { lang } })`
  发起请求
- success toast 使用“已提交英文翻译 / 已提交日文翻译 / 已提交英文重翻译”这一类措辞
  - 这里故意写“已提交”而不是“已完成”
  - 因为后端翻译可能是异步处理，列表刷新后不一定瞬间变成 `已翻译`

### 什么有效

- 不需要新建页面，直接复用现有 `RecentlySection` 就够
- `availableTranslations` 足够支撑 EN / JA 状态判断
- 将文案、状态和 pending 判断提取到单独 helper 后，组件复杂度可控

### 什么没有做

- 没做翻译预览
- 没做批量翻译
- 没做更多语言
- 没改首页 recently 展示样式

### 当前相关提交

- `63a0be3` `test(recently): 固化翻译状态推导`
- `de15a52` `feat(recently): 展示轻管理翻译状态`
- `70ab7a4` `feat(recently): 接入轻管理翻译操作`

### 下一步建议

1. push 当前分支
2. 触发前端部署 workflow
3. 部署后登录 `/dashboard/site` 或 `/dashboard/recently`，实测：
   - `AI 翻译` 按钮是否可点
   - EN / JA 状态是否会在生成后刷新
   - 若状态没有立即更新，确认是否只是后端任务异步延迟

---

## [2026-04-16 00:50] 修复 recently 翻译按钮 Failed to fetch，并压缩卡片布局

> 本节晚于前文所有 recently 记录；若冲突，以本节为准。

### 现象

用户在线上点击轻管理里的 `AI 翻译` 按钮时，浏览器报错：

```text
[GET] "https://api.418122.xyz/api/v2/ai/translations/article/<id>/generate?lang=en": <no response> Failed to fetch
```

同时用户反馈：

- `EN / JA 已翻译 / 未翻译` 标签占用了单独一行
- 希望它和时间、赞、踩放在同一行，整体更紧凑

### 根因

这次不是前端按钮状态逻辑错，而是 **浏览器直接跨域请求 recently 翻译生成 SSE 接口** 有 CORS 问题。

已验证：

```bash
curl -i -X OPTIONS 'https://api.418122.xyz/api/v2/ai/translations/article/<id>/generate?lang=en' \
  -H 'Origin: https://418122.xyz' \
  -H 'Access-Control-Request-Method: GET' \
  -H 'Access-Control-Request-Headers: x-session-uuid'
```

- `OPTIONS` 预检返回 `204`
- 带 `access-control-allow-origin`

但真实请求：

```bash
curl -i 'https://api.418122.xyz/api/v2/ai/translations/article/<id>/generate?lang=en' \
  -H 'Origin: https://418122.xyz'
```

- 返回 `200`
- `content-type: text/event-stream`
- **没有** `access-control-allow-origin`

所以浏览器会把它当成跨域失败，表现成 `<no response> Failed to fetch`。

### 正确修法

不要再让浏览器直接请求外域 `generate` SSE 接口。

当前修法：

- 新增同源中转 route：
  - [apps/web/src/app/api/internal/recently-translations/generate/route.ts](/Users/zhenghan/Documents/GitHub/Blog/apps/web/src/app/api/internal/recently-translations/generate/route.ts)
- 浏览器现在只请求本站：
  - `POST /api/internal/recently-translations/generate`
- route 内部会：
  1. 校验当前 owner session
  2. 服务端请求后端 `ai/translations/article/:id/generate?lang=en|ja`
  3. 消费完整 SSE 响应
  4. 返回同源 JSON 结果

这样浏览器完全绕过了外域 SSE 的 CORS 限制。

### 前端改动

- [apps/web/src/routes/site/recently-section.tsx](/Users/zhenghan/Documents/GitHub/Blog/apps/web/src/routes/site/recently-section.tsx)
  - 翻译触发从直接 `apiClient.ai.proxy(...).get(...)`
    改为 `fetch('/api/internal/recently-translations/generate', { method: 'POST' ... })`
  - 继续保留单条 `item + lang` 的 pending 控制
  - 将 `EN / JA 已翻译 / 未翻译` 徽标移入和时间、赞、踩同一行
  - 去掉原本为了状态单独留出来的额外纵向空间，让卡片更紧凑
- [apps/web/src/routes/site/recently-translation.ts](/Users/zhenghan/Documents/GitHub/Blog/apps/web/src/routes/site/recently-translation.ts)
  - 新增同源 trigger path helper
- [apps/web/src/routes/site/recently-translation.test.ts](/Users/zhenghan/Documents/GitHub/Blog/apps/web/src/routes/site/recently-translation.test.ts)
  - 补了 trigger path 的测试

### 本次验证

已真实执行：

```bash
pnpm --filter @shiro/web exec vitest run src/routes/site/recently-translation.test.ts src/routes/site/recently-section.test.tsx
```

结果：

- `2` 个 test files
- `10` 个 tests
- 全部通过

已真实执行：

```bash
NEXT_PUBLIC_API_URL=https://api.418122.xyz/api/v2 \
NEXT_PUBLIC_GATEWAY_URL=https://api.418122.xyz \
pnpm --filter @shiro/web build
```

结果：

- `next build` 成功
- 新增 route `ƒ /api/internal/recently-translations/generate`

### 下一步

1. push 当前 `codex/modify`
2. 触发前端部署 workflow
3. 部署后在线上实测 recently 翻译按钮是否恢复

---

## [2026-04-16 01:00] 修正 recently 中转 route：不要再依赖 owner session cookie

> 本节比上一节更新；若与 recently 中转实现描述冲突，以本节为准。

### 新发现

上一版把 recently 翻译按钮改成了同源 route 中转，但我在 route 里额外加了 owner session 校验，这在当前站点结构下是错误的。

原因：

- 前台轻管理在 `https://418122.xyz`
- 后端控制台在 `https://api.418122.xyz/proxy/qaqdmin`
- 浏览器里 owner 登录状态对 API 域可用，但 `418122.xyz` 的 Next route **拿不到** `api.418122.xyz` 的 session cookie
- 因此同源 route 会误报：
  - `Missing session cookie`

### 对照后端真实接口后的结论

已核对：

- 后端 `AiTranslationController` 中的
  - `GET /api/v2/ai/translations/article/:id/generate`
  - **没有** `@Auth()`
- 它本来就是一个公开的 SSE 生成入口
- 控制台里翻译博文之所以能正常用，是因为控制台和 API 同域，不会撞到前台的跨域 SSE 限制

所以前台的正确做法不是“补 cookie 校验”，而是：

- 保持同源 route
- 但这个 route 只做**纯代理**
- 不再自己校验 `auth/session`
- 服务端直接请求后端现有 SSE 接口并消费结果

### 当前最终实现

- [apps/web/src/app/api/internal/recently-translations/generate/route.ts](/Users/zhenghan/Documents/GitHub/Blog/apps/web/src/app/api/internal/recently-translations/generate/route.ts)
  - 已移除：
    - `cookie` 检查
    - `auth/session` 检查
    - owner role 校验
  - 现在只做：
    1. 校验 `itemId` / `lang`
    2. 服务端请求 `/api/v2/ai/translations/article/:id/generate?lang=...`
    3. 消费 SSE
    4. 返回同源 JSON

### 本次验证

已真实执行：

```bash
NEXT_PUBLIC_API_URL=https://api.418122.xyz/api/v2 \
NEXT_PUBLIC_GATEWAY_URL=https://api.418122.xyz \
pnpm --filter @shiro/web build
```

结果：

- `next build` 成功
- route 仍然正常出现在产物中：
  - `ƒ /api/internal/recently-translations/generate`

### 下一步

1. push 当前分支
2. 重跑前端部署
3. 线上再次点击 recently 的 `AI 翻译`
4. 若仍异常，再看后端 SSE 实际返回内容是否需要更薄的流式代理

---

## [2026-04-16 01:10] 修复 recently 翻译成功后状态仍显示未翻译

> 本节比上面所有 recently 状态描述更新；若冲突，以本节为准。

### 现象

用户点击 recently 的 `AI 翻译` 后，会看到成功 toast，但卡片上的状态仍然显示：

- `EN 未翻译`
- `JA 未翻译`

### 根因

这次不是翻译没成功，而是**状态来源选错了**。

已实际核对：

```bash
curl -sS 'https://api.418122.xyz/api/v2/ai/translations/article/69d4e1fac88eb639b90140fb/languages'
```

返回：

```json
{"data":["en"]}
```

说明翻译已真实生成。

但同时：

```bash
curl -sS 'https://api.418122.xyz/api/v2/recently?size=3'
```

返回的 recently 列表项**没有** `availableTranslations` 字段。

而前端之前一直用：

- `item.availableTranslations`

来判断状态，所以即使翻译成功，轻管理页面依旧只能显示“未翻译”。

### 最终修法

不要再假设 recently 列表本身会带语言状态。

当前前端实现改为：

1. 列表接口继续只拿 recently 基础内容
2. 对当前轻管理可见的每条 recently，额外请求：
   - `GET /api/v2/ai/translations/article/:id/languages`
3. 将返回的语言数组按 `item.id` 合并回前端列表项
4. 再用这个真实语言数组推导：
   - `EN 已翻译 / 未翻译`
   - `JA 已翻译 / 未翻译`

### 对应代码

- [apps/web/src/routes/site/recently-section.tsx](/Users/zhenghan/Documents/GitHub/Blog/apps/web/src/routes/site/recently-section.tsx)
  - 使用 `useQueries(...)` 为当前 recently 列表逐条拉取可用语言
  - 翻译成功后会 `invalidateQueries` 对应条目的 languages 查询
- [apps/web/src/routes/site/recently-translation.ts](/Users/zhenghan/Documents/GitHub/Blog/apps/web/src/routes/site/recently-translation.ts)
  - 新增 `getRecentlyTranslationItemsWithLanguages(...)`
- [apps/web/src/routes/site/recently-translation.test.ts](/Users/zhenghan/Documents/GitHub/Blog/apps/web/src/routes/site/recently-translation.test.ts)
  - 补了按 id 合并语言状态的测试

### 本次验证

已真实执行：

```bash
pnpm --filter @shiro/web exec vitest run src/routes/site/recently-translation.test.ts src/routes/site/recently-section.test.tsx
```

结果：

- `2` 个 test files
- `11` 个 tests
- 全部通过

已真实执行：

```bash
NEXT_PUBLIC_API_URL=https://api.418122.xyz/api/v2 \
NEXT_PUBLIC_GATEWAY_URL=https://api.418122.xyz \
pnpm --filter @shiro/web build
```

结果：

- `next build` 成功

### 下一步

1. push 当前分支
2. 重跑前端部署
3. 线上再次点击 recently 翻译按钮
4. 预期：toast 成功后，状态会从 `未翻译` 变成 `已翻译`

---

## [2026-04-16 01:15] 修复 recently 轻管理运行时崩溃：`includes is not a function`

> 本节是当前 recently 状态链路的最新补充；若与上文冲突，以本节为准。

### 现象

线上打开轻管理时出现：

```text
Unexpected Application Error!
t?.includes is not a function
```

报错位置在 recently 翻译状态渲染链路里。

### 根因

并不是 `useQueries` 或 React Query 本身有问题，而是 `/ai/translations/article/:id/languages` 的返回值在前端某些路径下不是纯数组，而是包装对象形态：

```json
{ "data": ["en"] }
```

之前代码直接把查询结果当 `string[]` 使用，再在状态推导里调用：

```ts
availableTranslations?.includes(...)
```

于是当传入值实际上是对象时，就会在运行时崩溃。

### 修法

新增统一归一化函数：

- [apps/web/src/routes/site/recently-translation.ts](/Users/zhenghan/Documents/GitHub/Blog/apps/web/src/routes/site/recently-translation.ts)
  - `normalizeRecentlyTranslationLanguages(value)`

规则：

- 如果是 `string[]`，直接返回
- 如果是 `{ data: [...] }`，递归解包
- 其他值统一回退为 `[]`

并在以下两处统一使用：

1. `getRecentlyTranslationStatuses(...)`
   - 不再直接对原值 `includes`
2. `getRecentlyTranslationItemsWithLanguages(...)`
   - 合并回列表项前先做归一化
3. `RecentlySection` 的 `useQueries(...)`
   - `queryFn` 里先归一化 `getAvailableLanguages(...).$serialized`

### 测试与验证

已新增测试：

- [apps/web/src/routes/site/recently-translation.test.ts](/Users/zhenghan/Documents/GitHub/Blog/apps/web/src/routes/site/recently-translation.test.ts)
  - 覆盖 `{ data: [...] }` 包装响应归一化

已真实执行：

```bash
pnpm --filter @shiro/web exec vitest run src/routes/site/recently-translation.test.ts src/routes/site/recently-section.test.tsx
```

结果：

- `2` 个 test files
- `12` 个 tests
- 全部通过

已真实执行：

```bash
NEXT_PUBLIC_API_URL=https://api.418122.xyz/api/v2 \
NEXT_PUBLIC_GATEWAY_URL=https://api.418122.xyz \
pnpm --filter @shiro/web build
```

结果：

- `next build` 成功

### 当前结论

recently 轻管理这一段现在的正确链路应当是：

1. 点击 `AI 翻译`
2. 前端请求同源纯代理 route
3. 后端生成翻译
4. 前端刷新该条 recently 的 `/languages`
5. `/languages` 返回值先归一化
6. 再渲染 `EN / JA 已翻译 / 未翻译`

---

## [2026-04-16 01:45] 站点配置翻译（Hero / 页脚链接）已进入前后端联动实现

> 本节是当前最新权威状态；若和之前“站点配置只有保存功能，没有翻译入口”的描述冲突，以本节为准。

### 用户目标

用户希望在轻管理页面中，为以下配置内容增加翻译接口和相关按钮：

- `Hero 标题`
- `Hero 描述`
- `首页一句话`
- `页脚链接` 的分组名
- `页脚链接` 的链接名称

用户已明确选择：

- 按钮粒度采用“分组级”
  - `Hero` 区块一个 `AI 翻译`
  - `页脚链接` 区块一个 `AI 翻译`
- 字段级状态可见
  - 每个字段旁边显示 `EN / JA 已翻译 / 未翻译`

### 当前前端状态（本仓库）

已完成：

- 设计 spec：
  - `docs/superpowers/specs/2026-04-16-site-settings-translation-ui-design.md`
  - commit: `17427da`
- 实现计划：
  - `docs/superpowers/plans/2026-04-16-site-settings-translation-ui-implementation.md`
  - commit: `4032554`
- 前端 helper：
  - `apps/web/src/routes/site/site-translation.ts`
  - `apps/web/src/routes/site/site-translation.test.ts`
  - commit: `f507cf6`
- 站点配置 UI：
  - `apps/web/src/routes/site/index.tsx`
  - `apps/web/src/routes/site/sections.tsx`
  - Hero / Footer 标题栏已接入 `AI 翻译` 按钮
  - Hero 字段和 Footer 各字段已接入 EN / JA 状态徽标
  - 前端直接调用后端：
    - `POST /api/v2/ai/translations/entries/generate`
    - `POST /api/v2/ai/translations/entries/lookup`
  - commit: `05b5ffd`

### 当前后端状态（外部仓库）

本地工作副本：

- `/tmp/blog-mx-core-import`

当前分支：

- `codex/site-settings-translation`

已完成：

- 扩展 translation entry keyPath：
  - `theme.hero.title`
  - `theme.hero.description`
  - `theme.hero.quote`
  - `theme.footer.section.name`
  - `theme.footer.link.name`
  - commit: `32113f9`
- 扩展 translation entry schema / controller / service：
  - `GenerateEntriesSchema` 支持 `values`
  - 新增 `QueryEntriesByLookupSchema`
  - controller 新增 `POST /ai/translations/entries/lookup`
  - service 支持：
    - `queryEntriesByLookup(...)`
    - `generateTranslations({ values })`
  - commit: `af525a9`

### 验证

前端已真实执行：

```bash
pnpm --filter @shiro/web exec vitest run src/routes/site/site-translation.test.ts
NEXT_PUBLIC_API_URL=https://api.418122.xyz/api/v2 NEXT_PUBLIC_GATEWAY_URL=https://api.418122.xyz pnpm --filter @shiro/web build
```

结果：

- helper 测试通过
- 前端构建成功

后端已真实执行：

```bash
cd /tmp/blog-mx-core-import && pnpm test -- translation-entry.site-settings
```

结果：

- `79` 个 test files
- `869` 个 tests
- 全部通过

### 当前远端状态

前端分支：

- `origin/codex/modify`

后端分支：

- `origin/codex/site-settings-translation`

已触发 workflows：

- 前端 Vercel deploy：
  - run `24469485738`
- 后端 GHCR build：
  - repo `V-IOLE-T/blog-mx-core`
  - run `24469485511`

### 关键部署注意点

后端现有 deploy workflow 默认部署：

- `ghcr.io/v-iole-t/blog-mx-server:master`

因此**不能**直接用现有 deploy workflow 发布功能分支镜像，否则会把 `master` 旧镜像重新部署。

正确收尾路径应是：

1. 等 `Build Backend Image (GHCR)` 在 `codex/site-settings-translation` 上构建完成
2. 确认该分支镜像 tag（或 sha tag）
3. 通过 SSH 或调整 deploy 方式，把对应 feature image 部署到服务器
4. 再验证前端 Hero / Footer 按钮是否能真实返回状态

### 给下一个 agent 的提醒

- 这次站点配置翻译是**前后端联动任务**，不是只改前端。
- 如果前端按钮上线了但后端接口没部署，页面上的按钮会失败，这不是前端本身坏了。
- 优先继续盯：
  - `24469485511` 后端 GHCR build
  - `24469485738` 前端 deploy
- 后端不要直接部署 `master` 镜像，必须确认 feature branch 对应 image tag。

---

## [2026-04-16 01:58] 站点配置翻译后端已手动部署到服务器

### 已确认事实

- 后端 GHCR 构建 run：
  - `https://github.com/V-IOLE-T/blog-mx-core/actions/runs/24469485511`
  - 结果：`success`
- 本次 feature branch：
  - `codex/site-settings-translation`
  - commit: `af525a9`
- 构建出的镜像 tag：
  - `ghcr.io/v-iole-t/blog-mx-server:codex-site-settings-translation`
  - `ghcr.io/v-iole-t/blog-mx-server:sha-af525a9`

### 部署方式

由于现有后端 deploy workflow 默认只部署：

- `ghcr.io/v-iole-t/blog-mx-server:master`

所以这次没有直接用 workflow 发生产，而是通过 SSH 手动切换服务器上的 app 镜像：

```bash
ssh -i ~/.ssh/macair4.pem root@43.153.75.156
cd /opt/mxspace
docker compose -f docker-compose.yml -f docker-compose.override.yml -f /tmp/docker-compose.ghcr.override.yml up -d --no-build app
```

实际运行中的容器镜像已经变成：

- `ghcr.io/v-iole-t/blog-mx-server:codex-site-settings-translation`

### 验证

已真实执行：

```bash
docker exec mx-server curl -fsS http://127.0.0.1:2333/api/v2/ping
```

结果：

```json
{"data":"pong"}
```

已真实执行公网接口探测：

```bash
curl -i -X POST 'https://api.418122.xyz/api/v2/ai/translations/entries/lookup' \
  -H 'Content-Type: application/json' \
  --data '{"keyPath":"theme.hero.title","lang":"en","lookupKeys":["hero.title"]}'
```

结果：

- 返回 `401 未登录`
- 这说明：
  - 新接口已经在线
  - 路由不是 `404`
  - 当前差的是前台是否用 owner 登录态去调用，而不是后端镜像未更新

### 当前线上状态

- 前端新 UI 已部署
- 后端新 translation-entry 接口已部署
- Hero / Footer 配置翻译功能现在具备联调条件

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
  - `83dec24 Fix PR comment workflow artifact downloads`
  - `0b15b72 Fix bundle analysis workflow and update handoff`
  - `4786e2c docs: 更新 handoff 记录接管进展与头像修复`
  - `9b0158e feat(blog): 切换到 Yohaku 前端源码`
  - `b5fae84 chore(repo): 清空旧博客业务文件`
- 当前 `git status --short`：
  - 无输出，工作区干净
- 当前分支远端状态：
  - `origin/codex/modify` 已存在
  - 本地 `HEAD` 已对齐到 `origin/codex/modify`

也就是说：

- 本地真实代码已经到位
- git 历史里已经记录了这次接管
- 之前 handoff 里“还有 patch / plan 未提交”“是否推送到原远端还待决定”的描述已经过期
- 但“上游头像修复还没正式回传到上游仓库/发布链路”这个判断仍然成立

---

## 当前服务器状态

### 服务

`docker ps` 最近一次确认结果：

- `yohaku` -> `blog-yohaku:latest`
- `mx-caddy` -> `caddy:2-alpine`
- `mx-server` -> `blog-mx-server:11.0.7-avatar-fix`
- `mongo` -> `mongo:7`
- `redis` -> `redis:alpine`

### 路径

- compose / Caddy：
  - `/opt/mxspace/docker-compose.yml`
  - `/opt/mxspace/docker-compose.override.yml`
  - `/opt/mxspace/Caddyfile`
- 源码：
  - `/opt/yohaku-src`
  - `/opt/mx-core-src`
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
- 公开 SEO 当前是：
  - `seo.title = "OO's blog"`
  - `seo.description = "Welcome!"`
- 用户明确反馈：上面这两个 SEO 值已经在现有 WebUI 里手动改过
- 但首页 Hero 仍是 placeholder：
  - `theme.config.hero.description = "An initialized placeholder site for Mix Space Core and Shiro."`
  - Hero title template 里仍含 `Temporary <MixSpace />`
- footer / Hero / 部分首页展示内容仍明显是初始化占位内容，而不是最终正式站配置

---

## 2026-04-01 新增进展：账号、头像与上游根治

### Owner 账号已经替换成用户指定值

已完成并验证：

- username：`zhenghanoo`
- email：`z411622h@163.com`
- password：用户指定值，已通过 `POST /api/v2/auth/sign-in/username` 实测登录成功

数据库结构里相关文档当前对应关系：

- `readers._id = ObjectId("69cbbe672b60836536a13af5")`
- `owner_profiles.readerId = ObjectId("69cbbe672b60836536a13af5")`
- `accounts.userId = ObjectId("69cbbe672b60836536a13af5")`

### 第一阶段：头像 bug 的真实根因与“只做兼容”的临时修复

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

### 第二阶段：已经从上游根治，不再停留在 `/objects` 兼容

这一步不是推测，已经定位到上游源码并完成线上部署。

根因定位结论：

- 当前 `Blog` / `Yohaku` 仓库不是生成旧头像 URL 的地方
- `mx-admin` 上传确实走的是 `/files/upload`
- 但它直接信任后端返回的 `res.url`
- 真正返回旧地址的是上游 `mx-space/core`

已定位到的上游问题点：

- `/tmp/mx-space-core-tar/apps/core/src/modules/file/file.service.ts`
  - `resolveFileUrl()` 仍返回 `.../objects/${type}/${name}`
- `/tmp/mx-space-core-tar/apps/core/src/modules/file/file-reference.service.ts`
  - 只识别 `/objects/image/`
- `/tmp/mx-space-core-tar/apps/core/src/modules/link/link-avatar.service.ts`
  - 只把 `/objects/avatar/` 当作内部链接

本地已完成的上游修复物：

- 计划文档：
  - `docs/superpowers/plans/2026-04-01-avatar-upload-url-root-cause-fix.md`
- patch：
  - `patches/mx-space-core-avatar-files-route.patch`
- 上游源码临时副本：
  - `/tmp/mx-space-core-tar`

上游修复内容：

- `resolveFileUrl()` 从 `/objects/${type}/${name}` 改为 `/files/${type}/${name}`
- `file-reference.service.ts` 同时兼容 `/objects/image/` 和 `/files/image/`
- `link-avatar.service.ts` 同时兼容 `/objects/avatar/` 和 `/files/avatar/`

本地针对上游修复已跑过的定向验证：

```bash
pnpm -C apps/core exec vitest run --config vitest.root-cause.config.mts \
  test/src/modules/file/file.service.spec.ts \
  test/src/modules/file/file-reference.service.spec.ts \
  test/src/modules/link/link-avatar.service.spec.ts
```

结果：

- `3 passed`
- `14 passed`

### 第三阶段：服务器已部署上游修复，不用再重新 build 一遍找状态

服务器侧这轮已经完成：

- 将修过的 `mx-space/core` 源码打包上传到：
  - `/opt/mx-core-src-patched.tar.gz`
- 解压到：
  - `/opt/mx-core-src`
- 新增 compose override：
  - `/opt/mxspace/docker-compose.override.yml`
- override 内容的关键作用：
  - 让 `app` 改为从 `/opt/mx-core-src/dockerfile` 构建
  - 生成镜像 `blog-mx-server:11.0.7-avatar-fix`

已经真实执行且成功的部署链路：

```bash
ssh -i ~/.ssh/macair4.pem root@43.153.75.156 '
  cd /opt/mxspace &&
  docker compose build app
'

ssh -i ~/.ssh/macair4.pem root@43.153.75.156 '
  cd /opt/mxspace &&
  docker compose up -d --no-deps app
'
```

已确认结果：

- `mx-server` 当前镜像是 `blog-mx-server:11.0.7-avatar-fix`
- `docker logs --tail 120 mx-server` 显示 `Nest application successfully started`
- `curl -s https://api.418122.xyz/api/v2/ping` 返回 `{"data":"pong"}`

### 第四阶段：部署后又发现一个新坑，且已经一起修掉

仅修上游后端还不算闭环。我在真实上传验证时发现：

- `POST https://api.418122.xyz/api/v2/files/upload?type=avatar` 已经返回新 URL：
  - `https://api.418122.xyz/files/avatar/<name>`
- 但第一轮访问这个新 URL 返回的是：
  - `{"ok":0,"message":"Cannot GET /files/avatar/<name>"}`

这说明：

- 后端返回值已经修对了
- 但入口层 Caddy 当时只兼容了 `/objects/*`
- `/files/*` 还没有被转发到 `/api/v2/files/*`

这个坑的有效修复：

- 在 `418122.xyz, www.418122.xyz` 和 `api.418122.xyz` 两个站点块里都新增：
  - `/files/*` -> `uri replace /files /api/v2/files` -> `reverse_proxy app:2333`
- 然后再次执行：

```bash
ssh -i ~/.ssh/macair4.pem root@43.153.75.156 '
  cd /opt/mxspace &&
  docker compose up -d --force-recreate caddy
'
```

为什么这里必须重建 `mx-caddy` 而不是只 reload：

- 因为 `/opt/mxspace/Caddyfile:/etc/caddy/Caddyfile:ro` 是单文件 bind mount
- 之前已经确认过：只改宿主机文件、甚至 `caddy reload`，都可能因为 inode 没更新而让容器继续吃旧配置
- 对这个部署形态，最稳的是改完后直接 `docker compose up -d --force-recreate caddy`

### 第五阶段：真实行为验证已经闭环

这部分是最重要的新鲜上下文，下一位 agent 不需要再猜。

我这轮做过的真实验证：

1. 临时在 Mongo 的 `mx-space.apikey` 中写入一个 owner API key，只用于验证上传接口
2. 用这个 key 调 `GET /api/v2/auth/token`，确认 token 生效
3. 直接上传一个 1x1 PNG 到：
   - `POST https://api.418122.xyz/api/v2/files/upload?type=avatar`
4. 检查返回 JSON 的 `url`
5. 再直接访问返回的 `/files/avatar/...` URL
6. 最后删除临时 API key 和测试文件，避免污染环境

验证结论：

- 真实上传返回的已经是：
  - `https://api.418122.xyz/files/avatar/mw5m1c0g5ja68bsubw.png`
- 该 URL 实测返回 `HTTP/2 200`
- 对应的 `/api/v2/files/avatar/...` 也返回 `HTTP/2 200`
- 临时 API key 已清理；当前 `db.apikey.find({})` 为空
- 验证用测试头像文件也已从服务器删除

这轮踩过但没用、或者只修了一半的尝试：

- 只加 `/objects/*` 兼容映射：
  - 有用，但只能兜住旧 URL，不能解决后端继续返回旧 URL 的根因
- 只部署上游 `mx-space/core` 修复、不补 `/files/*` 转发：
  - 会让上传返回值变成对的 `/files/...`
  - 但公网访问这个 URL 仍会 `404`
- 并行删除“临时 token”和“临时测试文件”：
  - 我试过一次，结果 token 先删掉，文件删除 API 返回“令牌无效”
  - 最后改成直接在服务器文件系统定点删除测试文件，才收尾干净

给下一位 agent 的直接结论：

- “头像上传仍返回旧 `/objects/...` URL”的问题，现在已经从上游根治并部署到线上，不需要重复查根因
- 当前线上不只是“旧路径兼容可用”，而是“新上传返回新 `/files/...` URL，且新 URL 真实可访问”
- `/objects/*` 兼容映射建议暂时保留，用来兜住历史数据；没必要立刻删除
- 如果后续要提交或同步这次修复，优先看：
  - `patches/mx-space-core-avatar-files-route.patch`
  - `docs/superpowers/plans/2026-04-01-avatar-upload-url-root-cause-fix.md`

---

## 2026-04-01 上午新增进展：首页配置入口调查

### 用户最新真实意图

用户已经明确：

- 不想把旧 Blog 的 branding 直接迁回 Yohaku
- 更想要的是：在当前前端里补一个“轻量 WebUI 配置入口”
- 目标范围不是只改 SEO，而是“把首页的可配置内容都放过去”
- 用户最后选定的范围是：
  - 首页 + 页脚常用内容
  - 不是只做 Hero，也不是做一个笼统的全站 JSON 编辑器

### 这轮已经确认的真实事实

1. 当前公开接口已经能证明：首页内容不是主要写死在仓库里，而是来自聚合数据 / theme config
2. `seo.title` / `seo.description` 来自 `aggregate/site`
3. 首页 Hero 读取的是 `theme.config.hero`
4. footer 也来自 `theme` / aggregate 返回值，而不是当前 repo 的静态文案常量
5. 用户明确反馈：
   - 现有 WebUI 里已经能改 `seo.title` / `seo.description`
   - 但没找到 `hero.description`

### 我具体读过哪些代码，得出了什么

- `apps/web/src/app/layout.tsx`
  - 这里会请求 `aggregate/site`
  - 页面 `<title>`、`description`、OG、Twitter 元数据都来自 `seo`
- `apps/web/src/app/[locale]/(home)/components/Hero.tsx`
  - 首页 Hero 的 `title` 和 `description` 直接读取 `config.hero`
- `apps/web/src/app.default.theme-config.ts`
  - 只提供 theme 默认结构
  - 不是线上真实数据源
- `apps/web/src/app.config.d.ts`
  - 类型里明确有 `Hero.description`
- `apps/web/src/app/(dashboard)/dashboard/[[...catch_all]]/router.tsx`
  - 当前 dashboard 只有首页、文章、日记、评论、Passkey、`/vue`
  - 没有现成 `site` / `settings` / `appearance` 编辑页
- `apps/web/src/routes/vue/index.tsx`
  - 菜单文案是“完整功能与其他设置”
  - 逻辑是尝试跳转到外部 `adminUrl`
- `apps/web/src/providers/root/index.tsx`、`apps/web/src/providers/root/aggregation-data-provider.tsx`
  - 当前快照里能看到 `webUrl` 被写入，但没直接看到是谁在给 `adminUrlAtom` 注值
- `apps/web/node_modules/@mx-space/api-client/dist/index.d.mts`
  - 类型层确认后端配置模型里有 `seo`、`url.adminUrl`、`adminExtra`
  - 但没看到现成 typed controller 暴露一个“theme / hero 编辑”接口

### 这轮我实际试了什么

#### 有效的路径

- 用公开接口直接看线上真实配置：

```bash
curl -sS -m 20 https://api.418122.xyz/api/v2/aggregate/site
curl -sS -m 20 'https://api.418122.xyz/api/v2/aggregate?theme=shiro'
```

这一步有效，因为它直接回答了：

- SEO 现在是什么
- Hero / footer 现在是不是 placeholder
- 首页数据源到底偏向 `seo` 还是 `theme.config`

- 读当前 dashboard 路由，而不是猜：
  - 这一步有效，因为它确认了当前前端快照里没有现成“站点配置页”

- 读 `api-client` 类型定义，而不是只看业务代码：
  - 这一步有效，因为它确认了后端至少存在 `seo`、`url.adminUrl` 这种配置模型

#### 没用、或只解决了一半的路径

- 只在当前 dashboard 里找表单入口：
  - 不够，因为现有 dashboard 本来就偏内容管理，不等于后端没有别的设置 UI

- 只根据 `/dashboard/vue` 存在，就断言“admin 入口一定完全配好”：
  - 不够稳，因为当前快照里只能看到“尝试用 `adminUrl` 跳走”的逻辑，没在本地代码里直接找到 `adminUrl` 的写入链路

- 只根据没找到 `hero.description` 的现成 WebUI 字段，就假设它写死在前端：
  - 这是错方向
  - 公开 `aggregate?theme=shiro` 已经证明它来自 theme config，而不是写死在 JSX

### 当前最接近真实的结论

- 现在不是“首页文案写死了，所以只能改代码”
- 更准确地说是：
  - 线上已有一部分 WebUI 能改 SEO
  - 但当前用户可见入口里没有把首页 Hero / footer 常用内容暴露出来
  - 当前前端快照里也没有现成轻量编辑页
- 所以下一个 agent 不应该继续争论“要不要从旧博客迁移 branding”
- 真正该做的是：
  - 在当前 Yohaku 前端里新加一个轻量 `site config` 页面
  - 第一版覆盖首页 + 页脚常用字段
  - 然后把这些字段写回它们真实的数据来源

### 这件事当前真正的阻塞点

现在最大的未知不是前端页面怎么写，而是：

- 后端当前到底提供了哪条“写回 SEO / theme / footer / hero”的真实接口
- 其中哪些已经能用
- 哪些需要走通用 `apiClient.proxy(...)`
- 哪些如果后端根本没暴露，就必须同步补后端或走现有 admin 接口

### 给下一位 agent 的最短执行建议

如果要继续完成“轻量首页配置入口”，下一步按这个顺序最省时间：

1. 先不要再纠结旧 Blog branding，要以“补配置入口”为主线
2. 先找真实可写接口，再写前端表单
3. 优先验证这几类数据的写回路径：
   - `seo.title` / `seo.description`
   - `theme.config.hero.title`
   - `theme.config.hero.description`
   - `theme.footer.linkSections`
   - 首页社交链接对应的数据源
4. 如果后端已有现成 admin / settings 接口：
   - 前端新增 `/dashboard/site` 之类的轻量页面即可
5. 如果后端没有直接暴露 theme 写接口：
   - 不要硬写一个只改本地 state 的假表单
   - 先补通写接口，再落 UI

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
- 对头像问题，先用 Caddy 兼容 `/objects/*` 兜底，再去上游 `mx-space/core` 找 `resolveFileUrl()`，这条排障路径是对的。
- 用临时 owner API key 直接调真实上传接口验证返回值，比只盯前端页面更快、更准。
- 部署完上游修复后，再反向验证 `/files/*` 是否真的被入口层暴露出来，这一步很关键。
- 对首页配置问题，先看 `aggregate/site` 和 `aggregate?theme=shiro` 的真实返回值，再决定该改 `seo`、`theme.config.hero` 还是 `footer`，这条定位路径是对的。
- 用户口头反馈“我在 WebUI 改过 SEO，但没找到 Hero 字段”是非常关键的新鲜上下文；下一位 agent 应直接沿着“补轻量配置入口”推进，而不是重新讨论是否迁回旧 branding。

---

## 2026-04-01 中午新增进展：轻量配置页已本地完成，但线上还没切过去

### 这轮已经真实完成了什么

- 已经在本地仓库里实现了第一版轻量 `site config` 页面：
  - 新增 dashboard 一级路由 `/dashboard/site`
  - 覆盖 `SEO`、`Hero`、`社交链接`、`页脚链接`
  - 保存时拆成三条真实后端写链：
    - `PATCH /api/v2/config/seo`
    - `PATCH /api/v2/owner`
    - `snippets/theme/shiro` 对应的 `POST/PUT /api/v2/snippets`
- 已补本地设计/计划文档：
  - `docs/superpowers/specs/2026-04-01-site-config-dashboard-design.md`
  - `docs/superpowers/plans/2026-04-01-site-config-dashboard.md`
- 已补本地 helper 单测：
  - `apps/web/src/routes/site/form-state.test.ts`
- 已做过的本地验证都通过：
  - `pnpm exec vitest run apps/web/src/routes/site/form-state.test.ts`
  - `pnpm --filter @shiro/web exec tsc --noEmit`
  - `pnpm --filter @shiro/web build`

### 这轮真正确认清楚的接口事实

这些现在已经不是“未知”，而是读过本地/服务器源码后确认过的事实：

- 后端 `config/options` 写接口存在：
  - 服务器源码 `apps/core/src/modules/option/controllers/base.option.controller.ts`
  - 关键接口：
    - `GET /api/v2/config/form-schema`
    - `GET /api/v2/config/:key`
    - `PATCH /api/v2/config/:key`
- `owner` 写接口存在：
  - 服务器源码 `apps/core/src/modules/owner/owner.controller.ts`
  - 关键接口：
    - `GET /api/v2/owner`
    - `PATCH /api/v2/owner`
- `theme` 公开读取来自 snippet，而不是硬编码常量：
  - 服务器源码 `apps/core/src/modules/aggregate/aggregate.controller.ts`
  - 内部是 `snippetService.getPublicSnippetByName(name, 'theme')`
- `theme` 的真实写回也不是单独的 `theme` controller，而是 `snippets` 资源：
  - 服务器源码 `apps/core/src/modules/snippet/snippet.controller.ts`
  - 关键接口：
    - `GET /api/v2/snippets/group/theme`
    - `POST /api/v2/snippets`
    - `PUT /api/v2/snippets/:id`
- 另外确认了一个很关键的安全细节：
  - `aggregate` 公开返回会主动 `omit(url.adminUrl)`，所以当前前端不能指望从聚合接口自然拿到 admin 跳转地址

### 这轮我具体试了什么

#### 有效的路径

- 本地先实现并验证轻量配置页，是有效的：
  - 新页面已经写进本地工作树
  - 相关新文件主要在：
    - `apps/web/src/routes/site/`
    - `apps/web/src/app/(dashboard)/dashboard/[[...catch_all]]/router.tsx`
- 用 SSH 直接读服务器上 `/opt/mx-core-src` 源码，确认真实接口，比猜 API 快很多：
  - `apps/core/src/modules/option/controllers/base.option.controller.ts`
  - `apps/core/src/modules/owner/owner.controller.ts`
  - `apps/core/src/modules/snippet/snippet.controller.ts`
  - `apps/core/src/modules/aggregate/aggregate.controller.ts`
- 直接打公网接口验证也有效：
  - `curl -sS -m 20 https://api.418122.xyz/api/v2/config/form-schema`
    - 返回 `{"ok":0,"code":15008,"message":"未登录"}`
    - 这能证明接口存在，只是需要登录
  - `curl -sS -m 20 https://api.418122.xyz/api/v2/snippets/theme/shiro`
    - 能直接拿到当前公开的 theme JSON
  - `curl -sS -m 20 'https://api.418122.xyz/api/v2/aggregate?theme=shiro'`
    - 能看到当前 Hero / footer / SEO 的线上真实值
- 把本地新代码同步到服务器源码目录也是成功的：
  - `apps/web/src/routes/site/` 已通过 `rsync` 同步到 `/opt/yohaku-src/apps/web/src/routes/site/`
  - `router.tsx` 因远端路径含括号，最后是通过：
    - `ssh ... "cat > '/opt/yohaku-src/.../router.tsx'" < local-file`
    - 成功覆盖过去

#### 没用、或只解决了一半的路径

- 只完成本地实现和本地构建，不会自动让线上生效：
  - 这是这轮最关键的现实问题
  - 用户刷新页面没变化，不是“页面没写”，而是“新镜像还没上线”
- 用普通 `rsync` 推送带括号路径的单文件会失败：
  - 远端 shell 会把 `apps/web/src/app/(dashboard)/...` 里的括号当成特殊字符
  - 这条命令实际报过：
    - `bash: -c: line 1: syntax error near unexpected token '('`
- 直接反复跑 `docker compose up -d --build yohaku` 不是好路径：
  - 这轮实际残留过多条 compose 进程
  - 容易互相干扰，也很难判断当前到底是哪一条在生效
- `nohup docker compose up -d --build yohaku > /tmp/yohaku-deploy.log 2>&1 &` 也不稳：
  - 这次 `/tmp/yohaku-deploy.log` 最终出现：
    - `canceled`
    - `exit status 130`
  - 说明后台那条部署并没有真正把新镜像构建完

### 当前线上为什么还没有更新

这件事到现在最重要的结论是：

- 新前端代码已经写在本地
- 新代码也已经同步到了服务器源码目录 `/opt/yohaku-src`
- 但是新的 `blog-yohaku:latest` 镜像还没有产出
- 所以运行中的 `yohaku` 容器仍然是旧镜像，用户刷新当然不会看到新入口

这不是猜测，是已经验证过的：

- `docker images blog-yohaku:latest --format 'table {{.Repository}}\t{{.Tag}}\t{{.CreatedSince}}\t{{.ID}}'`
  - 仍显示：`13 hours ago`
- `docker inspect yohaku --format '{{.Image}} {{.State.StartedAt}}'`
  - 仍指向旧 image digest：`sha256:5ae85da63be1...`
  - 启动时间还是：`2026-03-31T14:49:20.562119966Z`
- `docker ps`
  - `yohaku` 仍然是 `Up 13 hours`

### 这轮真正卡住的位置

当前最新、最真实的阻塞点已经不是“接口未知”，而是：

- 服务器上的 `docker compose build yohaku` / `docker compose up -d --build yohaku` 在构建 `blog-yohaku:latest` 时卡住，没有产出新镜像
- 从现象上看，它不是早早失败，而是长时间卡在 build 中后段
- 目前最可疑的位置是 `Dockerfile` 的 builder 阶段：
  - `COPY --from=deps /app/ .`
  - 或其后的 `RUN pnpm turbo run build --filter=@shiro/web`
- 但注意：这只是最接近真实的推断，不是已经被源码或日志铁证锁死的唯一根因

### 到这个时间点为止，我手上掌握的服务器证据

- 服务器当前仍有一条 build 进程在挂着：
  - `docker compose build yohaku`
  - 我最后一次看到的 PID 是 `559154`
- 但当时并没有看到对应的 `next build` / `turbo build` / `node` 子进程在持续跑
- `docker stats --no-stream` 里现有运行容器的 CPU 都很低，`yohaku` 还是旧容器，没有新容器接管

### 给下一位 agent 的最短继续建议

如果下一位 agent 要继续把这件事真正收口，请不要从“重新读需求”开始，直接做下面几件事：

1. 先承认一个事实：
   - 轻量配置页代码已经本地完成
   - 当前唯一没收口的是“服务器前端镜像没成功切过去”
2. 先检查服务器当前有没有残留 build 进程：
   - `ssh -i ~/.ssh/macair4.pem root@43.153.75.156 'ps -eo pid,etime,pcpu,pmem,command | grep -E "docker compose build yohaku|docker compose up -d --build yohaku|next build|turbo build" | grep -v grep'`
3. 再检查旧镜像/旧容器是否仍在：
   - `ssh -i ~/.ssh/macair4.pem root@43.153.75.156 'docker images blog-yohaku:latest --format "table {{.Repository}}\t{{.Tag}}\t{{.CreatedSince}}\t{{.ID}}"'`
   - `ssh -i ~/.ssh/macair4.pem root@43.153.75.156 'docker inspect yohaku --format "{{.Image}} {{.State.StartedAt}}"'`
4. 如果确认 build 还在卡：
   - 不要继续无脑叠加新的 `docker compose up -d --build yohaku`
   - 先把旧的残留 compose/build 进程清干净，再只保留一条可观察的 build
5. 更稳的路径建议优先顺序：
   - A. 单独 `docker compose build yohaku`，盯完整输出，确认到底卡在哪一步
   - B. 如果 build 完成，再单独 `docker compose up -d yohaku`
   - C. build 结束后第一时间复核镜像创建时间与容器启动时间是否更新
6. 如果还卡在 Docker build：
   - 直接在服务器上对 `Dockerfile` 所在阶段做更细粒度排查
   - 尤其关注 `COPY --from=deps /app/ .` 之后到 `pnpm turbo run build --filter=@shiro/web` 这一段
7. 只有当以下三件事同时成立，才能告诉用户“线上已经更新”：
   - `blog-yohaku:latest` 创建时间变成最新
   - `yohaku` 容器启动时间变成最新
   - 公网 `/dashboard` 实测能看到新的 `站点` 入口

---

## 什么没用，或者不要再浪费时间

- 不要再把这件事理解成“从零部署 MixSpace”。Core 和 API 早就存在并可用。
- 不要再把根域名当成静态站去挂 `/srv`，当前目标已经是 Yohaku 动态前端。
- 不要再花大量时间修老的 `innei/shiro:1.2.3` 镜像。
- 不要只改宿主机 Caddyfile 然后 `caddy reload` 就以为切流完成；单文件 bind mount 会坑你。
- 不要再从 Cloudflare / nameserver / 腾讯云基础 onboarding 重新开始。
- 不要再重复开新的 `docker compose build app` 去猜上次 build 成没成；这轮已经构建成功并上线了。
- 不要以为“后端上传返回 `/files/...` 就一定公网可访问”；如果入口层没配 `/files/*` 转发，还是会 `404`。
- 不要再把头像问题继续归因为 Mongo、文件写盘失败或前端单纯不刷新，这些方向都已经被排掉。
- 不要再根据当前 repo 里没找到 Hero 配置表单，就误判“用户没有任何 WebUI 可用”；用户已经明确说过 SEO 是在 WebUI 里改掉的。
- 不要把“SEO 可编辑”和“首页全部可编辑”混为一谈；目前已知只是前者成立，后者还没落地。
- 不要直接把旧 Blog branding 生搬硬套回新站；用户已经明确说不想走这条路。
- 不要在服务器上并发叠加多条 `docker compose up -d --build yohaku`；这轮已经证明这样很容易把状态弄乱，还会让你误判“是不是还在构建”。

---

## 下一个 agent 最应该做什么

### 如果目标是“把这次接管收口到远端”

优先做这个：

1. 复核本地 `git status`
2. 确认是否要把 `codex/modify` 推到原 `origin`
3. 除非用户明确同意，否则不要擅自 push

### 如果目标是“继续让线上更像正式站”

优先做这个：

1. 不要重复实现 UI；本地轻量配置页已经写好
2. 先把服务器 `blog-yohaku:latest` 真正构建出来并切到新容器
3. 然后再用公网验证 `/dashboard` 是否出现新的 `站点` 入口
4. 确认入口存在后，再让用户自己通过 WebUI 改 Hero / footer / 社交链接等配置
5. 不要默认迁移旧 Blog branding；只有用户再次明确要求时再做

### 如果目标是“把这次上游修复沉淀出去”

优先做这个：

1. 查看 `patches/mx-space-core-avatar-files-route.patch`
2. 基于它整理上游 PR 或补丁说明
3. 决定是否把服务器上的 `/opt/mx-core-src` 改造成更长期的可追踪部署来源
4. 在确认历史数据都不再依赖旧路径前，不要急着移除 `/objects/*` 兼容

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
ssh -i ~/.ssh/macair4.pem root@43.153.75.156 'docker logs --tail 120 mx-server'
curl -sS -m 15 https://api.418122.xyz/api/v2/ping
```

---

## 对接手者的最短结论

这件事现在已经不再是“要不要接管 Yohaku”，也不再是“服务器能不能跑起来”。

当前真实状态是：

- 私有 Yohaku 源码已经进了当前 `Blog` 仓库工作树
- 本地接管 commit 已存在，且当前工作区干净
- 本地构建通过
- 服务器源码构建通过
- 根域名已经切到 Yohaku
- API 正常
- 后台头像旧路径兼容已修复
- 上游 `mx-space/core` 已修复并部署，上传返回值已从旧 `/objects/...` 改为 `/files/...`
- 新 `/files/...` 公开访问链路也已补齐，不再是“返回值对了但公网 404”
- 用户已经能通过现有 WebUI 改 SEO
- 首页 Hero / footer 常用内容的轻量编辑入口已经在本地实现，但还没有成功部署到线上
- 最大未收口项是：
  - 服务器上的 `blog-yohaku:latest` 新镜像还没成功构建出来
  - 运行中的 `yohaku` 容器仍然是旧镜像，所以公网还看不到新入口
  - 首页 Hero 与 footer 仍是 placeholder 内容，还不是最终正式内容
  - 上游修复还没有正式回传到上游仓库/发布链路，目前服务器仍是本地定制镜像

如果时间有限，只看本文件就足够继续。

---

## 2026-04-01 最新补充：控制台按钮修复、热更新上线、部署结论

这部分是比上面更晚的新鲜上下文。若与上文旧结论冲突，以本节为准。

### 这轮用户真实诉求

- 用户反馈：前台已登录页面里，右上角菜单的 `控制台` 按钮点击没反应
- 目标不是再解释 UI 在哪，而是把线上按钮真正修好

### 根因已经查清

- 前台按钮逻辑在：
  - `apps/web/src/components/layout/header/internal/UserAuth.tsx`
- 这里会调用 `getAdminUrl()`，只有拿到非空 `adminUrl` 才会 `window.open(...)`
- `adminUrlAtom` 定义在：
  - `apps/web/src/atoms/url.ts`
- 旧代码里 `adminUrlAtom` 默认是 `null`，而且本地代码里没有任何稳定赋值路径
- `AggregationProvider` 只写入 `webUrl`，没有写 `adminUrl`
- 后端公开聚合接口会主动省略 `url.adminUrl`
  - 这一点前面已经在 `mx-core` 源码确认过：公开 aggregate 会 `omit(url.adminUrl)`
- 但 owner 登录后，可以通过：
  - `GET /api/v2/config/url`
  - 拿到 `adminUrl`

一句话根因：

- 前台“控制台”按钮坏掉，不是菜单没渲染，而是 owner 登录后前端从未把 `adminUrl` 拉回并写进状态，所以点击时一直是空值

### 这轮本地代码改了什么

- `apps/web/src/atoms/url.ts`
  - 新增：
    - `setAdminUrl(url: string | null)`
- `apps/web/src/providers/root/auth-session-provider.ts`
  - 无 session 时：
    - `setIsOwnerLogged(false)`
    - `setSessionReader(null)`
    - `setAdminUrl(null)`
  - 有 session 且 `role !== 'owner'` 时：
    - `setIsOwnerLogged(false)`
    - `setAdminUrl(null)`
  - 有 session 且 `role === 'owner'` 时：
    - 调 `apiClient.proxy('config/url').get()`
    - 成功则把 `response.data.adminUrl` 写入 atom
    - 失败则清空 atom

### 本地验证结果

- 下面两条都实际跑过并通过：
  - `pnpm --filter @shiro/web exec tsc --noEmit`
  - `pnpm --filter @shiro/web build`

### 线上链路这轮查到了什么

- 之前前台跨域去 `api.418122.xyz` 拿 `config/url` 会有 CORS 问题
- 服务器 `/opt/mxspace/docker-compose.yml` 里，`mx-server` 的：
  - `ALLOWED_ORIGINS`
  - 已经从错误写法修成：
    - `418122.xyz,www.418122.xyz`
- `mx-server` 已重启，当前已确认：
  - `https://api.418122.xyz/api/v2/config/url`
  - 对来自 `https://418122.xyz` 的请求会返回：
    - `Access-Control-Allow-Origin: https://418122.xyz`
    - `Access-Control-Allow-Credentials: true`
- 未登录请求该接口时，当前返回：
  - `401 {"ok":0,"code":15008,"message":"未登录"}`
  - 但 CORS 头是正确的

这说明：

- owner 登录态下，前台再去请求 `config/url`，链路本身已经不再被 CORS 挡住

### 这轮部署到底做了什么

#### 先试过但不稳/不推荐的路径

- 继续在服务器上直接跑：
  - `docker compose build yohaku`
- 这条路再次出现“长时间静默像卡死”的现象
- 当时服务器现场还存在残留进程：
  - `docker compose build yohaku`
  - `docker-compose compose build yohaku`
  - `pnpm turbo run build --filter=@shiro/web`
  - `node /app/apps/web/.next/build/postcss.js ...`
- 这类残留会让人误判“到底有没有在真正构建”

#### 这轮真正有效的上线方式

- 没继续赌服务器现编，而是改走“热更新当前运行容器”
- 具体做法：
  - 本地先构建通过
  - 从本地构建产物里提取运行时必须文件
  - 起初打过一个较大的 hotfix 包，但发现里面混进了：
    - Darwin `node_modules`
    - `._*` AppleDouble 垃圾文件
  - 这条包不适合直接覆盖 Linux 容器
- 后来重新打了“干净热更新包”，只包含：
  - `apps/web/server.js`
  - `apps/web/.next/server`
  - `apps/web/.next/static`
  - `apps/web/.next` 顶层关键 manifest / BUILD_ID
- 明确没有覆盖：
  - 容器里的 `node_modules`
- 干净包推到服务器后：
  - 解压到 `/tmp/yohaku-hotfix-clean-live`
  - 用 tar 管道把上述文件覆盖到 `yohaku:/app`
  - 然后 `docker restart yohaku`

#### 热更新后的实际结果

- `yohaku` 成功重启并恢复 `running`
- 容器日志显示 Next.js 正常 ready
- 当前复核到的现场：
  - `docker images blog-yohaku:latest`
    - `IMAGE ID = 7b6a0f6e6671`
    - `Created = About an hour ago`
  - `docker inspect yohaku`
    - `image=sha256:7b6a0f6e6671610ab2524bbaec2f3092685b2e52df8cd22fbe123d391dade6cf`
    - `started=2026-04-01T05:32:51.353692876Z`
    - `status=running`
  - `docker ps`
    - `yohaku -> blog-yohaku:latest -> Up`

### 一个非常重要的现实提醒

这轮“线上按钮恢复可用”的直接手段是：

- 把修复后的构建产物热覆盖到当前运行容器

所以必须明确写给下一位 agent：

- 当前运行中的 `yohaku` 容器文件系统里，已经有这次修复
- 我也验证过容器内 bundle 已经能搜到 `config/url` 这段 owner 拉取逻辑
- 但这 **不等于** 已经严格证明：
  - `blog-yohaku:latest` 镜像本身永久包含这次修复
- 因为热更新写入的是容器运行层；如果未来直接删容器并从镜像重新创建，仍需重新验证修复是否还在

也就是说：

- 这轮是“功能已上线、链路已恢复”
- 但从可重复部署角度看，仍然偏临时，不是最理想的正式发布形态

### 这轮命令级验证证据

- 本地：
  - `pnpm --filter @shiro/web exec tsc --noEmit`
  - `pnpm --filter @shiro/web build`
- 线上：
  - `curl -I -sS https://418122.xyz`
    - 返回 `HTTP/2 200`
  - `curl -i -sS -H 'Origin: https://418122.xyz' https://api.418122.xyz/api/v2/config/url`
    - 返回 `HTTP/2 401`
    - 同时带正确 CORS 头
  - `docker inspect yohaku --format 'image={{.Image}} started={{.State.StartedAt}} status={{.State.Status}}'`
    - 当前容器为 running

### 这轮关于部署方式的新结论

这次已经基本可以确认：

- 反复让小规格 VPS 自己 `docker compose build yohaku`，不是好主链路
- 根因不是单一业务 bug，而是部署方式太脆弱

我这轮额外查到的服务器事实：

- 服务器资源偏紧：
  - `Mem: 1.9Gi`
  - 一度只剩 `68Mi free`
  - `/` 磁盘只剩 `3.2G`
  - 磁盘使用率 `92%`
- 当前 `Dockerfile` 每次构建都很重：
  - `pnpm install`
  - `pnpm turbo run build --filter=@shiro/web`
  - runner 阶段还会联网下载字体
- 这类流程对小机子非常不友好，容易表现为：
  - 长时间静默
  - build 像卡死
  - 残留子进程
  - 状态混乱

### 我给用户的后续建议

不是继续优化“服务器现编前端”，而是把前端发布链路改掉。优先级如下：

1. 最推荐：
   - 前端迁移到 Vercel
   - `api.418122.xyz` 继续留在当前 VPS
   - 以后前端改完直接 git push -> Vercel 自动部署
2. 次优：
   - CI / 本地先构建镜像
   - 服务器只做 `pull/load + restart`
3. 最不推荐但可临时保留：
   - 继续让 VPS 自己 build
   - 但必须重构 Dockerfile、加 cache、拆 build / up、避免并发、并增加机器资源

### 关于 Vercel 的结论

- 用户问：“是不是用 Vercel 更好，因为作者推荐 Vercel”
- 我的结论是：
  - 对当前这个项目和用户现在的痛点来说，**大概率是更好**
- 理由：
  - 当前最痛的是生产机现编不稳
  - 项目本质上仍是标准 Next.js 前端
  - 前后端已能分离：
    - 前端调 `https://api.418122.xyz/api/v2`
    - 后端继续留在 VPS
- 但要注意一条原则：
  - 如果未来引入真正的 Next custom server，就不能直接按 Vercel 标准路径部署
- 当前仓库里看到的是：
  - `output: 'standalone'`
  - 以及 Docker/standalone 运行方式
  - 暂时没有看到必须依赖自定义 Node 网关才能跑的硬证据

### 给下一位 agent 的最短继续建议

如果接手后目标是“彻底收口，不再反复卡 Docker”，优先做这个：

1. 先读本节，不要再被上文旧的“新镜像还没产出”误导
2. 承认当前事实：
   - 线上功能已经恢复
   - `控制台` 按钮修复代码已本地完成并已通过热更新上线
   - 当前公网不是“没修”，而是“修复已在运行容器里”
3. 若要验证用户侧体验：
   - 让用户在 owner 已登录页面强刷后，再点右上角菜单里的 `控制台`
4. 若要做正式长期方案：
   - 不要再以“继续直接 `docker compose build yohaku`”为默认主线
   - 优先推进：
     - Vercel 前端部署
     - 或 CI 构建镜像、服务器只 pull
5. 若短期内仍需保留当前 VPS 前端：
   - 至少把这次修复重新做成可重复镜像发布
   - 然后再删除/重建一次 `yohaku` 容器，确认不是只存在于容器 overlay 里

### 这轮哪些东西有效，哪些没用

#### 有效

- 从 owner 登录链路反推 `adminUrl` 的真实来源
- 直接读本地/服务器源码确认：
  - aggregate 不公开 `adminUrl`
  - owner 可通过 `GET /api/v2/config/url` 拿到
- 修正 `mx-server` 的 `ALLOWED_ORIGINS`
- 在 `AuthSessionProvider` 中按 owner 登录态拉取 `config/url`
- 本地构建后，按“只覆盖运行时产物、不碰 node_modules”的方式热更新容器

#### 没用或不稳

- 继续盲跑服务器 `docker compose build yohaku`
- 把本机构建出来的 Darwin `node_modules` 一起打进 hotfix 包
- 直接覆盖整包而不筛掉 `._*` AppleDouble 文件
- 用“镜像大概已经是新的了”这类推断替代实际验证

如果时间有限，只看这一节也足够继续。

## [2026-04-01] 前端发布主链路定版（本节为部署指引最新权威结论）

> 本节明确覆盖此前“可考虑 Vercel”的探索性表述。
> 从本节开始，正式目标链路固定为：`GitHub Actions -> Vercel -> 418122.xyz / www.418122.xyz`。

### 1) 当前正式目标与角色划分（必须按此执行）

- 正式生产前端发布链路：`GitHub Actions -> Vercel -> 418122.xyz/www.418122.xyz`
- 旧 `.github/workflows/trigger.yml` 已降级为：
  - `workflow_dispatch` 手动触发
  - 仅用于 legacy/manual rollback，不再是默认前端发布路径
- 当前 VPS 前端容器 `yohaku` 的角色：
  - 仅为短期回退与过渡承载
  - 截至本次会话结束，由于 GitHub / Vercel 配置与 DNS cutover 都未执行，当前对公网提供服务的前端仍应视为 VPS `yohaku` 路径 / last-known live path
  - 但不再应被视为主生产前端形态

### 2) 本次会话已在仓库内完成的事项（代码侧完成）

- 新增主发布工作流：`.github/workflows/vercel-frontend-deploy.yml`
  - 触发：`push` 到 `main` + `workflow_dispatch`
  - 使用 secrets：`VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID`
  - 已包含并发保护、固定版本 `pnpm@10.27.0`、`vercel@47.0.5`、最小权限
- 调整旧工作流：`.github/workflows/trigger.yml`
  - 已改为手动触发
  - 已标注 legacy/manual rollback only
  - 已补充 curl 失败显式处理
- 文档已落仓：
  - `docs/deployment/vercel-frontend.md`（主路径、域名、secrets、env、发布/回滚/冒烟）
  - `README.md`（主路径更新为 Vercel 前端 + VPS API-only）

### 3) 必须在 GitHub / Vercel 控制台手动完成的事项（本会话尚未完成）

- GitHub Actions secrets（仓库设置）：
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID`
- Vercel 项目创建或链接：
  - Project Root Directory = `apps/web`
  - Production Branch = `main`
  - Environment Variables：
    - `NEXT_PUBLIC_API_URL=https://api.418122.xyz/api/v2`
    - `NEXT_PUBLIC_GATEWAY_URL=https://api.418122.xyz`
- Vercel 域名绑定：
  - `418122.xyz`
  - `www.418122.xyz`
- DNS / 流量切换到 Vercel：本会话尚未执行
- 本会话未核验的控制面事实：
  - 未确认 Vercel 项目是否已经存在
  - 未确认其实际 team / project 名称
  - 未确认 `418122.xyz` 当前 DNS 托管方
- 以上三项应作为下一位 agent 进入 GitHub / Vercel / DNS 控制面后的首批检查项，再决定如何 cutover

### 4) 验证证据（本会话已执行）

- workflow 格式检查：
  - 命令：
    - `pnpm exec prettier --check .github/workflows/vercel-frontend-deploy.yml .github/workflows/trigger.yml`
  - 结果：
    - `Checking formatting...`
    - `All matched files use Prettier code style!`
- workflow 差异空白检查：
  - 命令：
    - `git diff --check -- .github/workflows/vercel-frontend-deploy.yml .github/workflows/trigger.yml`
  - 结果：无输出（通过）
- 前端构建验证：
  - 命令：
    - `NEXT_PUBLIC_API_URL=https://api.418122.xyz/api/v2 NEXT_PUBLIC_GATEWAY_URL=https://api.418122.xyz pnpm --filter @shiro/web build`
  - 结果：构建通过
  - 备注：出现 Next.js workspace root 推断 warning（因 `/Users/zhenghan/package-lock.json` 存在额外 lockfile），不影响本次 build 成功
- 本次验证边界：
  - 新的 `GitHub Actions -> Vercel` 生产链路，本会话仅在仓库/workflow/config/build 层面完成本地验证
  - 本会话尚未完成 GitHub Actions 实跑 + Vercel 生产部署的端到端验证

### 5) 下一位 agent 的最短执行建议（按先后顺序）

1. 先进入 GitHub / Vercel / DNS 控制面，确认 Vercel 项目是否已存在、其 team/project 名称，以及 `418122.xyz` 当前 DNS 托管方；再完成 GitHub secrets 与 Vercel 项目/域名配置。
2. 在 `main` 合入后触发 `.github/workflows/vercel-frontend-deploy.yml`，确认 Vercel 产物可访问，并确认 GitHub Actions + Vercel 生产部署端到端跑通。
3. 再执行 DNS/流量切换，让 `418122.xyz` 与 `www.418122.xyz` 指向 Vercel。
4. 切换完成后，除了验证首页可访问，还必须验证此前出过问题的 `owner` 已登录 `控制台` 按钮链路是否正常。
5. 完成上述验收后，再将 VPS `yohaku` 明确降级为 rollback 容量；除回退演练外，不再把它当主生产前端。

## [2026-04-01 17:13] GitHub Actions -> Vercel 已跑通，待完成域名 cutover

> 本节明确覆盖上一节中“GitHub Actions / Vercel / DNS 尚未完成”的旧状态。
> 以本节为准：仓库侧的可重复部署链路已经被用户实际跑通，但域名绑定 / DNS 切流 / 上线验收还没在本文件中拿到最终实证。

### 1) 当前目标

- 收口目标已经从“把 Vercel workflow 配出来”变成：
  - 保持 `GitHub Actions -> Vercel` 为默认正式前端发布链路
  - 完成 `418122.xyz` 与 `www.418122.xyz` 的 Vercel 域名绑定与 DNS cutover
  - 做一次切流后的真实验收
- VPS `yohaku` 现在应视为：
  - 仍可用的 legacy/live fallback
  - 在域名正式切到 Vercel 并验收通过之前，不应贸然下线

### 2) 当前已知真实状态

- 本地仓库：
  - 分支：`codex/modify`
  - 当前 HEAD：`05ba7fd fix: 移除 Vercel 部署工作流的错误工作目录`
  - `git status --short` 无输出，工作区干净
- 仓库内已落地的文件：
  - `.github/workflows/vercel-frontend-deploy.yml`
  - `.github/workflows/trigger.yml`
  - `docs/deployment/vercel-frontend.md`
  - `README.md`
- 用户已明确反馈：
  - GitHub Actions 的 Vercel 部署“已经成功了，配置上了”
  - 这表示至少有一条真实的 `GitHub Actions -> Vercel production deploy` 已成功跑完
- 但当前 agent 尚未在 Vercel 控制面亲眼核验以下事实：
  - 实际 Vercel team 名称 / slug
  - 实际 project 名称
  - `418122.xyz` 与 `www.418122.xyz` 当前在 Vercel Domains 页的绑定状态
  - 当前公网根域名是否已经从 VPS 切到 Vercel
- 因此，此处必须区分：
  - “部署链路已跑通”是用户回传日志 + repo/workflow 演进可支持的事实
  - “域名已切到 Vercel 且公网验收通过”目前还不是本文件中的已验证事实

### 3) 这轮实际试了什么

#### 仓库内已经做过并生效的修改

- 新增/收口正式 workflow：`.github/workflows/vercel-frontend-deploy.yml`
  - 固定 `pnpm@10.27.0`
  - 固定 `vercel@47.0.5`
  - 触发：`push` 到 `main` + `workflow_dispatch`
  - 使用 secrets：
    - `VERCEL_TOKEN`
    - `VERCEL_ORG_ID`
    - `VERCEL_PROJECT_ID`
- 将旧 `.github/workflows/trigger.yml` 明确降级为 manual rollback only
- 修掉了一个关键 workflow 路径 bug：
  - 最初 workflow 里放了 `working-directory: apps/web`
  - 导致 runner 上执行时报错：
    - `ENOENT: no such file or directory, open '/home/runner/work/Blog/Blog/apps/web/apps/web/package.json'`
  - 已通过 commit `05ba7fd` 移除错误工作目录设置

#### 用户在 GitHub / Vercel 控制面已经实际完成的步骤

- 用户已登录 GitHub 与 Vercel
- 用户已创建或连接 Vercel 项目
- 用户已配置 GitHub Actions secrets
- 用户已至少触发并跑通一次生产部署

### 4) 什么有效

- 把 GitHub secrets 放在仓库级 `Settings -> Secrets and variables -> Actions`
  - 不是 environment secrets
  - 不是本地 shell 临时变量
- Vercel 项目关键配置使用：
  - Project Root Directory：`apps/web`
  - Production Branch：`main`
  - Vercel 项目里的 Node.js Version 改成 `22.x`
- workflow 中从仓库根目录执行 Vercel CLI，而不是再额外 `cd apps/web` 或 `working-directory: apps/web`
- 继续使用仓库里已经固定好的 CLI 版本：
  - `pnpm dlx vercel@47.0.5`
- 本地 build 验证命令仍然有效，可用于排除代码侧构建问题：

```bash
NEXT_PUBLIC_API_URL=https://api.418122.xyz/api/v2 \
NEXT_PUBLIC_GATEWAY_URL=https://api.418122.xyz \
pnpm --filter @shiro/web build
```

### 5) 什么没用、什么会误导

- 用无效 token 跑：

```bash
pnpm dlx vercel@47.0.5 pull --yes --environment=production --token="$VERCEL_TOKEN"
```

  - 会得到：
    - `Error: The specified token is not valid. Use vercel login to generate a new token.`
  - 这不是代码问题，而是 secret 值本身不对，或放错了位置
- 保持 Vercel Project Settings 中的 Node 版本为 `24.x`
  - 会报：
    - `Error: Found invalid Node.js Version: "24.x". Please set Node.js Version to 22.x`
  - 这里应改 Vercel 控制面，不是改 workflow 的 setup-node 就能解决
- 在 workflow 里额外设置 `working-directory: apps/web`
  - 会把路径拼成 `apps/web/apps/web`
  - 这正是导致 `package.json` 找不到的根因
- 仅凭本地 build 通过，就推断 Vercel 生产部署一定没问题
  - 本轮事实证明不够，控制面配置仍然会拦住部署
- 依赖当前会话里不稳定的网页登录态去推断 Vercel 控制面现状
  - 之前尝试过从网页侧检查，但 session 状态并不稳定，一度只看到 Vercel 登录页
  - 因此这一轮关于“部署成功”的权威来源以用户回传日志为准，而不是此前那个不稳定的网页观察

### 6) 已掌握的关键报错与对应修复

- 报错 1：`The specified token is not valid`
  - 修复：重新生成/重新填写正确的 `VERCEL_TOKEN`，并放到仓库级 GitHub Actions secrets
- 报错 2：`Found invalid Node.js Version: "24.x"`
  - 修复：去 Vercel Project Settings 把 Node.js Version 改为 `22.x`
- 报错 3：`ENOENT ... /apps/web/apps/web/package.json`
  - 修复：移除 workflow 中多余的 `working-directory: apps/web`
  - 对应提交：`05ba7fd`

### 7) 下一位 agent 不要重复排查的结论

- 不要再把当前问题当成“代码 build 坏了”
  - 代码侧构建已经验证过
  - 当前剩余问题集中在 Vercel domain / DNS / acceptance，而不是 repo 内部构建
- 不要再回头把 VPS `docker compose build yohaku` 当默认生产前端发布主线
  - 它现在只承担回退价值
- 不要再把“GitHub Actions 还没跑成功”当成待验证事项
  - 这一点已经被用户明确确认完成
  - 真正未完成的是域名和切流收口

### 8) 下一位 agent 的最短继续路径

1. 进入 Vercel 项目的 `Domains` 页面，核对并记录：
   - project 名称
   - team / scope 名称
   - `418122.xyz`
   - `www.418122.xyz`
   - 各自状态是 `Valid Configuration`、`Pending Verification` 还是别的
2. 若未添加域名，先添加 `418122.xyz` 与 `www.418122.xyz`。
3. 按 Vercel Domains 页给出的真实 DNS 记录，在当前 DNS 服务商处逐条配置。
4. 等域名状态就绪后，做一次验收：
   - `https://418122.xyz`
   - `https://www.418122.xyz`
   - 页面请求 `https://api.418122.xyz/api/v2` 正常
   - owner 登录正常
   - 用户此前点过的 `控制台` 按钮链路正常
5. 只有当上述验收都完成后，才把 VPS `yohaku` 明确标记为 rollback-only。

### 9) 给下一位 agent 的一句话版本

- 代码仓库、workflow、GitHub secrets、Vercel 生产部署本身已经跑通；不要再围绕 token / node version / `apps/web/apps/web` 这些旧坑兜圈子，直接去做 Domains + DNS + 切流验收。

## [2026-04-01 17:40] VPS 已移除 apex/www 前端入口，前端正式脱离 VPS

> 本节覆盖此前“VPS `yohaku` 仍可作为 live fallback 承载前端”的表述。
> 以本节为准：VPS 现在只承载 API；`418122.xyz` / `www.418122.xyz` 的前端流量不应再经过 VPS。

### 1) 这轮根因结论

- 用户要求继续排查“为什么 `/` 仍经过 Caddy，而 `/en` / `/dashboard` 已走 Vercel”，目标是让前端彻底脱离 VPS。
- 排查结果确认：
  - **公网实时请求** 到 `https://418122.xyz/`、`/en`、`/dashboard` 已经都返回 `server: Vercel`
  - 但 **VPS 上的 Caddy 仍保留**：
    - `418122.xyz, www.418122.xyz -> reverse_proxy yohaku:2323`
  - 我用：
    - `curl -k -I --resolve 418122.xyz:443:43.153.75.156 https://418122.xyz`
    - 可以稳定复现旧的：
      - `via: 1.1 Caddy`
      - `x-middleware-rewrite: /zh`
- 这说明此前“根路径偶尔仍像走 VPS”不是凭空现象，而是：
  - **公网切流已经发生**
  - 但 **VPS 旧前端入口仍活着**
  - 只要客户端/缓存/DNS 命中旧路径，就仍可能打到 VPS 上的 `yohaku`

### 2) 这轮在 VPS 上实际做了什么

- 服务器：
  - `43.153.75.156`
- SSH：
  - `ssh -i ~/.ssh/macair4.pem root@43.153.75.156`
- 先备份了旧 Caddy 配置：
  - `/opt/mxspace/Caddyfile.bak-20260401-frontend-detach`
- 然后把 `/opt/mxspace/Caddyfile` 改成 **只保留** `api.418122.xyz` 站点块
- 不再让 Caddy 监听：
  - `418122.xyz`
  - `www.418122.xyz`
- 用下面命令验证新配置合法并生效：

```bash
docker run --rm \
  -v /opt/mxspace/Caddyfile:/etc/caddy/Caddyfile:ro \
  caddy:2-alpine \
  caddy validate --config /etc/caddy/Caddyfile

cd /opt/mxspace && docker compose up -d --force-recreate caddy
cd /opt/mxspace && docker compose stop yohaku
```

### 3) 当前 VPS 运行状态

这轮收口后，服务器上的 `docker ps` 为：

- `mx-caddy`
- `mx-server`
- `redis`
- `mongo`

已经 **没有** 运行中的：

- `yohaku`

也就是说：

- VPS 现在只承载 API / Core / Redis / Mongo
- 前端运行容器已经停掉

### 4) 这轮实测验证结果

#### 公网前端仍正常

下面这些命令都返回 Vercel 响应头：

```bash
curl -I -sS https://418122.xyz/
curl -I -sS https://418122.xyz/en
curl -I -sS https://418122.xyz/dashboard
```

关键信号：

- `server: Vercel`
- `x-matched-path: /[locale]` 或 `/dashboard/[[...catch_all]]`

#### API 仍正常

```bash
curl -I -sS https://api.418122.xyz/api/v2/ping
```

返回：

- `HTTP/2 200`
- `via: 1.1 Caddy`

这符合预期，因为 API 现在仍由 VPS Caddy 反代到 `app:2333`

#### 强制命中 VPS 时，前端已不可达

这一步是本轮最关键的脱离证据：

```bash
curl -k -I -sS --resolve 418122.xyz:443:43.153.75.156 https://418122.xyz/
```

现在返回的是 TLS 握手失败：

- `curl: (35) LibreSSL... tlsv1 alert internal error`

这表示：

- 即使强行把 `418122.xyz` 的 SNI/Host 打到 VPS
- VPS 也已经不再对该 host 提供可用前端站点

### 5) 对下一位 agent 的直接结论

- 现在不要再把 VPS 当成前端 live fallback
- `418122.xyz` / `www.418122.xyz` 的前端链路应视为 **正式脱离 VPS**
- 若未来还想回退前端到 VPS：
  - 需要恢复 `/opt/mxspace/Caddyfile.bak-20260401-frontend-detach`
  - 并重新启动 `yohaku`
- 当前若继续做验收，应重点关注：
  - Vercel 前端功能完整性
  - API 与前端跨域/登录链路
  - 而不是再排查 VPS 前端容器

## [2026-04-01 17:48] 默认 compose 也已去前端化，VPS 只保留 rollback profile

> 本节补充上一节。
> 上一节解决的是“VPS 不再对外提供 apex/www 前端”；
> 本节继续解决“以后有人在 VPS 上跑 `docker compose up -d` 时，会不会又把 `yohaku` 带起来”。

### 1) 这轮发现的剩余隐患

- 虽然上一节已经：
  - 从 `Caddyfile` 中移除了 `418122.xyz, www.418122.xyz`
  - 停掉了 `yohaku`
- 但 `docker-compose.yml` 当时仍然保留：
  - `yohaku` 作为默认 service
  - `caddy.depends_on: [app, yohaku]`
- 这意味着：
  - 只要有人在 VPS 上习惯性执行 `cd /opt/mxspace && docker compose up -d`
  - `yohaku` 仍可能被重新启动
  - 从“运维默认路径”角度看，前端还没有彻底退出 VPS

### 2) 这轮在 VPS 上实际做了什么

- 服务器：
  - `43.153.75.156`
- 备份原 compose：
  - `/opt/mxspace/docker-compose.yml.bak-20260401-yohaku-rollback-profile`
- 重新整理 `/opt/mxspace/docker-compose.yml`：
  - 给 `yohaku` 增加：
    - `profiles: [rollback]`
  - 把 `caddy.depends_on` 从：
    - `app + yohaku`
    - 改成只依赖 `app`
- 然后执行：

```bash
cd /opt/mxspace && docker compose config >/tmp/mxspace-compose-effective.yaml
cd /opt/mxspace && docker compose up -d app mongo redis caddy
docker rm -f yohaku >/dev/null 2>&1 || true
```

### 3) 关键验证结果

#### 默认 compose up 不会再启动 yohaku

这一步已经真实执行：

```bash
cd /opt/mxspace && docker compose up -d
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'
```

结果只剩：

- `mx-caddy`
- `mx-server`
- `redis`
- `mongo`

没有 `yohaku`

#### docker compose config 的默认有效编排也不含运行态前端依赖

实测：

```bash
cd /opt/mxspace && docker compose config
```

当前有效配置中：

- `caddy.depends_on` 只剩 `app`
- `yohaku` 不再参与默认启动路径

### 4) 这轮补做的烟测

#### 公网前端

以下都返回 `server: Vercel`：

```bash
curl -I -sS https://418122.xyz/
curl -I -sS https://418122.xyz/en
curl -I -sS https://418122.xyz/dashboard
curl -I -sS https://418122.xyz/dashboard/site
```

#### API

```bash
curl -I -sS https://api.418122.xyz/api/v2/ping
```

返回：

- `HTTP/2 200`
- `via: 1.1 Caddy`

符合“VPS 只承载 API”的当前目标

#### 强制命中 VPS 的前端 host

以下命令仍返回 TLS 握手失败：

```bash
curl -k -I -sS --resolve 418122.xyz:443:43.153.75.156 https://418122.xyz/
curl -k -I -sS --resolve www.418122.xyz:443:43.153.75.156 https://www.418122.xyz/
```

这说明 VPS 仍然不对 apex/www 提供前端

#### owner 链路

浏览器实测：

- `https://418122.xyz/dashboard/site` 可正常打开
- 页面内能看到：
  - `站点配置`
  - `SEO`
  - `Hero`
  - `社交链接`
  - `页脚链接`
- owner 登录态下页面执行：

```js
fetch("https://api.418122.xyz/api/v2/config/url", { credentials: "include" })
```

返回 `200`

- 前台用户菜单里的 `Console` 触发的仍是：
  - `window.open("https://api.418122.xyz/proxy/qaqdmin", "_blank")`

### 5) 给下一位 agent 的直接结论

- 现在 VPS 已经不只是“流量上不再承载前端”
- 而且在 **默认运维路径** 上也不再会把前端带起来
- 若以后需要临时回退到 VPS 前端，可考虑：

```bash
cd /opt/mxspace
docker compose --profile rollback up -d yohaku
```

但前提仍是：

- 恢复 apex/www 的 Caddy 站点块
- 明确这是人工回退动作，而不是默认发布路径

### 6) 这轮额外沉淀的长期文档

为了避免以后再误操作把前端带回 VPS，这轮已新增/更新长期文档：

- 新增：
  - `docs/deployment/vps-frontend-rollback.md`
- 更新：
  - `docs/deployment/vercel-frontend.md`
  - `README.md`

直接用途：

- 日常发布看：
  - `docs/deployment/vercel-frontend.md`
- 需要临时回退 VPS 前端时看：
  - `docs/deployment/vps-frontend-rollback.md`

不要只依赖本 handoff 去执行长期运维动作；优先以这两份部署文档为准。

## [2026-04-02 02:30] 头部登录入口收拢已发布，以下新节为准

### 当前目标

- 将前台站点 `418122.xyz` 的账号入口从右上角移除
- 统一收拢到左上角头像/入口位
- 完成本地提交、远端推送与一次真实可追踪的生产部署

### 这轮做了什么

- 本地功能改动已在 commit `b3c287b feat: 收拢头部登录入口到左上角头像`
- 当前分支仍为 `codex/modify`
- `origin/codex/modify` 已确认指向同一提交：

```bash
git rev-parse HEAD
git rev-parse origin/codex/modify
```

- 两者都返回：
  - `b3c287b963b5c7699cd213f5f2b54a462762f9a0`

### 什么有效

- 这次为了避开 lint-staged / eslint 被无关打包产物污染，只提交了目标文件，没有把以下未跟踪产物混入本次提交：
  - `bootstrap.js`
  - `main-8X_hBwW2.js`
  - `plugins-page-nmaiEpNu.js`
  - `product-name-CswjKXkf.js`
- 本地构建与格式化验证在提交前已通过
- 旧的 GitHub Actions run `23864141052` 实际绑定的是旧提交 `a489e91`，不能代表这次发布
- 重新执行：

```bash
gh workflow run .github/workflows/vercel-frontend-deploy.yml --ref codex/modify
```

- 新 run `23864231971` 绑定的是正确提交 `b3c287b`
- 由于 workflow 配置了：

```yaml
concurrency:
  group: vercel-frontend-production
  cancel-in-progress: true
```

- 所以旧 run `23864141052` 已自动取消，状态为：
  - `completed/cancelled`
- 新 run `23864231971` 已成功完成，状态为：
  - `completed/success`

### 真实部署证据

- 成功 run：
  - <https://github.com/V-IOLE-T/Blog/actions/runs/23864231971>
- `gh run view 23864231971 --json status,conclusion,url,headSha` 返回：
  - `status=completed`
  - `conclusion=success`
  - `headSha=b3c287b963b5c7699cd213f5f2b54a462762f9a0`
- run 日志中可见：
  - `Deploying ni-chijous-projects/blog-web`
  - `Production: https://blog-ny3ogl0cf-ni-chijous-projects.vercel.app`

### 什么没有完全验证

- 从当前本机 shell 直接访问前台域名：

```bash
curl -I -sS https://418122.xyz
```

- 返回 TLS 握手错误：
  - `curl: (35) ... tlsv1 alert internal error`
- `openssl s_client -connect 418122.xyz:443 -servername 418122.xyz` 也显示服务端在握手阶段返回 `alert internal error`
- 但 API 域名当前可正常返回：

```bash
curl --tlsv1.2 -I -sS https://api.418122.xyz/api/v2/ping
```

- 返回 `HTTP/2 200`
- 因此本轮能确认的是：
  - GitHub Actions 已把正确提交成功部署到 Vercel production
- 还不能仅凭当前 shell 网络断言：
  - apex 域名 `418122.xyz` 的外网访问链路一定完全正常

### 给下一位 agent 的直接建议

- 若用户只关心“这次改动是否已发版”，直接以 run `23864231971 success` 为准
- 若用户反馈线上主域名仍看不到改动，优先排查：
  - `418122.xyz` 是否仍正确指向当前 Vercel production
  - 域名证书 / TLS 握手是否异常
  - 是否存在 CDN / 浏览器缓存
- 如需继续追站点可达性，可优先复用这些命令：

```bash
gh run view 23864231971 --log | tail -n 120
curl -I -sS https://418122.xyz
curl --tlsv1.2 -I -sS https://api.418122.xyz/api/v2/ping
echo | openssl s_client -connect 418122.xyz:443 -servername 418122.xyz
```

## [2026-04-02 03:39] GitHub 社交登录已定位为后端 callback URL 拼接错误

> 这一节是当前“GitHub provider 已配置但点击登录仍失败”的最新权威结论。若与前文冲突，以本节为准。

### 当前目标

- 排查并解释：为什么 GitHub OAuth App 已配置后，站点前台点击左上角登录入口仍然无法正常进入 GitHub 登录。

### 已尝试路径

- 复核线上前端运行时环境：
  - `curl -I -sS https://418122.xyz`
  - 结果显示当前前端由 `Vercel` 提供，`server: Vercel`
- 复核页面注入环境变量：
  - `curl -sS https://418122.xyz | grep -n "window.__ENV\\|NEXT_PUBLIC_API_URL\\|NEXT_PUBLIC_GATEWAY_URL"`
  - 已确认页面注入：
    - `NEXT_PUBLIC_API_URL=https://api.418122.xyz/api/v2`
    - `NEXT_PUBLIC_GATEWAY_URL=https://api.418122.xyz`
- 复核后端 provider 接口：
  - `curl -sS -D - https://api.418122.xyz/api/v2/auth/providers`
  - 返回 `HTTP/2 200`
  - body: `{"data":["github"]}`
- 复核匿名 session：
  - `curl -sS -D - https://api.418122.xyz/api/v2/auth/session`
  - 返回 `HTTP/2 200`
  - body: `null`
- 用 `web-access` 浏览器从匿名态真实点击左上角登录入口并进入 GitHub 授权页

### 什么有效

- 已确认问题**不在 provider 是否注册成功**：
  - `/api/v2/auth/providers` 已返回 `github`
- 已确认问题**不在前台运行时 API 环境变量**：
  - 首页注入的 `NEXT_PUBLIC_API_URL` 是正确的 `https://api.418122.xyz/api/v2`
- 已确认问题**不是“当前暂不可登录”那类 providers 为空问题**
- 真实点击登录后，浏览器跳转到 GitHub OAuth 授权地址，说明前台触发链路已经走到 provider 授权步骤

### 根因结论

- 真实失败点发生在 GitHub OAuth 授权页，页面文案为：
  - `The redirect_uri is not associated with this application.`
- 真实打开的授权 URL 中，`redirect_uri` 是：
  - `https://api.418122.xyz/auth/callback/github`
- 但用户当前在 GitHub OAuth App 中配置的是：
  - `https://api.418122.xyz/api/v2/auth/callback/github`
- 两者不一致，导致 GitHub 直接报 `Invalid Redirect URI`

### 代码级证据

- 服务器源码路径：
  - `/opt/mx-core-src/apps/core/src/modules/auth/auth.middleware.ts`
- 当前实现会把 GitHub 回调地址拼成：

```ts
redirectURI: `${urls.serverUrl}/auth/callback/github`
```

- 但 Better Auth 在同项目中的 `basePath` 实际是：
  - 开发环境：`/auth`
  - 生产环境：`/api/v${API_VERSION}/auth`
- 对应源码：
  - `/opt/mx-core-src/apps/core/src/modules/auth/auth.implement.ts`

```ts
basePath: isDev ? '/auth' : `/api/v${API_VERSION}/auth`
```

- 因此当前后端在生产环境下把 OAuth callback URL 少拼了 `/api/v2`

### 什么没有修

- 本轮还**没有**修改服务器源码、重建镜像或重启 `mx-server`
- 本轮也**没有**改动 GitHub OAuth App 配置

### 下一步最推荐动作

- 优先修后端源码，而不是改 GitHub 配置去迁就错误实现
- 建议修法：
  - 在 `/opt/mx-core-src/apps/core/src/modules/auth/auth.middleware.ts` 中，让 `redirectURI` 与 Better Auth 的 `basePath` 保持一致
  - 生产环境应改为：
    - `https://api.418122.xyz/api/v2/auth/callback/github`
- 修完后需要：
  - 重新构建 `mx-server`
  - 重启服务
  - 再验证一次左上角登录入口

### 关键验证命令

```bash
curl -sS -D - https://api.418122.xyz/api/v2/auth/providers
curl -sS -D - https://api.418122.xyz/api/v2/auth/session
```

- 若要在浏览器中再次复核，可关注 GitHub 授权页最终 URL 里的 `redirect_uri` 参数是否已变成：
  - `https://api.418122.xyz/api/v2/auth/callback/github`

### [2026-04-02 04:04] 本节补充：服务器已修 callback，当前剩余阻塞在 GitHub OAuth App / clientId 对应关系

- 已直接在服务器源码中修复：
  - 文件：`/opt/mx-core-src/apps/core/src/modules/auth/auth.middleware.ts`
  - 改动：
    - 新增 `import { API_VERSION } from '~/app.config'`
    - 新增：

```ts
const authBasePath = isDev ? '/auth' : `/api/v${API_VERSION}/auth`
```

    - GitHub / Google 的 `redirectURI` 统一改为：

```ts
`${urls.serverUrl}${authBasePath}/callback/<provider>`
```

- 已重建镜像并替换线上 `mx-server`
  - 新镜像 ID：
    - `sha256:f4bf60cd0ee30f2bac5c412ace531ad2a73699aa95c578690ddd3294c76ee78b`
  - 当前容器已运行该镜像：

```bash
docker inspect mx-server --format "{{.Image}}"
```

  - 返回：
    - `sha256:f4bf60cd0ee30f2bac5c412ace531ad2a73699aa95c578690ddd3294c76ee78b`

- 已做 fresh verification：

```bash
curl -sS -D - https://api.418122.xyz/api/v2/ping
curl -sS -D - https://api.418122.xyz/api/v2/auth/providers
```

- 结果：
  - `/api/v2/ping` -> `HTTP/2 200`
  - `/api/v2/auth/providers` -> `HTTP/2 200`
  - body: `{"data":["github"]}`

- 再次用浏览器从匿名态真实点击登录按钮后，GitHub 授权 URL 中的 `redirect_uri` 已经变成：
  - `https://api.418122.xyz/api/v2/auth/callback/github`

- 但 GitHub 页面仍报：
  - `The redirect_uri is not associated with this application.`

- 当前最关键的新判断：
  - 服务器 callback 路径问题已经修好
  - 现在剩余问题大概率是：
    1. GitHub OAuth App 页面里配置的 callback URL 与当前后端实际使用的 app 不一致
    2. 或者后端 `oauth` 配置里的 `clientId/clientSecret` 对应的是另一套 GitHub OAuth App

- 已从真实 GitHub 授权 URL 观察到后端当前使用的 `client_id` 是：
  - `Ov23liSx4jsKbiVXeQnH`

- 因此下一位 agent / 当前继续排查时，第一优先级是：
  - 让用户核对其正在编辑的 GitHub OAuth App 的 **Client ID 是否正好是** `Ov23liSx4jsKbiVXeQnH`
  - 并确认该 app 的 callback URL **精确等于**：
    - `https://api.418122.xyz/api/v2/auth/callback/github`
  - 注意不能有：
    - 少 `/api/v2`
    - 尾部多 `/`
    - 多余 query
    - 编辑的是另一套 OAuth App

- 额外观察：
  - `docker logs mx-server` 中有 Better Auth 警告：

```text
[better-auth] Base URL could not be determined. Please set a valid base URL using the baseURL config option or the BETTER_AUTH_URL environment variable.
```

  - 它还没有阻止当前授权 URL 生成，但若后续 callback/redirect 仍异常，可补：
    - `BETTER_AUTH_URL=https://api.418122.xyz/api/v2/auth`

## [2026-04-02 04:29] 用户已重新配置 GitHub，当前 handoff 以本节为最新权威状态

> 本节覆盖上面“clientId/clientSecret 仍不匹配”的中间态描述。若与前文冲突，以本节为准。

### 当前目标

- 让下一位 agent 接手时，不需要重新从头排查 GitHub 社交登录链路。
- 当前重点不再是“找根因”，而是基于已经完成的修复和用户最新反馈，继续做收尾验证、清理遗留风险，或处理新增问题。

### 截至当前的真实状态

- 用户最新反馈：`好了，现在配置好了。`
- 当前线上后端服务仍在线，fresh verification：

```bash
curl -sS -D - https://api.418122.xyz/api/v2/ping
curl -sS -D - https://api.418122.xyz/api/v2/auth/providers
```

- 实测结果：
  - `/api/v2/ping` -> `HTTP/2 200`
  - body: `{"data":"pong"}`
  - `/api/v2/auth/providers` -> `HTTP/2 200`
  - body: `{"data":["github","google"]}`

- 与上一轮相比，一个重要变化是：
  - providers 列表从之前的 `["github"]` 变成了 `["github","google"]`
  - 说明后台 `oauth` 配置这轮被用户实际更新过，而且配置中心刷新已经生效

- 当前运行的后端容器仍是我们修过 callback 的镜像：

```bash
ssh -i ~/.ssh/macair4.pem root@43.153.75.156 \
  'docker inspect mx-server --format "{{.Image}}"'
```

- 返回：
  - `sha256:f4bf60cd0ee30f2bac5c412ace531ad2a73699aa95c578690ddd3294c76ee78b`

### 这次排查里试过什么

#### 1. 先验接口验证

- 验证过旧错误路径：

```bash
curl -sS -D - https://api.418122.xyz/api/v2/proxy/auth/providers
curl -sS -D - https://api.418122.xyz/api/v2/proxy/auth/session
```

- 两者早先都返回 `404`
- 这一步帮助确认：
  - 真正可用的 auth 接口不在 `/proxy/auth/*`
  - 线上应该以 `/api/v2/auth/*` 为准

#### 2. 核对后端 provider 链路

- 验证：

```bash
curl -sS -D - https://api.418122.xyz/api/v2/auth/providers
curl -sS -D - https://api.418122.xyz/api/v2/auth/session
```

- 这一步有效，因为它把问题从“前端按钮没反应”收窄成了“provider 已注册，但 OAuth 授权 / token exchange 失败”

#### 3. 服务器源码排查

- 关键源码文件：
  - `/opt/mx-core-src/apps/core/src/modules/auth/auth.middleware.ts`
  - `/opt/mx-core-src/apps/core/src/modules/auth/auth.implement.ts`
  - `/opt/mx-core-src/apps/core/src/modules/auth/auth.controller.ts`

- 有效结论：
  - provider 来自配置中心 `oauth` / `url`
  - 不是通过 docker env 直接注入 GitHub provider
  - 生产环境 Better Auth `basePath` 是 `/api/v2/auth`
  - 原始代码却把 GitHub callback 拼成了 `/auth/callback/github`

#### 4. 真实浏览器点击复现

- 使用 `web-access` 独立浏览器从匿名态点击站点左上角登录入口
- 这一步非常有效，因为它给了我们两段关键的一手证据：
  - 第一阶段：GitHub 报 `Invalid Redirect URI`
  - 第二阶段：修 callback 后，GitHub 改为报 `incorrect_client_credentials`

### 什么有效

- 直接查线上接口有效
  - 比只看前端文案更快锁定 auth 链路真实状态
- 直接看服务器日志有效
  - 在 `docker logs mx-server` 中明确看到了 Better Auth 的一手报错
- 修后端 callback 拼接有效
  - 现在服务器发出的 `redirect_uri` 已与 GitHub App callback URL 对齐
- 让用户重新核对 GitHub OAuth App 的 `Client ID / Client Secret` 有效
  - 这是把错误从 `Invalid Redirect URI` 推进到“现在配置好了”的关键动作

### 什么没用 / 容易误导

- 只改 GitHub 回调 URL，不改后端 callback 拼接
  - 无法解决问题
- 盯着 `/api/v2/proxy/auth/*`
  - 会把注意力带偏，这不是当前真实可用的 auth 路由
- 只看前端按钮交互，不查 GitHub 授权页和服务器日志
  - 无法知道到底是 callback 错、secret 错，还是 state/code 交换失败
- 用自动化浏览器判断“最终登录一定成功”
  - 不够可靠
  - 原因是 OAuth 流程涉及 popup、GitHub 登录态、人工授权与站点 cookie 回写，CDP 自动化在这一步容易受 popup/user gesture 限制

### 曾经出现过、但当前已不是最新结论的错误

- `Invalid Redirect URI`
  - 根因：后端 callback 少了 `/api/v2`
  - 状态：已通过服务器源码修复
- `incorrect_client_credentials`
  - 根因：GitHub App 的 `client_id/client_secret` 与后端配置不匹配
  - 状态：这是用户本轮“重新配置好”之前的最新阻塞；当前应视为历史中间态，不再是最新权威状态

### 当前还能看到的日志信号

- 在最近 20 分钟日志里仍能看到历史错误：
  - `incorrect_client_credentials`
  - `State not found undefined`
  - `Cannot GET /?error=invalid_code`
- 这些是前面几轮错误配置时留下的记录，不代表用户最新这轮配置后仍然必现
- 同一批日志里还能看到：

```text
[better-auth] Base URL could not be determined. Please set a valid base URL using the baseURL config option or the BETTER_AUTH_URL environment variable.
```

- 这条警告目前仍存在，虽然它没有阻止 provider 列表正常返回，但它是后续最值得优先清理的遗留风险之一

### 当前代码 / 部署 / 环境状态

- 本地仓库：
  - `/Users/zhenghan/Documents/GitHub/Blog`
- 当前分支：
  - `codex/modify`
- 本地当前额外脏文件：
  - `HANDOFF.md` 已修改
  - 还有此前就存在的未跟踪打包产物，不要误处理：
    - `bootstrap.js`
    - `main-8X_hBwW2.js`
    - `plugins-page-nmaiEpNu.js`
    - `product-name-CswjKXkf.js`

- 服务器：
  - `ssh -i ~/.ssh/macair4.pem root@43.153.75.156`
- 后端源码：
  - `/opt/mx-core-src`
- 线上运行容器：
  - `mx-server`
  - 当前镜像 digest：
    - `sha256:f4bf60cd0ee30f2bac5c412ace531ad2a73699aa95c578690ddd3294c76ee78b`

### 下一位 agent 最推荐先做什么

1. 先不要重新排 callback 根因，这一段已经完成。
2. 若用户说“现在已经能登录”，先做一次 end-to-end 验证，而不是继续猜。
3. 最优先检查是否还需要补 `BETTER_AUTH_URL`：
   - 建议值：
     - `BETTER_AUTH_URL=https://api.418122.xyz/api/v2/auth`
4. 若用户又报新的 OAuth 问题，先看 fresh logs：

```bash
ssh -i ~/.ssh/macair4.pem root@43.153.75.156 \
  'docker logs --since 10m mx-server 2>&1 | tail -n 200'
```

5. 若要确认当前 provider 配置中心状态，可优先从后台 UI 或 `config/oauth` 相关接口入手，而不是再猜 env

### 关键命令清单

```bash
curl -sS -D - https://api.418122.xyz/api/v2/ping
curl -sS -D - https://api.418122.xyz/api/v2/auth/providers
curl -sS -D - https://api.418122.xyz/api/v2/auth/session

ssh -i ~/.ssh/macair4.pem root@43.153.75.156 \
  'docker inspect mx-server --format "{{.Image}}"'

ssh -i ~/.ssh/macair4.pem root@43.153.75.156 \
  'docker logs --since 10m mx-server 2>&1 | tail -n 200'
```

## [2026-04-02 04:43] 站点配置页 Snippet 已存在 + 首屏卡顿 已定位并本地修复

> 若后续问题集中在 `/dashboard/site` 的首页配置保存或打开速度，这一节是最新权威状态。

### 当前目标

- 修复用户在站点配置页修改首页 Hero / Footer / Social 等配置时，保存报错 `Snippet 已存在`
- 修复 `/dashboard/site` 页面打开时长时间 loading、体感卡顿的问题

### 真实根因

#### 1. `Snippet 已存在` 的根因

- 文件：`apps/web/src/routes/site/index.tsx`
- 旧实现不是精确读取当前主题 snippet，而是：
  - 先请求 `GET /snippets/group/theme`
  - 再在前端结果里 `find(item.name === 'shiro')`
- 但保存时却是：
  - 有 `id` -> `PUT /snippets/:id`
  - 没 `id` -> `POST /snippets`
- 这意味着只要 `group/theme` 没返回当前那条 `theme/shiro` 记录，前端就会误判成“snippet 不存在”，随后走 `POST /snippets`，最终撞到后端唯一约束并报 `Snippet 已存在`

#### 2. 站点配置页打开卡顿的根因

- 同一文件旧实现把页面 loading 条件写成：
  - `aggregationQuery.isLoading || snippetQuery.isLoading || !aggregationQuery.data || !form`
- 但页面表单初始值实际上只依赖 `aggregation.root()`，并不依赖 snippet 查询结果
- 结果是：
  - 即使 aggregate 已经拿到、表单已可构建
  - 页面仍会被 `snippetQuery.isLoading` 卡住
- 所以 `/dashboard/site` 的首屏体验被一个“仅用于保存时拿 snippet 元数据”的查询拖慢了

### 这次做了什么

- 新增精确 snippet helper：
  - `apps/web/src/routes/site/theme-snippet.ts`
- 将站点配置页的 snippet 查询改为：
  - `apiClient.snippet.getByReferenceAndName('theme', 'shiro')`
- 对 `404` 做显式处理：
  - 仅在“精确确认不存在”时才返回 `null`
  - 其他错误继续抛出，不吞掉真实异常
- 去掉 `/dashboard/site` 首屏对 `snippetQuery.isLoading` 的阻塞
- 保存时增加兜底：
  - 若页面已渲染但 snippet query 还没完成，会在 `save()` 内再次 `fetchQuery(themeSnippetQueryOptions)`，确保真正决定 `PUT` 还是 `POST` 时拿到最新结果

### 哪些文件被改了

- `apps/web/src/routes/site/index.tsx`
- `apps/web/src/routes/site/theme-snippet.ts`
- `apps/web/src/routes/site/theme-snippet.test.ts`

### 什么有效

- 先读 `HANDOFF.md` 和 `apps/web/src/routes/site/*`
  - 很快把问题收敛到首页配置入口而不是首页渲染组件本身
- 对照 API client 源码有效
  - `apps/web/node_modules/@mx-space/api-client/dist/index.mjs`
  - 明确发现已经有 `snippet.getByReferenceAndName(reference, name)` 这个精确查询能力，旧代码只是没用
- 把“页面是否能渲染”和“保存前是否拿到 snippet 元数据”拆开处理有效
  - 这样同时解决了保存误判和首屏等待

### 什么没用 / 容易误导

- 继续依赖 `GET /snippets/group/theme` 再前端筛 `name === 'shiro'`
  - 这正是误判根源
- 认为页面必须等 snippet query 完成才能显示
  - 不成立，表单初始值来自 aggregate，不来自 snippet raw
- 只盯着首页 Hero 组件
  - 当前问题不在 `apps/web/src/app/[locale]/(home)/components/Hero.tsx`
  - 而在 dashboard 配置页的数据读写策略

### 本地验证结果

- 定向测试通过：

```bash
pnpm exec vitest run \
  apps/web/src/routes/site/theme-snippet.test.ts \
  apps/web/src/routes/site/form-state.test.ts
```

- 结果：
  - `2` 个测试文件通过
  - `5` 个测试通过

- 构建通过：

```bash
pnpm --filter @shiro/web build
```

- 结果：
  - `next build` 成功
  - 输出包含 `/dashboard/[[...catch_all]]`

### 当前代码 / 环境状态

- 本地仓库：
  - `/Users/zhenghan/Documents/GitHub/Blog`
- 当前分支：
  - `codex/modify`
- 当前与本轮直接相关的工作树变更：
  - `apps/web/src/routes/site/index.tsx`
  - `apps/web/src/routes/site/theme-snippet.ts`
  - `apps/web/src/routes/site/theme-snippet.test.ts`
- 仍有此前就存在、与本轮无关的脏文件，不要误处理：
  - `bootstrap.js`
  - `main-8X_hBwW2.js`
  - `plugins-page-nmaiEpNu.js`
  - `product-name-CswjKXkf.js`

### 下一位 agent 最推荐先做什么

1. 先让用户在真实后台 `/dashboard/site` 再试一次保存首页配置，确认线上是否还会报 `Snippet 已存在`
2. 若用户仍反馈慢，优先在浏览器 Network 里对比：
   - `aggregate?theme=shiro`
   - `snippets/theme/shiro`
   看是否还有后端接口本身偏慢
3. 若线上仍存在旧行为，检查是否已经把这次前端修复部署到 Vercel / 当前实际站点
4. 若后续要继续优化体验，可考虑把 snippet 元数据查询改成：
   - 页面渲染后后台预取
   - 或保存时首次按需获取
   但当前这轮不需要继续扩大改动

### 关键命令 / 证据

```bash
sed -n '1,260p' apps/web/src/routes/site/index.tsx
sed -n '1,220p' apps/web/src/routes/site/form-state.ts
sed -n '1,220p' apps/web/src/routes/site/theme-snippet.ts

pnpm exec vitest run \
  apps/web/src/routes/site/theme-snippet.test.ts \
  apps/web/src/routes/site/form-state.test.ts

pnpm --filter @shiro/web build

curl -sS -m 20 'https://api.418122.xyz/api/v2/aggregate?theme=shiro' | jq '.theme.config.hero'
curl -sS -m 20 https://api.418122.xyz/api/v2/snippets/group/theme
```

## [2026-04-02 04:55] 站点配置页修复已通过 GitHub Actions 发布到 Vercel

> 若下一个 agent 需要确认“这次站点配置页修复是否已上线”，以本节为准。

### 已上线的提交

- 分支：`codex/modify`
- 提交：`c9b2789`
- commit message：`fix(site): 修复站点配置页 Snippet 查询`

### 实际发布动作

- 推送：

```bash
git push origin codex/modify
```

- 手动触发 workflow：

```bash
gh workflow run .github/workflows/vercel-frontend-deploy.yml --ref codex/modify
```

- 本次 run：
  - `23870256064`
  - URL:
    - `https://github.com/V-IOLE-T/Blog/actions/runs/23870256064`

### 发布结果

- `gh run watch 23870256064 --exit-status` 返回成功
- GitHub Actions 显示：
  - workflow：`Deploy Frontend to Vercel`
  - branch：`codex/modify`
  - head sha：`c9b27896e431ca565f175a82057cfebe63c34d4c`
  - job 用时：`2m44s`

### Vercel 产物

- Inspect：
  - `https://vercel.com/ni-chijous-projects/blog-web/2Za2sstEx9WUeTXo6W2YRoXGvJht`
- Production deployment：
  - `https://blog-ifv2neqb1-ni-chijous-projects.vercel.app`

### 发布后 smoke 结果

- `curl -I -sS https://418122.xyz/`
  - `HTTP/2 200`
  - `server: Vercel`
  - `x-vercel-cache: MISS`
- `curl -I -sS https://418122.xyz/dashboard`
  - `HTTP/2 200`
  - `server: Vercel`
  - `x-vercel-cache: MISS`
- `curl -sS https://api.418122.xyz/api/v2/ping`
  - `{"data":"pong"}`

### 当前仍需注意

- 这次是通过 `workflow_dispatch` 从 `codex/modify` 直接发的 production deploy，不是通过 `main` push
- 站点基础可达已验证，但“后台保存首页配置后不再报 `Snippet 已存在`”这条还没有在真实登录态下做人工端到端回归
- workflow 日志里仍有一条中长期提醒：
  - GitHub Actions 上 `actions/checkout@v4` / `actions/setup-node@v4` / `pnpm/action-setup@v4` 仍运行在 Node.js 20 action runtime
  - 从 `2026-06-02` 起默认会被切到 Node 24
  - 这不是本次发布阻塞，但后续应择机升级 action 版本或验证兼容性

## [2026-04-02 14:29] 修复 `name: Invalid input: expected string, received undefined` 并已重新发布

> 若下一个 agent 需要确认“为什么 `Snippet 已存在` 修完后又变成 `name` 校验错误”，以本节为准。

### 当前问题与根因

- 用户在 `/dashboard/site` 保存配置时，线上报：
  - `name: Invalid input: expected string, received undefined`
- 根因不是保存 payload 拼接逻辑本身回退了，而是：
  - `apps/web/src/routes/site/theme-snippet.ts`
  - 新增的精确查询 `getByReferenceAndName('theme', 'shiro')`
  - 实际返回形状可能是 `{ data: { ...snippet } }`
- 之前 helper 直接把返回值当 snippet 本体来归一化，没有先解 `data`
- 于是：
  - `existingThemeSnippet` 是“包裹对象”
  - fallback 没有生效
  - `payloads.themeSnippet.name` 变成 `undefined`
  - 后端 zod / DTO 校验报 `expected string, received undefined`

### 这次做了什么

- 文件：
  - `apps/web/src/routes/site/theme-snippet.ts`
  - `apps/web/src/routes/site/theme-snippet.test.ts`
- 新增 `unwrapThemeSnippetRecord()`
  - 先识别是否已经是 snippet 本体
  - 如果是 `{ data: ... }` 包裹，就递归拆包
- 再在 `normalizeThemeSnippetRecord()` 中统一基于拆包后的对象补 `id`

### 新增/更新的测试

- 新增测试：
  - `unwraps data-wrapped snippet responses before normalizing fields`
- 这条测试先红后绿，证明当前 helper 现在能兼容：

```ts
{
  data: {
    _id: 'wrapped-id',
    name: 'shiro',
    reference: 'theme',
    type: 'json',
    raw: '{"config":{}}',
  },
}
```

### 本地验证

```bash
pnpm exec vitest run \
  apps/web/src/routes/site/theme-snippet.test.ts \
  apps/web/src/routes/site/form-state.test.ts

pnpm --filter @shiro/web build
```

- 结果：
  - 2 个测试文件通过
  - 6 个测试通过
  - `@shiro/web build` 成功

### 实际发布与竞态说明

- 先推送了提交：
  - `022ce48`
  - `fix(site): 兼容 snippet 包装响应`
- 第一次触发 workflow 时出现 git push / workflow_dispatch 竞态：
  - run `23887086861`
  - 实际抓到的还是旧 head sha：
    - `c9b27896e431ca565f175a82057cfebe63c34d4c`
  - 这条 run 虽然成功，但不是最新修复版本
- 随后确认远端 `codex/modify` 已指向：
  - `022ce486ceae82618484c986976a92b281a58b45`
- 再次手动触发 workflow，得到真正有效的 production run：
  - `23887164087`
  - URL:
    - `https://github.com/V-IOLE-T/Blog/actions/runs/23887164087`

### 最终已上线版本

- branch：`codex/modify`
- head sha：`022ce486ceae82618484c986976a92b281a58b45`
- Vercel inspect：
  - `https://vercel.com/ni-chijous-projects/blog-web/GavvSqLu8KhQiFWj2Qekzr3mJkHp`
- Vercel production deployment：
  - `https://blog-7rdgrboq9-ni-chijous-projects.vercel.app`

### 发布后 smoke

- `curl -I -sS https://418122.xyz/`
  - `HTTP/2 200`
  - `server: Vercel`
- `curl -I -sS https://418122.xyz/dashboard`
  - `HTTP/2 200`
  - `server: Vercel`
- `curl -sS https://api.418122.xyz/api/v2/ping`
  - `{"data":"pong"}`

### 下一位 agent 最推荐先做什么

1. 让用户在真实登录态下再次保存 `/dashboard/site` 配置
2. 若仍报错，优先抓浏览器 Network 中这两个请求体/响应：
   - `GET /api/v2/snippets/theme/shiro`
   - `PUT /api/v2/snippets/:id` 或 `POST /api/v2/snippets`
3. 若保存成功但用户仍觉得页面慢，再单独针对 `/dashboard/site` 做 Network timing 分析，而不要再回头猜 snippet 字段问题

## [2026-04-02 23:58] Hero 描述保存与 dashboard 今日诗句修复（以下新章节为准）

### 当前目标

- 解决用户最后两个剩余问题：
  - `/dashboard/site` 里 Hero 标题能保存，但 Hero 描述保存后首页仍不生效
  - dashboard 首页里的“今日诗句”一直处于加载中

### 这轮真实排查结论

- Hero 标题链路已经正常：
  - 首页 Hero 直接读 `apps/web/src/app/[locale]/(home)/components/Hero.tsx` 里的 `config.hero.description`
  - `/dashboard/site` 保存逻辑也会把 `form.heroDescription` 写回 theme snippet
- 公开聚合接口在本轮排查时返回：

```bash
curl -sS -m 20 'https://api.418122.xyz/api/v2/aggregate?theme=shiro' | jq '.theme.config.hero,.seo'
```

- 返回结果里：
  - `hero.title.template[0].text = "Hi, I am Zheng Han(OO)👋"`
  - `hero.description = "An ordinary independent developer with love."`
- 说明：
  - 站点公开读取链路本身是通的
  - “描述改了但没生效”更像是 dashboard 编辑态里的 textarea 当前值没有稳定进入 save payload，而不是首页渲染错字段

### 今日诗句根因

- `apps/web/src/components/modules/dashboard/home/Shiju.tsx` 原先直接请求：
  - `https://v2.jinrishici.com/one.json`
- 在当前环境直接实测：

```bash
curl -I -sS -m 20 https://v2.jinrishici.com/one.json
```

- 结果：
  - `curl: (28) Connection timed out after 20007 milliseconds`
- 这解释了为什么 dashboard 上“今日诗句”会一直 loading：
  - 组件没有超时控制
  - 没有失败态
  - 没有备用数据源

### 这轮代码改动

- `apps/web/src/routes/site/index.tsx`
  - 给 `seoDescription` 与 `heroDescription` 两个 `TextArea` 增加 `ref`
  - 点击“保存更改”时，优先用 textarea DOM 当前值同步描述字段，再构造 mutation payload
  - 两个描述字段的 `setForm` 改为函数式更新，降低并发输入时旧 state 覆盖新值的风险
- `apps/web/src/components/modules/dashboard/home/Shiju.data.ts`
  - 新增纯数据 helper，便于测试
  - 为今日诗句请求加入 4 秒超时
  - 主数据源失败时降级到 `https://v1.hitokoto.cn/?c=i`
- `apps/web/src/components/modules/dashboard/home/Shiju.tsx`
  - 改为调用 `getDashboardPoem()`
  - 主源可用时维持原有诗句 popover 展示
  - 主源与备用源都失败时显示“今日诗句暂时不可用”，不再无限 loading
- `apps/web/src/components/modules/dashboard/home/Shiju.test.ts`
  - 新增 3 条测试，覆盖主源成功、备用源兜底、双失败返回 null

### 本地验证

已真实运行：

```bash
pnpm exec vitest run \
  apps/web/src/routes/site/form-state.test.ts \
  apps/web/src/routes/site/theme-snippet.test.ts \
  apps/web/src/components/modules/dashboard/home/Shiju.test.ts

pnpm --filter @shiro/web build
```

- 结果：
  - 3 个测试文件通过
  - 10 个测试通过
  - `@shiro/web build` 成功

### 当前工作区状态

- 当前分支：
  - `codex/modify`
- 与本轮任务直接相关的文件：
  - `apps/web/src/routes/site/index.tsx`
  - `apps/web/src/components/modules/dashboard/home/Shiju.tsx`
  - `apps/web/src/components/modules/dashboard/home/Shiju.data.ts`
  - `apps/web/src/components/modules/dashboard/home/Shiju.test.ts`
- 仍有与本轮无关的本地未跟踪文件，勿误删：
  - `bootstrap.js`
  - `main-8X_hBwW2.js`
  - `plugins-page-nmaiEpNu.js`
  - `product-name-CswjKXkf.js`

### 下一步建议

1. 提交本轮相关文件并 push 到 `origin/codex/modify`
2. 手动触发 `.github/workflows/vercel-frontend-deploy.yml`
3. 确认 workflow 抓到的 `headSha` 是这次新提交，而不是前一次 SHA
4. 发布后优先请用户验证两点：
   - 修改 Hero 描述后，返回首页是否立即更新
   - dashboard 首页“今日诗句”是否能显示诗句或至少显示失败提示，而不是一直 loading

### 追加：本轮已完成提交与部署

- 本轮提交：
  - `1fbeb5d`
  - `fix(site): 修复描述保存与诗句降级`
- 已 push：
  - `origin/codex/modify`
- GitHub Actions run：
  - `23909667374`
  - `https://github.com/V-IOLE-T/Blog/actions/runs/23909667374`
- run 里确认抓到的 SHA：
  - `1fbeb5d69db99616f54c4ea383a19bb878aae849`
- Vercel deploy 日志中的地址：
  - Inspect: `https://vercel.com/ni-chijous-projects/blog-web/217t9jC65TzdSvqbRyXAoytZQyBN`
  - Production: `https://blog-fs2hkd1hd-ni-chijous-projects.vercel.app`

### 追加：发布后验证现状

- 已确认：
  - `https://api.418122.xyz/api/v2/ping` 返回 `{"data":"pong"}`

## [2026-04-03 08:55] 首页一句话二次修改不生效，根因是公开 GET 接口被 CDN 短缓存

> 这一节是当前关于“首页一句话二次修改后刷新仍旧内容”和“状态保存后不立即显示”的最新权威补充。
> 若与前文冲突，以本节为准。

### 当前目标

- 修复两个“保存成功但前台短时间仍旧内容”的问题：
  - 首页一句话二次修改后，首页刷新仍可能显示上一版
  - 公开状态保存后，前台读取可能仍拿到旧状态

### 已确认的真实链路

- 保存链路本身是成功的，不是 dashboard 表单没写进去。
- 线上直接检查：

```bash
curl -sS -D - 'https://api.418122.xyz/api/v2/aggregate?theme=shiro' -o /tmp/aggregate-theme.out
jq '.theme.config.hero' /tmp/aggregate-theme.out
```

- 返回的 `theme.config.hero.hitokoto.custom` 已经是用户新保存的内容，例如：

```json
{
  "description": "An ordinary independent developer with love.",
  "hitokoto": {
    "random": false,
    "custom": "不在乎世俗的眼光，去追求，自己的光芒。 —— XIN"
  }
}
```

- 同时检查前台公开接口：

```bash
curl -sS -D - https://418122.xyz/api/hero-hitokoto -o /tmp/hero-hitokoto.out
cat /tmp/hero-hitokoto.out

curl -sS -D - https://418122.xyz/api/owner-status -o /tmp/owner-status.out
cat /tmp/owner-status.out
```

- 关键发现：
  - 两个接口返回内容是对的
  - 但响应头里都带了 CDN 缓存，例如：

```txt
cache-control: s-maxage=10, stale-while-revalidate=30
cdn-cache-control: max-age=10
cloudflare-cdn-cache-control: max-age=10, stale-while-revalidate=60
```

- 这会导致：
  - 第一次修改后，可能等一会儿看到新值
  - 第二次很快再修改时，又会继续拿到上一版 10 秒左右
  - 用户主观感受就是“保存成功了，但刷新还是没变”

### 本轮修复

- 文件：
  - `apps/web/src/app/api/hero-hitokoto/route.ts`
  - `apps/web/src/app/api/owner-status/route.ts`
- 改动：
  - 补充 `export const revalidate = 0`
  - 补充 `export const fetchCache = 'force-no-store'`
  - 显式设置响应头：
    - `Cache-Control: no-store, no-cache, must-revalidate, max-age=0`
    - `CDN-Cache-Control: no-store`
    - `Cloudflare-CDN-Cache-Control: no-store`
    - `Vercel-CDN-Cache-Control: no-store`

### 为什么这次判断比之前更接近根因

- 之前已经做过：
  - dashboard 保存后手动触发 revalidate
  - 首页客户端主动请求 `/api/hero-hitokoto` 覆盖初始 HTML
- 但用户仍反馈“第一次改好了，第二次又不变”
- 这类“短时间二次修改不生效”的现象，与 10 秒公开接口缓存完全吻合
- 且实测 `/api/hero-hitokoto` 与 `/api/owner-status` 都确实被 Vercel/CDN 缓存了

### 关于状态展示逻辑，当前代码的真实行为

- 顶部左上角头像逻辑在：
  - `apps/web/src/components/layout/header/internal/AnimatedLogo.tsx`
  - `apps/web/src/components/layout/header/internal/SiteOwnerAvatar.tsx`
- 当前行为不是“所有访客都看站长头像+状态”：
  - owner 登录：左上角显示站长头像，可挂状态
  - 普通 reader 登录：左上角显示 reader 自己的头像
  - 未登录 guest：显示登录入口头像
- `OwnerStatus` 组件当前只挂在 `SiteOwnerAvatar` 的 `variant === 'owner'` 分支上。
- 也就是说：
  - 普通访客登录自己的账号后，左上角看到的是“他自己的头像”
  - 不是“站长头像 + 站长状态”
  - 若后续用户要“访客也能稳定看见站长公开状态”，需要单独设计一个公开展示位，不能直接依赖当前左上角 reader 头像位

### 本地验证

已真实运行：

```bash
pnpm --filter @shiro/web build
```

- 结果：
  - `@shiro/web build` 成功

### 当前工作区状态

- 本轮改动文件：
  - `apps/web/src/app/api/hero-hitokoto/route.ts`
  - `apps/web/src/app/api/owner-status/route.ts`
- 仍有无关未跟踪文件，勿误删：
  - `bootstrap.js`
  - `main-8X_hBwW2.js`
  - `plugins-page-nmaiEpNu.js`
  - `product-name-CswjKXkf.js`

### 下一步建议

1. 提交并 push 本轮 `no-store` 修复
2. 等 GitHub Actions / Vercel 生产部署完成
3. 部署后再次检查：
   - `curl -I https://418122.xyz/api/hero-hitokoto`
   - `curl -I https://418122.xyz/api/owner-status`
4. 预期应不再出现 `max-age=10` 这一类缓存头
5. 再让用户连续两次修改“首页一句话”做真实回归

### 追加：本轮已完成提交与部署

- 本轮提交：
  - `c8868b3`
  - `fix(site): 禁用公开接口短缓存`
- 已 push：
  - `origin/codex/modify`
- GitHub Actions run：
  - `23928923422`
  - `https://github.com/V-IOLE-T/Blog/actions/runs/23928923422`
- 运行结果：
  - `completed`
  - `success`
- Vercel deploy：
  - Inspect: `https://vercel.com/ni-chijous-projects/blog-web/51bvQ6GceHR9T7FEsFi7kbncpQPn`
  - Production: `https://blog-lw34f8oi3-ni-chijous-projects.vercel.app`
- 部署后线上复核：

```bash
curl -sS -D - https://418122.xyz/api/hero-hitokoto -o /tmp/hero-hitokoto-live.out
curl -sS -D - https://418122.xyz/api/owner-status -o /tmp/owner-status-live.out
```

- 已确认两个接口现在都返回：

```txt
cache-control: no-store, no-cache, must-revalidate, max-age=0
cdn-cache-control: no-store
cloudflare-cdn-cache-control: no-store
```

- 也就是说：
  - “首页一句话”二次连续修改后，公开读取接口不再被 10 秒 CDN 短缓存卡住
  - “公开状态”读取也不再被同类短缓存延迟

## [2026-04-03 15:24] 首屏旧一句话闪回 + 状态保存 Forbidden 二次收口

> 这一节是当前关于“刷新时旧一句话闪一下”和“状态保存报 Forbidden”的最新补充。
> 若与前文冲突，以本节为准。

### 用户最新反馈

- 首页一句话在刷新时会先出现旧内容约零点几秒，然后才切到新内容。
- 修改状态时保存会报：
  - `Forbidden`
- 左上角 hover 后“点击设置状态”的文字颜色当前偏 accent/red，用户希望改成黑色。

### 根因结论

- 首页一句话闪回不是保存失败，也不是公开 `/api/hero-hitokoto` 又被 CDN 缓存。
- 当前真正的显示链路是：
  - 首屏先用聚合数据里的 `config.hero.hitokoto.custom` 渲染
  - 客户端挂载后再请求 `/api/hero-hitokoto`
  - 当聚合数据仍是旧值、而公开接口已是新值时，就会出现“旧文案先闪一下，再被新文案覆盖”
- 状态保存报 `Forbidden` 的根因在内部 owner 校验，不在弹窗提交本身：
  - `auth/session` 的真实返回可能是 `{ data: session }`
  - 之前 `requireOwnerSession()` 直接把整个返回体当 session 读 `session.role`
  - 这样会把真实 owner 误判成非 owner，于是 `/api/internal/owner-status` 返回 `403 Forbidden`

### 本轮代码改动

- 新增：
  - `apps/web/src/app/api/owner-status/session.ts`
  - `apps/web/src/app/api/owner-status/session.test.ts`
  - `apps/web/src/app/[locale]/(home)/components/hero-hitokoto-state.ts`
  - `apps/web/src/app/[locale]/(home)/components/hero-hitokoto-state.test.ts`
- 更新：
  - `apps/web/src/app/api/owner-status/shared.ts`
  - `apps/web/src/app/api/internal/revalidate-aggregate/route.ts`
  - `apps/web/src/app/[locale]/(home)/components/Hero.tsx`
  - `apps/web/src/components/layout/header/internal/OwnerStatus.tsx`

### 本轮修复内容

- 首页一句话：
  - 抽出 `resolveHeroHitokotoState`
  - 当本地聚合数据里存在 `custom`，但最新 `/api/hero-hitokoto` 结果尚未返回时，先不渲染这句文案
  - 这样刷新时不会再先看到旧 `custom` 再跳到新 `custom`
- 状态保存：
  - 抽出 `normalizeOwnerSession`
  - 兼容直接 session 和 `{ data: session }` 两种返回
  - `requireOwnerSession()` 与内部 revalidate 路由都改成走这个归一化逻辑
- 交互样式：
  - 无状态 hover 时的“点击设置状态”按钮从 `text-accent` 改成中性黑色系

### 本地验证

已真实运行：

```bash
pnpm exec vitest run \
  'apps/web/src/app/api/owner-status/session.test.ts' \
  'apps/web/src/app/[locale]/(home)/components/hero-hitokoto-state.test.ts' \
  'apps/web/src/app/api/owner-status/shared.test.ts'

pnpm exec vitest run \
  'apps/web/src/routes/site/form-state.test.ts' \
  'apps/web/src/components/modules/dashboard/home/Shiju.test.ts'

pnpm --filter @shiro/web build

pnpm exec eslint \
  'apps/web/src/app/api/owner-status/session.ts' \
  'apps/web/src/app/api/owner-status/session.test.ts' \
  'apps/web/src/app/api/owner-status/shared.ts' \
  'apps/web/src/app/api/internal/revalidate-aggregate/route.ts' \
  'apps/web/src/app/[locale]/(home)/components/hero-hitokoto-state.ts' \
  'apps/web/src/app/[locale]/(home)/components/hero-hitokoto-state.test.ts' \
  'apps/web/src/app/[locale]/(home)/components/Hero.tsx' \
  'apps/web/src/components/layout/header/internal/OwnerStatus.tsx'
```

- 结果：
  - 7 个新增/相关测试通过
  - 原 site / shiju 定向测试通过
  - `@shiro/web build` 成功
  - eslint 无 error；`Hero.tsx` 仍有 2 个既有 warning：
    - `@eslint-react/no-array-index-key`
    - 这两个 warning 位于标题 template 渲染，非本轮新引入

### 当前工作区状态

- 当前尚未提交本轮修复。
- 仍有无关未跟踪文件，勿误删：
  - `bootstrap.js`
  - `main-8X_hBwW2.js`
  - `plugins-page-nmaiEpNu.js`
  - `product-name-CswjKXkf.js`

### 下一步建议

1. 在线上真实验证两件事：
   - 修改首页一句话后直接刷新，确认不再闪旧文案
   - 设置 / 重置状态，确认不再出现 `Forbidden`
2. 若线上验证通过，再提交本轮修复并触发 Vercel 部署。

## [2026-04-03 16:27] 状态保存继续报 Forbidden，根因不是 session 结构，而是 cookie 域不一致

> 这一节是当前关于“状态保存依旧 Forbidden”的最新权威补充。
> 若与前文冲突，以本节为准。

### 用户最新反馈

- 即使上一轮已经修了 `normalizeOwnerSession`，线上“设置状态 / 重置状态”仍然报：
  - `Forbidden`

### 新证据

- 通过 `web-access` 浏览器直接读取线上页面 `window.__ENV`，真实值是：

```json
{
  "API_URL": "",
  "NEXT_PUBLIC_API_URL": "https://api.418122.xyz/api/v2",
  "NEXT_PUBLIC_CLIENT_API_URL": "",
  "NEXT_PUBLIC_GATEWAY_URL": "https://api.418122.xyz"
}
```

- 这说明：
  - 浏览器端 `apiClient` / auth 相关请求，默认直连的是 `https://api.418122.xyz/api/v2`
  - 即 owner 登录态主要存在于 `api.418122.xyz` 这侧
- 而此前状态保存走的是：
  - `https://418122.xyz/api/internal/owner-status`
- 这条链路会让浏览器把 `418122.xyz` 域的 cookie 带给 Next 内部路由，再由内部路由转发去后端。

### 根因结论

- 真正的根因不是“`auth/session` 返回结构仍然没兼容全”，而是：
  - 前端 owner 登录态依赖 `api.418122.xyz` 域 cookie
  - 状态保存却绕进了 `418122.xyz` 自己的内部路由
  - 两边 cookie 域不一致，导致内部路由无法稳定拿到 owner 那套 auth cookie
- 所以会出现：
  - 页面上看起来 owner 已登录
  - 但 `/api/internal/owner-status` 仍返回 `Forbidden`

### 本轮修复策略

- 不再让状态保存 / 重置依赖 Next 内部路由做 owner session 判断。
- 改为和 dashboard 其他写操作保持一致：
  - 浏览器侧直接使用 `apiClient` 调后端 `snippets` 相关接口
  - 这样请求天然带上 `api.418122.xyz` 域的 auth cookie
- 公开读取链路不改：
  - 仍由 `/api/owner-status` 负责公开读取
  - 仍走当前 no-store 读取逻辑

### 本轮代码改动

- 新增：
  - `apps/web/src/components/layout/header/internal/status-snippet.ts`
  - `apps/web/src/components/layout/header/internal/status-snippet.test.ts`
- 更新：
  - `apps/web/src/components/layout/header/internal/OwnerStatus.tsx`

### 实现细节

- `status-snippet.ts`
  - 新增 snippet unwrap / normalize 辅助方法
  - 新增 `fetchStatusSnippetRecord(apiClient)`
  - 新增 `buildStatusSnippetMutationPayload(...)`
- `OwnerStatus.tsx`
  - `handleSubmit` 改为：
    - 先通过 `apiClient` 读取现有 status snippet
    - 再直接 `POST /snippets` 或 `PUT /snippets/:id`
  - `handleReset` 同理，直接把 snippet raw 写成 `null`
  - 错误展示统一改走 `getErrorMessageFromRequestError`
- 也就是说：
  - 这轮状态写入已不再依赖 `/api/internal/owner-status`
  - 即使内部路由仍存在，它也不是当前状态保存的关键路径了

### 本地验证

已真实运行：

```bash
pnpm exec vitest run \
  'apps/web/src/components/layout/header/internal/status-snippet.test.ts' \
  'apps/web/src/app/api/owner-status/session.test.ts' \
  'apps/web/src/app/api/owner-status/shared.test.ts'

pnpm exec eslint \
  'apps/web/src/components/layout/header/internal/OwnerStatus.tsx' \
  'apps/web/src/components/layout/header/internal/status-snippet.ts' \
  'apps/web/src/components/layout/header/internal/status-snippet.test.ts'
```

- 结果：
  - 3 个测试文件通过
  - 7 个测试通过
  - eslint 无报错

### 下一步建议

1. 提交这一轮“直连后端保存状态”的修复
2. push 到 `origin/codex/modify`
3. 触发 Vercel 部署
4. 发布后优先让用户验证：
   - 设置状态是否还会报 `Forbidden`
   - 重置状态是否正常

## [2026-04-03 17:23] 状态文案 hover 可见性补强 + 仓库默认交付约定更新

> 这一节是当前关于“状态只看到表情，看不到文案”以及“完成功能后的默认交付动作”的最新补充。
> 若与前文冲突，以本节为准。

### 用户最新反馈

- 状态表情已经能显示。
- 但鼠标悬浮时看不到状态文案，希望 hover 时能看到自己设置的文字。
- 用户额外要求：把“每改完一个功能自动提交并部署”写入仓库 `AGENTS.md`。

### 根因结论

- 当前状态文案并不是没保存。
- 更接近真实问题的是：
  - 右下角状态热点很小
  - 自定义 `FloatPopover` 的 hover 体验在这个小触发区上不够稳定
  - 用户实际悬浮时，容易只能看到表情，看不到 tooltip 内容

### 本轮修复

- 新增：
  - `apps/web/src/components/layout/header/internal/owner-status-tooltip.ts`
  - `apps/web/src/components/layout/header/internal/owner-status-tooltip.test.ts`
- 更新：
  - `apps/web/src/components/layout/header/internal/OwnerStatus.tsx`
  - `AGENTS.md`

### 实现细节

- `OwnerStatus.tsx`
  - 通过 `getOwnerStatusTooltipText(ownerStatus)` 生成 hover 文案
  - 直接把文案挂到状态热点元素的：
    - `title`
    - `aria-label`
  - 有状态时显示类似：
    - `✍️ Writing`
  - 无状态但 owner 已登录时，hover 兜底显示：
    - `点击设置状态`
- 这样即使自定义浮层在小热点上不稳定，浏览器原生 hover 提示仍会显示状态文案

### AGENTS 约定更新

- 仓库级 `AGENTS.md` 已新增 `## Delivery Default`
- 当前约定变为：
  - 功能 / bugfix 完成并通过直接相关验证后
  - 默认自动：
    - commit 当前分支
    - push 当前分支
    - 触发 `.github/workflows/vercel-frontend-deploy.yml`
  - 除非用户明确说不要，或任务本身是只读 / 不打算发布

### 本地验证

已真实运行：

```bash
pnpm exec vitest run \
  'apps/web/src/components/layout/header/internal/owner-status-tooltip.test.ts' \
  'apps/web/src/components/layout/header/internal/status-snippet.test.ts' \
  'apps/web/src/app/api/owner-status/shared.test.ts'

pnpm exec eslint \
  'apps/web/src/components/layout/header/internal/OwnerStatus.tsx' \
  'apps/web/src/components/layout/header/internal/owner-status-tooltip.ts' \
  'apps/web/src/components/layout/header/internal/owner-status-tooltip.test.ts'
```

- 结果：
  - 3 个测试文件通过
  - 7 个测试通过
  - eslint 通过

### 下一步建议

1. 提交“状态 hover 文案可见性”修复与 `AGENTS.md` 更新
2. push 到 `origin/codex/modify`
3. 触发 Vercel 部署
4. 发布后让用户验证：
   - hover 状态表情时，是否能稳定看到状态文案

## [2026-04-03 17:52] 状态 hover 仍不可见，根因是文案绑在小热点而不是头像按钮

> 这一节是当前关于“状态文案 hover 还是看不到”的最新补充。
> 若与前文冲突，以本节为准。

### 用户最新反馈

- 即使上一轮已经给右下角状态点补了 `title` / `aria-label`，实际鼠标悬浮仍然看不到状态文案。

### 新证据

- 通过 `web-access` 直接检查线上页面 DOM：
  - 头像外层实际可 hover 的按钮仍然只有：
    - `aria-label="Han Zheng"`
  - 没有状态文案
- 同时页面里也没有包含状态 emoji/文案的 `title` 节点命中到整颗头像按钮。

### 根因结论

- 上一轮修复把状态文案挂在了右下角很小的状态热点元素上。
- 但用户真实 hover 的大多是“整颗头像按钮”，不是那个 16px 左右的小热点。
- 所以真正的问题不是 tooltip 文案缺失，而是：
  - **文案绑错了可命中的交互层**

### 本轮修复

- 文件：
  - `apps/web/src/components/layout/header/internal/AnimatedLogo.tsx`
- 改动：
  - `TapableLogo` 读取 `useOwnerStatus()`
  - 复用 `getOwnerStatusTooltipText(ownerStatus)`
  - 当 owner 有状态时，把状态文案直接挂到：
    - 登录按钮 `button.title`
    - owner 头像菜单触发器 `DropdownMenuTrigger.title`
    - 两者的 `aria-label`
- 这样用户 hover **整颗头像** 时就能看到状态文案，而不需要精准命中右下角小状态点

### 本地验证

已真实运行：

```bash
pnpm exec vitest run \
  'apps/web/src/components/layout/header/internal/owner-status-tooltip.test.ts'

pnpm exec eslint \
  'apps/web/src/components/layout/header/internal/AnimatedLogo.tsx' \
  'apps/web/src/components/layout/header/internal/OwnerStatus.tsx' \
  'apps/web/src/components/layout/header/internal/owner-status-tooltip.ts'
```

- 结果：
  - 测试通过
  - eslint 通过

### 下一步建议

1. 提交这一轮 `AnimatedLogo` hover 绑定修复
2. push 到 `origin/codex/modify`
3. 触发 Vercel 部署
4. 发布后让用户直接 hover 整颗头像确认文案是否出现

## [2026-04-03 18:26] 点击状态点触发渲染错误，根因指向 `FloatPopover asChild` + 头像触发层耦合

> 这一节是当前关于“点击右下角设置状态后页面渲染出错”和“未设置状态时提示框过长”的最新补充。
> 若与前文冲突，以本节为准。

### 用户最新反馈

- 点击右下角状态点去设置状态时，会进入“页面渲染出错，请尝试刷新页面”。
- 未设置状态时，大提示框过长，用户希望它只包裹住文字即可。

### 根因判断

- 未设置状态时提示框过长的直接原因很明确：
  - `AnimatedLogo.tsx` 之前把大浮层写成了：
    - `popoverClassNames="min-w-[18rem]"`
  - 这会强制空状态提示框拉成过宽的最小宽度
- 页面渲染错误更像交互层耦合导致，而不是状态数据本身：
  - 当前大浮层是通过 `FloatPopover asChild` 直接克隆 `DropdownMenuTrigger`
  - 同时头像内部还叠着 `OwnerStatus` 的右下角点击热点
  - 这会让“头像 hover 提示 / 下拉菜单 trigger / 状态点点击设置”三套交互共享同一触发树
  - 用户点击右下角设置状态时，更容易把这类复合触发关系打爆，最后落到 Header 的 ErrorBoundary

### 本轮修复

- 文件：
  - `apps/web/src/components/layout/header/internal/AnimatedLogo.tsx`
  - `apps/web/src/components/layout/header/internal/OwnerStatus.tsx`
  - `apps/web/src/components/layout/header/internal/owner-status-tooltip.ts`
  - `apps/web/src/components/layout/header/internal/owner-status-tooltip.test.ts`

### 实现细节

- `OwnerStatus.tsx`
  - 继续只负责右下角状态点和点击打开设置 modal
  - 大浮层内容由 `OwnerStatusPopoverContent` 输出
  - 空状态第一行文本加了：
    - `w-fit`
    - `whitespace-nowrap`
  - 使提示框只包裹文字，不再被内容行本身拉伸
- `AnimatedLogo.tsx`
  - 大浮层仍保留在整颗头像上
  - 但去掉 `asChild`
  - 改成让 `FloatPopover` 用自己的普通 wrapper 处理 hover，而不是直接克隆 `DropdownMenuTrigger`
  - 同时把大浮层宽度改成：
    - `w-fit max-w-[18rem]`
  - 不再使用强制 `min-w-[18rem]`
- `owner-status-tooltip.ts`
  - 新增 `getOwnerStatusPopoverClassNames()`，把提示框尺寸策略收敛到单点

### 本地验证

已真实运行：

```bash
pnpm exec vitest run \
  'apps/web/src/components/layout/header/internal/owner-status-tooltip.test.ts'

pnpm exec eslint \
  'apps/web/src/components/layout/header/internal/AnimatedLogo.tsx' \
  'apps/web/src/components/layout/header/internal/OwnerStatus.tsx' \
  'apps/web/src/components/layout/header/internal/owner-status-tooltip.ts' \
  'apps/web/src/components/layout/header/internal/owner-status-tooltip.test.ts'
```

- 结果：
  - 测试通过
  - eslint 通过

### 下一步建议

1. 提交本轮“保留大浮层 + 去掉过宽最小宽度 + 降低触发层耦合”的修复
2. push 到 `origin/codex/modify`
3. 触发 Vercel 部署
4. 发布后请用户验证：
   - 点击右下角状态点时，是否还会出现页面渲染错误
   - 未设置状态时，大提示框是否只包裹文字

## [2026-04-03 19:03] 状态点继续触发渲染错误，根因确认为“状态点仍嵌在头像按钮树内”

> 这一节是当前关于“点击右下角设置状态仍然页面渲染出错”的最新权威补充。
> 若与前文冲突，以本节为准。

### 用户最新反馈

- 即使上一轮已经把大提示改成纯 CSS hover 卡片，点击右下角状态点仍会进入 Header 的 block ErrorBoundary。

### 这轮根因结论

- 上一轮虽然去掉了大提示的 `FloatPopover` 触发链，但：
  - `OwnerStatus` 这个右下角状态点仍然内嵌在 `SiteOwnerAvatar` 内
  - `SiteOwnerAvatar` 又被直接放进头像 trigger 里
- 也就是说：
  - 状态点实际上仍然是“头像按钮 DOM 树的一部分”
  - 点击它时，依旧会和头像 trigger / dropdown menu 这一套交互共享同一棵树
- 新增测试已经明确锁住了这个边界：
  - `SiteOwnerAvatar` 需要支持 `showOwnerStatus={false}`
  - 让头像本体和状态点真正拆成两个兄弟层，而不是继续嵌套

### 本轮修复

- 文件：
  - `apps/web/src/components/layout/header/internal/SiteOwnerAvatar.tsx`
  - `apps/web/src/components/layout/header/internal/AnimatedLogo.tsx`
  - `apps/web/src/components/layout/header/internal/SiteOwnerAvatar.test.tsx`

### 实现细节

- `SiteOwnerAvatar.tsx`
  - 新增 `showOwnerStatus?: boolean`
  - 当 `showOwnerStatus={false}` 时，头像内部不再渲染 `OwnerStatus`
- `AnimatedLogo.tsx`
  - 传给头像：
    - `showOwnerStatus={false}`
  - 在头像 trigger 外层单独渲染：
    - `<OwnerStatus />`
  - 这样右下角状态点现在是头像 trigger 的兄弟层，而不是子层
- 也就是说：
  - 点击右下角状态点时，不再命中 dropdown trigger 这棵按钮树
  - 这才是针对“页面渲染出错”的真正结构性修复

### 本地验证

已真实运行：

```bash
pnpm exec vitest run \
  'apps/web/src/components/layout/header/internal/SiteOwnerAvatar.test.tsx' \
  'apps/web/src/components/layout/header/internal/owner-status-tooltip.test.ts'

pnpm exec eslint \
  'apps/web/src/components/layout/header/internal/AnimatedLogo.tsx' \
  'apps/web/src/components/layout/header/internal/SiteOwnerAvatar.tsx' \
  'apps/web/src/components/layout/header/internal/OwnerStatus.tsx' \
  'apps/web/src/components/layout/header/internal/owner-status-tooltip.ts' \
  'apps/web/src/components/layout/header/internal/owner-status-tooltip.test.ts' \
  'apps/web/src/components/layout/header/internal/SiteOwnerAvatar.test.tsx'
```

- 结果：
  - 2 个测试文件通过
  - 4 个测试通过
  - eslint 通过

### 下一步建议

1. 提交这一轮“状态点移出头像 trigger 树”的修复
2. push 到 `origin/codex/modify`
3. 触发 Vercel 部署
4. 发布后优先只验证一件事：
   - 点击右下角状态点，是否还会出现“页面渲染出错”

## [2026-04-03 08:15] 状态功能根因修复 + 首页一句话保存状态核对（以下新章节为准）

### 用户最新反馈

- “设置状态保存之后不会出现状态”
- “不清楚设置后访客页面能否看见”
- “首页一句话修改之后并未更新”

### 这轮关键排查结论

- 首页一句话其实已经保存成功，不是没写入：

```bash
curl -sS -m 20 'https://api.418122.xyz/api/v2/aggregate?theme=shiro' | jq '.theme.config.hero'
```

- 当前公开聚合里已经有：
  - `hero.hitokoto.random = false`
  - `hero.hitokoto.custom = "目的虽有，却无路可循；我们称之为路的，无非是踌躇。 —— 误入世界"`
- 说明轻管理“首页一句话”保存链路是通的；若浏览器里仍看到旧句子，更像浏览器 / 路由缓存未刷新到最新页面

- “设置状态”真正根因不是前端按钮，而是后端函数不存在：

```bash
curl -sS -m 20 'https://api.418122.xyz/api/v2/fn/shiro/status'
```

- 返回：
  - `{"ok":0,"code":11017,"message":"函数不存在: serverless function is not exist, Path: /shiro/status"}`
- 也就是说旧逻辑依赖：
  - `GET /api/v2/fn/shiro/status`
  - `serverless.proxy.shiro.status.post/delete`
- 但线上 core 根本没有这个函数，所以状态永远不会真正保存出来

### 本轮修复方案

- 不再依赖失效的 `/fn/shiro/status`
- 改为用公开 snippet 持久化 owner 状态：
  - snippet reference：`status`
  - snippet name：`owner`
- 新增公开读路由：
  - `apps/web/src/app/api/owner-status/route.ts`
  - 面向所有访客返回当前 owner 状态
- 新增 owner 写路由：
  - `apps/web/src/app/api/internal/owner-status/route.ts`
  - 先通过 `auth/session` 校验 owner 登录态
  - 再写入 / 更新公开 snippet
- 新增共享 helper：
  - `apps/web/src/app/api/owner-status/helpers.ts`
  - `apps/web/src/app/api/owner-status/shared.ts`
- `apps/web/src/components/layout/header/internal/OwnerStatus.tsx`
  - 前台状态查询改为请求 `/api/owner-status`
  - 设置 / 重置改为请求 `/api/internal/owner-status`
  - 成功后立即更新本地状态并刷新 `['shiro-status']`
  - 失败会直接 toast 报错，不再静默
- `apps/web/src/lib/server-api-fetch.ts`
  - 导出 `buildServerApiUrl`，供新 API 路由拼接 core API 地址

### 访客能否看见状态

- 修完后的逻辑是：能看见
- 因为状态会存成公开 snippet，然后所有访客访问站点时都会走：
  - `/api/owner-status`
- 前台显示位置至少包括：
  - 站点 owner 头像旁的小状态徽标 / tooltip
  - 首页下拉内容里的 owner 状态文案
- 只要状态未过期，访客和你自己看到的是同一份状态数据
- 若已过期，公开路由会返回 `null`，前台就不显示状态

### 本地验证

已真实运行：

```bash
pnpm exec vitest run \
  apps/web/src/routes/site/form-state.test.ts \
  apps/web/src/routes/site/theme-snippet.test.ts \
  apps/web/src/components/modules/dashboard/home/Shiju.test.ts \
  apps/web/src/app/api/owner-status/shared.test.ts

pnpm --filter @shiro/web build
```

- 结果：
  - 4 个测试文件通过
  - 13 个测试通过
  - `@shiro/web build` 成功

### 当前工作区状态

- 本轮直接相关文件：
  - `apps/web/src/components/layout/header/internal/OwnerStatus.tsx`
  - `apps/web/src/app/api/owner-status/helpers.ts`
  - `apps/web/src/app/api/owner-status/shared.ts`
  - `apps/web/src/app/api/owner-status/route.ts`
  - `apps/web/src/app/api/internal/owner-status/route.ts`
  - `apps/web/src/app/api/owner-status/shared.test.ts`
  - `apps/web/src/lib/server-api-fetch.ts`

### 下一步建议

1. 提交本轮状态修复
2. push 到 `origin/codex/modify`
3. 触发 Vercel 前端部署
4. 发布后让用户优先验证：
   - 设置状态后，自己页面和访客页面是否都能看到
   - 首页一句话若保存后仍是旧句子，先做一次硬刷新再看
- 这台机器上对站点域名做 smoke 时遇到本地 TLS/HTTPS 异常：
  - `curl https://418122.xyz/` 与 `curl https://418122.xyz/dashboard` 返回 `LibreSSL ... tlsv1 alert internal error`
  - `node fetch('https://418122.xyz/')` 也返回 `TypeError: fetch failed`
- 这更像当前执行环境到站点 HTTPS 的握手问题，不是 workflow 部署失败，因为：
  - GitHub Actions 已成功
  - Vercel deploy step 已产出新的 production URL
- 因此下一位 agent / 当前接手者若需要最终线上确认，优先从浏览器真实访问或换一台机器再次 smoke，不要仅凭这台机器的 TLS 结果判断部署失败

## [2026-04-03 00:32] 轻管理新增首页一句话编辑 + 状态入口补强（以下新章节为准）

### 用户这轮反馈

- “点击设置状态之后没有反应”
- 首页有一句固定文案：
  - `当第一颗卫星飞向大气层外，我们便以为自己终有一日会征服宇宙。`
- 用户希望能在轻管理面板里修改并保存这段文字

### 本轮排查结论

- 这句首页文案不是 Hero 标题/描述，而是 `Hero` 右下角的一句话：
  - `apps/web/src/app/[locale]/(home)/components/Hero.tsx`
  - 读取的是 `config.hero.hitokoto.custom`
  - 如果 `custom` 为空，则回退到多语言文案：
    - `apps/web/src/messages/zh/home.json` 的 `hero_default_hitokoto`
- 之前 `/dashboard/site` 轻管理没有暴露这个字段，所以用户无法编辑
- “设置状态”相关逻辑在：
  - `apps/web/src/components/layout/header/internal/OwnerStatus.tsx`
- 之前的问题更像 UX / 反馈不足：
  - 没有状态时，popover 里只有“点击设置状态”文字，不是实际按钮
  - 提交和重置缺少错误提示
  - 成功后也没有本地状态立即更新，用户容易感觉“没反应”

### 本轮代码改动

- `apps/web/src/routes/site/form-state.ts`
  - 新增 `heroQuote` 到轻管理表单状态
  - 从 `theme.config.hero.hitokoto.custom` 读取初始值
  - 保存时写回 `theme.config.hero.hitokoto.custom`
  - 若填写了自定义文案，则强制 `random: false`，确保首页优先显示用户填写内容
- `apps/web/src/routes/site/index.tsx`
  - Hero 区域新增“首页一句话” `TextArea`
  - 保存时同步读取当前 textarea DOM 值，避免遗漏最后一次输入
- `apps/web/src/routes/site/form-state.test.ts`
  - 更新测试，覆盖 `heroQuote` 的读取与保存
- `apps/web/src/components/layout/header/internal/OwnerStatus.tsx`
  - 抽出 `openSettingModal`
  - 无状态时，将 popover 中的“点击设置状态”改为真正可点击的按钮
  - 给状态触发器补了键盘 Enter / Space 支持
  - 设置 / 重置状态时增加错误提示
  - 成功后立即 `setOwnerStatus(...)` 并刷新 `['shiro-status']`，减少“点击没反应”的感觉

### 本地验证

已真实运行：

```bash
pnpm exec vitest run \
  apps/web/src/routes/site/form-state.test.ts \
  apps/web/src/routes/site/theme-snippet.test.ts \
  apps/web/src/components/modules/dashboard/home/Shiju.test.ts

pnpm --filter @shiro/web build
```

- 结果：
  - 3 个测试文件通过
  - 10 个测试通过
  - `@shiro/web build` 成功

### 当前工作区状态

- 本轮直接相关文件：
  - `apps/web/src/routes/site/index.tsx`
  - `apps/web/src/routes/site/form-state.ts`
  - `apps/web/src/routes/site/form-state.test.ts`
  - `apps/web/src/components/layout/header/internal/OwnerStatus.tsx`
- 仍有无关未跟踪文件，勿误删：
  - `bootstrap.js`
  - `main-8X_hBwW2.js`
  - `plugins-page-nmaiEpNu.js`
  - `product-name-CswjKXkf.js`

### 下一步建议

1. 提交本轮改动并 push 到 `origin/codex/modify`
2. 触发 `.github/workflows/vercel-frontend-deploy.yml`
3. 发布后请用户优先验证：
   - `/dashboard/site` 是否出现“首页一句话”，保存后首页是否更新
   - 首页头像状态入口现在是否能打开设置弹窗并正常保存/重置

### 追加：本轮已完成提交与部署

- 本轮提交：
  - `26cfe66`
  - `fix(site): 支持编辑首页一句话`
- 已 push：
  - `origin/codex/modify`
- GitHub Actions run：
  - `23911102388`
  - `https://github.com/V-IOLE-T/Blog/actions/runs/23911102388`
- run 里确认抓到的 SHA：
  - `26cfe667803a09704b11cb54ec5be73d14094218`
- Vercel deploy 日志中的地址：
  - Inspect: `https://vercel.com/ni-chijous-projects/blog-web/2Erdrje6eQHBfh8in4oBAizD7iEx`
  - Production: `https://blog-n7o938hat-ni-chijous-projects.vercel.app`
- 已确认：
  - `https://api.418122.xyz/api/v2/ping` 返回 `{"data":"pong"}`

## [2026-04-07 13:32] 设置状态点击后渲染报错，根因确认为 `FloatPopover` 缺失导入

> 这一节是当前关于“点击右下角状态点后进入 `Something went wrong`”的最新权威补充。
> 若与前文冲突，以本节为准。

### 当前目标

- 修复线上首页 owner 头像右下角状态点点击后进入 ErrorBoundary 的问题，并补上回归测试，避免后续再次把 modal content 渲染炸掉。

### 这轮真实排查路径

- 先读取 `HANDOFF.md` 和 `2026-04-03` 的历史 session，确认最新相关提交已经是：
  - `eda7860`
  - `fix(status): 将状态点移出头像触发树`
- 仅看代码不足以判断线上是否还炸，所以这轮切到 `web-access` 独立浏览器，用真实 owner 登录态做复现。
- 在 `web-access` 中确认首页左上角已经不是登录按钮，而是：
  - `aria-label="Site Owner Avatar"`
- 继续点击状态点后，页面稳定进入：
  - `Something went wrong`
  - `Please try refreshing the page`

### 根因结论

- 这次报错不是“状态点仍在头像 trigger 树里”，那一层结构性修复已经在线上。
- 真正导致 ErrorBoundary 的运行时异常是：
  - `ReferenceError: FloatPopover is not defined`
- 真实浏览器里挂 `window.onerror` / `console.error` 监听后抓到的关键栈：

```text
ReferenceError: FloatPopover is not defined
    at ee (https://418122.xyz/_next/static/chunks/0qts.48q92uzf.js:1:18804)
```

- 对应到本地源码，问题点在：
  - `apps/web/src/components/layout/header/internal/OwnerStatus.tsx`
- 文件底部 `SettingStatusModalContent` 仍然渲染了 `<FloatPopover />` 包裹 emoji picker trigger
- 但文件顶部缺少：
  - `import { FloatPopover } from '~/components/ui/float-popover'`
- 所以一旦点击状态点打开 modal，并实际渲染 `SettingStatusModalContent`，就会直接触发 `ReferenceError`，随后由 Header 的 ErrorBoundary 接住。

### 本轮修复

- 生产代码：
  - `apps/web/src/components/layout/header/internal/OwnerStatus.tsx`
  - 仅补上缺失的 `FloatPopover` 导入
- 新增回归测试：
  - `apps/web/src/components/layout/header/internal/OwnerStatus.test.tsx`
- 测试策略：
  - mock `useModalStack().present(...)` 捕获 modal content
  - 先点击 `OwnerStatus` 的触发点
  - 再单独渲染被捕获的 modal content
  - 修复前该测试会以 `ReferenceError: FloatPopover is not defined` 失败
  - 修复后通过

### 本地验证

已真实运行：

```bash
pnpm exec vitest run --config vitest.config.ts \
  src/components/layout/header/internal/OwnerStatus.test.tsx \
  src/components/layout/header/internal/SiteOwnerAvatar.test.tsx \
  src/components/layout/header/internal/owner-status-tooltip.test.ts

pnpm exec eslint \
  apps/web/src/components/layout/header/internal/OwnerStatus.tsx \
  apps/web/src/components/layout/header/internal/OwnerStatus.test.tsx \
  apps/web/src/components/layout/header/internal/AnimatedLogo.tsx \
  apps/web/src/components/layout/header/internal/SiteOwnerAvatar.tsx \
  apps/web/src/components/layout/header/internal/SiteOwnerAvatar.test.tsx \
  apps/web/src/components/layout/header/internal/owner-status-tooltip.ts \
  apps/web/src/components/layout/header/internal/owner-status-tooltip.test.ts

pnpm --filter @shiro/web build
```

- 结果：
  - 3 个测试文件通过
  - 5 个测试通过
  - eslint 通过
  - `@shiro/web build` 成功
- 说明：
  - 测试运行时仍会看到 Node 层的 `--localstorage-file` warning，这是当前 `happy-dom` / Next 构建环境噪音，不是本 bug 的失败信号

### 当前工作区状态

- 本轮直接相关文件：
  - `apps/web/src/components/layout/header/internal/OwnerStatus.tsx`
  - `apps/web/src/components/layout/header/internal/OwnerStatus.test.tsx`
- 仍有无关未跟踪文件，勿误删：
  - `bootstrap.js`
  - `main-8X_hBwW2.js`
  - `plugins-page-nmaiEpNu.js`
  - `product-name-CswjKXkf.js`

### 下一步建议

1. 提交这轮“补齐状态弹窗 `FloatPopover` 导入 + 回归测试”
2. push 到 `origin/codex/modify`
3. 触发 `.github/workflows/vercel-frontend-deploy.yml`
4. 发布后优先用真实 owner 登录态验证：
   - 首页点击右下角状态点，不再出现 `Something went wrong`
   - 状态设置 modal 能正常打开

## [2026-04-07 14:29] 状态悬浮卡片改为更横向的便签比例

> 这一节是当前关于“owner 状态 hover 卡片比例”的最新权威补充。
> 若与前文冲突，以本节为准。

### 用户反馈

- 当前 hover 卡片太窄太高，中文状态会被挤成竖着换行。
- 用户明确希望它更像横向纸片，而不是细长竖条。

### 本轮改动

- `apps/web/src/components/layout/header/internal/owner-status-tooltip.ts`
  - 将状态卡宽度 token 从：
    - `w-fit max-w-[18rem]`
  - 改为：
    - `w-max min-w-[10.5rem] max-w-[14rem]`
- `apps/web/src/components/layout/header/internal/AnimatedLogo.tsx`
  - hover 卡外层改为复用 `getOwnerStatusPopoverClassNames()`
  - 将内边距从 `py-2` 调整为 `py-3`
- `apps/web/src/components/layout/header/internal/OwnerStatus.tsx`
  - 空状态文案改成更紧凑的单行小字
  - 已有状态时：
    - 改成 `flex-col gap-1.5`
    - 描述行与时间行都加 `whitespace-nowrap`
    - 避免“开心”这类短中文被硬挤成两行
- `apps/web/src/components/layout/header/internal/owner-status-tooltip.test.ts`
  - 更新断言，锁住新的横向卡片宽度 token

### 本地验证

已真实运行：

```bash
pnpm exec vitest run --config vitest.config.ts \
  src/components/layout/header/internal/owner-status-tooltip.test.ts \
  src/components/layout/header/internal/OwnerStatus.test.tsx \
  src/components/layout/header/internal/SiteOwnerAvatar.test.tsx

pnpm exec eslint \
  apps/web/src/components/layout/header/internal/owner-status-tooltip.ts \
  apps/web/src/components/layout/header/internal/owner-status-tooltip.test.ts \
  apps/web/src/components/layout/header/internal/AnimatedLogo.tsx \
  apps/web/src/components/layout/header/internal/OwnerStatus.tsx \
  apps/web/src/components/layout/header/internal/OwnerStatus.test.tsx \
  apps/web/src/components/layout/header/internal/SiteOwnerAvatar.tsx \
  apps/web/src/components/layout/header/internal/SiteOwnerAvatar.test.tsx

pnpm --filter @shiro/web build
```

- 结果：
  - 3 个测试文件通过
  - 5 个测试通过
  - eslint 通过
  - `@shiro/web build` 成功

### 当前工作区状态

- 本轮直接相关文件：
  - `apps/web/src/components/layout/header/internal/AnimatedLogo.tsx`
  - `apps/web/src/components/layout/header/internal/OwnerStatus.tsx`
  - `apps/web/src/components/layout/header/internal/owner-status-tooltip.ts`
  - `apps/web/src/components/layout/header/internal/owner-status-tooltip.test.ts`
- 仍有无关未跟踪文件，勿误删：
  - `bootstrap.js`
  - `main-8X_hBwW2.js`
  - `plugins-page-nmaiEpNu.js`
  - `product-name-CswjKXkf.js`

### 下一步建议

1. 提交这轮“状态卡改为更横向矩形”的样式调整
2. push 到 `origin/codex/modify`
3. 触发 `.github/workflows/vercel-frontend-deploy.yml`
4. 发布后优先看首页 owner 头像 hover：
   - 状态卡是否明显更宽、更低
   - 中文描述和“持续到 xx:xx:xx”是否保持横向阅读

## [2026-04-07 15:13] Hero 右侧头像改为所有人可见的只读 owner 状态入口

> 这一节是当前关于“访客/读者在首页固定位置看到 owner 状态”的最新权威补充。
> 若与前文冲突，以本节为准。

### 用户确认的最终交互

- 左上角 header 保持现状：
  - 访客看到登录入口
  - 读者看到自己的头像
  - owner 自己仍在左上角修改状态
- 首页右侧 Hero 头像承担公开展示职责：
  - 访客、读者、owner 自己都能在这里看到 owner 当前状态
  - 点击 Hero 头像只打开只读状态卡
  - 不允许从这里编辑状态

### 这轮实现

- 新增组件：
  - `apps/web/src/app/[locale]/(home)/components/HeroOwnerAvatar.tsx`
- 新增测试：
  - `apps/web/src/app/[locale]/(home)/components/HeroOwnerAvatar.test.tsx`
- 修改首页 Hero：
  - `apps/web/src/app/[locale]/(home)/components/Hero.tsx`

### 关键设计点

- 不把公开状态继续塞回全局 `statusAtom`，避免读者左上角“自己的头像”错误显示成 owner 状态。
- `Hero.tsx` 自己独立请求：
  - `/api/owner-status`
- `HeroOwnerAvatar.tsx` 只接收显式传入的 `ownerStatus`
- 当 `ownerStatus` 存在时：
  - 右下角显示 emoji 状态点
  - 用 `FloatPopover` 的 `trigger="both"` 让 hover 和 click 都能打开只读状态卡
  - 卡片内容复用：
    - `OwnerStatusPopoverContent`
    - 但固定传 `isLogged={false}`，因此不会出现“点击设置状态”这类 owner 编辑语义
- 当 `ownerStatus` 为空时：
  - 右侧 Hero 头像保持普通头像，不强行弹出无意义提示

### 测试策略

- `HeroOwnerAvatar.test.tsx`
  - mock `FloatPopover`
  - 验证公开分支会渲染只读状态内容
  - 验证 trigger 模式是 `both`
  - 验证无状态时只渲染普通头像，不包 popover

### 本地验证

已真实运行：

```bash
pnpm exec vitest run --config vitest.config.ts \
  'src/app/[locale]/(home)/components/HeroOwnerAvatar.test.tsx' \
  src/components/layout/header/internal/OwnerStatus.test.tsx \
  src/components/layout/header/internal/SiteOwnerAvatar.test.tsx \
  src/components/layout/header/internal/owner-status-tooltip.test.ts

pnpm exec eslint \
  'apps/web/src/app/[locale]/(home)/components/Hero.tsx' \
  'apps/web/src/app/[locale]/(home)/components/HeroOwnerAvatar.tsx' \
  'apps/web/src/app/[locale]/(home)/components/HeroOwnerAvatar.test.tsx' \
  apps/web/src/components/layout/header/internal/OwnerStatus.tsx \
  apps/web/src/components/layout/header/internal/OwnerStatus.test.tsx \
  apps/web/src/components/layout/header/internal/SiteOwnerAvatar.tsx \
  apps/web/src/components/layout/header/internal/SiteOwnerAvatar.test.tsx \
  apps/web/src/components/layout/header/internal/owner-status-tooltip.ts \
  apps/web/src/components/layout/header/internal/owner-status-tooltip.test.ts

pnpm --filter @shiro/web build
```

- 结果：
  - 4 个测试文件通过
  - 7 个测试通过
  - eslint 通过
  - `@shiro/web build` 成功

### 当前工作区状态

- 本轮直接相关文件：
  - `apps/web/src/app/[locale]/(home)/components/Hero.tsx`
  - `apps/web/src/app/[locale]/(home)/components/HeroOwnerAvatar.tsx`
  - `apps/web/src/app/[locale]/(home)/components/HeroOwnerAvatar.test.tsx`
- 仍有无关未跟踪文件，勿误删：
  - `bootstrap.js`
  - `main-8X_hBwW2.js`
  - `plugins-page-nmaiEpNu.js`
  - `product-name-CswjKXkf.js`

### 下一步建议

1. 提交这轮“Hero 右侧头像改为公开只读状态入口”
2. push 到 `origin/codex/modify`
3. 触发 `.github/workflows/vercel-frontend-deploy.yml`
4. 发布后重点验证：
   - 未登录访客：首页右侧头像 hover/click 能看到 owner 状态
   - 已登录读者：左上角仍是自己的头像，右侧 Hero 头像展示 owner 状态
   - owner：左上角仍能编辑，右侧 Hero 头像仍为只读展示

## [2026-04-07 16:23] 站点图标改为跟随 owner 当前头像

> 这一节是当前关于“网站 favicon 跟随 owner 头像”的最新权威补充。
> 若与前文冲突，以本节为准。

### 用户需求

- 希望浏览器标签页里的网站图标不再走旧的 `seo.icon / theme favicon` 配置，而是直接跟随 owner 当前头像。

### 现状根因

- favicon 之前有三处独立来源：
  - `apps/web/src/app/layout.tsx`
    - `seo.icon / seo.iconDark`
  - `apps/web/src/app/[locale]/layout.tsx`
    - `data.seo.icon / themeConfig.config.site.favicon / faviconDark`
  - `apps/web/src/app/(dashboard)/layout.tsx`
    - 直接硬编码 `/favicon.ico`
- 这些入口彼此分裂，所以即使 owner 更换头像，浏览器标签图标也不会自动跟着更新。

### 本轮实现

- 新增 helper：
  - `apps/web/src/app/api/site-icon/shared.ts`
  - 规则：
    1. 优先 owner avatar
    2. 其次 `seo.icon`
    3. 再次 theme `site.favicon`
    4. 最后回退到 `/favicon.ico`
- 新增测试：
  - `apps/web/src/app/api/site-icon/shared.test.ts`
- 新增统一图标路由：
  - `apps/web/src/app/api/site-icon/route.ts`
  - 路由会实时取：
    - `aggregate?theme=shiro`
  - 再按上述优先级解析图标来源
  - 最终 302/307 redirect 到真实头像或回退图标地址
  - headers 设置为 no-store，尽量降低 favicon 缓存滞后
- 更新 favicon 入口：
  - `apps/web/src/app/layout.tsx`
  - `apps/web/src/app/[locale]/layout.tsx`
  - `apps/web/src/app/(dashboard)/layout.tsx`
  - 全部统一改为指向：
    - `/api/site-icon`

### 为什么选路由而不是直接写死 avatar URL

- 这样 root / locale / dashboard 可以统一走一个来源，不再三处分叉。
- 以后 owner 更换头像时，不需要分别改 metadata 和 head 逻辑。
- 浏览器若继续强缓存 favicon，也只需要处理一个入口。

### 本地验证

已真实运行：

```bash
pnpm exec vitest run --config vitest.config.ts \
  src/app/api/site-icon/shared.test.ts

pnpm exec eslint \
  'apps/web/src/app/api/site-icon/shared.ts' \
  'apps/web/src/app/api/site-icon/shared.test.ts' \
  'apps/web/src/app/api/site-icon/route.ts' \
  'apps/web/src/app/layout.tsx' \
  'apps/web/src/app/[locale]/layout.tsx' \
  'apps/web/src/app/(dashboard)/layout.tsx'

pnpm --filter @shiro/web build
```

- 结果：
  - 1 个测试文件通过
  - 3 个测试通过
  - eslint 通过
  - `@shiro/web build` 成功

### 当前工作区状态

- 本轮直接相关文件：
  - `apps/web/src/app/api/site-icon/shared.ts`
  - `apps/web/src/app/api/site-icon/shared.test.ts`
  - `apps/web/src/app/api/site-icon/route.ts`
  - `apps/web/src/app/layout.tsx`
  - `apps/web/src/app/[locale]/layout.tsx`
  - `apps/web/src/app/(dashboard)/layout.tsx`
- 仍有无关未跟踪文件，勿误删：
  - `bootstrap.js`
  - `main-8X_hBwW2.js`
  - `plugins-page-nmaiEpNu.js`
  - `product-name-CswjKXkf.js`

### 下一步建议

1. 提交这轮“站点图标跟随 owner 头像”的实现
2. push 到 `origin/codex/modify`
3. 触发 `.github/workflows/vercel-frontend-deploy.yml`
4. 发布后重点验证：
   - 浏览器标签页 favicon 是否变成当前 owner 头像
   - dashboard 页面 favicon 也同步变更
   - 更换 owner 头像后，favicon 是否跟着变化

## [2026-04-07 20:00] 轻管理页新增“速记”区块，顶部卡片 + 下方内嵌后台内容

> 这一节是当前关于“轻管理页接入现有速记模块”的最新权威补充。
> 若与前文冲突，以本节为准。

### 用户确认的最终需求

- 不是新做一套“速记”业务。
- 要复用后台现有模块：
  - 模块地址：`https://api.418122.xyz/proxy/qaqdmin#/recently`
- 轻管理页中要同时有：
  - 顶部卡片摘要
  - 下方直接展开现有速记内容
- 位置要求：
  - 和轻管理页顶部现有那些配置区块放在一起

### 这轮真实核对

- 通过后台页面实查确认：
  - 左侧菜单“速记”会进入：
    - `#/recently`
  - 页面标题是：
    - `速记 - 静かな森`
- 后台“快速操作”卡片里的：
  - `新建速记`
  - `管理`
  - 确实存在
- 但“新建速记”不是简单 URL hash 跳转，更像是后台内部按钮行为 / modal，因此这轮不直接伪造未知 create 路径。

### 本轮实现

- 新增区块组件：
  - `apps/web/src/routes/site/recently-section.tsx`
- 新增测试：
  - `apps/web/src/routes/site/recently-section.test.tsx`
- 接入位置：
  - `apps/web/src/routes/site/index.tsx`
  - 放在 `SEO` 卡片和 `Hero` 卡片之间，属于轻管理页顶部同层级模块

### 具体交互

- 顶部卡片：
  - 标题：`速记`
  - 数量：使用 `apiClient.recently.getAll()` 实时统计当前速记条数
  - 按钮：
    - `新建速记`
    - `管理`
- `管理`：
  - 直接新标签打开：
    - `#/recently`
- `新建速记`：
  - 当前不伪造未知 create URL
  - 改为滚动到下方内嵌区域，并显示提示：
    - `请在下方右上角点击 + 新建速记`
- 下方内容区：
  - 直接 iframe 内嵌：
    - `https://api.418122.xyz/proxy/qaqdmin#/recently`
- 降级策略：
  - 若 5 秒内仍未正常加载，显示提示：
    - `当前无法直接内嵌速记模块，请使用上方按钮打开后台速记页面。`

### 为什么这样做

- 满足“复用现有模块，不重写业务”。
- 满足“卡片入口 + 下方直接展开内容”。
- 避免为了“新建速记”按钮硬猜后台私有 create 路径。
- 即使 iframe 被 CSP / 登录态限制，顶部卡片和管理入口仍可工作。

### 本地验证

已真实运行：

```bash
pnpm exec vitest run --config vitest.config.ts \
  src/routes/site/recently-section.test.tsx \
  src/routes/site/form-state.test.ts \
  src/routes/site/theme-snippet.test.ts

pnpm exec eslint \
  apps/web/src/routes/site/index.tsx \
  apps/web/src/routes/site/recently-section.tsx \
  apps/web/src/routes/site/recently-section.test.tsx

pnpm --filter @shiro/web build
```

- 结果：
  - 3 个测试文件通过
  - 9 个测试通过
  - eslint 通过
  - `@shiro/web build` 成功

### 当前工作区状态

- 本轮直接相关文件：
  - `apps/web/src/routes/site/index.tsx`
  - `apps/web/src/routes/site/recently-section.tsx`
  - `apps/web/src/routes/site/recently-section.test.tsx`
- 仍有无关未跟踪文件，勿误删：
  - `bootstrap.js`
  - `main-8X_hBwW2.js`
  - `plugins-page-nmaiEpNu.js`
  - `product-name-CswjKXkf.js`

### 下一步建议

1. 提交这轮“轻管理页接入速记区块”
2. push 到 `origin/codex/modify`
3. 触发 `.github/workflows/vercel-frontend-deploy.yml`
4. 发布后重点验证：
   - 轻管理页顶部能看到“速记”卡片
   - 数量与后台速记数量一致
   - 下方 iframe 能直接看到 `#/recently`
   - `管理` 按钮能打开后台速记页
   - `新建速记` 提示是否足够清楚

## [2026-04-07 21:56] 速记从“站点页内区块”调整为与站点平行的独立轻管理页面

> 这一节是当前关于“速记在轻管理中的信息架构”的最新权威补充。
> 若与前文冲突，以本节为准。

### 用户最新纠偏

- 用户明确表示：
  - 不希望“速记”继续放在 `站点` 页面里
  - 希望它作为一个和 `站点` 平行的独立页面

### 这轮调整

- 从 `站点` 页移除：
  - `apps/web/src/routes/site/index.tsx`
    - 删除内嵌 `RecentlySection`
- 新增独立页面：
  - `apps/web/src/routes/recently/index.tsx`
  - 页面结构：
    - 顶部标题：`速记`
    - 说明文案
    - 下方复用 `RecentlySection`
- 路由接入：
  - `apps/web/src/app/(dashboard)/dashboard/[[...catch_all]]/router.tsx`
  - 新增：
    - `/recently`
  - 并把它加入 dashboard 顶层导航项，和 `/site` 平级

### 保留的现有行为

- `RecentlySection` 本身逻辑不变：
  - 顶部卡片显示数量、`新建速记`、`管理`
  - 下方 iframe 继续尝试嵌入：
    - `https://api.418122.xyz/proxy/qaqdmin#/recently`
  - iframe 失败时显示降级提示

### 为什么这样改

- 这次是信息架构纠偏，不是业务重写。
- 让“速记”成为和“站点”平级的独立页面，更符合用户对轻管理导航分层的预期。
- 复用既有 `RecentlySection`，避免重复实现。

### 本地验证

已真实运行：

```bash
pnpm exec vitest run --config vitest.config.ts \
  src/routes/site/recently-section.test.tsx \
  src/routes/site/form-state.test.ts \
  src/routes/site/theme-snippet.test.ts

pnpm exec eslint \
  'apps/web/src/routes/site/index.tsx' \
  'apps/web/src/routes/site/recently-section.tsx' \
  'apps/web/src/routes/site/recently-section.test.tsx' \
  'apps/web/src/routes/recently/index.tsx' \
  'apps/web/src/app/(dashboard)/dashboard/[[...catch_all]]/router.tsx'

pnpm --filter @shiro/web build
```

- 结果：
  - 3 个测试文件通过
  - 9 个测试通过
  - eslint 通过
  - `@shiro/web build` 成功

### 当前工作区状态

- 本轮直接相关文件：
  - `apps/web/src/routes/site/index.tsx`
  - `apps/web/src/routes/recently/index.tsx`
  - `apps/web/src/app/(dashboard)/dashboard/[[...catch_all]]/router.tsx`
  - `apps/web/src/routes/site/recently-section.tsx`
  - `apps/web/src/routes/site/recently-section.test.tsx`
- 仍有无关未跟踪文件，勿误删：
  - `bootstrap.js`
  - `main-8X_hBwW2.js`
  - `plugins-page-nmaiEpNu.js`
  - `product-name-CswjKXkf.js`

### 下一步建议

1. 提交这轮“速记独立成页”的结构调整
2. push 到 `origin/codex/modify`
3. 触发 `.github/workflows/vercel-frontend-deploy.yml`
4. 发布后重点验证：
   - 顶部导航里出现独立 `速记`
   - `站点` 页面里不再出现速记区块
   - `速记` 页面能看到数量与管理入口

## [2026-04-07 23:32] 速记页下方内嵌内容已打通，问题在 fallback 误报过早

> 这一节是当前关于“速记页下方 iframe 内容是否真正显示”的最新权威补充。
> 若与前文冲突，以本节为准。

### 用户问题

- 用户继续要求把“下方真的嵌出后台速记内容”打通，而不是只显示降级提示。

### 这轮真实排查结论

- 首先确认：
  - 后台页面本身没有 `X-Frame-Options` 或 `frame-ancestors` 直接禁止嵌入的响应头。
- 再确认：
  - 公开 API `https://api.418122.xyz/api/v2/recently?size=5` 正常返回速记数据，不是“没有内容”。
- 继续用 `web-access` 观察后台 `#/recently`：
  - 页面一开始确实只看到骨架屏
  - 但等待约 20 秒后，真实速记内容会渲染出来
- 这说明：
  - iframe 不是完全失败
  - 我们之前 5 秒就显示“当前无法直接内嵌”的 fallback 过于激进
  - 真正的根因是：
    - **fallback 定时器比后台速记模块的真实渲染更快触发**
    - 且在 iframe load 后没有正确取消后续误报

### 本轮修复

- 文件：
  - `apps/web/src/routes/site/recently-section.tsx`
  - `apps/web/src/routes/site/recently-section.test.tsx`
- 具体改动：
  - 新增 `shouldShowRecentlyEmbedFallback(...)` helper
  - 将 fallback 超时从原先的 5 秒调整为 20 秒
  - 使用 `embedFallbackTimerRef` 在 iframe `onLoad` 时显式清理超时定时器
  - 用 `embedState` 统一管理：
    - `hasTimedOut`
    - `isFrameLoaded`
  - 只有在：
    - 超时了
    - 且 iframe 还未 load
    - 才显示降级提示

### 为什么这个修复有效

- 当前后台速记页不是秒开，它会先出现骨架屏，再逐步渲染内容。
- 之前逻辑会在内容真正出现前，就把“无法内嵌”的提示打出来，造成用户误判。
- 现在逻辑改成：
  - 优先等 iframe 正常 load
  - load 后即取消 fallback 定时器
  - 不再让“误报提示”盖过真实内容

### 本地验证

已真实运行：

```bash
pnpm exec vitest run --config vitest.config.ts \
  src/routes/site/recently-section.test.tsx

pnpm exec eslint \
  'apps/web/src/routes/site/recently-section.tsx' \
  'apps/web/src/routes/site/recently-section.test.tsx' \
  'apps/web/src/routes/recently/index.tsx'

pnpm --filter @shiro/web build
```

- 结果：
  - 1 个测试文件通过
  - 3 个测试通过
  - eslint 通过
  - `@shiro/web build` 成功

### 当前工作区状态

- 本轮直接相关文件：
  - `apps/web/src/routes/site/recently-section.tsx`
  - `apps/web/src/routes/site/recently-section.test.tsx`
- 仍有无关未跟踪文件，勿误删：
  - `bootstrap.js`
  - `main-8X_hBwW2.js`
  - `plugins-page-nmaiEpNu.js`
  - `product-name-CswjKXkf.js`

### 下一步建议

1. 提交这轮“速记页 iframe fallback 误报修复”
2. push 到 `origin/codex/modify`
3. 触发 `.github/workflows/vercel-frontend-deploy.yml`
4. 发布后优先验证：
   - `#/recently` 下方先出现骨架屏，但不会立刻误报失败
   - 等待后能看到真实速记内容

## [2026-04-08 10:34] 速记页改为前端原生内容列表，不再内嵌后台页面

> 这一节是当前关于“速记页不再显示后台骨架，而是直接显示真实速记内容”的最新权威补充。
> 若与前文冲突，以本节为准。

### 用户最新要求

- 用户明确不要后台 `#/recently` 的骨架屏展示。
- 希望速记页面直接在轻管理前端里渲染真实速记内容。

### 这轮调整

- 放弃 iframe 方案：
  - `apps/web/src/routes/site/recently-section.tsx`
  - 移除：
    - iframe
    - fallback 计时器
    - “无法直接内嵌”提示逻辑
- 保留顶部卡片：
  - 速记
  - 数量
  - 新建速记
  - 管理
- 下方改为前端原生列表：
  - 直接调用 `apiClient.recently.getAll()`
  - 渲染真实速记内容
  - 显示：
    - 内容
    - 时间
    - up/down 计数
- owner 管理能力：
  - `新建速记`
    - 直接在当前页打开本地创建弹窗
  - 每条内容支持：
    - 编辑
    - 删除
  - `管理`
    - 保留为打开后台 `#/recently` 的完整功能入口

### 为什么这样改

- 完全满足“不显示后台骨架”的要求。
- 轻管理页自己掌握加载态、空态和交互，不再依赖后台页面的渲染节奏。
- 仍保留“管理”按钮作为完整后台入口，不丢原功能。

### 本轮实现

- 主要文件：
  - `apps/web/src/routes/site/recently-section.tsx`
  - `apps/web/src/routes/site/recently-section.test.tsx`
- 具体做法：
  - 将 `RecentlySection` 改成 dashboard-native 列表
  - 新增：
    - `RecentlyEditorModal`
    - `RecentlyDeleteModal`
  - 列表 query key：
    - `['dashboard-recently-list']`

### 本地验证

已真实运行：

```bash
pnpm exec vitest run --config vitest.config.ts \
  src/routes/site/recently-section.test.tsx \
  src/routes/site/form-state.test.ts \
  src/routes/site/theme-snippet.test.ts

pnpm exec eslint \
  'apps/web/src/routes/site/recently-section.tsx' \
  'apps/web/src/routes/site/recently-section.test.tsx' \
  'apps/web/src/routes/recently/index.tsx' \
  'apps/web/src/routes/site/index.tsx'

pnpm --filter @shiro/web build
```

- 结果：
  - 3 个测试文件通过
  - 10 个测试通过
  - eslint 通过
  - `@shiro/web build` 成功

### 当前工作区状态

- 本轮直接相关文件：
  - `apps/web/src/routes/site/recently-section.tsx`
  - `apps/web/src/routes/site/recently-section.test.tsx`
- 仍有无关未跟踪文件，勿误删：
  - `bootstrap.js`
  - `main-8X_hBwW2.js`
  - `plugins-page-nmaiEpNu.js`
  - `product-name-CswjKXkf.js`

### 下一步建议

1. 提交这轮“速记页改为前端原生列表”
2. push 到 `origin/codex/modify`
3. 触发 `.github/workflows/vercel-frontend-deploy.yml`
4. 发布后重点验证：
   - `速记` 页下方不再出现后台骨架屏
   - 直接显示真实速记内容
   - `新建速记` 可在当前页创建
   - `编辑 / 删除` 行为正常

## [2026-04-08 11:25] 速记页改成原生内容流 + 去掉顶部管理按钮 + dashboard favicon 固定服务.svg

> 这一节是当前关于“速记页最终形态”和“轻管理 favicon 来源”的最新权威补充。
> 若与前文冲突，以本节为准。

### 用户最新要求

- 速记页顶部卡片去掉：
  - `管理`
- 速记页下方真实显示内容，不要后台骨架。
- 调整速记卡片的视觉层次。
- 增加分页。
- 轻管理页面 favicon 不再跟 owner 头像走，而是固定使用：
  - `/Users/zhenghan/Downloads/服务.svg`

### 这轮最终实现

- `apps/web/src/routes/site/recently-section.tsx`
  - 顶部卡片：
    - 只保留 `新建速记`
    - 删除 `管理`
  - 下方内容：
    - 改为前端原生速记列表
    - 不再使用 iframe
  - 数据获取：
    - 数量：`apiClient.recently.getAll()`
    - 列表：`useInfiniteQuery + apiClient.shorthand.getList({ before, size })`
  - 分页：
    - 使用 `LoadMoreIndicator`
    - 下滑继续加载速记
  - owner 操作：
    - `新建速记` 当前页本地弹窗创建
    - 每条卡片支持 `编辑 / 删除`
  - 视觉层次：
    - 内容正文抬高为主层
    - 时间、赞踩降为次级元信息
    - 操作区独立为底部弱分隔行
    - 卡片使用更柔和的边框、阴影和圆角
- `apps/web/src/routes/site/recently-section.test.tsx`
  - 更新测试断言：
    - 不再渲染 iframe
    - 顶部不再有 `管理`
    - 仍保留 `打开完整后台`
- `apps/web/src/app/(dashboard)/layout.tsx`
  - dashboard favicon 改为固定：
    - `/dashboard-service.svg`
- 新增资源：
  - `apps/web/public/dashboard-service.svg`
  - 内容来自用户提供的：
    - `/Users/zhenghan/Downloads/服务.svg`

### 为什么这样做

- 速记页现在真正是轻管理原生页面，而不是后台页面壳子。
- 去掉顶部 `管理` 后，页面目标更聚焦：快速记录 + 直接浏览。
- 仍保留“打开完整后台”作为完整能力入口，避免功能回退。
- dashboard favicon 与主站 favicon 完全解耦，满足“轻管理使用固定服务图标”的需求。

### 本地验证

已真实运行：

```bash
pnpm exec vitest run --config vitest.config.ts \
  src/routes/site/recently-section.test.tsx \
  src/routes/site/form-state.test.ts \
  src/routes/site/theme-snippet.test.ts

pnpm exec eslint \
  'apps/web/src/routes/site/recently-section.tsx' \
  'apps/web/src/routes/site/recently-section.test.tsx' \
  'apps/web/src/routes/recently/index.tsx' \
  'apps/web/src/routes/site/index.tsx' \
  'apps/web/src/app/(dashboard)/layout.tsx'

pnpm --filter @shiro/web build
```

- 结果：
  - 3 个测试文件通过
  - 11 个测试通过
  - eslint 通过
  - `@shiro/web build` 成功

### 当前工作区状态

- 本轮直接相关文件：
  - `apps/web/src/routes/site/recently-section.tsx`
  - `apps/web/src/routes/site/recently-section.test.tsx`
  - `apps/web/src/app/(dashboard)/layout.tsx`
  - `apps/web/public/dashboard-service.svg`
- 仍有无关未跟踪文件，勿误删：
  - `bootstrap.js`
  - `main-8X_hBwW2.js`
  - `plugins-page-nmaiEpNu.js`
  - `product-name-CswjKXkf.js`

### 下一步建议

1. 提交这轮“速记页最终形态 + dashboard favicon 固定图标”
2. push 到 `origin/codex/modify`
3. 触发 `.github/workflows/vercel-frontend-deploy.yml`
4. 发布后重点验证：
   - 顶部卡片不再出现 `管理`
   - 下方直接显示真实速记内容
   - 下滑可继续加载更多
   - dashboard 标签页 favicon 变成服务图标

## [2026-04-15 00:41] 已确认公开站 locale 切换链路；后台当前没有翻译生成或双语录入入口

> 这一节是当前关于“中英日切换逻辑”和“后台文章/笔记翻译能力现状”的最新权威补充。
> 若与前文冲突，以本节为准。

### 当前目标

- 用户最新问题不是要改代码，而是要搞清楚两件事：
  - 公开站中/英/日切换到底怎么工作
  - 如果后台用中文写文章，英文是自动生成、手动录入，还是当前根本没有入口
- 当前已完成代码级结论梳理，但还没有实现新的翻译按钮或双语编辑功能。

### 这轮实际做了什么

- 先按仓库约定重新读取：
  - `HANDOFF.md`
  - `~/.codex/superpowers/skills/using-superpowers/SKILL.md`
- 然后系统排查了公开站 i18n / locale 链路，重点看了这些文件：
  - `apps/web/src/i18n/config.ts`
  - `apps/web/src/i18n/routing.ts`
  - `apps/web/src/i18n/request.ts`
  - `apps/web/src/proxy.ts`
  - `apps/web/src/i18n/navigation.ts`
  - `apps/web/src/app/[locale]/layout.tsx`
  - `apps/web/src/providers/root/lang-sync-provider.tsx`
  - `apps/web/src/components/layout/footer/LocaleSwitcher.tsx`
  - `apps/web/src/components/modules/translation/TranslationLanguageSwitcher.tsx`
  - `apps/web/src/app/[locale]/posts/(post-detail)/[category]/[slug]/api.tsx`
  - `apps/web/src/queries/definition/post.ts`
  - `apps/web/src/queries/definition/note.ts`
  - `apps/web/src/lib/server-api-fetch.ts`
- 为了确认 next-intl 真正的 locale 判定优先级，不只看本仓库代码，还直接读了本地依赖源码：
  - `apps/web/node_modules/next-intl/dist/esm/development/routing/config.js`
  - `apps/web/node_modules/next-intl/dist/esm/development/middleware/resolveLocale.js`
  - `apps/web/node_modules/next-intl/dist/esm/development/navigation/shared/syncLocaleCookie.js`
- 接着排查后台写作/保存/翻译入口，重点看了：
  - `apps/web/src/models/writing.ts`
  - `apps/web/src/components/modules/dashboard/writing/Writing.tsx`
  - `apps/web/src/components/modules/dashboard/writing/BaseWritingProvider.tsx`
  - `apps/web/src/components/modules/dashboard/post-editing/data-provider.tsx`
  - `apps/web/src/components/modules/dashboard/note-editing/data-provider.tsx`
  - `apps/web/src/components/modules/dashboard/post-editing/sidebar/index.tsx`
  - `apps/web/src/components/modules/dashboard/note-editing/sidebar/index.tsx`
  - `apps/web/src/queries/definition/post.ts`
  - `apps/web/src/queries/definition/note.ts`
- 最后为了确认“是不是后端有翻译能力但前端没接”，又读了 API client 类型和实现：
  - `apps/web/node_modules/@mx-space/api-client/dist/index.d.mts`
  - `apps/web/node_modules/@mx-space/api-client/dist/index.mjs`

### 已确认的结论

#### A. 公开站中英日切换逻辑

- 支持语言是：
  - `zh`
  - `en`
  - `ja`
- 默认语言是：
  - `zh`
- 证据：
  - `apps/web/src/i18n/config.ts`
- 路由前缀模式是：
  - `localePrefix: 'as-needed'`
- 这意味着：
  - 中文通常走无前缀 URL，例如 `/posts/...`
  - 英文/日文通常走 `/en/...`、`/ja/...`
- 证据：
  - `apps/web/src/i18n/routing.ts`
- 公开站请求会经过 `apps/web/src/proxy.ts` 里的 next-intl middleware；
 但以下路径跳过这套 locale 路由：
  - `/api`
  - `/dashboard`
  - `/_next`
  - `/_vercel`
  - `/feed`
  - `/sitemap`
  - `/home-og`
  - 静态资源路径
- next-intl 实际 locale 判定优先级已经用依赖源码确认过：
  1. URL 前缀
  2. `NEXT_LOCALE` cookie
  3. `Accept-Language` 请求头
  4. 默认 `zh`
- 证据：
  - `apps/web/node_modules/next-intl/dist/esm/development/middleware/resolveLocale.js`
- 用户手动切换公开站语言的 UI 在页脚：
  - `apps/web/src/components/layout/footer/LocaleSwitcher.tsx`
- 它做的事情是：
  - `router.push(pathname, { locale: newLocale })`
  - 即保持当前 pathname，只切 locale
- 客户端切换 locale 时，next-intl 会同步写入 `NEXT_LOCALE` cookie。
- 证据：
  - `apps/web/node_modules/next-intl/dist/esm/development/navigation/shared/syncLocaleCookie.js`
- 服务端布局 `apps/web/src/app/[locale]/layout.tsx` 会：
  - 校验 locale 是否在支持列表里
  - `setRequestLocale(locale)`
  - 加载对应国际化 messages
  - 再以该 locale 拉聚合数据
- 客户端后续请求也会自动带：
  - `x-lang: 当前 locale`
- 证据：
  - `apps/web/src/providers/root/lang-sync-provider.tsx`
  - `apps/web/src/lib/server-api-fetch.ts`

#### B. 文章 / 笔记里的“翻译切换”和整站 locale 的关系

- 前台文章/笔记详情页有“翻译语言切换器”：
  - `apps/web/src/components/modules/translation/TranslationLanguageSwitcher.tsx`
- 这个组件不是独立维护第二套翻译 URL 参数模型，而是直接复用 locale 导航：
  - `router.push(pathname, { locale: lang })`
- 详情页拉文章时，会把：
  - `searchParams.lang || params.locale`
  当作 preferred language 传给查询层
- 证据：
  - `apps/web/src/app/[locale]/posts/(post-detail)/[category]/[slug]/api.tsx`
  - `apps/web/src/queries/definition/post.ts`
  - `apps/web/src/queries/definition/note.ts`
- 所以当前实现里，“前台翻译切换”和“站点 locale”是强耦合的：
  - 切英文/日文时，不只是 UI 文案换语言
  - 文章内容也会按该语言去请求后端翻译版本
- 如果后端已经有对应翻译记录，前台能切过去看；
  如果没有，则只是 locale 切换，不会凭空出现人工英文内容。

#### C. 后台当前没有“自动翻译”入口，也没有“手写第二版内容”入口

- 后台写作 DTO 里只有单份内容模型：
  - `title`
  - `text`
  - `summary`
  - `meta`
- 没有看到类似：
  - `translations`
  - `enText`
  - `jaText`
  - `sourceLang`
  - `targetLang`
  的编辑字段
- 证据：
  - `apps/web/src/models/writing.ts`
- 后台正文编辑区只是一份：
  - `TitleInput`
  - `TextArea`
- 没有双语 tab / 语言分栏 / 翻译表单
- 证据：
  - `apps/web/src/components/modules/dashboard/writing/Writing.tsx`
- 后台文章/笔记侧栏只包含：
  - 分类 / 标签 / 相关内容 / summary / 图片 / AI meta / 其他 meta
- 没有翻译管理区块
- 证据：
  - `apps/web/src/components/modules/dashboard/post-editing/sidebar/index.tsx`
  - `apps/web/src/components/modules/dashboard/note-editing/sidebar/index.tsx`
- 保存时只是把当前 DTO 直接提交到 post/note create/update 接口；
  没有顺带调用任何 translation generate / translation save 逻辑
- 证据：
  - `apps/web/src/queries/definition/post.ts`
  - `apps/web/src/queries/definition/note.ts`

#### D. 底层 API 的确支持翻译，但当前前端后台没接

- `@mx-space/api-client` 明确提供了这些能力：
  - `getTranslation({ articleId, lang })`
  - `getAvailableLanguages(articleId)`
  - `getTranslationGenerateUrl({ articleId, lang })`
  - `streamTranslationGenerate({ articleId, lang })`
- 说明后端 / API client 这一层是有“获取翻译”和“生成翻译 SSE”能力的。
- 证据：
  - `apps/web/node_modules/@mx-space/api-client/dist/index.d.mts`
  - `apps/web/node_modules/@mx-space/api-client/dist/index.mjs`
- 但在 `apps/web/src` 里，没有找到任何地方实际调用这些 translation generate API。
- 只看到了前台对已有翻译结果的消费、切换和展示。

### 什么有效

- 有效路径 1：
  - 不猜，直接从 `i18n/config.ts -> routing.ts -> proxy.ts -> [locale]/layout.tsx` 串起来看。
  - 这样可以明确区分：
    - locale 决策
    - 路由前缀
    - 文案加载
    - 请求头传播
- 有效路径 2：
  - 直接读 next-intl 本地依赖源码，而不是只凭经验判断 cookie / header 优先级。
  - 这一步确认了：
    - URL 前缀 > cookie > Accept-Language > default locale
- 有效路径 3：
  - 从后台 DTO 和保存 mutation 反推能力边界。
  - 一看 `apps/web/src/models/writing.ts` 和 `queries/definition/post.ts|note.ts` 就能快速确定：
    - 当前后台不是双语编辑器
    - 保存时也不会自动翻译
- 有效路径 4：
  - 直接读 `@mx-space/api-client`，确认“后端有没有能力”与“前端有没有接 UI”是两回事。
  - 这一步确认了最重要的产品事实：
    - API 层有翻译生成能力
    - 当前前端后台没接出来

### 什么没用 / 容易误导

- 误导点 1：
  - 只看前台文章页的 `TranslationLanguageSwitcher`，很容易误以为“后台肯定有录入或生成入口”。
  - 实际上它只是消费已有翻译结果，不代表后台编辑器能生产翻译。
- 误导点 2：
  - 只看 `availableTranslations` / `translationMeta` 这些展示字段，会误判成“已经存在完整 CMS 翻译工作流”。
  - 实际这些字段只证明前台读模型支持 translated payload。
- 误导点 3：
  - 在 `apps/web/src` 里搜 `translation` 会出现很多前台消费代码、评论锚点语言代码、AI 摘要相关代码，噪音很大。
  - 更高效的入口是先看：
    - `models/writing.ts`
    - `queries/definition/post.ts`
    - `queries/definition/note.ts`
    - `@mx-space/api-client`
- 误导点 4：
  - 目前后台路径本身不走公开站 locale middleware；
  所以不要把“公开站语言切换逻辑”直接等同于“后台编辑器多语言能力”。

### 当前工作区状态

- 这轮没有修改应用代码。
- 当前分支：
  - `codex/modify`
- 目前已知未跟踪文件仍然存在，且与本次分析无关，不要误删：
  - `bootstrap.js`
  - `main-8X_hBwW2.js`
  - `plugins-page-nmaiEpNu.js`
  - `product-name-CswjKXkf.js`
- 本轮唯一应新增的变更是本 `HANDOFF.md` 补充。

### 如果下一个 agent 要继续完成这个需求，推荐怎么做

#### 方向 1：最短路径，做“后台一键生成英文 / 日文翻译”

- 这是当前最值得继续的实现方向。
- 原因：
  - API client 已经有 translation generate SSE 能力
  - 当前前台也已经能消费 translated article/note
  - 所以大概率不需要重做前台展示模型
- 推荐下一步：
  1. 确认后台文章编辑页和笔记编辑页实际挂载组件与保存按钮入口
  2. 在编辑页或侧栏增加“生成英文 / 生成日文”按钮
  3. 调用：
     - `apiClient.ai.streamTranslationGenerate({ articleId, lang })`
     或同等 controller 封装
  4. 明确生成完成后，前台 `availableTranslations` 是否立即可见，是否需要 revalidate / refetch
  5. 重点验证：
     - 中文原文发布后点击生成英文
     - 前台切到 `/en/...` 能读到英文版
     - 前台切回 `/` 或 `lang=original` 仍是中文原文

#### 方向 2：如果产品想要“人工双语录入”

- 这不是当前最短路径。
- 因为现有后台编辑模型是单语 DTO，需要先确认后端是否支持：
  - 手工写入 translation record
  - 覆盖已有自动翻译
  - 同时保存原文与多语言版本
- 在没有先确认后端写入 contract 前，不建议直接开工做前端双语编辑 UI。

### 给下一个 agent 的明确提醒

- 不要再花时间验证“后台是不是已经藏着翻译入口”了；
  这轮已经把后台写作 DTO、侧栏、保存 mutation 都看过，当前前端里没有。
- 若要继续实现，请直接把精力放在：
  - 后台编辑页真实入口组件
  - `@mx-space/api-client` 的 translation generate API
  - 生成后如何刷新当前文章数据 / 列表数据 / 前台缓存
- 如果要做实现，建议先做文章 `post`，跑通后再复制到 `note`，避免一上来双线并行导致范围失控。

## [2026-04-15 10:50] Page 路由已接入 locale-aware 翻译读取，`academic` 修复完成

> 这一节比上面的“后台是否已有翻译入口”分析更新；若和更早内容冲突，以本节为准。

### 当前目标

- 修复公开站独立页面（Page）在英文路由下仍显示中文正文的问题。
- 明确验收样例：
  - `https://418122.xyz/academic` 应显示中文
  - `https://418122.xyz/en/academic` 应显示英文

### 这轮做了什么

- 已修改：
  - `apps/web/src/app/[locale]/(page-detail)/[slug]/api.ts`
  - `apps/web/src/app/[locale]/(page-detail)/[slug]/layout.tsx`
  - `apps/web/src/app/[locale]/(page-detail)/[slug]/page.tsx`
- 已新增：
  - `apps/web/src/app/[locale]/(page-detail)/[slug]/page-query.ts`
  - `apps/web/src/app/[locale]/(page-detail)/[slug]/api.test.ts`
  - `docs/superpowers/plans/2026-04-15-page-locale-translation-plan.md`

### 根因

- `Page` 详情链路之前没有像 `Post/Note` 那样显式把 route locale 传给 API。
- `@mx-space/api-client` 当前 `PageController.getBySlug()` 的类型定义没有暴露 `lang` 参数，所以原前端代码一直只传了 `prefer=lexical`，没有把 `/en` 变成 `lang=en`。
- 结果是：
  - 页面外壳 locale 正常切到英文
  - 但正文请求仍命中默认中文内容

### 这轮确认过的关键事实

- 线上旧行为（修复前）：
  - `curl -L -s https://418122.xyz/en/academic`
  - HTML `lang="en"` 正常，但正文仍是中文。
- 后端实际支持 Page 按语言返回：
  - `curl -s 'https://api.418122.xyz/api/v2/pages/slug/academic?lang=en&prefer=lexical'`
  - 返回英文正文（以 `## About Me` 开头）。
- 默认中文也仍存在：
  - `curl -s 'https://api.418122.xyz/api/v2/pages/slug/academic?prefer=lexical'`
  - 返回中文正文（以 `## 关于我` 开头）。

### 修复方式

- 新增纯函数 `buildPageQueryParams(locale)`：
  - `zh` -> 只传 `prefer=lexical`
  - `en` -> 传 `lang=en&prefer=lexical`
  - `ja` -> 传 `lang=ja&prefer=lexical`
- `getData` 改为接收 `(slug, locale)`，并通过：
  - `apiClient.page.proxy.slug(slug).get({ params: buildPageQueryParams(locale) })`
  显式请求对应语言。
- `layout.tsx` 的 metadata 获取与 `definePrerenderPage` fetcher 都已改为传入 `params.locale`。
- `page.tsx` 正文渲染入口也已改为传入 `locale`，避免 metadata 和正文取到不同语言。

### 验证证据

- 单测：
  - `cd /Users/zhenghan/Documents/GitHub/Blog/apps/web && pnpm exec vitest run 'src/app/[locale]/(page-detail)/[slug]/api.test.ts' --config vitest.config.ts`
  - 结果：`3 tests passed`
- 构建：
  - `cd /Users/zhenghan/Documents/GitHub/Blog && pnpm --filter @shiro/web build`
  - 结果：build 成功
- 本地 standalone 烟测：
  - 启动：
    - `PORT=4010 HOSTNAME=127.0.0.1 NEXT_PUBLIC_API_URL=https://api.418122.xyz/api/v2 NEXT_PUBLIC_GATEWAY_URL=https://api.418122.xyz node .next/standalone/Documents/GitHub/Blog/apps/web/server.js`
  - 看到本地英文页请求：
    - `https://api.418122.xyz/api/v2/pages/slug/academic?lang=en&prefer=lexical`
    - 返回 `200`
  - 本地英文响应 metadata 已变为英文摘要（`About Me I am currently...`），说明 `/en/academic` 已在页面渲染链路中使用英文内容。
- 关于 `/academic`：
  - 本地 middleware 会将默认路由 rewrite 到 `/zh/academic`，再结合 `zh` 不传 `lang` 与后端默认中文返回，可推导默认路由保持中文。

### 当前工作区状态

- 分支：
  - `codex/modify`
- 本轮与任务直接相关的文件已修改，但尚未在此 handoff 记录时提交。
- 与本次任务无关的未跟踪文件仍然存在，不要顺手清理：
  - `bootstrap.js`
  - `main-8X_hBwW2.js`
  - `plugins-page-nmaiEpNu.js`
  - `product-name-CswjKXkf.js`

### 如果下一个 agent 还要继续扩展

- 优先扩展方向：
  - 把 `Page` 列表 / header navigation / page paginator 的标题也接入 locale-aware 查询。
- 当前没有做的原因：
  - 本次验收目标只要求打开 `/academic` 与 `/en/academic` 时正文语言正确，不需要顺带扩大到整站 Page 导航标题。

## [2026-04-15 11:05] Vercel 前端部署失败根因已定位并修复

> 若和更早的“部署失败可能与 Node 20 warning 有关”的猜测冲突，以本节为准。

### 现象

- GitHub Actions run:
  - `https://github.com/V-IOLE-T/Blog/actions/runs/24433910339`
- 失败 job:
  - `deploy`
- 用户侧看到：
  - 1 error
  - 1 warning
  - `Process completed with exit code 1`
  - Node 20 deprecation warning

### 根因

- 真正导致退出码 1 的不是 Node 20 warning。
- 失败日志中明确报错：

```text
Error: Your Vercel CLI version is outdated. This endpoint requires version 47.2.2 or later.
```

- 当前工作流 `.github/workflows/vercel-frontend-deploy.yml` 把 CLI 固定成了：
  - `vercel@47.0.5`
- 构建阶段其实已经成功，失败发生在最后的上传/部署阶段。

### 修复

- 已修改：
  - `.github/workflows/vercel-frontend-deploy.yml`
- 修复内容：
  - 新增统一环境变量：
    - `VERCEL_CLI_VERSION: 51.2.1`
  - 将三处命令统一改为：
    - `pnpm dlx vercel@"$VERCEL_CLI_VERSION" ...`

### 为什么这样改

- `npm view vercel version` 当前返回：
  - `51.2.1`
- 这满足 Vercel 端点要求的 `>= 47.2.2`
- 同时避免继续把版本号散落在 3 行命令里。

### 验证

- 失败日志确认根因：
  - `gh run view 24433910339 --log-failed`
- YAML 语法检查：
  - `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/vercel-frontend-deploy.yml"); puts "yaml ok"'`
  - 输出：
    - `yaml ok`

### 对下一个 agent 的提醒

- Node 20 deprecation 目前只是 warning，不是这次失败根因。
- 如果未来要继续治理 CI，可以再单独升级：
  - `actions/checkout`
  - `actions/setup-node`
  - `pnpm/action-setup`
- 但这不是本次部署失败的阻塞点。

## [2026-04-15 11:20] 语言切换按钮已迁到页面右上角

> 若和更早“语言切换器在 footer” 的描述冲突，以本节为准。

### 当前目标

- 将公开站中英日切换入口从 footer 移到 header 右上角。
- 避免页面同时出现两份 locale 入口。

### 这轮做了什么

- 已修改：
  - `apps/web/src/components/layout/header/Header.tsx`
  - `apps/web/src/components/layout/footer/Footer.tsx`
  - `apps/web/src/components/layout/footer/FooterInfo.tsx`
- 已新增：
  - `apps/web/src/components/layout/header/internal/HeaderLocaleSwitcher.tsx`
  - `apps/web/src/components/layout/header/internal/HeaderLocaleSwitcher.config.ts`
  - `apps/web/src/components/layout/header/internal/HeaderLocaleSwitcher.test.ts`
- 已删除：
  - `apps/web/src/components/layout/footer/LocaleSwitcher.tsx`

### 实现方式

- 在 header 右侧原本空着的固定区域中挂入新的 `HeaderLocaleSwitcher`。
- 为了适配 header 右上角的小尺寸区域，trigger 使用紧凑标签：
  - `zh -> 中`
  - `en -> EN`
  - `ja -> 日`
- 下拉项仍显示完整语言名称：
  - `简体中文`
  - `English`
  - `日本語`
- footer 中原有 locale 切换入口已移除，仅保留主题切换。

### 验证

- 单测：
  - `cd /Users/zhenghan/Documents/GitHub/Blog/apps/web && pnpm exec vitest run 'src/components/layout/header/internal/HeaderLocaleSwitcher.test.ts' --config vitest.config.ts`
  - 结果：
    - `2 tests passed`
- 构建：
  - `cd /Users/zhenghan/Documents/GitHub/Blog && pnpm --filter @shiro/web build`
  - 结果：
    - build 成功

### 给下一个 agent 的提醒

- 这次只移动了公开站 locale 入口，没有改内容翻译逻辑。
- 如果用户后续想要：
  - 移动端抽屉里也显示 locale 切换
  - header 右上角显示图标而不是紧凑文字
  - 同时把主题切换也迁到 header
  那是后续 UI 迭代，不在这次范围内。

## [2026-04-15 11:45] 右上角已升级为“主题 + 语言”双按钮

> 若和上一节“右上角只有语言按钮”的描述冲突，以本节为准。

### 当前目标

- 将主题切换也迁移到页面右上角。
- 最终右上角呈现两个相邻圆形按钮：
  - 主题按钮
  - 语言按钮

### 这轮做了什么

- 已修改：
  - `apps/web/src/components/layout/header/Header.tsx`
  - `apps/web/src/components/layout/footer/Footer.tsx`
  - `apps/web/src/components/layout/footer/FooterInfo.tsx`
- 已新增：
  - `apps/web/src/components/layout/header/internal/HeaderThemeSwitcher.tsx`
  - `apps/web/src/components/layout/header/internal/HeaderThemeSwitcher.config.ts`
  - `apps/web/src/components/layout/header/internal/HeaderThemeSwitcher.test.ts`
- 已删除：
  - `apps/web/src/components/layout/footer/FooterThemeSwitcher.tsx`

### 实现方式

- 主题切换器采用单按钮下拉菜单，风格与语言按钮保持一致。
- trigger 图标按当前主题状态切换：
  - `light` -> 太阳
  - `system` -> 电脑
  - `dark` -> 月亮
- 下拉项使用：
  - 太阳 / 电脑 / 月亮 图标
  - 对应的主题 aria 文案
  - 当前选中态勾选
- 为了放下两个按钮，desktop header 右侧列宽从单按钮宽度扩展到可容纳两个按钮的宽度。
- footer 中主题切换入口已移除，因此 footer 不再承担任何“显示设置”功能。

### 验证

- 单测：
  - `cd /Users/zhenghan/Documents/GitHub/Blog/apps/web && pnpm exec vitest run 'src/components/layout/header/internal/HeaderThemeSwitcher.test.ts' 'src/components/layout/header/internal/HeaderLocaleSwitcher.test.ts' --config vitest.config.ts`
  - 结果：
    - `4 tests passed`
- 构建：
  - `cd /Users/zhenghan/Documents/GitHub/Blog && pnpm --filter @shiro/web build`
  - 结果：
    - build 成功

### 给下一个 agent 的提醒

- 这次没有把“移动端抽屉里的显示设置”一起重做。
- 如果后续用户觉得右上角两个按钮还不够统一，可继续演进为：
  - 一个总设置按钮
  - 或一个带图标的 segmented control
  但当前版本已经满足“右上角两个相邻按钮”的需求。

## [2026-04-15 12:35] 首页英文页的 locale 请求链路已补齐，但仍有后台未翻译数据残留

> 若和更早“首页英文页有中文主要是前端漏传 locale” 的笼统描述冲突，以本节为准。

### 当前目标

- 修复首页 `/en` 下仍混出中文的前端请求链路问题。
- 明确区分：
  - 前端没按 locale 请求
  - 后台即使收到英文请求仍返回中文

### 这轮做了什么

- 已新增：
  - `apps/web/src/i18n/build-api-lang-query.ts`
  - `apps/web/src/i18n/build-api-lang-query.test.ts`
- 已修改：
  - `apps/web/src/app/[locale]/(home)/layout.tsx`
  - `apps/web/src/app/[locale]/(home)/components/BottomSection.tsx`
  - `apps/web/src/app/[locale]/(home)/components/ActivityRecent.tsx`
  - `apps/web/src/app/[locale]/(home)/components/HomePageTimeLine.tsx`
  - `apps/web/src/components/layout/footer/FooterInfo.tsx`
  - `apps/web/src/components/layout/header/internal/HeaderDataConfigureProvider.tsx`

### 前端根因

- 首页多处查询之前虽然拿到了 `locale`，但没有显式把它转成 API 的 `lang` 参数。
- 典型位置：
  - `aggregate/top`
  - `activity/recent`
  - `activity/last-year/publication`
  - `recently`
- 结果是：
  - UI 文案走英文
  - 但首页内容数据仍按默认中文拉取

### 修复方式

- 新增统一 helper：
  - `buildApiLangQuery(locale)`
  - 规则：
    - `zh` -> 不传 `lang`
    - `en` -> `lang=en`
    - `ja` -> `lang=ja`
- 首页 SSR 预取 `aggregate/top` 已改为显式带 `lang`
- `BottomSection` / `ActivityRecent` / `HomePageTimeLine` 的客户端查询也已改为显式带 `lang`
- `HeaderDataConfigureProvider` 里与首页相关的 `nav-top` 也同步带上 locale，并把 query key 改成包含 locale
- `FooterInfo` 改为显式读取当前 locale 再取 aggregation data

### 这轮确认下来的后台事实

- 以下接口加 `lang=en` 后，**部分字段**会变英文：
  - `/api/v2/aggregate/top`
  - `/api/v2/activity/recent`
  - `/api/v2/activity/last-year/publication`
- 但仍有字段即使加了 `lang=en` 也还是中文，例如：
  - 文章分类名（如 `项目`、`默认分类`）
  - 文章摘要（部分文章）
  - `recently` 文本流内容
- 这说明首页剩余中文并不全是前端问题，部分是后台内容本身没有英文版本。

### 本地烟测结论

- 本地 standalone `/en` 首页中：
  - `Visual Email Management and OAuth Automation Extension` 已能出现在 `Recently Writing`
  - 说明 `aggregate/top?lang=en` 链路已接通
- 仍能看到中文：
  - `占位文章`
  - `NapCat Docker 部署完整复盘`
  - `一个把邮箱池管理...`
  - `项目` / `默认分类`
  - footer 的 `关于本站` / `关于我` / `时间线`
- 这些残留中文当前更像是后台内容/配置未翻译，而不是前端没带 locale。

### 验证

- 单测：
  - `cd /Users/zhenghan/Documents/GitHub/Blog/apps/web && pnpm exec vitest run 'src/i18n/build-api-lang-query.test.ts' --config vitest.config.ts`
  - 结果：
    - `3 tests passed`
- 构建：
  - `cd /Users/zhenghan/Documents/GitHub/Blog && pnpm --filter @shiro/web build`
  - 结果：
    - build 成功

### 给下一个 agent 的提醒

- 如果用户继续追问“为什么英文首页还有中文”，先不要再从前端链路里找锅。
- 下一步更应该检查和处理的是：
  - 具体文章是否生成了英文摘要/分类展示名
  - `recently` 数据是否支持翻译或是否需要前端在英文首页隐藏该模块
  - footer 链接文案是否来自后台中文配置

## [2026-04-15 19:20] 已新增仓库架构与试错复盘文档

### 这轮补充了什么

- 已更新：
  - `AGENTS.md`
- 已新增：
  - `docs/deployment/2026-04-15-repo-architecture-and-retrospective.md`

### 作用

- `AGENTS.md`
  - 只保留高价值、可执行、能防止下一个 agent 重复试错的经验。
- `docs/deployment/2026-04-15-repo-architecture-and-retrospective.md`
  - 给人类和下一位 agent 看的完整复盘：
    - 这段时间改了什么
    - 哪些方向错了
    - 为什么错
    - 当前前端仓库和外部后端仓库的架构
    - 哪些文件负责什么

### 给下一个 agent 的建议

- 如果是要快速接手问题：
  1. 先读 `AGENTS.md`
  2. 再读 `HANDOFF.md` 最新章节
- 如果是要理解全局背景或学习这次排障路径：
  - 直接读：
    - `docs/deployment/2026-04-15-repo-architecture-and-retrospective.md`
