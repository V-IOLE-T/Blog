# Shiro Design Spec Status Map

## Summary

这份索引记录 `docs/superpowers/specs` 与当前实现的关系。不要把这里的 spec 默认当成现状；先看 [current-design-map.md](current-design-map.md)。

状态含义：

| Status | Meaning |
| --- | --- |
| `aligned` | 当前代码基本符合 spec，可继续引用 |
| `partial` | 核心方向还在，但 token/布局/组件组织已经变化 |
| `historical` | spec 主要反映历史方案，不应直接当成当前设计依据 |
| `not-audited` | 这次没有核对实现 |

## Audit Table

| Spec | Status | Current source of truth | Notes |
| --- | --- | --- | --- |
| `2026-03-13-errorboundary-redesign.md` | `aligned` | `apps/web/src/components/common/ErrorBoundary.tsx` | block/inline 方案已落地，token 细节有轻微中性色替换 |
| `2026-03-14-note-letter-bottom-design.md` | `aligned` | `apps/web/src/components/modules/note/NoteLatestRender.tsx` | 胶带、手写链接、邮戳基本一致 |
| `2026-03-14-note-topic-binder-clip-design.md` | `aligned` | `apps/web/src/components/modules/note/NoteTopicBinderClip.tsx` | 夹片隐喻和 topic hue 仍成立 |
| `2026-03-14-notes-list-page-design.md` | `historical` | `apps/web/src/components/modules/note/NoteListTimeline.tsx`, `apps/web/src/components/modules/note/NoteListCard.tsx` | 当前实现是年分组 + 印章式时间轴，不是 spec 里的月分组 diary timeline |
| `2026-03-14-notes-list-hero-latest-design.md` | `aligned` | `apps/web/src/components/modules/note/NoteLatestRender.tsx` | 最新 note 强化展示已落地 |
| `2026-03-14-timeline-list-redesign.md` | `partial` | `apps/web/src/components/ui/list/TimelineList.tsx`, `apps/web/src/components/ui/list/TimelineListItem.tsx` | 方向仍可参考，但细节需回看当前代码 |
| `2026-03-15-hero-redesign-design.md` | `historical` | `apps/web/src/app/[locale]/(home)/components/Hero.tsx` | 当前 Hero 更收敛，非 spec 中的散文式自由布局终稿 |
| `2026-03-15-second-screen-redesign-design.md` | `partial` | `apps/web/src/app/[locale]/(home)/components/SecondScreen.tsx` | 折页隐喻保留，但结构与实现边界已变化 |
| `2026-03-15-timeline-redesign-design.md` | `aligned` | `apps/web/src/app/[locale]/(home)/components/HomePageTimeLine.tsx` | 季节书页、分栏、纵深仍是当前主线 |
| `2026-03-15-scroll-driven-animation-design.md` | `partial` | `apps/web/src/styles/animation.css`, home components | 节奏可参考，但要以实际类名和组件 wiring 为准 |
| `2026-03-15-header-redesign-design.md` | `partial` | `apps/web/src/components/layout/header/internal/HeaderContent.tsx` | active 浮层成立，但 blur 没有被完全移除 |
| `2026-03-15-mobile-header-redesign-design.md` | `partial` | `apps/web/src/components/layout/header/internal/HeaderDrawerContent.tsx` | 融合浮片思路还在，具体 token 已演化 |
| `2026-03-16-button-redesign-design.md` | `aligned` | `apps/web/src/components/ui/button/*` | ink-pressure 已落地 |
| `2026-03-16-dropdown-menu-redesign-design.md` | `aligned` | `apps/web/src/components/ui/dropdown-menu/*` | 当前实现基本就是 spec 版本 |
| `2026-03-16-float-popover-panel-redesign-design.md` | `aligned` | `apps/web/src/components/ui/float-popover/FloatPopover.tsx`, `apps/web/src/components/ui/float-panel/FloatPanel.tsx` | 纸卡 surface + 定向展开已落地 |
| `2026-03-16-modal-redesign-design.md` | `aligned` | `apps/web/src/components/ui/modal/stacked/modal.tsx` | letter-card 结构和 surface 已落地 |
| `2026-03-16-footer-redesign-design.md` | `historical` | `apps/web/src/components/layout/footer/Footer.tsx`, `apps/web/src/components/layout/footer/FooterInfo.tsx` | 当前 footer 的背景、字号、controls 排布已偏离原 spec |
| `2026-03-17-posts-page-redesign-design.md` | `historical` | `apps/web/src/components/modules/post/PostFeaturedCard.tsx`, `apps/web/src/components/modules/post/PostListItem.tsx`, `apps/web/src/components/modules/post/PostListActions.tsx` | 当前 posts 列表未走 spec 里的“纯文字 meta 极简版”终态 |
| `2026-03-17-post-detail-redesign-design.md` | `partial` | `apps/web/src/components/modules/shared/NoticeCard.tsx`, `apps/web/src/components/modules/post/PostMetaBar.tsx` | NoticeCard 已落地，但 detail 周边不是完全按 spec 收敛 |
| `2026-03-14-terminology-i18n-design.md` | `not-audited` | notes pages + messages | 这次未核对 |
| `2026-03-15-comment-config-guard-design.md` | `not-audited` | comments-related UI | 这次未核对 |

