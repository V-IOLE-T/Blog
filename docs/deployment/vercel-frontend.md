# Vercel 前端部署与运维（主路径）

本文档用于冷启动工程师快速完成前端部署切换。当前推荐主路径：前端托管到 Vercel，VPS 仅保留 API 服务。

> 说明：Vercel / GitHub 控制台配置与 DNS 切流均为外部手动步骤，不会被仓库内命令自动完成。

## 1. 一次性项目配置（手动）

在 Vercel 控制台创建或接管项目时，使用以下固定配置：

- Project Root Directory: `apps/web`
- Production Branch: `main`
- 必需环境变量：
  - `NEXT_PUBLIC_API_URL=https://api.418122.xyz/api/v2`
  - `NEXT_PUBLIC_GATEWAY_URL=https://api.418122.xyz`

## 2. 域名绑定与 DNS（手动）

在 Vercel 项目中添加以下域名：

- `418122.xyz`
- `www.418122.xyz`

添加后，按 Vercel 提示在 DNS 服务商处更新记录，使这两个域名流量实际指向 Vercel。

## 3. GitHub Secrets（手动）

在 GitHub 仓库 `Settings -> Secrets and variables -> Actions` 中配置：

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

这些密钥供 `.github/workflows/vercel-frontend-deploy.yml` 使用。

`VERCEL_ORG_ID` 与 `VERCEL_PROJECT_ID` 可从以下任一位置获取：

- Vercel Dashboard 的团队/项目设置页面
- 本地执行 `vercel link` 后生成的 `.vercel/project.json`（本地绑定产物，不应提交到仓库）

## 4. 常规发布方式

生产发布默认通过以下任一路径触发：

1. 推送代码到 `main`
2. 手动触发 `.github/workflows/vercel-frontend-deploy.yml`

## 5. 切换后的 Smoke Checklist

完成 Vercel 配置、DNS 切流后，至少检查：

1. `https://418122.xyz` 返回 200，页面可正常渲染。
2. `https://www.418122.xyz` 返回 200，且与主域行为一致。
3. 页面可正常请求 `https://api.418122.xyz/api/v2`（浏览器网络面板无基础 CORS/404 错误）。
4. 关键入口（如首页、登录后控制台入口）可访问。
5. `https://api.418122.xyz/api/v2/ping` 返回 `{"data":"pong"}`。
6. 最近一次 `main` 提交对应的 Vercel Deployment 状态为 `Ready`。

## 6. 回退方式（短期应急）

若 Vercel 侧异常且需快速止损，可短期切回 VPS 前端容器路径：

1. 不要直接在 VPS 上恢复旧前端入口；先阅读专门回退手册：
   - [VPS 前端回退与运维说明](./vps-frontend-rollback.md)
2. 按回退手册执行：
   - 恢复 apex/www 的 Caddy 站点块
   - 用 `rollback` profile 启动 `yohaku`
   - 验证容器与公网链路
3. 记录回退时间点、原因和恢复计划，问题修复后按同一手册切回 Vercel 主路径。

## 7. 明确不再作为主线的做法

- 不再默认使用 `docker compose build yohaku` 作为前端发布主线。
- 不再依赖“热更新运行中容器文件系统”来发布线上修复。
- 不再允许普通 `docker compose up -d` 把前端默认带回 VPS。

以上方式可作为临时救火手段，但不再是默认运维策略。
