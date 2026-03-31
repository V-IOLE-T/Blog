---
name: applying-shiro-design-language
description: Use when designing or implementing UI components, pages, visual restyles, animations, or interaction changes in Shiroi, especially when choosing surfaces, typography, motion, hover states, dark mode, or decorative metaphors.
---

# Applying Shiro Design Language

## Overview

Shiroi 的设计语言不是通用 SaaS UI，而是统一的「書写·信纸·光影」系统。

当前代码是第一真相，`docs/superpowers/specs` 只是历史设计意图的候选来源。若 spec 与实现冲突，以实现为准，再回头判断 spec 是否仍值得保留。

核心隐喻：

| 维度 | 规则 |
| --- | --- |
| 世界观 | 页面像展开的信纸，组件像附在纸上的批注、夹片、胶带、邮戳、折页 |
| 视觉气质 | 克制、轻、安静，有留白，不做强数字感或强科技感 |
| 色彩角色 | `accent` 是点题色、批注色、强调线，不是大面积主底色 |
| 交互隐喻 | 像纸张、墨水、书页、折痕，不像橡胶、玻璃、果冻 |
| 布局态度 | 优先自然排布和阅读节奏，再考虑组件感和功能感 |

先读这份 skill 再画界面。需要看当前代码里的稳定样式时，先读 [references/current-design-map.md](references/current-design-map.md)。只有在需要追溯设计意图时，才读 [references/spec-map.md](references/spec-map.md)。

## When to Use

- 新做页面、区块、卡片、弹层、导航、列表。
- 重设计现有 UI，只改视觉语言，不改数据和交互骨架。
- 不确定该用 serif、accent、hover、阴影、动效、装饰隐喻时。
- 做 design review，判断某个方案是否“像 Shiroi”。

不要在这些场景使用：

- 纯业务逻辑、数据流、接口设计。
- 只需遵守现成第三方组件外观，且项目视觉不参与决策。
- 管理后台式高密度工具界面。

## Decision Flow

```text
Need a new UI or restyle?
        |
        v
What is the surface?
page / embedded card / floating layer / inline status
        |
        v
What reading role does it play?
title / label / body / marginal note / metadata
        |
        v
What physical metaphor fits?
paper / fold / note / clip / tape / stamp
        |
        v
Apply motion + hover rules
paper-like, ink-pressure, no glass, no bounce-scale
        |
        v
Check dark mode + mobile simplification
```

## Core System

### 1. Surface

| Surface type | Use | Rule |
| --- | --- | --- |
| Page / content card | 列表卡、文章附注、内容容器 | 轻底色、极细边框、轻阴影、保留呼吸感 |
| Floating layer | modal、popover、dropdown、panel | 统一 letter-card：`bg-[#fefefb]` / `dark:bg-neutral-2`，`border-black/5`，`rounded-xl`，软阴影 |
| Inline status | meta、error inline、辅助提示 | 低对比底色，弱存在感，不抢正文 |
| Active nav | 当前项 | 用中性色加深 + 浅色浮层，不用 accent 实底 |

硬规则：

- 禁止 glassmorphism：不要 `backdrop-blur`、半透明毛玻璃、重投影。
- 浮层统一用不透明纸卡，而不是漂浮玻璃。
- 常用圆角是 `rounded-xl` 或极小方角；不要默认 `rounded-full`。
- 阴影要轻：像纸离桌面 1-2mm，不像悬浮窗砸下来。

### 2. Color

| 角色 | 规则 |
| --- | --- |
| `--color-accent` | 用于强调线、标签、边界、轻背景、hover 点亮、统计数字 |
| 中性色 | 主体文字和层级依赖 `text-neutral-*`，让 light/dark 自动翻转 |
| 暖光色 | 用于光斑、纸感渐变、AI 摘要等氛围层 |
| 装饰色 | 可从 topic/title hash 生成 hue，但饱和度和明度必须被约束 |

硬规则：

- 不要把 accent 当导航激活项主色块。
- 不要随手写死孤立颜色，优先复用 token 和 CSS 变量。
- dark mode 保持同一层级关系，只降低透明度和高光强度，不重做另一套语义。

### 3. Typography

| Tier | Rule | Typical use |
| --- | --- | --- |
| Section label | `text-[9px]` 左右，uppercase，tracking `3-4px`，`text-neutral-4/6` | BLOG、LINKS、section header、modal label |
| Display title | serif 或继承站点 serif，字距舒展 | Hero、月标题、页头标题、强调标题 |
| Body / summary | sans，`text-xs` 到 `text-sm`，较松行高 | 摘要、正文外围、列表说明 |
| Marginal note | serif italic，小号，浅色 | 日期、注脚、P.S.、边注 |
| Metadata | 更小、更淡、常配 `·` 分隔 | 时间、分类、阅读、点赞、页码 |

硬规则：

