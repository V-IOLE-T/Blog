# 首页改版与文章目录重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将首页改造成个人主页式介绍页，新增 `/blog` 与 `/resume`，并把文章内容模型从 `categories` 收敛为 `folder`。

**Architecture:** 保持现有 Astro 布局和主题外观，围绕内容模型、路由层和少量新组件进行增量重构。`/blog` 通过统一的文件夹配置和查询参数驱动展示状态，文章详情页与标签体系继续复用现有数据流。

**Tech Stack:** Astro 5、TypeScript、Markdown content collections、Node test runner、Less

---

## 文件结构映射

- Modify: `src/content.config.ts` - 更新文章 schema，移除 `categories`，新增 `folder` 与 `summary`
- Create: `src/page_data/BlogFolders.ts` - 维护逻辑文件夹配置
- Modify: `src/config.ts` - 调整导航、关闭分类侧边栏展示
- Modify: `src/utils/getArchive.ts` - 移除分类聚合，保留归档与标签聚合，统一过滤隐藏文章
- Modify: `src/utils/getPostInfo.ts` - 删除分类统计，更新站点计数逻辑
- Modify: `src/components/Aside/Aside.astro` - 移除分类模块与分类数展示
- Modify: `src/pages/[...page].astro` - 停止作为首页文章列表入口，后续改为 `/blog`
- Create: `src/pages/index.astro` - 新首页
- Create: `src/pages/blog/index.astro` - 文章目录页
- Create: `src/pages/resume/index.astro` - 简历页
- Modify: `src/components/MainHeader/MainHeader.astro` - 支持首页新的横幅内容
- Modify: `src/components/MainHeader/MainHeader.less` - 支持首页按钮与介绍视觉
- Modify: `src/pages/article/[...article].astro` - 文章详情页移除分类入口，必要时展示 folder 名称
- Delete: `src/pages/about/index.md` - 移除 about 页
- Delete: `src/pages/categories/[...categories].astro` - 移除分类页
- Modify: `src/content/blog/*.md` - 批量补充 `folder` 与 `summary`，移除 `categories`
- Test: `tests/site-routing.test.js` - 验证导航与页面入口调整
- Test: `tests/content-schema.test.js` - 验证 schema 与文章 frontmatter 迁移
- Test: `tests/site-config.test.js` - 更新配置断言

### Task 1: 路由与配置基线

**Files:**
- Create: `tests/site-routing.test.js`
- Modify: `tests/site-config.test.js`
- Modify: `src/config.ts`

- [ ] **Step 1: 写失败测试，描述新导航与配置行为**

```js
test("导航包含文章目录与简历入口且不再包含关于", async () => {
  const configContent = await readFile(configPath, "utf8");
  assert.match(configContent, /text:\s*'文章目录'/);
  assert.doesNotMatch(configContent, /text:\s*'关于'/);
  assert.match(configContent, /CategoriesShow:\s*false/);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm test tests/site-config.test.js tests/site-routing.test.js`
Expected: FAIL，提示导航和分类展示配置仍是旧结构

- [ ] **Step 3: 做最小实现，更新站点配置**

