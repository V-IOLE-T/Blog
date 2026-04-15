# Recently 轻管理 AI 翻译 UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在轻管理 `Recently` 卡片里加入常驻翻译状态和统一的 `AI 翻译` 下拉菜单，并打通英文 / 日文的单条翻译触发。

**Architecture:** 复用现有 `RecentlySection` 作为唯一 UI 入口，不新增页面。通过一个小型 helper 统一处理 `availableTranslations` 推导、菜单文案和语言元信息，再在 `RecentlySection` 中接入逐条 mutation 与刷新逻辑。

**Tech Stack:** React 19、TypeScript、TanStack Query、Next Intl、现有 `DropdownMenu` 组件、Vitest、Next build

---

## 文件结构

### 需要修改

- `apps/web/src/routes/site/recently-section.tsx`
  - 扩展列表项类型
  - 渲染翻译状态徽标
  - 增加 `AI 翻译` 下拉菜单
  - 接入逐条英文 / 日文 mutation 与刷新逻辑
- `apps/web/src/routes/site/recently-section.test.tsx`
  - 覆盖翻译状态显示
  - 覆盖 `AI 翻译` 按钮和动态菜单文案的静态渲染

### 建议新增

- `apps/web/src/routes/site/recently-translation.ts`
  - 封装语言定义、状态推导、菜单文案和 toast 文案生成
- `apps/web/src/routes/site/recently-translation.test.ts`
  - 单测状态推导逻辑，避免把业务判断散落在组件里

### 参考文件

- `apps/web/src/components/layout/header/internal/HeaderThemeSwitcher.tsx`
  - 参考现有 `DropdownMenu` 用法
- `apps/web/node_modules/@mx-space/api-client/dist/index.d.mts`
  - 确认 `RecentlyModel`、`availableTranslations`、`streamTranslationGenerate(...)`
- `docs/superpowers/specs/2026-04-15-recently-light-admin-ai-ui-design.md`
  - 本次实现的权威设计来源

## Task 1: 固化翻译状态推导

**Files:**
- Create: `apps/web/src/routes/site/recently-translation.ts`
- Create: `apps/web/src/routes/site/recently-translation.test.ts`
- Reference: `apps/web/node_modules/@mx-space/api-client/dist/index.d.mts`

- [ ] **Step 1: 写 helper 单测，先固定 EN / JA 状态推导**

```ts
import { describe, expect, it } from 'vitest'

import {
  getRecentlyTranslationActionLabel,
  getRecentlyTranslationStatuses,
} from './recently-translation'

describe('recently translation helpers', () => {
  it('marks both languages as untranslated when list is empty', () => {
    expect(getRecentlyTranslationStatuses(undefined)).toEqual([
      { lang: 'en', code: 'EN', translated: false },
      { lang: 'ja', code: 'JA', translated: false },
    ])
  })

  it('marks only english as translated when en exists', () => {
    expect(getRecentlyTranslationStatuses(['en'])).toEqual([
      { lang: 'en', code: 'EN', translated: true },
      { lang: 'ja', code: 'JA', translated: false },
    ])
  })

  it('returns update labels for translated languages', () => {
    expect(getRecentlyTranslationActionLabel('en', true)).toBe('更新英文')
    expect(getRecentlyTranslationActionLabel('ja', false)).toBe('生成日文')
  })
})
```

- [ ] **Step 2: 运行单测，确认当前失败**

Run:

```bash
pnpm --filter @shiro/web exec vitest run src/routes/site/recently-translation.test.ts
```

Expected:

- FAIL
- 提示找不到 `recently-translation.ts` 或导出不存在

- [ ] **Step 3: 写最小 helper 实现**

```ts
const RECENTLY_TRANSLATION_LANGS = [
  { lang: 'en', code: 'EN', label: '英文' },
  { lang: 'ja', code: 'JA', label: '日文' },
] as const

export const getRecentlyTranslationStatuses = (
  availableTranslations?: string[],
) =>
  RECENTLY_TRANSLATION_LANGS.map((item) => ({
    ...item,
    translated: !!availableTranslations?.includes(item.lang),
  }))

export const getRecentlyTranslationActionLabel = (
  lang: 'en' | 'ja',
  translated: boolean,
) => {
  const label = lang === 'en' ? '英文' : '日文'
  return `${translated ? '更新' : '生成'}${label}`
}

export const getRecentlyTranslationToastLabel = (
  lang: 'en' | 'ja',
  translated: boolean,
) => {
  const label = lang === 'en' ? '英文' : '日文'
  return `已提交${label}${translated ? '重翻译' : '翻译'}`
}
```

