# Site Settings Translation UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为轻管理页中的 `Hero` 与 `页脚链接` 增加 AI 翻译按钮、字段级翻译状态，以及后端对应的 translation entry 接口。

**Architecture:** 这次实现采用“前端分组按钮 + 后端 translation entries”模式。前端负责把 Hero/页脚字段映射成稳定 key path 和 lookupKey；后端扩展 translation entry 的 key path 与查询/生成接口，用同一套 entry 存储字段翻译状态与结果。

**Tech Stack:** React 19、TypeScript、TanStack Query、Next.js Route / Dashboard UI、NestJS、Zod DTO、Typegoose、translation-entry service、Vitest、Next build

---

## 文件结构

### 前端仓库 `Blog`

#### 需要修改

- `apps/web/src/routes/site/index.tsx`
  - 为 Hero 和页脚链接区块接入 `AI 翻译` 按钮
  - 读取翻译状态并刷新分组
- `apps/web/src/routes/site/form-state.ts`
  - 构造 Hero / Footer 的可翻译字段快照
  - 生成稳定 key path / lookupKey
- `apps/web/src/routes/site/sections.tsx`
  - 为字段渲染 EN / JA 状态徽标
  - 可能补充区块标题栏 action 插槽

#### 建议新增

- `apps/web/src/routes/site/site-translation.ts`
  - 统一封装 Hero / Footer 的 translation key path、lookupKey、状态映射、分组菜单文案
- `apps/web/src/routes/site/site-translation.test.ts`
  - 测试 key path、lookupKey、字段分组、状态归一化逻辑
- `apps/web/src/app/api/internal/site-translations/generate/route.ts`
  - 前端同源代理，避免浏览器直接跨域访问后端 translation entry 接口
- `apps/web/src/app/api/internal/site-translations/query/route.ts`
  - 前端同源代理，供轻管理读取 Hero / Footer 字段翻译状态

### 后端仓库 `blog-mx-core`（本地工作副本：`/tmp/blog-mx-core-import`）

#### 需要修改

- `/tmp/blog-mx-core-import/apps/core/src/modules/ai/ai-translation/translation-entry.model.ts`
  - 扩展 `TranslationEntryKeyPath`，加入 site settings 相关 key
- `/tmp/blog-mx-core-import/apps/core/src/modules/ai/ai-translation/translation-entry.schema.ts`
  - 扩展 Zod key path 枚举
  - 增加针对 lookupKeys / custom values 的 DTO
- `/tmp/blog-mx-core-import/apps/core/src/modules/ai/ai-translation/translation-entry.service.ts`
  - 支持按 lookupKeys 精确查询 entry
  - 支持生成指定 values 的翻译
- `/tmp/blog-mx-core-import/apps/core/src/modules/ai/ai-translation/translation-entry.controller.ts`
  - 增加站点配置翻译查询 / 生成接口

#### 可能新增

- `/tmp/blog-mx-core-import/apps/core/test/src/modules/ai/translation-entry.site-settings.e2e-spec.ts`
  - 覆盖 Hero / Footer translation entry 查询与生成

## 设计决策

### Key Path 约定

首版采用以下 key path：

- `theme.hero.title`
- `theme.hero.description`
- `theme.hero.quote`
- `theme.footer.section.name`
- `theme.footer.link.name`

#### lookupKey 约定

为避免把 sectionIndex / linkIndex 硬编码进 key path 枚举，使用 `lookupKey` 承担定位责任：

- Hero
  - `hero.title`
  - `hero.description`
  - `hero.quote`
- Footer section
  - `footer.section.${sectionIndex}.name`
- Footer link
  - `footer.section.${sectionIndex}.link.${linkIndex}.name`

这样后端只需要扩展有限的 keyPath 集合，而前端仍能精确定位到每个字段。

### 读取策略

前端不从 theme snippet 本体猜状态，而是：

1. 按当前表单生成字段快照
2. 把 `{ keyPath, lookupKey, sourceText }[]` 发给同源 query route
3. route 代理到后端查询 translation entries
4. 返回 EN / JA 状态字典

### 生成策略

前端点击 `翻译 Hero` / `翻译页脚` 时：

1. 构造当前分组字段值
2. 发给同源 generate route
3. route 代理到后端 translation entry generate 接口
4. 成功后刷新当前分组状态查询

## Task 1: 前端字段映射与状态 helper

**Files:**
- Create: `apps/web/src/routes/site/site-translation.ts`
- Create: `apps/web/src/routes/site/site-translation.test.ts`
- Modify: `apps/web/src/routes/site/form-state.ts`

