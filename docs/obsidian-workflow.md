# Obsidian 工作流骨架说明

## 🎯 目录结构与职责
* `notes/posts/`：承载实际文章稿件，所有新内容都应通过 Obsidian 快速捕获后落在这个目录中，主流程会从这里读取 Markdown。
* `notes/assets/`：存放引用在文章中的本地图片或资源，模板里的 `![[图片.png]]` 就是在这个目录下寻找媒体。
* `.obsidian/templates/Post Template.md`：提供统一的前置字段（title/categories/tags/id/date/updated/cover/draft）和示意的图片引用语法，保证主流程可以稳定解析新稿件。
* `pnpm publish:note -- <笔记路径>`：命令行发布入口。脚本会补全 frontmatter、处理 `![[图片]]`、复制静态资源，并推送到 GitHub。
* `QuickAdd -> 发表博客`：Obsidian 内部发布入口。它会读取当前活动笔记，并调用同一套发布脚本。

## 📝 模板解读
模板的 YAML frontmatter 包含业务流程要求的几个字段：
- `title`、`categories`、`tags`：用于内容分类；模板默认会写成 `categories: 未分类` 和 `tags: []`，避免 QuickAdd 在未提供变量时生成非法 YAML。
- `id`：可留空，发布脚本会按标题生成稳定值并写回源笔记。
- `date` / `updated`：都可以留空，首次发布和后续更新时会自动补全。
- `cover`：支持写成 `![[图片.png]]`，发布后会被转换成站内静态资源路径。
- `draft`：用于标记文稿是否仍在草稿状态。发布前请改成 `false` 或删除该字段。

模板正文部分以 `![[图片.png]]` 的形式提示如何嵌入图片，实际使用时把对应资源放进 `notes/assets/` 并替换文件名。

## ⚡ QuickAdd 集成建议
1. 在 Obsidian 中为新文章创建一个 QuickAdd 动作，类型选「模板」，目标模板选择本项目的 `Post Template.md`。
2. 设置输出目录为项目里的 `notes/posts/`，并让 QuickAdd 自动填充文件名（例如 `posts/{{DATE:YYYY-MM-DD}}-{{title}}.md`）。
3. 在触发这个动作时，至少填入标题即可；分类和标签可以先保留模板默认值，后续按需手改。正文里的图片文件先存入 `notes/assets/`。
4. 直接使用仓库里已经配置好的 QuickAdd Macro `发表博客`，并绑定到你习惯的快捷键。它会自动读取当前活动文件并执行发布。

QuickAdd 完成后，新的 Markdown 就在 `notes/posts/`，其余工作交给现有的非核心脚本 / 发布流程处理，确保该目录和 `notes/assets/` 里的内容同步到版本控制和部署。
