# Header Auth Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将首页头部账号入口统一收敛到左上角头像，未登录时显示 `enter.svg` 并支持悬浮“登录”提示，移除右上角重复头像入口。

**Architecture:** 复用现有 owner 登录态、reader session、OAuth 登录弹层与登出逻辑，只调整头部入口装配方式。实现上优先把左上角头像改造成统一账号菜单入口，并让右上角 `UserAuth` 从“承载入口”降级为不再输出可见账号交互。

**Tech Stack:** Next.js App Router, React, next-intl, TanStack Query, Base UI Dropdown Menu, pnpm

---

### Task 1: 准备未登录资源与文案

**Files:**
- Create: `apps/web/public/enter.svg`
- Modify: `apps/web/src/messages/zh/common.json`
- Modify: `apps/web/src/messages/en/common.json`
- Modify: `apps/web/src/messages/ja/common.json`

- [ ] **Step 1: 复制未登录头像资源**

将用户提供的 `/Users/zhenghan/Downloads/enter.svg` 复制到 `apps/web/public/enter.svg`，后续通过 `/enter.svg` 引用，避免运行时依赖下载目录。

- [ ] **Step 2: 补充头部登录提示文案**

在三份 `common.json` 中新增左上角入口所需文案，例如：

```json
{
  "auth_login": "登录"
}
```

英文与日文同步补齐等价翻译，避免 UI 或 `title`/`aria-label` 硬编码。

- [ ] **Step 3: 校对现有菜单文案是否可复用**

确认以下现有 key 继续复用，不重复新增：

- `auth_account`
- `auth_dashboard`
- `auth_console`
- `auth_logout`
- `aria_login`
- `aria_site_owner_avatar`

### Task 2: 将左上角头像改造成统一账号入口

**Files:**
- Modify: `apps/web/src/components/layout/header/internal/AnimatedLogo.tsx`
- Modify: `apps/web/src/components/layout/header/internal/SiteOwnerAvatar.tsx`
- Modify: `apps/web/src/components/layout/header/internal/UserAuth.tsx`
- Test: `apps/web/src/components/layout/header/internal/UserAuth.tsx`（手工验证为主）

- [ ] **Step 1: 去掉现有单击/双击分流逻辑**

从 `AnimatedLogo.tsx` 中移除当前基于 `useSingleAndDoubleClick` 的：

- 单击回首页/直播
- 双击 owner 进控制台
- 双击访客跳登录

把左上角头像改成显式单击账号入口。

- [ ] **Step 2: 复用现有账号菜单内容，而不是重写一套**

以 `UserAuth.tsx` 中现有的菜单逻辑为基础，提炼/迁移到左上角入口使用，保证下面这些行为保持一致：

- owner：
  - `轻管理` -> `window.open('/dashboard', '_blank')`
  - `控制台` -> `window.open(getAdminUrl(), '_blank')`
  - `登出` -> `apiClient.owner.logout()` + `authClient.signOut()`
- reader：
  - 展示头像、昵称、handle/email
  - `退出登录` -> `authClient.signOut()`
- 未登录：
  - 复用 `useOauthLoginModal()` 打开现有登录弹层

- [ ] **Step 3: 明确左上角三种头像来源**

在左上角入口中按优先级渲染头像：

1. owner 已登录：owner 头像
2. reader 已登录：reader session 头像
3. 都未登录：`/enter.svg`

如果 reader session 缺头像，允许回退到安全占位样式，但不影响菜单与登录动作。

- [ ] **Step 4: 为未登录态增加悬浮提示**

在左上角入口的未登录态加入“登录”提示，优先使用轻量实现之一：

- `title={t('auth_login')}`
- 或现有 tooltip/float-popover 方案

同时保持可访问性：

- `aria-label={t('aria_login')}`
- `sr-only` 文案与未登录视觉状态一致

- [ ] **Step 5: 保留菜单触发稳定性**