- 标题层和正文层要明确分离，不要全部一个字重。
- 小标题更像编辑标签，不像按钮。
- 纯元信息优先用文字和分隔符，少用图标。

### 4. Motion

| Layer | Rule |
| --- | --- |
| Hero / 首屏进入 | 允许更有叙事性的入场，但只在首次访问 |
| Below-fold scroll | 用 scroll-driven 或视口驱动，随滚动展开，不用突兀 trigger-once |
| Floating UI | 定向 `scaleX/scaleY` 展开，像纸页从边缘长出来 |
| Buttons / hover | ink-pressure：颜色加深、边框加深、`translateY(1px)`，不要 scale 弹跳 |

硬规则：

- 统一 easing：`cubic-bezier(0.22, 1, 0.36, 1)`。
- 动效优先表达纸张展开、书页翻开、墨迹加深。
- 避免弹簧、橡胶、果冻、夸张 overshoot。
- `prefers-reduced-motion` 必须能直接退化为静态。
- 移动端去掉 3D 透视类效果，简化为 opacity + translate。

### 5. Interaction

| Pattern | Rule |
| --- | --- |
| Link / title hover | 常用 `neutral-9` 或 accent 轻点亮，配 200-300ms 过渡 |
| Card hover | 轻微浮起，背景更白一点，阴影略增强 |
| Button active | 像笔压纸，往下 1px，不放大 |
| Row highlight | 可用左侧 accent 线或极淡渐变，不整块高亮 |

硬规则：

- hover 是“提气”，不是“发光”。
- 交互反馈优先 opacity、border、background、shadow 微调。
- 浮层和菜单的方向感要来自 placement，不要统一向下平移。

## Decorative Metaphors

装饰只能在内容语义支持时使用。

| Metaphor | When it fits | Rule |
| --- | --- | --- |
| Letter card | modal、popover、notice card、内容卡 | 无玻璃，轻边框，软阴影，像纸片 |
| Fold / crease | 第二屏、展开式区块 | 用折痕和 unfold 表达结构，而不是强分割线 |
| Washi tape | note 场景、便笺式 CTA、手帐化内容 | 半透明、轻旋转、带纹理和撕边 |
| Binder clip | topic / series 归属关系 | 贴在纸角上，像真实夹片，不做多余装饰 |
| Postage / stamp | note 结尾、信件语境 | 仅作弱装饰，移动端可隐藏 |
| Seasonal page | timeline / archive | 用时间纵深、透明度梯度、细分隔线，而不是传统时间轴圆点 |

如果一个装饰没有强化“阅读隐喻”或信息结构，就不要加。

## Common Recipes

### Floating surfaces

- 用统一纸卡 token。
- 去掉 blur、重投影、厚 overlay。
- modal / popover / dropdown / panel 保持同一家族。

### Navigation

- 桌面导航是“书页浮片”，不是药丸。
- 当前项用浅白浮层和深色文字，不用 accent 填满。
- 子菜单是实底纸卡。

### Lists and timelines

- 强调阅读节奏、时间层次、留白。
- 用细竖线、淡渐变、字重变化代替传统组件感。
- 时间和元信息更轻，标题更稳。

### Notice and meta blocks

- 可合并成单一淡卡，减少碎片。
- 分隔线用极淡 hairline。
- AI/状态类内容可有暖色渐变或光斑，但透明度要低。

## Review Checklist

用这张表快速否决不符合风格的方案：

| Check | Pass condition |
| --- | --- |
| Surface | 看起来像纸，不像玻璃或系统弹窗 |
| Hierarchy | label / title / body / meta 四层清楚 |
| Accent | 是强调，不是大面积主底 |
| Motion | 是展开、呼吸、压墨，不是缩放弹跳 |
| Hover | 轻，不刺眼，不突然 |
| Decoration | 有语义理由，且移动端可简化 |
| Dark mode | 只是同一体系的夜间版，不是另一套视觉 |
| Mobile | 结构更线性、更直接，去掉复杂空间隐喻 |

## Don’ts

- 不要玻璃拟态。
- 不要重阴影、重遮罩、重对比边框。
- 不要把导航、菜单、按钮默认做成 `rounded-full`。
- 不要把 active 态全交给 accent 实底。
- 不要把所有信息都塞进图标。
- 不要为了“高级感”加无意义噪点、纹理、炫光。
- 不要在移动端保留复杂 3D 或大面积装饰件。

## References

- 需要按当前实现查规则时，优先读 [references/current-design-map.md](references/current-design-map.md)。
- 需要确认哪些 spec 已经漂移时，读 [references/spec-map.md](references/spec-map.md)。
- 需要首页动效节奏时，优先看 Hero / SecondScreen / Timeline / scroll-driven animation 相关 spec。
- 需要浮层和按钮规则时，优先看 modal / float-popover / dropdown / button 相关 spec。