```ts
Navs: [
  { text: '文章目录', link: '/blog', icon: '...' },
  { text: '动态', link: '/talking', icon: '...' },
  { text: '昔日', link: '/archives', icon: '...' },
  { text: '留言', link: '/message', icon: '...' },
  { text: '简历', link: '/resume', icon: '...' },
]
AsideShow: {
  CategoriesShow: false,
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm test tests/site-config.test.js tests/site-routing.test.js`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add tests/site-config.test.js tests/site-routing.test.js src/config.ts
git commit -m "test: lock new navigation structure"
```

### Task 2: 内容模型迁移

**Files:**
- Create: `tests/content-schema.test.js`
- Modify: `src/content.config.ts`
- Create: `src/page_data/BlogFolders.ts`
- Modify: `src/content/blog/*.md`

- [ ] **Step 1: 写失败测试，约束 schema 与文章 frontmatter**

```js
test("文章 schema 使用 folder 与 summary 而不是 categories", async () => {
  const schema = await readFile("src/content.config.ts", "utf8");
  assert.match(schema, /folder:\s*z\.string\(\)/);
  assert.match(schema, /summary:\s*z\.string\(\)\.optional\(\)/);
  assert.doesNotMatch(schema, /categories:/);
});
```

```js
test("现有文章 frontmatter 已迁移到 folder", async () => {
  const article = await readFile(samplePostPath, "utf8");
  assert.match(article, /^folder:\s+/m);
  assert.doesNotMatch(article, /^categories:\s+/m);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm test tests/content-schema.test.js`
Expected: FAIL，说明 schema 仍声明 `categories`，文章 frontmatter 仍未迁移

- [ ] **Step 3: 做最小实现，迁移 schema、文件夹配置和文章元数据**

```ts
schema: z.object({
  title: z.string(),
  folder: z.string(),
  summary: z.string().optional(),
})
```

```ts
export default [
  { slug: "frontend", name: "前端工程", description: "...", order: 1 },
  { slug: "ai", name: "AI 应用", description: "...", order: 2 },
];
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm test tests/content-schema.test.js`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add tests/content-schema.test.js src/content.config.ts src/page_data/BlogFolders.ts src/content/blog
git commit -m "feat: migrate blog content to folder model"
```

### Task 3: 首页与主横幅重构

**Files:**
- Create: `tests/homepage-content.test.js`
- Create: `src/pages/index.astro`
- Modify: `src/components/MainHeader/MainHeader.astro`
- Modify: `src/components/MainHeader/MainHeader.less`

- [ ] **Step 1: 写失败测试，描述首页已经不是文章分页页**

```js
test("首页使用独立 index 页面承载个人介绍", async () => {
  const indexPage = await readFile("src/pages/index.astro", "utf8");
  assert.match(indexPage, /查看文章目录/);
  assert.match(indexPage, /CV\s*\/\s*个人简历/);
});
```

```js
test("主横幅包含首页 hero 所需字段", async () => {
  const header = await readFile("src/components/MainHeader/MainHeader.astro", "utf8");
  assert.match(header, /查看文章目录/);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm test tests/homepage-content.test.js`
Expected: FAIL，因为首页仍由 `[...page].astro` 负责，主横幅没有新内容

- [ ] **Step 3: 做最小实现，新增首页并升级横幅**

```astro
<Layout title="" description={Description} Home={true}>
  <section class="home-intro">
    <a href="/blog">查看文章目录</a>
    <a href="/resume">CV / 个人简历</a>
  </section>
</Layout>
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm test tests/homepage-content.test.js`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add tests/homepage-content.test.js src/pages/index.astro src/components/MainHeader/MainHeader.astro src/components/MainHeader/MainHeader.less
git commit -m "feat: rebuild homepage as profile landing page"
```

### Task 4: `/blog` 目录页与聚合逻辑

**Files:**
- Create: `tests/blog-directory.test.js`
- Create: `src/pages/blog/index.astro`
- Modify: `src/pages/[...page].astro`
- Modify: `src/utils/getArchive.ts`
- Modify: `src/utils/getPostInfo.ts`

- [ ] **Step 1: 写失败测试，描述 `/blog` 目录行为**

```js
test("/blog 使用 folder 查询参数驱动当前目录", async () => {
  const page = await readFile("src/pages/blog/index.astro", "utf8");
  assert.match(page, /folder/);
  assert.match(page, /URL/);
});
```

```js
test("旧分页首页不再作为站点首页入口", async () => {
  const listPage = await readFile("src/pages/[...page].astro", "utf8");
  assert.match(listPage, /blog/);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm test tests/blog-directory.test.js`
Expected: FAIL

- [ ] **Step 3: 做最小实现，新增目录页并收敛聚合逻辑**

```ts
const visiblePosts = posts.filter(post => !post.data.hide);
const grouped = visiblePosts.reduce((acc, post) => { ...post.data.folder... }, {});
```

```astro
const currentFolder = Astro.url.searchParams.get("folder") ?? defaultFolder.slug;
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm test tests/blog-directory.test.js`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add tests/blog-directory.test.js src/pages/blog/index.astro src/pages/[...page].astro src/utils/getArchive.ts src/utils/getPostInfo.ts
git commit -m "feat: add folder based blog directory"
```

### Task 5: 简历页与旧入口清理

**Files:**
- Create: `tests/page-removal.test.js`
- Create: `src/pages/resume/index.astro`
- Delete: `src/pages/about/index.md`
- Delete: `src/pages/categories/[...categories].astro`
- Modify: `src/components/Aside/Aside.astro`
- Modify: `src/pages/article/[...article].astro`

- [ ] **Step 1: 写失败测试，描述 about/categories 已移除且 resume 已存在**

```js
test("存在 resume 页面并移除 about 页面", async () => {
  assert.equal(await exists("src/pages/resume/index.astro"), true);
  assert.equal(await exists("src/pages/about/index.md"), false);
});
```

```js
test("文章详情页不再链接到 categories 路由", async () => {
  const articlePage = await readFile("src/pages/article/[...article].astro", "utf8");
  assert.doesNotMatch(articlePage, /\\/categories\\//);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm test tests/page-removal.test.js`
Expected: FAIL

- [ ] **Step 3: 做最小实现，新增 resume 并清理旧入口**

```astro
<Layout title="个人简历" description={Description} activeNav="resume">
  <section class="vh-page">...</section>
</Layout>
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm test tests/page-removal.test.js`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add tests/page-removal.test.js src/pages/resume/index.astro src/components/Aside/Aside.astro src/pages/article/[...article].astro
git rm src/pages/about/index.md src/pages/categories/[...categories].astro
git commit -m "feat: add resume page and remove legacy category routes"
```

### Task 6: 全量验证

**Files:**
- Verify only

- [ ] **Step 1: 运行站点测试**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 2: 运行构建验证**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 3: 检查 git 工作区**

Run: `git status --short`
Expected: 仅包含本次实现变更

- [ ] **Step 4: 提交验证后的最终改动**

```bash
git add .
git commit -m "feat: rebuild homepage and blog information architecture"
```