- [ ] **Step 4: 重新跑 helper 单测，确认通过**

Run:

```bash
pnpm --filter @shiro/web exec vitest run src/routes/site/recently-translation.test.ts
```

Expected:

- PASS

- [ ] **Step 5: 提交 helper 任务**

```bash
git add apps/web/src/routes/site/recently-translation.ts apps/web/src/routes/site/recently-translation.test.ts
git commit -m "test(recently): 固化翻译状态推导"
```

## Task 2: 让 `RecentlySectionView` 渲染状态与入口

**Files:**
- Modify: `apps/web/src/routes/site/recently-section.tsx`
- Modify: `apps/web/src/routes/site/recently-section.test.tsx`
- Reference: `apps/web/src/components/layout/header/internal/HeaderThemeSwitcher.tsx`

- [ ] **Step 1: 先给视图层补静态渲染测试**

```tsx
it('renders translation status badges and ai translation entry for owner', () => {
  const html = renderToStaticMarkup(
    <RecentlySectionView
      adminUrl="https://api.418122.xyz/proxy/qaqdmin#/recently"
      hasNextPage={false}
      isFetchingNextPage={false}
      items={[
        {
          id: 'recently-1',
          content: '今天从杭州回来了，赶早上的飞机真的好困。',
          created: '2026-04-07T10:52:42.124Z',
          modified: null,
          up: 0,
          down: 0,
          availableTranslations: ['en'],
        },
      ]}
      recentlyCount={1}
      showOwnerActions
    />,
  )

  expect(html).toContain('EN 已翻译')
  expect(html).toContain('JA 未翻译')
  expect(html).toContain('AI 翻译')
})
```

- [ ] **Step 2: 运行视图测试，确认新增断言失败**

Run:

```bash
pnpm --filter @shiro/web exec vitest run src/routes/site/recently-section.test.tsx
```

Expected:

- FAIL
- 现有视图还没有状态徽标 / `AI 翻译` 入口

- [ ] **Step 3: 扩展 `RecentlyListItem` 和纯视图渲染**

```ts
type RecentlyListItem = Pick<
  RecentlyModel,
  'content' | 'created' | 'down' | 'id' | 'modified' | 'up'
> & {
  availableTranslations?: string[]
}
```

```tsx
const statuses = getRecentlyTranslationStatuses(item.availableTranslations)

<div className="mt-4 flex flex-wrap gap-2">
  {statuses.map((status) => (
    <span key={status.lang}>
      {status.code} {status.translated ? '已翻译' : '未翻译'}
    </span>
  ))}
</div>
```

```tsx
<DropdownMenu modal={false}>
  <DropdownMenuTrigger asChild>
    <StyledButton type="button" variant="secondary">
      AI 翻译
    </StyledButton>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    {statuses.map((status) => (
      <DropdownMenuItem key={status.lang}>
        {getRecentlyTranslationActionLabel(status.lang, status.translated)}
      </DropdownMenuItem>
    ))}
  </DropdownMenuContent>
</DropdownMenu>
```

- [ ] **Step 4: 重新运行视图测试，确认通过**

Run:

```bash
pnpm --filter @shiro/web exec vitest run src/routes/site/recently-section.test.tsx
```

Expected:

- PASS

- [ ] **Step 5: 提交视图任务**

```bash
git add apps/web/src/routes/site/recently-section.tsx apps/web/src/routes/site/recently-section.test.tsx
git commit -m "feat(recently): 展示轻管理翻译状态"
```

## Task 3: 接入单条翻译 mutation 与刷新

**Files:**
- Modify: `apps/web/src/routes/site/recently-section.tsx`
- Modify: `apps/web/src/routes/site/recently-section.test.tsx`
- Reference: `apps/web/node_modules/@mx-space/api-client/dist/index.d.mts`

- [ ] **Step 1: 为 mutation 入口补一条组件级行为测试或最小可验证断言**

