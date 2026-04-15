import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useMemo, useRef, useState } from 'react'

import { useIsOwnerLogged } from '~/atoms/hooks/owner'
import { PageLoading } from '~/components/layout/dashboard/PageLoading'
import { defineRouteConfig } from '~/components/modules/dashboard/utils/helper'
import { StyledButton } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Input, TextArea } from '~/components/ui/input'
import { apiClient } from '~/lib/request'
import { getErrorMessageFromRequestError } from '~/lib/request.shared'
import { toast } from '~/lib/toast'
import { aggregation } from '~/queries/definition/aggregation'

import {
  buildSiteSettingsMutationPayloads,
  createSiteSettingsFormState,
  type SiteSettingsFormState,
} from './form-state'
import {
  FieldLabel,
  FooterLinksEditor,
  SectionCard,
  SocialLinksEditor,
  TranslationStatusBadges,
} from './sections'
import {
  buildFooterTranslationFields,
  buildHeroTranslationFields,
  buildSiteTranslationStatusMap,
  getGroupHasTranslation,
  getSiteTranslationActionLabel,
  groupSiteTranslationFieldsByKeyPath,
  normalizeSiteTranslationEntries,
  type SiteTranslationField,
  type SiteTranslationLang,
  type SiteTranslationStatusMap,
} from './site-translation'
import {
  fetchThemeSnippetRecord,
  THEME_SNIPPET_NAME,
  THEME_SNIPPET_REFERENCE,
} from './theme-snippet'

const themeSnippetQueryOptions = {
  queryKey: ['theme-snippet', THEME_SNIPPET_REFERENCE, THEME_SNIPPET_NAME],
  queryFn: () => fetchThemeSnippetRecord(apiClient),
}

const SITE_TRANSLATION_LANGS: SiteTranslationLang[] = ['en', 'ja']

const EMPTY_SITE_SETTINGS_FORM_STATE: SiteSettingsFormState = {
  heroDescription: '',
  heroQuote: '',
  heroTitle: '',
  linkSections: [],
  seoDescription: '',
  seoTitle: '',
  socialLinks: [],
}