- [ ] **Step 1: 先写 helper 测试，固定 Hero / Footer 的 keyPath 与 lookupKey 输出**

```ts
import { describe, expect, it } from 'vitest'

import {
  buildHeroTranslationFields,
  buildFooterTranslationFields,
} from './site-translation'

describe('site translation helpers', () => {
  it('builds hero fields with stable keyPath and lookupKey', () => {
    expect(
      buildHeroTranslationFields({
        heroTitle: 'OO Blog',
        heroDescription: 'Hello world',
        heroQuote: 'Keep building',
      }),
    ).toEqual([
      {
        fieldId: 'hero.title',
        keyPath: 'theme.hero.title',
        lookupKey: 'hero.title',
        sourceText: 'OO Blog',
      },
      {
        fieldId: 'hero.description',
        keyPath: 'theme.hero.description',
        lookupKey: 'hero.description',
        sourceText: 'Hello world',
      },
      {
        fieldId: 'hero.quote',
        keyPath: 'theme.hero.quote',
        lookupKey: 'hero.quote',
        sourceText: 'Keep building',
      },
    ])
  })

  it('builds footer fields without translating href', () => {
    expect(
      buildFooterTranslationFields([
        {
          name: '关于',
          links: [{ name: '时间线', href: '/timeline' }],
        },
      ]),
    ).toEqual([
      {
        fieldId: 'footer.section.0.name',
        keyPath: 'theme.footer.section.name',
        lookupKey: 'footer.section.0.name',
        sourceText: '关于',
      },
      {
        fieldId: 'footer.section.0.link.0.name',
        keyPath: 'theme.footer.link.name',
        lookupKey: 'footer.section.0.link.0.name',
        sourceText: '时间线',
      },
    ])
  })
})
```

- [ ] **Step 2: 跑测试，确认它先失败**

Run:

```bash
pnpm --filter @shiro/web exec vitest run src/routes/site/site-translation.test.ts
```

Expected:

- FAIL
- 缺少 helper 文件或导出

- [ ] **Step 3: 写最小 helper 实现**

```ts
export const buildHeroTranslationFields = (...) => [...]
export const buildFooterTranslationFields = (...) => [...]
export const getSiteTranslationActionLabel = (...) => ...
export const mergeSiteTranslationStatuses = (...) => ...
```

- [ ] **Step 4: 重新跑 helper 测试**

Run:

```bash
pnpm --filter @shiro/web exec vitest run src/routes/site/site-translation.test.ts
```

Expected:

- PASS

- [ ] **Step 5: 提交 helper 任务**

```bash
git add apps/web/src/routes/site/site-translation.ts apps/web/src/routes/site/site-translation.test.ts apps/web/src/routes/site/form-state.ts
git commit -m "test(site): 固化配置翻译字段映射"
```

## Task 2: 后端扩展 translation entry keyPath 与 DTO

**Files:**
- Modify: `/tmp/blog-mx-core-import/apps/core/src/modules/ai/ai-translation/translation-entry.model.ts`
- Modify: `/tmp/blog-mx-core-import/apps/core/src/modules/ai/ai-translation/translation-entry.schema.ts`
- Test: `/tmp/blog-mx-core-import/apps/core/test/src/modules/ai/translation-entry.site-settings.e2e-spec.ts`

- [ ] **Step 1: 先写后端 failing test，固定 site settings keyPath 可接受**

```ts
it('accepts theme hero and footer key paths for generation', async () => {
  const payload = {
    values: [
      {
        keyPath: 'theme.hero.title',
        keyType: 'entity',
        lookupKey: 'hero.title',
        sourceText: 'OO Blog',
      },
    ],
    targetLangs: ['en'],
  }

  await expect(controller.generateEntries(payload as any)).resolves.toBeDefined()
})
```

- [ ] **Step 2: 运行后端测试，确认当前 schema / types 先失败**

Run:

```bash
cd /tmp/blog-mx-core-import && pnpm test -- translation-entry.site-settings
```

Expected:

- FAIL
- keyPath 枚举不包含 `theme.hero.title`

- [ ] **Step 3: 扩展 `TranslationEntryKeyPath` 与 Zod 枚举**

```ts
export type TranslationEntryKeyPath =
  | 'category.name'
  | 'topic.name'
  | 'topic.introduce'
  | 'note.mood'
  | 'note.weather'
  | 'theme.hero.title'
  | 'theme.hero.description'
  | 'theme.hero.quote'
  | 'theme.footer.section.name'
  | 'theme.footer.link.name'
```

- [ ] **Step 4: 重新跑后端测试**

Run:

```bash
cd /tmp/blog-mx-core-import && pnpm test -- translation-entry.site-settings
```

Expected:

- PASS 或进入下一类失败（接口尚未补齐）

- [ ] **Step 5: 提交后端类型任务**

```bash
cd /tmp/blog-mx-core-import
git add apps/core/src/modules/ai/ai-translation/translation-entry.model.ts apps/core/src/modules/ai/ai-translation/translation-entry.schema.ts apps/core/test/src/modules/ai/translation-entry.site-settings.e2e-spec.ts
git commit -m "feat(translation): 扩展站点配置翻译键"
```

## Task 3: 后端增加 site settings translation query / generate 接口

**Files:**
- Modify: `/tmp/blog-mx-core-import/apps/core/src/modules/ai/ai-translation/translation-entry.schema.ts`
- Modify: `/tmp/blog-mx-core-import/apps/core/src/modules/ai/ai-translation/translation-entry.controller.ts`
- Modify: `/tmp/blog-mx-core-import/apps/core/src/modules/ai/ai-translation/translation-entry.service.ts`
- Test: `/tmp/blog-mx-core-import/apps/core/test/src/modules/ai/translation-entry.site-settings.e2e-spec.ts`

- [ ] **Step 1: 写 failing test，覆盖“按 lookupKey 查询状态”和“按 values 生成翻译”**

```ts
it('queries entries by keyPath + lookupKeys + lang', async () => {
  const result = await controller.queryEntriesByLookup({
    keyPath: 'theme.hero.title',
    lang: 'en',
    lookupKeys: ['hero.title'],
  } as any)

  expect(result.data).toBeDefined()
})

it('generates entries for arbitrary provided values', async () => {
  const result = await controller.generateEntries({
    targetLangs: ['en'],
    values: [
      {
        keyPath: 'theme.hero.title',
        keyType: 'entity',
        lookupKey: 'hero.title',
        sourceText: 'OO Blog',
      },
    ],
  } as any)

  expect(result.created).toBeGreaterThanOrEqual(0)
})
```

- [ ] **Step 2: 跑测试，确认接口尚不存在**

Run:

```bash
cd /tmp/blog-mx-core-import && pnpm test -- translation-entry.site-settings
```

Expected:

- FAIL

- [ ] **Step 3: 扩展 DTO 和 service**

建议新增：

```ts
const TranslationEntryInputSchema = z.object({
  keyPath: z.enum(validKeyPaths),
  keyType: z.enum(['entity', 'dict']),
  lookupKey: z.string(),
  sourceText: z.string().min(1),
})

const GenerateEntriesSchema = z.object({
  keyPaths: z.array(z.enum(validKeyPaths)).optional(),
  targetLangs: z.array(z.string()).optional(),
  values: z.array(TranslationEntryInputSchema).optional(),
})

const QueryEntriesByLookupSchema = z.object({
  keyPath: z.enum(validKeyPaths),
  lang: z.string(),
  lookupKeys: z.array(z.string()).min(1),
})
```

服务端新增：

```ts
async queryEntriesByLookup(input) { ... }
async generateTranslations(options) {
  if (options.values?.length) {
    return this.generateForValues(options.values)
  }
  ...
}
```

- [ ] **Step 4: 再跑后端测试**

Run:

```bash
cd /tmp/blog-mx-core-import && pnpm test -- translation-entry.site-settings
```

Expected:

- PASS

- [ ] **Step 5: 提交后端接口任务**

```bash
cd /tmp/blog-mx-core-import
git add apps/core/src/modules/ai/ai-translation/translation-entry.schema.ts apps/core/src/modules/ai/ai-translation/translation-entry.controller.ts apps/core/src/modules/ai/ai-translation/translation-entry.service.ts apps/core/test/src/modules/ai/translation-entry.site-settings.e2e-spec.ts
git commit -m "feat(translation): 支持站点配置翻译查询"
```

## Task 4: 前端同源代理 route

**Files:**
- Create: `apps/web/src/app/api/internal/site-translations/query/route.ts`
- Create: `apps/web/src/app/api/internal/site-translations/generate/route.ts`

- [ ] **Step 1: 先写 route 层最小测试或 curl 脚本说明**

如果没有 route 单测基础，至少补一个手工验证脚本说明到计划执行里。

- [ ] **Step 2: 新增 query route**

职责：

- 接收 `{ keyPath, lookupKeys, lang }`
- 代理到后端 translation entry query-by-lookup 接口
- 返回前端直接可消费的状态数据

- [ ] **Step 3: 新增 generate route**

职责：

- 接收 `{ values, targetLang }`
- 代理到后端 generate entries 接口
- 返回 `{ ok: true }` 或错误 message