```tsx
it('shows update labels when translation already exists', () => {
  const html = renderToStaticMarkup(
    <RecentlySectionView
      adminUrl="https://api.418122.xyz/proxy/qaqdmin#/recently"
      hasNextPage={false}
      isFetchingNextPage={false}
      items={[
        {
          id: 'recently-1',
          content: '今天从杭州回来了，赶早上的飞机真的好困。',
          created: '2026-04-07T10:52:42.124Z',
          modified: null,
          up: 0,
          down: 0,
          availableTranslations: ['en', 'ja'],
        },
      ]}
      recentlyCount={1}
      showOwnerActions
    />,
  )

  expect(html).toContain('更新英文')
  expect(html).toContain('更新日文')
})
```

- [ ] **Step 2: 运行测试，确认当前菜单文案或行为还未完全满足**

Run:

```bash
pnpm --filter @shiro/web exec vitest run src/routes/site/recently-section.test.tsx
```

Expected:

- FAIL 或部分断言未通过

- [ ] **Step 3: 接入单条 mutation**

```ts
const { mutateAsync: translateRecently, isPending } = useMutation({
  mutationFn: async ({
    id,
    lang,
  }: {
    id: string
    lang: 'en' | 'ja'
  }) => {
    await apiClient.ai.streamTranslationGenerate({ articleId: id, lang })
  },
})
```

```ts
const handleTranslate = async (
  item: RecentlyListItem,
  lang: 'en' | 'ja',
  translated: boolean,
) => {
  try {
    await translateRecently({ id: item.id, lang })
    toast.success(getRecentlyTranslationToastLabel(lang, translated))
    await refetch()
  } catch (error) {
    toast.error(getErrorMessageFromRequestError(error as any))
  }
}
```

实现注意点：

- loading 需要尽量按“单条 item + 语言”粒度管理，避免整页按钮一起锁死
- 如果 `streamTranslationGenerate(...)` 在当前后端场景不适合作为触发入口，再退回 `apiClient.ai.proxy(...)` 调用同一后端路由
- 成功提示必须用“已提交”，不要暗示已经翻译完成

- [ ] **Step 4: 重新运行最近相关测试**

Run:

```bash
pnpm --filter @shiro/web exec vitest run src/routes/site/recently-translation.test.ts src/routes/site/recently-section.test.tsx
```

Expected:

- PASS

- [ ] **Step 5: 提交 mutation 任务**

```bash
git add apps/web/src/routes/site/recently-section.tsx apps/web/src/routes/site/recently-section.test.tsx apps/web/src/routes/site/recently-translation.ts
git commit -m "feat(recently): 接入轻管理翻译操作"
```

## Task 4: 回归验证与交付

**Files:**
- Modify: `apps/web/src/routes/site/recently-section.tsx`（如 build 暴露小问题再补）
- Modify: `HANDOFF.md`

- [ ] **Step 1: 运行最近模块定向测试**

Run:

```bash
pnpm --filter @shiro/web exec vitest run src/routes/site/recently-translation.test.ts src/routes/site/recently-section.test.tsx
```

Expected:

- PASS

- [ ] **Step 2: 运行前端构建验证**

Run:

```bash
NEXT_PUBLIC_API_URL=https://api.418122.xyz/api/v2 NEXT_PUBLIC_GATEWAY_URL=https://api.418122.xyz pnpm --filter @shiro/web build
```

Expected:

- BUILD SUCCESS

- [ ] **Step 3: 更新交接文档**

需要补充到 `HANDOFF.md`：

- 这次为轻管理 recently 增加了哪些 UI 能力
- 使用了哪些接口 / 触发方式
- 哪些地方仍是异步任务行为，可能不会立即显示为已翻译
- 验证命令与结果

- [ ] **Step 4: 提交收尾**

```bash
git add apps/web/src/routes/site/recently-section.tsx apps/web/src/routes/site/recently-section.test.tsx apps/web/src/routes/site/recently-translation.ts apps/web/src/routes/site/recently-translation.test.ts HANDOFF.md
git commit -m "feat(recently): 支持轻管理 AI 翻译入口"
```

- [ ] **Step 5: 推送并触发前端部署**

Run:

```bash
git push origin codex/modify
gh workflow run .github/workflows/vercel-frontend-deploy.yml
```

Expected:

- push 成功
- 前端部署 workflow 被触发

## 备注

- 若实现中发现 `Recently` 列表接口没有返回 `availableTranslations`，优先补最小兼容层，不要重开页面
- 若 `streamTranslationGenerate(...)` 不适合当前后端生成契约，应记录真实可用路由，并在实现中用最薄的 fallback 封装
- 不要把本计划之外的未跟踪文件一起提交
