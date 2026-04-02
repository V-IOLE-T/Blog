import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'

import { PageLoading } from '~/components/layout/dashboard/PageLoading'
import { defineRouteConfig } from '~/components/modules/dashboard/utils/helper'
import { StyledButton } from '~/components/ui/button'
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
} from './sections'
import {
  fetchThemeSnippetRecord,
  THEME_SNIPPET_NAME,
  THEME_SNIPPET_REFERENCE,
} from './theme-snippet'

const themeSnippetQueryOptions = {
  queryKey: ['theme-snippet', THEME_SNIPPET_REFERENCE, THEME_SNIPPET_NAME],
  queryFn: () => fetchThemeSnippetRecord(apiClient),
}

export const Component = () => {
  const queryClient = useQueryClient()
  const aggregationQuery = useQuery(aggregation.root())
  const snippetQuery = useQuery(themeSnippetQueryOptions)
  const [form, setForm] = useState<SiteSettingsFormState | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const seoDescriptionRef = useRef<HTMLTextAreaElement | null>(null)
  const heroDescriptionRef = useRef<HTMLTextAreaElement | null>(null)

  const initialState = useMemo(() => {
    if (!aggregationQuery.data) return null
    return createSiteSettingsFormState(
      aggregationQuery.data,
      aggregationQuery.data.theme,
    )
  }, [aggregationQuery.data])

  useEffect(() => {
    if (!initialState || form) return
    setForm(initialState)
  }, [form, initialState])

  if (aggregationQuery.isLoading || !aggregationQuery.data || !form) {
    return <PageLoading loadingText="正在加载站点配置…" />
  }

  const resetForm = () =>
    setForm(
      createSiteSettingsFormState(
        aggregationQuery.data!,
        aggregationQuery.data!.theme,
      ),
    )

  const getSyncedFormState = () => ({
    ...form,
    seoDescription: seoDescriptionRef.current?.value ?? form.seoDescription,
    heroDescription: heroDescriptionRef.current?.value ?? form.heroDescription,
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
      setForm(
        createSiteSettingsFormState(nextAggregation, nextAggregation.theme),
      )
      toast.success('站点配置已保存')
    } catch (error) {
      toast.error(getErrorMessageFromRequestError(error as any))
    } finally {
      setIsSaving(false)
    }
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
              setForm({ ...form, seoTitle: event.target.value })
            }
          />
        </div>
        <div>
          <FieldLabel title="站点描述" />
          <TextArea
            ref={seoDescriptionRef}
            value={form.seoDescription}
            onChange={(event) =>
              setForm((current) =>
                current
                  ? { ...current, seoDescription: event.target.value }
                  : current,
              )
            }
          />
        </div>
      </SectionCard>

      <SectionCard description="首页首屏的主标题与说明文案。" title="Hero">
        <div>
          <FieldLabel
            hint="第一版会保存成简单文本 title template。"
            title="Hero 标题"
          />
          <Input
            value={form.heroTitle}
            onChange={(event) =>
              setForm({ ...form, heroTitle: event.target.value })
            }
          />
        </div>
        <div>
          <FieldLabel title="Hero 描述" />
          <TextArea
            ref={heroDescriptionRef}
            value={form.heroDescription}
            onChange={(event) =>
              setForm((current) =>
                current
                  ? { ...current, heroDescription: event.target.value }
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
          onChange={(socialLinks) => setForm({ ...form, socialLinks })}
        />
      </SectionCard>

      <SectionCard
        description="页脚分组链接，空名称或空地址的项不会保存。"
        title="页脚链接"
      >
        <FooterLinksEditor
          value={form.linkSections}
          onChange={(linkSections) => setForm({ ...form, linkSections })}
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