确保左上角入口在桌面端和移动端都能正常触发：

- owner / reader 登录态单击打开菜单
- 未登录单击直接登录，不先打开空菜单
- 菜单内容在 hover/scroll 动画下不闪烁

### Task 3: 移除右上角重复账号入口并收口头部布局

**Files:**
- Modify: `apps/web/src/components/layout/header/Header.tsx`
- Modify: `apps/web/src/components/layout/header/internal/UserAuth.tsx`
- Modify: `apps/web/src/components/layout/header/internal/grid.css`

- [ ] **Step 1: 让右上角不再承载可见账号入口**

在 `Header.tsx` 中移除或降级右侧 `<UserAuth />` 的可见输出，确保首页头部只剩左上角这一处账号交互。

- [ ] **Step 2: 处理布局占位**

检查当前三列头部栅格：

```tsx
grid-cols-[4.5rem_auto_4.5rem]
```

根据移除右上角入口后的视觉效果，选择以下其一并保持最小改动：

- 右列保留空占位，确保中间导航不偏移
- 右列改为纯布局占位容器
- 若确实需要，微调 `grid.css` 但不改整体头部结构

- [ ] **Step 3: 避免遗留重复认证入口**

检查首页头部桌面端与移动端，确认不会同时出现：

- 左上角新入口
- 右上角旧头像/登录按钮

### Task 4: 定向验证

**Files:**
- Test: `apps/web/src/components/layout/header/internal/AnimatedLogo.tsx`
- Test: `apps/web/src/components/layout/header/internal/UserAuth.tsx`
- Test: `apps/web/src/messages/zh/common.json`
- Test: `apps/web/src/messages/en/common.json`
- Test: `apps/web/src/messages/ja/common.json`

- [ ] **Step 1: 本地静态检查改动文件**

运行：

```bash
pnpm exec prettier --check \
  apps/web/src/components/layout/header/Header.tsx \
  apps/web/src/components/layout/header/internal/AnimatedLogo.tsx \
  apps/web/src/components/layout/header/internal/SiteOwnerAvatar.tsx \
  apps/web/src/components/layout/header/internal/UserAuth.tsx \
  apps/web/src/messages/zh/common.json \
  apps/web/src/messages/en/common.json \
  apps/web/src/messages/ja/common.json
```

Expected: `All matched files use Prettier code style!`

- [ ] **Step 2: 运行前端构建验证**

运行：

```bash
NEXT_PUBLIC_API_URL=https://api.418122.xyz/api/v2 \
NEXT_PUBLIC_GATEWAY_URL=https://api.418122.xyz \
pnpm --filter @shiro/web build
```

Expected: 构建成功，无新增类型错误或消息 key 缺失错误

- [ ] **Step 3: 手工验收未登录态**

在首页验证：

- 左上角显示 `enter.svg`
- 悬浮时出现“登录”提示
- 点击时直接拉起现有登录弹层

- [ ] **Step 4: 手工验收 reader 登录态**

完成一次 reader 登录后验证：

- 左上角切换为 reader 头像
- 点击后展示账号摘要
- 菜单只出现账号信息和退出登录
- 右上角无重复头像入口

- [ ] **Step 5: 手工验收 owner 登录态**

完成一次 owner 登录后验证：

- 左上角切换为 owner 头像
- 点击后展示：
  - `进入控制台`
  - `轻管理`
  - `登出`
- `控制台` 能打开 `https://api.418122.xyz/proxy/qaqdmin#/dashboard`
- `轻管理` 能打开 `/dashboard`
- 右上角无重复头像入口

- [ ] **Step 6: 记录剩余风险**

如存在以下未完全验证项，必须如实记录：

- owner 登录是否在所有浏览器里都能稳定刷新左上角头像
- tooltip 是否在移动端退化为 `title` 或不展示
- header 栅格是否还需要进一步视觉微调
