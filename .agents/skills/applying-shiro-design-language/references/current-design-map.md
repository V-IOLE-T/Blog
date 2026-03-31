# Current Shiro Design Map

## Source Of Truth

以当前代码实现为准。只有当实现缺失、明显回退、或正在重构时，才回看 `docs/superpowers/specs`。

## Audited Areas

| Area | Current source files | Current design signal |
| --- | --- | --- |
| Hero | `apps/web/src/app/[locale]/(home)/components/Hero.tsx` | 现在是较克制的双区布局，不是完全自由散点；保留光斑、渐进动画、serif/neutral 层级 |
| Second screen | `apps/web/src/app/[locale]/(home)/components/SecondScreen.tsx` | 保留折页和 crease 隐喻，但结构已拆成多个子文件，设计重点是 unfold 节奏而不是 spec 中的组件组织方式 |
| Home timeline | `apps/web/src/app/[locale]/(home)/components/HomePageTimeLine.tsx` | 季节书页和时间纵深仍成立；当前实现更偏简洁分栏，底部统计和 divider 已落地 |
| Desktop header | `apps/web/src/components/layout/header/internal/HeaderContent.tsx` | 当前是“浮片导航 + 内浮层 active”，但非完全去 blur；滚动态仍保留半透明 + backdrop blur |
| Mobile header | `apps/web/src/components/layout/header/internal/HeaderDrawerContent.tsx` | 仍是融合浮片思路，标签和内联展开成立；以当前 chip/block 样式为准 |
| Footer | `apps/web/src/components/layout/footer/Footer.tsx`, `apps/web/src/components/layout/footer/FooterInfo.tsx` | 当前 footer 是 accent 混根背景 + 不对称信息区；字号和 spacing 已明显偏离原 spec 的精确 token |
| Buttons | `apps/web/src/components/ui/button/StyledButton.tsx`, `apps/web/src/components/ui/button/RoundedIconButton.tsx`, `apps/web/src/components/ui/button/MotionButton.tsx` | ink-pressure 已成立；无 scale；primary/secondary/ghost 是稳定现状 |
| Floating UI | `apps/web/src/components/ui/float-popover/FloatPopover.tsx`, `apps/web/src/components/ui/dropdown-menu/index.tsx`, `apps/web/src/components/ui/modal/stacked/modal.tsx` | 纸卡 surface + 方向感展开 + 轻阴影 是稳定族谱 |
| Post list | `apps/web/src/components/modules/post/PostFeaturedCard.tsx`, `apps/web/src/components/modules/post/PostListItem.tsx`, `apps/web/src/components/modules/post/PostListActions.tsx` | 当前列表仍混用图标 meta 和 accent 分类/tag；不是 spec 里那种完全纯文字极简版 |
| Post detail | `apps/web/src/components/modules/post/PostMetaBar.tsx`, `apps/web/src/components/modules/shared/NoticeCard.tsx` | NoticeCard 方向成立；PostMetaBar 以当前“纯文字为主但保留交互按钮”的实现为准 |
| Notes latest/detail | `apps/web/src/components/modules/note/NoteLatestRender.tsx`, `apps/web/src/components/modules/note/NoteTopicBinderClip.tsx` | 手帐 CTA、邮戳、binder clip 基本已落地，可继续复用 |
| Notes list | `apps/web/src/components/modules/note/NoteListTimeline.tsx`, `apps/web/src/components/modules/note/NoteListCard.tsx` | 当前更像“年份印章 + 卡片时间轴”，不是 spec 里的月分组 diary timeline |
| Error states | `apps/web/src/components/common/ErrorBoundary.tsx` | block/inline 双态已经稳定，可作为弱打扰错误 UI 参考 |

## Stable Cross-Cutting Rules

| Rule | Current signal in code |
| --- | --- |
| Accent is support color | header active 不用 accent 实底；button/post tag/links 才用 accent 点亮 |
| Floating surfaces share tokens | `bg-[#fefefb]`, `dark:bg-neutral-2`, `border-black/5`, `rounded-xl`, 软阴影 |
| Motion uses paper metaphors | modal/dropdown/popover 定向展开；button active `translate-y-px` |
| Mobile simplifies space | 复杂折页、装饰、3D 都会降级或隐藏 |
| Meta text stays light | `text-xs` / `text-[11px]` / `text-neutral-3~6` 是主区间 |

## Use This File

```text
Need Shiro visual guidance?
        |
        v
Check current-design-map.md
        |
        v
Open the actual component file
        |
        v
Only if intent is unclear, read the matching spec
```
