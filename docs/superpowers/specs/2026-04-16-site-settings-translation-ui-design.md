# 站点配置翻译 UI 设计

**日期：** 2026-04-16  
**范围：** 轻管理页面中的站点配置翻译能力  
**仓库：** 前端 `Blog`，后端 `blog-mx-core`

## 目标

在轻管理页面中，为以下配置内容增加 AI 翻译入口与状态展示：

- `Hero 标题`
- `Hero 描述`
- `首页一句话`
- `页脚链接` 的分组名
- `页脚链接` 中每个链接的名称

用户希望这些配置项能像 recently 一样，在轻管理页面内直接触发翻译，而不需要跳到别的后台页面或通过数据库手工维护。

## 当前上下文

### 前端现状

站点配置页当前已经支持编辑并保存以下内容：

- [apps/web/src/routes/site/index.tsx](/Users/zhenghan/Documents/GitHub/Blog/apps/web/src/routes/site/index.tsx)
  - `Hero 标题`
  - `Hero 描述`
  - `首页一句话`
  - `页脚链接`
- [apps/web/src/routes/site/form-state.ts](/Users/zhenghan/Documents/GitHub/Blog/apps/web/src/routes/site/form-state.ts)
  - 负责把聚合数据和 theme snippet 转成可编辑表单
  - 负责把表单写回 `themeSnippet.raw`
- [apps/web/src/routes/site/sections.tsx](/Users/zhenghan/Documents/GitHub/Blog/apps/web/src/routes/site/sections.tsx)
  - 负责 Hero、页脚链接等分组的 UI

这些内容目前都被写进 theme snippet 中，并不是后端已有的 `post / note / recently` 文章模型。

### 后端现状

后端现有 AI 翻译主干主要覆盖：

- `Post`
- `Note`
- `Page`
- `Recently`

它们都属于“文章式 refId + refType”模型。

而 `Hero` 和 `页脚链接` 这种站点配置文案，更接近“配置项字典翻译”，不是天然 article translation 对象。

后端还存在更适合这一类场景的能力基础：

- translation entries / translate-fields 体系
- 可以按稳定 key path 管理某个具体文本节点的翻译

因此，这次设计不建议硬把 site settings 塞进 article translation 流程，而是建议走配置文案的 translation entry 模型。

## 用户已确认的偏好

### 按钮粒度

用户明确选择：

- 不要每个字段旁边单独一个按钮
- 采用“分组级按钮”

即：

- `Hero` 区块右上角一个 `AI 翻译`
- `页脚链接` 区块右上角一个 `AI 翻译`

### 状态可见性

用户明确接受：

- 按钮是分组级
- 但字段级状态要可见

例如：

- `Hero 描述` 旁边能看到 `EN 已翻译 / JA 未翻译`
- 某个页脚链接名称旁边也能看到同样的状态

## 方案对比

### 方案 1：分组级按钮 + 字段级状态（推荐）

- `Hero` 标题栏右侧一个 `AI 翻译`
- `页脚链接` 标题栏右侧一个 `AI 翻译`
- 每个具体字段旁边展示 EN / JA 状态

优点：

- 操作不碎
- 状态足够清晰
- 最符合轻管理页面的“轻但可控”

缺点：

- 需要补一层字段级状态映射

### 方案 2：分组级按钮 + 无字段状态

- 只保留 `翻译 Hero` / `翻译页脚`
- 不展示每个字段的具体语言状态

优点：

- UI 最干净

缺点：

- 用户很难知道翻译到底覆盖到了哪些字段

### 方案 3：整页统一翻译

- 顶部统一一个 `翻译站点配置`

优点：

- 操作最少

缺点：

- 控制力太差
- 很容易一次翻太多，不适合精细维护站点文案

## 选定方案

采用 **方案 1：分组级按钮 + 字段级状态**。

原因：

- 能保持轻管理页面整洁
- 同时保留字段级透明度
- 更适合站点配置这类“内容量小但细节多”的场景

## 详细设计

### 1. 交互布局

#### Hero 区块

在 `Hero` 卡片标题栏右侧新增 `AI 翻译` 按钮。

此按钮只作用于：

- `Hero 标题`
- `Hero 描述`
- `首页一句话`

不作用于：

- 社交链接

#### 页脚链接区块

在 `页脚链接` 卡片标题栏右侧新增 `AI 翻译` 按钮。

此按钮只作用于：

- 每个分组名
- 每个链接名称

不作用于：

- `href`

### 2. 菜单行为

两个分组按钮都使用统一下拉菜单：

- `生成英文` / `更新英文`
- `生成日文` / `更新日文`

动态文案规则：

- 若该分组下所有目标字段都没有对应语言翻译，显示 `生成`
- 若该分组下已有对应语言翻译记录，显示 `更新`

这里的“生成 / 更新”只决定用户看到的动作语义，不要求前端维护两套路由；首版可以统一走同一个“提交翻译任务”接口。

### 3. 字段范围定义

#### Hero

需要翻译的字段：

- `Hero 标题`
- `Hero 描述`
- `首页一句话`

不翻译的字段：

- Hero title template 的视觉样式配置
- hitokoto 的 `random` 开关

#### 页脚链接

需要翻译的字段：

- section `name`
- link `name`

不翻译的字段：

- section 顺序
- link `href`

### 4. 后端存储建议