## Style Spine

| Theme | Key rules | Source specs |
| --- | --- | --- |
| 总体设计语言 | 書写·信纸·光影；页面像信纸；组件像附着其上的书写物 | `2026-03-15-hero-redesign-design.md`, `2026-03-15-second-screen-redesign-design.md`, `2026-03-15-timeline-redesign-design.md`, `2026-03-17-posts-page-redesign-design.md`, `2026-03-17-post-detail-redesign-design.md` |
| 反玻璃拟态 | 去 blur、去半透明玻璃、去重阴影，统一 paper surface | `2026-03-16-modal-redesign-design.md`, `2026-03-16-float-popover-panel-redesign-design.md`, `2026-03-16-dropdown-menu-redesign-design.md`, `2026-03-16-button-redesign-design.md`, `2026-03-15-header-redesign-design.md` |
| 轻编辑感排版 | 小号 uppercase label，serif 标题，italic 边注，meta 纯文字 | `2026-03-15-hero-redesign-design.md`, `2026-03-15-second-screen-redesign-design.md`, `2026-03-15-timeline-redesign-design.md`, `2026-03-16-footer-redesign-design.md`, `2026-03-17-post-detail-redesign-design.md` |
| Accent 用法 | 用于强调线、标签、统计、渐变，不做导航实底主色 | `2026-03-15-header-redesign-design.md`, `2026-03-15-timeline-redesign-design.md`, `2026-03-16-button-redesign-design.md`, `2026-03-17-posts-page-redesign-design.md` |

## Surface Tokens

| Context | Token pattern | Source specs |
| --- | --- | --- |
| Floating surface family | `bg-[#fefefb]` / `dark:bg-neutral-2` + `border-black/5` + `rounded-xl` + 软阴影 | `2026-03-16-modal-redesign-design.md`, `2026-03-16-float-popover-panel-redesign-design.md`, `2026-03-16-dropdown-menu-redesign-design.md` |
| Embedded notice/card | `bg-white/40 border border-black/[0.03] dark:bg-white/5 dark:border-white/5` | `2026-03-17-post-detail-redesign-design.md`, `2026-03-17-posts-page-redesign-design.md` |
| Header floating slab | 方角微圆、极细边框、无毛玻璃、内浮层 active | `2026-03-15-header-redesign-design.md`, `2026-03-15-mobile-header-redesign-design.md` |
| Paper-like content cards | 白底/淡底、轻阴影、留白、弱边界 | `2026-03-14-notes-list-page-design.md`, `2026-03-17-posts-page-redesign-design.md`, `2026-03-15-second-screen-redesign-design.md` |

## Motion Patterns

| Pattern | Key rules | Source specs |
| --- | --- | --- |
| Hero 首次入场 | mount entry，仅首访；标题 gradient sweep；后续呼吸浮动 | `2026-03-15-hero-redesign-design.md` |
| Scroll-driven 节奏 | Hero 慢退出 → SecondScreen 长 unfold → Timeline 中速 stagger → Windsock 快收束 | `2026-03-15-scroll-driven-animation-design.md` |
| Fold / unfold | 第二屏折页信纸；下半页 rotateX 展开；移动端退化 | `2026-03-15-second-screen-redesign-design.md` |
| Direction-aware expand | popover / panel / dropdown / modal 按 placement 方向 scaleX/scaleY | `2026-03-16-float-popover-panel-redesign-design.md`, `2026-03-16-dropdown-menu-redesign-design.md`, `2026-03-16-modal-redesign-design.md` |
| Ink-pressure interaction | button 用颜色/边框/位移，不用 scale | `2026-03-16-button-redesign-design.md` |

## Typography And Information Hierarchy

