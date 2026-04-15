# Page Locale Translation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure localized page routes serve matching localized content, specifically `/academic` serving Chinese content and `/en/academic` serving English content for the same page slug.

**Architecture:** Keep the fix focused on the Page detail chain. Thread `locale` through the page detail data loader, metadata builder, and page renderer, then send an explicit `lang` query to the Page API because the live API already supports `lang=en` even though the current api-client types do not expose it. Preserve current default-locale behavior so Chinese remains the fallback on non-prefixed routes.

**Tech Stack:** Next.js App Router, `next-intl`, `@mx-space/api-client`, Vitest, curl smoke verification

---

### Task 1: Centralize locale-aware Page fetching

**Files:**
- Modify: `apps/web/src/app/[locale]/(page-detail)/[slug]/api.ts`
- Test: `apps/web/src/app/[locale]/(page-detail)/[slug]/api.test.ts`

- [ ] **Step 1: Add a small pure helper that resolves the request language**

Create a helper in `apps/web/src/app/[locale]/(page-detail)/[slug]/api.ts` that converts route locale into the API `lang` value.

Rules:
- `zh` route -> `lang` omitted or `zh`
- `en` route -> `lang: 'en'`
- `ja` route -> `lang: 'ja'`

- [ ] **Step 2: Change the Page data loader signature**

Update `getData` from:

```ts
getData(slug: string)
```

to:

```ts
getData({
  slug,
  locale,
}: {
  slug: string
  locale: string
})
```

and keep it `cache(...)` wrapped.

- [ ] **Step 3: Bypass the current api-client type gap and pass `lang` explicitly**

Replace the current `apiClient.page.getBySlug(slug, { prefer: 'lexical' })` call with a request path that can include both:

```ts
{
  prefer: 'lexical',
  lang: resolvedLang,
}
```

Implementation note:
- The live API already proves `GET /api/v2/pages/slug/academic?lang=en&prefer=lexical` returns English.
- The current `PageController` typing does not expose `lang`, so use a thin local wrapper around `apiClient.page.proxy.slug(slug).get(...)` or an equivalent typed escape hatch inside this file only.
- Do not widen the change into shared fetch infrastructure yet.

- [ ] **Step 4: Add a focused unit test for request parameter selection**

Create `apps/web/src/app/[locale]/(page-detail)/[slug]/api.test.ts` with tests that verify:
- English locale produces `lang=en`
- Chinese locale keeps default behavior
- Japanese locale produces `lang=ja`

Keep the test focused on the local helper or request-options builder so it does not need a full Next runtime.

- [ ] **Step 5: Run the focused test**

Run:

```bash
pnpm exec vitest run apps/web/src/app/[locale]/(page-detail)/[slug]/api.test.ts --config apps/web/vitest.config.ts
```

Expected:
- PASS for all locale mapping assertions

### Task 2: Thread locale through the Page route and metadata

**Files:**
- Modify: `apps/web/src/app/[locale]/(page-detail)/[slug]/layout.tsx`
- Modify: `apps/web/src/app/[locale]/(page-detail)/[slug]/page.tsx`

- [ ] **Step 1: Update page metadata fetching**

In `apps/web/src/app/[locale]/(page-detail)/[slug]/layout.tsx`, update `generateMetadata` so it passes both:

```ts
{
  slug,
  locale: params.locale,
}
```

into `getData(...)`.

- [ ] **Step 2: Update the prerender fetcher**

In the same file, change the `definePrerenderPage` fetcher from:

```ts
return getData(params.slug)
```

to:

```ts
return getData({
  slug: params.slug,
  locale: params.locale,
})
```

- [ ] **Step 3: Update the page component fetch**

In `apps/web/src/app/[locale]/(page-detail)/[slug]/page.tsx`, update the direct `getData(...)` call to also pass route locale so the rendered page body, title, subtitle, and content all come from the same localized payload.

- [ ] **Step 4: Confirm no behavior regression for the default route**

Check that `/academic` still resolves through the default locale path and continues rendering the Chinese version.

### Task 3: Verify the localized route behavior end-to-end

**Files:**
- No code changes required if previous tasks pass

- [ ] **Step 1: Run a direct local/preview smoke check**

Use curl against the deployed site or local dev server and verify:

```bash
curl -L -s https://418122.xyz/academic | rg "关于我"
curl -L -s https://418122.xyz/en/academic | rg "About Me"
```

Expected:
- Chinese route contains Chinese heading/body text
- English route contains English heading/body text

- [ ] **Step 2: Verify metadata directionally matches content**

Confirm `/en/academic` no longer builds metadata from the Chinese body summary.

- [ ] **Step 3: Run a targeted app build check if code was changed**

Run:

```bash
pnpm --filter @shiro/web build
```

Expected:
- Build succeeds without Page route type errors

### Task 4: Optional follow-up if page titles also need localization

**Files:**
- Modify: `apps/web/src/queries/definition/navigation.ts`
- Modify: `apps/web/src/app/[locale]/(page-detail)/[slug]/pageExtra.tsx`
- Modify: `apps/web/src/components/layout/header/internal/HeaderDataConfigureProvider.tsx`

- [ ] **Step 1: Decide whether page navigation labels must also localize**

Today `academic` title is `Academic` in all tested responses, so this is not required to satisfy the current acceptance criteria.

- [ ] **Step 2: If titles diverge by locale later, thread locale into page list queries**

Update page list/navigation queries to pass the same explicit `lang` query so header menus and page paginator labels stay aligned with localized page content.

- [ ] **Step 3: Keep this follow-up out of the first fix unless acceptance requires it**

This prevents the initial change from expanding beyond the concrete `/academic` and `/en/academic` requirement.