这批内容不建议走 article translation，而建议走 translation entries。

推荐为每个字段定义稳定 key path：

- `theme.hero.title`
- `theme.hero.description`
- `theme.hero.quote`
- `theme.footer.section.<sectionIndex>.name`
- `theme.footer.section.<sectionIndex>.link.<linkIndex>.name`

这些 key path 的目的：

- 让后端能够针对单个配置字段建立翻译记录
- 让前端能精确查询某个字段的 EN / JA 状态
- 在 theme snippet 被重新保存后，也能稳定判断哪些翻译需要更新

如果后端不希望依赖 index，也可以进一步改成带稳定 hash/key 的路径，但首版用 index 足够清晰、也最容易落地。

### 5. 前端状态来源

前端不应假设 theme snippet 自身会直接携带翻译状态。

推荐做法：

1. 读取原始站点配置表单值
2. 按上述 key path 构造字段清单
3. 从后端拉这些字段的翻译状态
4. 以字段为粒度渲染：
   - `EN 已翻译 / 未翻译`
   - `JA 已翻译 / 未翻译`

状态展示位置：

- `Hero 标题` 输入框附近
- `Hero 描述` 文本域附近
- `首页一句话` 文本域附近
- `页脚链接` 每个分组名输入框附近
- `页脚链接` 每个链接名输入框附近

### 6. 前端触发方式

点击 `Hero` 或 `页脚链接` 的 `AI 翻译` 按钮后：

1. 收集当前分组内所有可翻译字段
2. 构造成 translation entry 批量输入
3. 调用后端批量生成 / 更新翻译
4. 成功后刷新当前分组翻译状态

成功提示：

- `已提交 Hero 英文翻译`
- `已提交 Hero 日文翻译`
- `已提交页脚链接英文翻译`

失败提示：

- 沿用现有 toast 体系
- 不增加复杂弹窗

### 7. 状态与结果关系

首版只要求：

- 能看见字段是否已有 EN / JA 翻译
- 能从轻管理页面提交生成 / 更新

首版不强求：

- 轻管理表单直接切换成英文视图
- 点击后即时预览翻译内容

也就是说，这一版的重点是“翻译任务与状态管理”，不是“双语站点配置编辑器”。

### 8. 前台回填预期

后续若希望前台首页在英文 / 日文下真正显示这些配置翻译，需要再补一层前台读取逻辑：

- 当前 locale 为 `en / ja`
- 聚合数据中的 theme 配置字段在返回时应用 translation entries

这一步不是本次 UI 的必需前置条件，但这次 key path 设计需要与未来前台回填兼容。

## 可能涉及的文件

### 前端

- [apps/web/src/routes/site/index.tsx](/Users/zhenghan/Documents/GitHub/Blog/apps/web/src/routes/site/index.tsx)
  - 增加 Hero / 页脚翻译按钮与状态查询
- [apps/web/src/routes/site/form-state.ts](/Users/zhenghan/Documents/GitHub/Blog/apps/web/src/routes/site/form-state.ts)
  - 构造可翻译字段清单与 key path
- [apps/web/src/routes/site/sections.tsx](/Users/zhenghan/Documents/GitHub/Blog/apps/web/src/routes/site/sections.tsx)
  - 可抽出字段旁状态徽标、小按钮等 UI
- 可能新增：
  - `apps/web/src/routes/site/site-translation.ts`
  - 用于封装 key path、状态合并、分组翻译动作

### 后端

更可能涉及：

- translation entry controller / service
- aggregate theme 读取链路
- snippet/theme 相关读取时应用翻译逻辑

但这部分实现应以后端仓库实际结构为准，不在本 spec 中强行规定具体文件。

## 风险与约束

### 风险 1：key path 使用 index，顺序变化会导致映射漂移

如果页脚链接顺序被重排，旧翻译可能不再对应正确字段。

应对：

- 首版允许这个约束
- 后续如需更稳定，可为 section/link 引入临时本地 id

### 风险 2：theme snippet 保存后，翻译状态可能变旧

用户改了原文后，旧翻译不该继续被视为“有效”。

应对：

- translation entry 应基于 source text/hash 校验新鲜度
- 更新原文后应自动变为待更新状态

### 风险 3：前端字段多、状态查询碎片化

如果每个字段单独查一次，可能让页面逻辑变得过重。

应对：

- 优先设计分组批量查询接口
- 至少保证 Hero 和 Footer 能按组查询，而不是每个 input 一次请求

## 验收标准

以下条件同时满足即可认为设计达成目标：

1. `Hero` 区块右上角有 `AI 翻译` 按钮。
2. `页脚链接` 区块右上角有 `AI 翻译` 按钮。
3. `Hero 标题 / Hero 描述 / 首页一句话` 能显示 EN / JA 翻译状态。
4. 页脚分组名与链接名称能显示 EN / JA 翻译状态。
5. 点击 `Hero` 或 `页脚链接` 的翻译按钮后，可以提交英文 / 日文翻译生成或更新。
6. `href` 不会被纳入翻译。
7. 首版不需要新增独立翻译管理页。

## 实现建议

实现阶段建议拆成两步：

1. 先打通后端 translation entry key path 和状态查询
2. 再把轻管理 UI 按分组接上按钮与状态

这样能避免前端先做完按钮，后端却还没有稳定状态模型。
