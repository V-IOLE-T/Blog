# MixSpace 占位数据初始化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在线上 `MixSpace Core` 中补齐一套最小可用占位数据，使 `Yohaku/Shiro` 所需聚合接口可正常返回。

**Architecture:** 先核实线上实例的真实 schema 与初始化入口，优先复用系统原生初始化方式；若不存在可用入口，则在完成数据库备份后直接向 Mongo 写入最小 owner、站点配置、分类与文章数据，并通过聚合接口验证。

**Tech Stack:** MixSpace Core, MongoDB, Tencent Cloud Lighthouse command execution, Cloudflare/public HTTP verification, web-access

---

### Task 1: 核实线上可用初始化路径

**Files:**
- Modify: `/Users/zhenghan/Documents/GitHub/Blog/docs/superpowers/plans/2026-03-31-mxspace-placeholder-data.md`

- [ ] **Step 1: 检查线上容器和数据目录中的可用入口**

运行只读检查，确认是否存在初始化脚本、管理端、seed 命令或可读配置：

```bash
docker ps
docker exec mx-server sh -lc 'ls -la /app && find /app -maxdepth 3 | head -200'
find /opt/mxspace/data -maxdepth 3 -type f | sort
```

- [ ] **Step 2: 记录可复用入口或确认不存在**

预期：

- 若找到初始化脚本/CLI/API，进入 Task 2A
- 若未找到，进入 Task 2B

### Task 2A: 通过系统原生入口初始化最小数据

**Files:**
- Modify: `/Users/zhenghan/Documents/GitHub/Blog/docs/superpowers/plans/2026-03-31-mxspace-placeholder-data.md`

- [ ] **Step 1: 备份目标数据库相关集合**

运行：

```bash
docker exec mongo mongosh mx-space --quiet --eval '
db.users.find().toArray();
db.posts.find().toArray();
db.notes.find().toArray();
db.pages.find().toArray();
db.categories.find().toArray();
'
```

- [ ] **Step 2: 执行最小初始化命令**

根据 Task 1 发现的入口，初始化 owner、站点信息和最小内容。

- [ ] **Step 3: 验证聚合接口**

运行：

```bash
curl -s https://api.418122.xyz/api/v2/aggregate/site
curl -s 'https://api.418122.xyz/api/v2/aggregate?theme=shiro'
```

预期：

- 不再出现 owner 丢失
- 聚合结果中存在可渲染站点数据

### Task 2B: 直接写 Mongo 初始化最小数据

**Files:**
- Modify: `/Users/zhenghan/Documents/GitHub/Blog/docs/superpowers/plans/2026-03-31-mxspace-placeholder-data.md`

- [ ] **Step 1: 读取 schema 线索**

运行：

```bash
docker exec mx-server sh -lc "find /app -type f \\( -name '*.js' -o -name '*.mjs' -o -name '*.cjs' \\) | xargs rg -n 'users|posts|categories|site|theme|aggregate'"
```

目标：

- 找到集合名、关键字段、聚合接口依赖的数据结构

- [ ] **Step 2: 导出现有集合备份**

运行：

```bash
docker exec mongo mongosh mx-space --quiet --eval '
printjson({
  users: db.users.find().toArray(),
  posts: db.posts.find().toArray(),
  notes: db.notes.find().toArray(),
  pages: db.pages.find().toArray(),
  categories: db.categories.find().toArray()
})
'
```

- [ ] **Step 3: 构造最小占位数据**

至少包括：

- owner 用户
- 站点/主题相关配置
- 默认分类
- 1 到 3 篇文章

占位正文使用中文 Markdown，自带“占位内容”标识。

- [ ] **Step 4: 写入最小数据**

通过 `mongosh` 执行最小插入脚本，保持新增记录带统一前缀，如 `seed-20260331-`。

- [ ] **Step 5: 验证接口结果**

运行：

```bash
curl -s https://api.418122.xyz/api/v2/ping
curl -s https://api.418122.xyz/api/v2/aggregate/site
curl -s 'https://api.418122.xyz/api/v2/aggregate?theme=shiro'
```

预期：

- `ping` 正常
- `aggregate/site` 返回 owner
- `aggregate?theme=shiro` 返回非空站点主题聚合

### Task 3: 为后续切流做最小验收

**Files:**
- Modify: `/Users/zhenghan/Documents/GitHub/Blog/HANDOFF.md`

- [ ] **Step 1: 记录最终写入结果**

在 `HANDOFF.md` 中补充：

- 使用了哪条初始化路径
- 写入了哪些占位集合
- 关键验证返回结果

- [ ] **Step 2: 明确是否可以进入前端切流**

判定标准：

- 聚合接口齐全
- 至少一篇文章能被读取
- 若仍缺 theme 或站点配置，则不能切流

- [ ] **Step 3: 仅在满足条件时进入下一阶段**

下一阶段不是直接提交，而是重新验证 `Yohaku/Shiro` 部署所需环境变量和反代配置。