- [ ] **Step 4: 本地验证 route 与 build**

Run:

```bash
NEXT_PUBLIC_API_URL=https://api.418122.xyz/api/v2 NEXT_PUBLIC_GATEWAY_URL=https://api.418122.xyz pnpm --filter @shiro/web build
```

Expected:

- 新 route 成功进入 app route 产物

- [ ] **Step 5: 提交前端代理任务**

```bash
git add apps/web/src/app/api/internal/site-translations/query/route.ts apps/web/src/app/api/internal/site-translations/generate/route.ts
git commit -m "feat(site): 添加配置翻译代理接口"
```

## Task 5: 轻管理页接入 Hero / Footer 翻译按钮与字段状态

**Files:**
- Modify: `apps/web/src/routes/site/index.tsx`
- Modify: `apps/web/src/routes/site/sections.tsx`
- Modify: `apps/web/src/routes/site/form-state.ts`
- Modify: `apps/web/src/routes/site/site-translation.ts`
- Test: `apps/web/src/routes/site/site-translation.test.ts`

- [ ] **Step 1: 写 failing test，固定 Hero / Footer 按钮与字段状态文案**

```tsx
it('renders hero translation entry and field status badges', () => {
  const html = renderToStaticMarkup(<Component />)
  expect(html).toContain('Hero')
  expect(html).toContain('AI 翻译')
  expect(html).toContain('EN 已翻译')
})
```

如果整页组件测试成本太高，则退化为 helper + section view 测试。

- [ ] **Step 2: 跑测试，确认当前 UI 尚未具备这些内容**

Run:

```bash
pnpm --filter @shiro/web exec vitest run src/routes/site/site-translation.test.ts
```

Expected:

- FAIL

- [ ] **Step 3: 实现 Hero / Footer 状态与菜单**

实现要点：

- Hero 标题栏右侧 `AI 翻译`
- 页脚链接标题栏右侧 `AI 翻译`
- 字段级 EN / JA 状态徽标
- 菜单文案按状态动态显示 `生成 / 更新`
- 只翻译：
  - Hero 标题 / 描述 / 一句话
  - Footer 分组名 / 链接名
- 不翻译 `href`

- [ ] **Step 4: 跑前端定向测试**

Run:

```bash
pnpm --filter @shiro/web exec vitest run src/routes/site/site-translation.test.ts src/routes/site/recently-translation.test.ts
```

Expected:

- PASS

- [ ] **Step 5: 提交 UI 任务**

```bash
git add apps/web/src/routes/site/index.tsx apps/web/src/routes/site/sections.tsx apps/web/src/routes/site/form-state.ts apps/web/src/routes/site/site-translation.ts apps/web/src/routes/site/site-translation.test.ts
git commit -m "feat(site): 接入配置翻译按钮与状态"
```

## Task 6: 回归验证与交付

**Files:**
- Modify: `HANDOFF.md`

- [ ] **Step 1: 跑前端定向测试**

Run:

```bash
pnpm --filter @shiro/web exec vitest run src/routes/site/site-translation.test.ts src/routes/site/recently-translation.test.ts src/routes/site/recently-section.test.tsx
```

Expected:

- PASS

- [ ] **Step 2: 跑前端构建**

Run:

```bash
NEXT_PUBLIC_API_URL=https://api.418122.xyz/api/v2 NEXT_PUBLIC_GATEWAY_URL=https://api.418122.xyz pnpm --filter @shiro/web build
```

Expected:

- BUILD SUCCESS

- [ ] **Step 3: 跑后端相关测试**

Run:

```bash
cd /tmp/blog-mx-core-import && pnpm test -- translation-entry.site-settings
```

Expected:

- PASS

- [ ] **Step 4: 更新交接文档**

写入 `HANDOFF.md`：

- Hero / Footer 配置翻译按钮入口
- translation entry 的新 key path
- 前端 query / generate route
- 验证命令与结果

- [ ] **Step 5: 推送并部署**

前端：

```bash
git push origin codex/modify
gh workflow run .github/workflows/vercel-frontend-deploy.yml --ref codex/modify
```

后端：

```bash
cd /tmp/blog-mx-core-import
git push origin <backend-branch>
gh workflow run <backend-deploy-workflow> --ref <backend-branch>
```

## 备注

- 本任务天然跨前后端，但仍属于一个闭环：按钮、状态、接口、存储缺一不可
- 若后端仓库当前不在本地可写状态，前端实现应暂停在“计划完成”而不是伪装完成
- 首版不做 SEO 翻译按钮，也不做前台实时双语编辑视图
