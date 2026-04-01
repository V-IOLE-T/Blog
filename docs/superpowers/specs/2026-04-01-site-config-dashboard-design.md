# Site Config Dashboard Design

**目标**

在 Yohaku 当前 dashboard 中新增一个轻量 `site` 配置页，让 owner 能直接修改首页与页脚常用配置，而不是再跳到外部 admin 或直接改 snippet 数据。

**范围**

- 首页 SEO：`seo.title`、`seo.description`
- 首页 Hero：`theme.config.hero.title.template`、`theme.config.hero.description`
- 页脚链接：`theme.footer.linkSections`
- 社交链接：`owner.socialIds`

**非目标**

- 不做通用 JSON 编辑器
- 不覆盖全部 theme 配置
- 不迁移旧 Blog branding
- 不新增后端接口，优先复用现有 `config`、`owner`、`snippets` 写接口

**数据来源与写回**

- SEO 读取自 `aggregate.seo`，保存走 `PATCH /api/v2/config/seo`
- 社交链接读取自 `aggregate.user.socialIds`，保存走 `PATCH /api/v2/owner`
- Hero 与 footer 读取自 `theme` snippet，保存走 `snippets` 资源：
  - 先读取当前 theme snippet 元数据
  - 若存在则 `PUT /api/v2/snippets/:id`
  - 若不存在则 `POST /api/v2/snippets`

**前端方案**

- 在 dashboard 新增一级路由 `/dashboard/site`
- 页面使用单页表单，分成 `SEO`、`Hero`、`页脚链接`、`社交链接` 四块
- 表单本地状态由聚合数据与 theme snippet 派生，保存时拆成三类 payload：
  - `seo`
  - `owner`
  - `theme snippet`
- 保存成功后重新拉取 aggregation 与 snippet 数据，确保 dashboard 与首页都能看到最新值

**风险**

- theme snippet 保存需要文档 id，不能只依赖公开 `GET /snippets/theme/shiro`
- Hero title 的真实结构是 `template[]`，第一版需要限制为简单可编辑文本块，避免破坏现有 schema
- footer linkSections 是数组嵌套数组，表单需要做最小格式约束，避免写回非法结构

**验证**

- helper 单测覆盖表单状态映射与 payload 拆分
- 定向跑新 helper 测试
- 定向跑 `@shiro/web` build，确认 dashboard 路由与类型通过