| Layer | Key rules | Source specs |
| --- | --- | --- |
| Section labels | `text-[9px]`、uppercase、tracking `3-4px`、neutral 浅色 | `2026-03-15-hero-redesign-design.md`, `2026-03-15-second-screen-redesign-design.md`, `2026-03-15-timeline-redesign-design.md`, `2026-03-16-footer-redesign-design.md`, `2026-03-16-modal-redesign-design.md` |
| Serif display | 标题、月份、品牌名、部分强调标题使用 serif | `2026-03-14-notes-list-page-design.md`, `2026-03-15-hero-redesign-design.md`, `2026-03-15-timeline-redesign-design.md`, `2026-03-16-footer-redesign-design.md` |
| Marginal notes | 日期、P.S.、引用、统计使用小号 italic | `2026-03-15-hero-redesign-design.md`, `2026-03-15-second-screen-redesign-design.md`, `2026-03-15-timeline-redesign-design.md` |
| Pure text meta | 用 `·` 分隔，减少图标依赖 | `2026-03-17-post-detail-redesign-design.md`, `2026-03-17-posts-page-redesign-design.md`, `2026-03-16-footer-redesign-design.md` |

## Decorative Motifs

| Motif | Key rules | Source specs |
| --- | --- | --- |
| Light spots / glow | 1-2 个低透明 radial-gradient 光斑，烘托氛围，不做噪点 | `2026-03-15-hero-redesign-design.md`, `2026-03-17-post-detail-redesign-design.md` |
| Fold crease | 用于第二屏中线和展开阴影 | `2026-03-15-second-screen-redesign-design.md` |
| Seasonal page | 第三屏按春夏秋冬分栏，远近透明度递减 | `2026-03-15-timeline-redesign-design.md` |
| Washi tape / stamp | 便笺式 CTA、手帐结尾、右下角邮戳与胶带碎片 | `2026-03-14-note-letter-bottom-design.md` |
| Binder clip | topic 归属用纸角夹片表现 | `2026-03-14-note-topic-binder-clip-design.md` |

## Page And Component Patterns

| Area | Key rules | Source specs |
| --- | --- | --- |
| Hero | 散文式自由布局，非严格二栏，光影背景 + 书写感标题 | `2026-03-15-hero-redesign-design.md` |
| Second screen | 折页信纸，上半近期笔墨，下半灵活三栏 | `2026-03-15-second-screen-redesign-design.md` |
| Timeline home | 横卷季节书页，细分隔线，时间纵深 | `2026-03-15-timeline-redesign-design.md` |
| Timeline/list pages | 细线时间轴、极简 hover accent、弱化圆点 | `2026-03-14-timeline-list-redesign.md` |
| Header | 桌面书页浮片，移动端融合浮片，从 header 下方展开 | `2026-03-15-header-redesign-design.md`, `2026-03-15-mobile-header-redesign-design.md` |
| Footer | 不用硬分隔线，改渐变过渡；不对称品牌区 + 链接区 | `2026-03-16-footer-redesign-design.md` |
| Posts list | Featured card + 紧凑列表，hover 像纸轻抬 | `2026-03-17-posts-page-redesign-design.md` |
| Post detail | NoticeCard 合并状态区；meta 纯文字；related 淡卡 | `2026-03-17-post-detail-redesign-design.md` |
| Notes list/detail | Paper-like diary list；latest note 便笺式 CTA；topic clip | `2026-03-14-notes-list-page-design.md`, `2026-03-14-notes-list-hero-latest-design.md`, `2026-03-14-note-letter-bottom-design.md`, `2026-03-14-note-topic-binder-clip-design.md` |
| Error/empty inline UI | 弱背景、圆角、轻量图标，不喧宾夺主 | `2026-03-13-errorboundary-redesign.md` |

## Stable Rules To Reuse

| Rule | Notes |
| --- | --- |
| Shared easing | `cubic-bezier(0.22, 1, 0.36, 1)` |
| Shared floating radius | `rounded-xl` |
| Floating shadow family | light `0 2px 12px rgba(0,0,0,0.04)` + 0.5px ring; dark stronger shadow + light ring |
| Shared mobile fallback | 去 3D、去复杂装饰、改线性流 |
| Shared dark strategy | 同一 token 体系自动翻转，装饰透明度降低 |

## Non-Design Specs In This Folder

这些 spec 主要是业务或 copy 规则，不是 design skill 的核心来源，但实现时可能相关：

| Spec | Why it matters |
| --- | --- |
| `2026-03-14-terminology-i18n-design.md` | 统一 UI copy 与术语 |
| `2026-03-15-comment-config-guard-design.md` | 评论配置守卫的状态逻辑与 UI 文案 |
