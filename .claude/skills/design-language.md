---
name: design-language
description: Use when designing or implementing UI components, pages, or visual changes in Shiroi. Triggers on layout decisions, color choices, animation design, typography, hover states, dark mode, or any visual/style work.
---

# 書写·信纸·光影 Design Language

Shiroi 整站以**个人书写**为隐喻。页面如一封展开的信纸，元素如手帐般散落，追求散文式自由感而非对称网格。

## Color System

| Layer | Light | Dark |
|-------|-------|------|
| Accent | 浅葱 `#33A6B8` | 桃 `#F596AA` |
| Root bg | `#fefefb` (`--color-root-bg`) | `rgb(28,28,30)` |
| Text | `neutral-1→10` 正序 | `neutral-1→10` 反转（`variables.css`） |
| Light spots | warm `rgba(255,228,180,0.35)` | cold `rgba(180,200,255,0.15)` |
| Decorative | accent at 6-15% opacity | same, lower opacity |
| Borders/dividers | `rgba(0,0,0,0.04~0.06)` | `neutral-700~800` |

- Dynamic accent via `--color-accent` CSS var (OKLCH available)
- Dark mode: follow existing tokens, no extra `dark:` for text (neutral-* auto-inverts)
- Cards: `dark:bg-white/5`

## Typography

| Element | Font | Size | Style | Color |
|---------|------|------|-------|-------|
| Section title | sans | `text-[9px]` | uppercase tracking-[4px] | neutral-4 |
| Main heading | serif | inherit | letter-spacing 5-6px | neutral-9~10 |
| Body/summary | sans | text-xs~sm | normal | neutral-5~7 |
| Marginal notes | serif | text-xs | italic | neutral-3~4 |
| Date/month | serif | text-[8-9px] | italic | neutral-3 |
| P.S./quotes | serif | text-xs | italic | neutral-4~5 |
| Hover links | — | — | — | → neutral-9 (not accent) |

Base font: 14px (`html { font-size: 14px }`).

## Animation Hierarchy

### 1. Mount entry (first visit only)
- `sessionStorage('hero-entered')` marks return visits
- Hero anchors the sequence; SecondScreen continues at ~0.95s delay
- Return visit: skip entry, show immediately

### 2. Scroll-driven (every visit)
- CSS Scroll-Driven Animations API (`animation-timeline: view()`)
- `@supports` feature detection; Safari fallback = show immediately
- Rhythm: slow → medium → fast (Hero parallax → SecondScreen unfold → Timeline stagger → Windsock snap)
- All CSS classes in `animation.css`

### 3. Idle breathing (desktop only)
- CSS keyframes, amplitude ±2-3px, period 12-18s
- No JS drivers

### Constraints
- `prefers-reduced-motion: reduce` → disable ALL animations
- Mobile: no 3D perspective (no rotateX), simplify to translateY + opacity
- Shared easing: `cubic-bezier(0.22, 1, 0.36, 1)`

## Layout

- **Desktop (lg+):** free positioning or flex multi-column, max-w `1400px`, horizontal padding `px-6 lg:px-12 xl:px-16 2xl:px-24`
- **Mobile (<lg):** linear vertical flow (flex-col), uniform spacing 24px, no fold/crease concepts
- Sections flow naturally without hard dividers; Hero light spots can overflow into SecondScreen
- Empty columns auto-hide; flex fills remaining space

## Interaction Patterns

| Context | Treatment |
|---------|-----------|
| Link/title hover | `color → neutral-9`, transition 0.3s |
| Nav active item | neutral-9 text + white float layer (bg-white/55 + shadow), NOT accent |
| Card hover | `box-shadow: 0 2px 12px rgba(0,0,0,0.04)` |
| Number animation | `NumberSmoothTransition` counting effect |
| Divider lines | gradient fade (both ends transparent, middle low-opacity) |
| Dropdown hover | `hover:bg-black/[0.02]` (not accent) |

## Component Rules

- Inline sub-components in parent file; **split only if >80 lines**
- Max 500 lines/file, React components <300 lines
- Edge case trinity: Loading → skeleton, Empty → hide section, Error → ErrorBoundary hide
- Use `clsx` / `clsxm` for class composition
- `'use client'` directive for client components

## Don'ts

- Never use accent color for active nav items or dropdown hovers
- Never use `rounded-full` for nav containers (pill shape removed)
- Never use glassmorphism (`backdrop-blur`) for dropdown popups
- Never hardcode colors that should use CSS variables
- Never add 3D perspective effects on mobile
