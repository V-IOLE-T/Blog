# Avatar Upload URL Root Cause Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 从上游源码层修复头像上传后仍返回旧 `/objects/...` URL 的问题，避免继续依赖 Caddy 兼容转发。

**Architecture:** 先在当前 Yohaku 仓库确认现象不是页面层直接拼接，再抓取 `mx-server` 或相关 admin 上游源码，定位上传接口返回 URL 的生成逻辑。修复应尽量收敛在资源 URL 规范化或文件服务 URL builder 这一层，并用失败测试锁住 `/api/v2/files/...` 的期望行为。

**Tech Stack:** TypeScript, Node.js, pnpm, mx-space/api-client, 上游 GitHub 源码

---

### Task 1: 固化现象与边界

**Files:**
- Modify: `HANDOFF.md`
- Modify: `apps/web/src/lib/upload.ts`
- Create: `docs/superpowers/plans/2026-04-01-avatar-upload-url-root-cause-fix.md`

- [ ] **Step 1: 读取当前仓库上传 helper 与 dashboard 路由**
- [ ] **Step 2: 记录“当前仓库只消费上传返回 URL，不生成旧路径”的结论**
- [ ] **Step 3: 明确真正待修范围扩展到 `mx-server` / admin 上游**

### Task 2: 抓取上游并定位根因

**Files:**
- Create: `/tmp/mx-space-upstream/*`
- Modify: 上游中负责对象上传、静态文件 URL 生成、头像返回 DTO 的源码文件
- Test: 上游对应测试文件

- [ ] **Step 1: 拉取候选上游仓库源码到临时目录**
- [ ] **Step 2: 搜索 `/objects`, `/api/v2/files`, `upload`, `avatar` 相关实现**
- [ ] **Step 3: 确认旧 URL 是由哪个模块/函数生成**
- [ ] **Step 4: 选定最小修复点，避免在调用层分散改写**

### Task 3: TDD 修复

**Files:**
- Modify: 上游 URL builder / upload service 实现文件
- Test: 上游对应单元测试或集成测试文件

- [ ] **Step 1: 写一个失败测试，断言上传返回 URL 使用 `/api/v2/files/...`**
- [ ] **Step 2: 运行该测试，确认它先以旧 `/objects/...` 行为失败**
- [ ] **Step 3: 实现最小修复，使 URL builder 或返回值统一落到新路径**
- [ ] **Step 4: 重新运行测试，确认通过**

### Task 4: 验证与回迁

**Files:**
- Modify: `HANDOFF.md`
- Modify: 必要的说明文档或 patch 记录

- [ ] **Step 1: 运行与上传/文件 URL 相关的定向测试**
- [ ] **Step 2: 若可行，补一条最小运行脚本或请求样例验证返回值**
- [ ] **Step 3: 记录需要如何把上游修复带回当前服务器环境**
- [ ] **Step 4: 总结是否还能保留 Caddy 兼容作为过渡兜底**