export const Component = () => {
  const queryClient = useQueryClient()
  const isOwnerLogged = useIsOwnerLogged()
  const aggregationQuery = useQuery(aggregation.root())
  const snippetQuery = useQuery(themeSnippetQueryOptions)
  const [draftForm, setDraftForm] = useState<SiteSettingsFormState>()
  const [isSaving, setIsSaving] = useState(false)
  const [translatingGroup, setTranslatingGroup] = useState<{
    group: 'footer' | 'hero'
    lang: SiteTranslationLang
  } | null>(null)
  const seoDescriptionRef = useRef<HTMLTextAreaElement | null>(null)
  const heroDescriptionRef = useRef<HTMLTextAreaElement | null>(null)
  const heroQuoteRef = useRef<HTMLTextAreaElement | null>(null)

  const initialState = useMemo(() => {
    if (!aggregationQuery.data) return null
    return createSiteSettingsFormState(
      aggregationQuery.data,
      aggregationQuery.data.theme,
    )
  }, [aggregationQuery.data])
  const form = draftForm ?? initialState
  const safeForm = form ?? EMPTY_SITE_SETTINGS_FORM_STATE

  const heroFields = useMemo(
    () =>
      buildHeroTranslationFields({
        heroDescription: safeForm.heroDescription,
        heroQuote: safeForm.heroQuote,
        heroTitle: safeForm.heroTitle,
      }),
    [safeForm.heroDescription, safeForm.heroQuote, safeForm.heroTitle],
  )
  const footerFields = useMemo(
    () => buildFooterTranslationFields(safeForm.linkSections),
    [safeForm.linkSections],
  )

  const heroLookupGroups = useMemo(
    () => groupSiteTranslationFieldsByKeyPath(heroFields),
    [heroFields],
  )
  const footerLookupGroups = useMemo(
    () => groupSiteTranslationFieldsByKeyPath(footerFields),
    [footerFields],
  )

  const heroTranslationQueries = useQueries({
    queries: isOwnerLogged
      ? heroLookupGroups.flatMap((group) =>
          SITE_TRANSLATION_LANGS.map((lang) => ({
            enabled: !!form && group.lookupKeys.length > 0,
            queryKey: [
              'site-translation-lookup',
              'hero',
              group.keyPath,
              lang,
              group.lookupKeys.join('|'),
            ],
            queryFn: async () => {
              const response = await apiClient
                .proxy('ai/translations/entries/lookup')
                .post({
                  data: {
                    keyPath: group.keyPath,
                    lang,
                    lookupKeys: group.lookupKeys,
                  },
                })

              return normalizeSiteTranslationEntries((response as any).data)
            },
            staleTime: 60 * 1000,
          })),
        )
      : [],
  })

  const footerTranslationQueries = useQueries({
    queries: isOwnerLogged
      ? footerLookupGroups.flatMap((group) =>
          SITE_TRANSLATION_LANGS.map((lang) => ({
            enabled: !!form && group.lookupKeys.length > 0,
            queryKey: [
              'site-translation-lookup',
              'footer',
              group.keyPath,
              lang,
              group.lookupKeys.join('|'),
            ],
            queryFn: async () => {
              const response = await apiClient
                .proxy('ai/translations/entries/lookup')
                .post({
                  data: {
                    keyPath: group.keyPath,
                    lang,
                    lookupKeys: group.lookupKeys,
                  },
                })

              return normalizeSiteTranslationEntries((response as any).data)
            },
            staleTime: 60 * 1000,
          })),
        )
      : [],
  })

  const heroStatusMap = useMemo<SiteTranslationStatusMap>(() => {
    const entriesByLang = Object.fromEntries(
      SITE_TRANSLATION_LANGS.map((lang, langIndex) => [
        lang,
        heroLookupGroups.flatMap(
          (_, groupIndex) =>
            (heroTranslationQueries[
              groupIndex * SITE_TRANSLATION_LANGS.length + langIndex
            ]?.data as any[]) ?? [],
        ),
      ]),
    ) as Record<SiteTranslationLang, any[]>

    return buildSiteTranslationStatusMap(heroFields, entriesByLang)
  }, [heroFields, heroLookupGroups, heroTranslationQueries])

  const footerStatusMap = useMemo<SiteTranslationStatusMap>(() => {
    const entriesByLang = Object.fromEntries(
      SITE_TRANSLATION_LANGS.map((lang, langIndex) => [
        lang,
        footerLookupGroups.flatMap(
          (_, groupIndex) =>
            (footerTranslationQueries[
              groupIndex * SITE_TRANSLATION_LANGS.length + langIndex
            ]?.data as any[]) ?? [],
        ),
      ]),
    ) as Record<SiteTranslationLang, any[]>

    return buildSiteTranslationStatusMap(footerFields, entriesByLang)
  }, [footerFields, footerLookupGroups, footerTranslationQueries])

  const { mutateAsync: requestSiteTranslation } = useMutation({
    mutationFn: async ({
      lang,
      values,
    }: {
      lang: SiteTranslationLang
      values: SiteTranslationField[]
    }) => {
      await apiClient.proxy('ai/translations/entries/generate').post({
        data: {
          targetLangs: [lang],
          values: values.map((item) => ({
            keyPath: item.keyPath,
            keyType: item.keyType,
            lookupKey: item.lookupKey,
            sourceText: item.sourceText,
          })),
        },
      })
    },
  })

  if (aggregationQuery.isLoading || !aggregationQuery.data || !form) {
    return <PageLoading loadingText="正在加载站点配置…" />
  }

  const resetForm = () =>
    setDraftForm(
      createSiteSettingsFormState(
        aggregationQuery.data!,
        aggregationQuery.data!.theme,
      ),
    )

  const getSyncedFormState = () => ({
    ...form,
    seoDescription: seoDescriptionRef.current?.value ?? form.seoDescription,
    heroDescription: heroDescriptionRef.current?.value ?? form.heroDescription,
    heroQuote: heroQuoteRef.current?.value ?? form.heroQuote,
  })

  const save = async () => {
    setIsSaving(true)

    try {
      const syncedForm = getSyncedFormState()
      const existingThemeSnippet =
        snippetQuery.data ||
        (await queryClient.fetchQuery(themeSnippetQueryOptions))

      const payloads = buildSiteSettingsMutationPayloads({
        form: syncedForm,
        previousThemeSnippet: existingThemeSnippet || {
          name: THEME_SNIPPET_NAME,
          private: false,
          raw: '',
          reference: THEME_SNIPPET_REFERENCE,
          type: 'json',
        },
        previousThemeConfig: aggregationQuery.data.theme,
      })

      await apiClient.proxy('config/seo').patch({ data: payloads.seo })
      await apiClient.owner.proxy.patch({ data: payloads.owner })

      if (payloads.themeSnippet.id) {
        await apiClient.proxy(`snippets/${payloads.themeSnippet.id}`).put({
          data: payloads.themeSnippet,
        })
      } else {
        const { id: _, ...snippetPayload } = payloads.themeSnippet
        await apiClient.proxy('snippets').post({ data: snippetPayload })
      }

      // Homepage/theme reads are server-cached for up to 10 minutes, so refresh
      // aggregate caches immediately after a successful site settings save.
      await fetch('/api/internal/revalidate-aggregate', {
        method: 'POST',
        credentials: 'include',
      }).catch(() => null)

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['aggregation'] }),
        queryClient.invalidateQueries({
          queryKey: themeSnippetQueryOptions.queryKey,
        }),
      ])

      const nextAggregation = await queryClient.fetchQuery(aggregation.root())
      await queryClient.fetchQuery(themeSnippetQueryOptions)
      setDraftForm(
        createSiteSettingsFormState(nextAggregation, nextAggregation.theme),
      )
      toast.success('站点配置已保存')
    } catch (error) {
      toast.error(getErrorMessageFromRequestError(error as any))
    } finally {
      setIsSaving(false)
    }
  }

  const triggerGroupTranslation = async ({
    fields,
    group,
    groupLabel,
    lang,
  }: {
    fields: SiteTranslationField[]
    group: 'footer' | 'hero'
    groupLabel: string
    lang: SiteTranslationLang
  }) => {
    if (!fields.length) return

    setTranslatingGroup({ group, lang })

    try {
      await requestSiteTranslation({ lang, values: fields })
      await queryClient.invalidateQueries({
        queryKey: ['site-translation-lookup', group],
      })
      toast.success(`已提交${groupLabel}${lang === 'en' ? '英文' : '日文'}翻译`)
    } catch (error) {
      toast.error(getErrorMessageFromRequestError(error as any))
    } finally {
      setTranslatingGroup(null)
    }
  }

  const heroHasTranslation = {
    en: getGroupHasTranslation(heroFields, heroStatusMap, 'en'),
    ja: getGroupHasTranslation(heroFields, heroStatusMap, 'ja'),
  }
  const footerHasTranslation = {
    en: getGroupHasTranslation(footerFields, footerStatusMap, 'en'),
    ja: getGroupHasTranslation(footerFields, footerStatusMap, 'ja'),
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-light">站点配置</h1>
          <p className="mt-2 text-sm text-neutral-6">
            第一版只覆盖 SEO、首页 Hero、页脚常用链接和社交链接。
          </p>
        </div>

        <div className="flex gap-2">
          <StyledButton type="button" variant="secondary" onClick={resetForm}>
            重置
          </StyledButton>
          <StyledButton isLoading={isSaving} type="button" onClick={save}>
            保存更改
          </StyledButton>
        </div>
      </div>

      <SectionCard
        description="公开元信息，会影响首页标题、描述与分享卡片。"
        title="SEO"
      >
        <div>
          <FieldLabel title="站点标题" />
          <Input
            value={form.seoTitle}
            onChange={(event) =>
              setDraftForm({ ...form, seoTitle: event.target.value })
            }
          />
        </div>
        <div>
          <FieldLabel title="站点描述" />
          <TextArea
            ref={seoDescriptionRef}
            value={form.seoDescription}
            onChange={(event) =>
              setDraftForm((current) =>
                current
                  ? { ...current, seoDescription: event.target.value }
                  : current,
              )
            }
          />
        </div>
      </SectionCard>

      <SectionCard
        description="首页首屏的主标题与说明文案。"
        title="Hero"
        actions={
          isOwnerLogged ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <StyledButton
                  type="button"
                  variant="secondary"
                  disabled={
                    !heroFields.length || translatingGroup?.group === 'hero'
                  }
                >
                  {translatingGroup?.group === 'hero' ? 'AI 翻译中' : 'AI 翻译'}
                </StyledButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent keepMounted align="end">
                {SITE_TRANSLATION_LANGS.map((lang) => {
                  const isPending =
                    translatingGroup?.group === 'hero' &&
                    translatingGroup.lang === lang

                  return (
                    <DropdownMenuItem
                      disabled={isPending || !heroFields.length}
                      key={lang}
                      onClick={() =>
                        triggerGroupTranslation({
                          fields: heroFields,
                          group: 'hero',
                          groupLabel: 'Hero ',
                          lang,
                        })
                      }
                    >
                      {isPending
                        ? `${getSiteTranslationActionLabel(
                            lang,
                            heroHasTranslation[lang],
                          )}中`
                        : getSiteTranslationActionLabel(
                            lang,
                            heroHasTranslation[lang],
                          )}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null
        }
      >
        <div>
          <FieldLabel
            hint="第一版会保存成简单文本 title template。"
            title="Hero 标题"
          />
          <TranslationStatusBadges status={heroStatusMap['hero.title']} />
          <Input
            value={form.heroTitle}
            onChange={(event) =>
              setDraftForm({ ...form, heroTitle: event.target.value })
            }
          />
        </div>
        <div>
          <FieldLabel title="Hero 描述" />
          <TranslationStatusBadges status={heroStatusMap['hero.description']} />
          <TextArea
            ref={heroDescriptionRef}
            value={form.heroDescription}
            onChange={(event) =>
              setDraftForm((current) =>
                current
                  ? { ...current, heroDescription: event.target.value }
                  : current,
              )
            }
          />
        </div>
        <div>
          <FieldLabel
            hint="首页右下角的一句话。留空则回退默认文案；填写后会优先使用这里的内容。"
            title="首页一句话"
          />
          <TranslationStatusBadges status={heroStatusMap['hero.quote']} />
          <TextArea
            ref={heroQuoteRef}
            value={form.heroQuote}
            onChange={(event) =>
              setDraftForm((current) =>
                current
                  ? { ...current, heroQuote: event.target.value }
                  : current,
              )
            }
          />
        </div>
      </SectionCard>

      <SectionCard
        description="首页 Hero 区域使用的站长社交链接。"
        title="社交链接"
      >
        <SocialLinksEditor
          value={form.socialLinks}
          onChange={(socialLinks) => setDraftForm({ ...form, socialLinks })}
        />
      </SectionCard>

      <SectionCard
        description="页脚分组链接，空名称或空地址的项不会保存。"
        title="页脚链接"
        actions={
          isOwnerLogged ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <StyledButton
                  type="button"
                  variant="secondary"
                  disabled={
                    !footerFields.length || translatingGroup?.group === 'footer'
                  }
                >
                  {translatingGroup?.group === 'footer'
                    ? 'AI 翻译中'
                    : 'AI 翻译'}
                </StyledButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent keepMounted align="end">
                {SITE_TRANSLATION_LANGS.map((lang) => {
                  const isPending =
                    translatingGroup?.group === 'footer' &&
                    translatingGroup.lang === lang

                  return (
                    <DropdownMenuItem
                      disabled={isPending || !footerFields.length}
                      key={lang}
                      onClick={() =>
                        triggerGroupTranslation({
                          fields: footerFields,
                          group: 'footer',
                          groupLabel: '页脚链接',
                          lang,
                        })
                      }
                    >
                      {isPending
                        ? `${getSiteTranslationActionLabel(
                            lang,
                            footerHasTranslation[lang],
                          )}中`
                        : getSiteTranslationActionLabel(
                            lang,
                            footerHasTranslation[lang],
                          )}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null
        }
      >
        <FooterLinksEditor
          getTranslationStatus={(fieldId) => footerStatusMap[fieldId]}
          value={form.linkSections}
          onChange={(linkSections) => setDraftForm({ ...form, linkSections })}
        />
      </SectionCard>
    </div>
  )
}

export const config = defineRouteConfig({
  title: '站点',
  icon: <i className="i-mingcute-settings-3-line" />,
  priority: 9,
})
