# Vercel 前端部署收口 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将前端生产发布从 VPS 本地构建 `yohaku` 容器切换为 Vercel 托管部署，同时保留 VPS 上的 `api.418122.xyz` 作为后端 API。

**Architecture:** 仓库内新增一条以 Vercel CLI 为核心的 GitHub Actions 发布链路，并把旧的 `main` 分支远程触发部署工作流降级，避免双轨发布互相干扰。文档层补齐 Vercel 项目根目录、必需 Secrets、域名切换、回退步骤与验收口径，确保后续发布以 git commit 为唯一来源。

**Tech Stack:** GitHub Actions, Vercel CLI, Next.js standalone app (`apps/web`), pnpm

---

### Task 1: 固化新的 Vercel 发布工作流

**Files:**
- Create: `.github/workflows/vercel-frontend-deploy.yml`
- Modify: `.github/workflows/trigger.yml`

- [ ] **Step 1: 新增 Vercel 生产部署 workflow 骨架**

目标：
- 支持 `workflow_dispatch`
- 支持 `push` 到 `main` 时自动发布生产环境
- 使用仓库 secrets：`VERCEL_TOKEN`、`VERCEL_ORG_ID`、`VERCEL_PROJECT_ID`

建议结构：

```yaml
name: Deploy Frontend to Vercel

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
```

- [ ] **Step 2: 补齐 workflow 的构建与部署步骤**

目标：
- `checkout`
- 安装 Node 20 与 pnpm
- 安装依赖
- 用 Vercel CLI 在 `apps/web` 目录执行 `pull -> build -> deploy --prebuilt`

建议命令：

```bash
pnpm install --frozen-lockfile
cd apps/web
npx vercel pull --yes --environment=production --token="$VERCEL_TOKEN"
npx vercel build --prod --token="$VERCEL_TOKEN"
npx vercel deploy --prebuilt --prod --token="$VERCEL_TOKEN"
```

注意：
- `VERCEL_ORG_ID` 与 `VERCEL_PROJECT_ID` 通过 job `env` 注入
- 不把 `.vercel/project.json` 这类本地绑定文件提交进仓库

- [ ] **Step 3: 让旧的远端触发 workflow 退出主链路**

当前 `.github/workflows/trigger.yml` 仍会在 `main` push 时触发旧仓库 `shiroi-remote-deploy`，这会和新 Vercel 主链路冲突。

处理方式：
- 保留文件，但改成仅 `workflow_dispatch`
- 在文件头部补注释，明确它已是旧链路/紧急手动回退用途

- [ ] **Step 4: 本地检查 workflow 文件的基础格式**

Run:

```bash
pnpm exec prettier --check .github/workflows/vercel-frontend-deploy.yml .github/workflows/trigger.yml
```

Expected:
- 退出码为 `0`
- 输出显示 `Checking formatting...` 且没有格式错误

### Task 2: 补齐 Vercel 项目配置与运维文档

**Files:**
- Create: `docs/deployment/vercel-frontend.md`
- Modify: `README.md`

- [ ] **Step 1: 新建前端部署文档**

文档必须覆盖：
- Vercel 项目根目录为 `apps/web`
- Production Branch 设为 `main`
- 必需环境变量：
  - `NEXT_PUBLIC_API_URL=https://api.418122.xyz/api/v2`
  - `NEXT_PUBLIC_GATEWAY_URL=https://api.418122.xyz`
- GitHub Secrets：
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID`
- 域名绑定：
  - `418122.xyz`
  - `www.418122.xyz`
- 切换完成后的 smoke checklist
- 回退方式：短期内可切回 VPS 前端容器

- [ ] **Step 2: 更新 README 的生产部署建议**

把当前偏私服 Docker 的描述补成：
- 推荐主路径：Vercel 托管前端
- VPS 仅保留 API
- 旧 Docker 路径仅作为历史兼容或短期回退方案

- [ ] **Step 3: 在文档中显式写出不应再做的事**

至少写明：
- 不再默认使用 `docker compose build yohaku` 作为前端发布主线
- 不再依赖热更新运行中容器文件系统发布修复

### Task 3: 验证仓库改动没有破坏前端构建

**Files:**
- Test: `.github/workflows/vercel-frontend-deploy.yml`
- Test: `README.md`
- Test: `docs/deployment/vercel-frontend.md`

- [ ] **Step 1: 重新运行前端构建验证**

Run:

```bash
NEXT_PUBLIC_API_URL=https://api.418122.xyz/api/v2 \
NEXT_PUBLIC_GATEWAY_URL=https://api.418122.xyz \
pnpm --filter @shiro/web build
```

Expected:
- 构建成功
- 没有因为部署文档或 workflow 相关改动引入新的前端构建问题

- [ ] **Step 2: 做一次仓库级 diff 检查**

Run:

```bash
git diff --check
```

Expected:
- 退出码为 `0`
- 没有尾随空格、冲突标记或坏掉的 patch

- [ ] **Step 3: 记录仍需人工完成的外部操作**

把下列事项写入最终文档和 handoff：
- 在 GitHub 仓库中配置 Vercel secrets
- 在 Vercel 控制台绑定 `apps/web` 为项目根目录
- 把生产域名切到 Vercel
- 切换后验证首页、owner 登录态与“控制台”按钮链路

### Task 4: 更新交接文档，避免下一位 agent 重复踩坑

**Files:**
- Modify: `HANDOFF.md`

- [ ] **Step 1: 追加新的 handoff 章节**

必须写清：
- 新的正式目标链路是 `GitHub Actions -> Vercel -> 418122.xyz/www`
- 旧 `trigger.yml` 已降级，不再是默认前端发布路径
- 当前 VPS 前端容器的角色是短期回退，不是主生产
- 哪些步骤已在仓库内完成，哪些必须到 GitHub/Vercel 控制台手动完成

- [ ] **Step 2: 在 handoff 中记录验证证据**

至少记录：
- workflow 格式检查命令
- `pnpm --filter @shiro/web build` 的结果
- 当前仍未执行的外部切换动作
