# Site Config Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 dashboard 中新增轻量站点配置页，支持修改 SEO、首页 Hero、页脚链接与社交链接

**Architecture:** 读取继续复用 aggregation/theme 数据，保存时拆分成 `config/seo`、`owner`、`snippets/theme` 三条现有后端链路。页面状态与 payload 转换逻辑下沉到独立 helper，优先通过单测锁定行为，再接入路由与表单 UI。

**Tech Stack:** React Router, TanStack Query, Jotai, ofetch api client, Vitest

---

### Task 1: 建立可测试的数据转换层

**Files:**
- Create: `apps/web/src/routes/site/form-state.test.ts`
- Create: `apps/web/src/routes/site/form-state.ts`

- [ ] **Step 1: 写失败测试**
- [ ] **Step 2: 运行测试，确认失败原因正确**
- [ ] **Step 3: 实现最小转换逻辑**
- [ ] **Step 4: 重新运行测试，确认通过**

### Task 2: 接入 dashboard 路由与页面

**Files:**
- Create: `apps/web/src/routes/site/index.tsx`
- Modify: `apps/web/src/app/(dashboard)/dashboard/[[...catch_all]]/router.tsx`
- Modify: `apps/web/src/messages/zh/dashboard.json`
- Modify: `apps/web/src/messages/en/dashboard.json`
- Modify: `apps/web/src/messages/ja/dashboard.json`

- [ ] **Step 1: 增加一级菜单路由**
- [ ] **Step 2: 实现表单页面与查询逻辑**
- [ ] **Step 3: 接入保存动作与错误提示**
- [ ] **Step 4: 保存后刷新 aggregation/theme 数据**

### Task 3: 定向验证

**Files:**
- Test: `apps/web/src/routes/site/form-state.test.ts`

- [ ] **Step 1: 运行 helper 单测**
- [ ] **Step 2: 运行 `pnpm --filter @shiro/web build`**
- [ ] **Step 3: 检查输出并记录剩余风险**
