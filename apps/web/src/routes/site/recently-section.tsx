import type { RecentlyModel } from '@mx-space/api-client'
import {
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import { useIsOwnerLogged } from '~/atoms/hooks/owner'
import { useResolveAdminUrl } from '~/atoms/hooks/url'
import { LoadMoreIndicator } from '~/components/modules/shared/LoadMoreIndicator'
import { StyledButton } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { TextArea } from '~/components/ui/input'
import { useModalStack } from '~/components/ui/modal'
import { RelativeTime } from '~/components/ui/relative-time'
import { apiClient } from '~/lib/request'
import { getErrorMessageFromRequestError } from '~/lib/request.shared'
import { toast } from '~/lib/toast'

import {
  buildRecentlyTranslationTriggerPath,
  getRecentlyTranslationActionLabel,
  getRecentlyTranslationItemsWithLanguages,
  getRecentlyTranslationStatuses,
  getRecentlyTranslationToastLabel,
  isRecentlyTranslationPendingTarget,
  normalizeRecentlyTranslationLanguages,
  type RecentlyTranslationLang,
  type RecentlyTranslationListItem,
  type RecentlyTranslationTarget,
} from './recently-translation'
import { SectionCard } from './sections'

const RECENTLY_ADMIN_PATH = '#/recently'
const RECENTLY_COUNT_QUERY_KEY = ['dashboard-recently-count']
const RECENTLY_LIST_QUERY_KEY = ['dashboard-recently-list']
const RECENTLY_TRANSLATION_LANGUAGES_QUERY_KEY = [
  'dashboard-recently-translation-languages',
] as const
const RECENTLY_PAGE_SIZE = 10
const RECENTLY_SKELETON_IDS = [
  'recently-a',
  'recently-b',
  'recently-c',
] as const
const RECENTLY_SKELETON_WIDTHS = ['100%', '82%', '36%'] as const

type RecentlyListItem = Pick<
  RecentlyModel,
  'content' | 'created' | 'down' | 'id' | 'modified' | 'up'
> &
  RecentlyTranslationListItem

export const buildRecentlyAdminUrl = (
  resolveAdminUrl: (path?: string) => string,
) => resolveAdminUrl(RECENTLY_ADMIN_PATH)

export const RecentlySection = () => {
  const t = useTranslations('common')
  const isOwnerLogged = useIsOwnerLogged()
  const resolveAdminUrl = useResolveAdminUrl()
  const adminUrl = buildRecentlyAdminUrl(resolveAdminUrl)
  const { present } = useModalStack()
  const queryClient = useQueryClient()
  const [translatingTarget, setTranslatingTarget] =
    useState<RecentlyTranslationTarget | null>(null)

  const { data: recentlyCount } = useQuery({
    queryKey: RECENTLY_COUNT_QUERY_KEY,
    queryFn: async () => {
      const payload = (await apiClient.recently.getAll()).$serialized
      return payload.data.length
    },
    staleTime: 60 * 1000,
  })

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: RECENTLY_LIST_QUERY_KEY,
    queryFn: async ({ pageParam }) => {
      const { data } = await apiClient.shorthand.getList({
        before: pageParam,
        size: RECENTLY_PAGE_SIZE,
      })
      return data as RecentlyModel[]
    },
    getNextPageParam: (lastPage) =>
      lastPage.length === RECENTLY_PAGE_SIZE
        ? (lastPage.at(-1)?.id ?? undefined)
        : undefined,
    initialPageParam: undefined as string | undefined,
    refetchOnMount: true,
  })

  const items = useMemo<RecentlyListItem[]>(
    () =>
      data?.pages.flatMap((page) =>
        page.map((item) => ({
          availableTranslations: (
            item as RecentlyModel & {
              availableTranslations?: string[]
            }
          ).availableTranslations,
          content: item.content,
          created: item.created,
          down: item.down,
          id: item.id,
          modified: item.modified,
          up: item.up,
        })),
      ) || [],
    [data],
  )

  const translationLanguageQueries = useQueries({
    queries: isOwnerLogged
      ? items.map((item) => ({
          enabled: !!item.id,
          queryKey: [...RECENTLY_TRANSLATION_LANGUAGES_QUERY_KEY, item.id],
          queryFn: async () =>
            normalizeRecentlyTranslationLanguages(
              (await apiClient.ai.getAvailableLanguages(item.id)).$serialized,
            ),
          staleTime: 60 * 1000,
        }))
      : [],
  })

  const itemsWithTranslations = useMemo<RecentlyListItem[]>(() => {
    const languagesById = Object.fromEntries(
      items.map((item, index) => [
        item.id,
        translationLanguageQueries[index]?.data as string[] | undefined,
      ]),
    )

    return getRecentlyTranslationItemsWithLanguages(items, languagesById)
  }, [items, translationLanguageQueries])

  const { mutateAsync: requestRecentlyTranslation } = useMutation({
    mutationFn: async ({
      itemId,
      lang,
    }: {
      itemId: string
      lang: RecentlyTranslationLang
    }) => {
      const response = await fetch(
        buildRecentlyTranslationTriggerPath({ itemId, lang }),
        {
          body: JSON.stringify({ itemId, lang }),
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        },
      )

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string
        } | null

        throw new Error(payload?.message || 'Translation request failed')
      }

      return await response.json().catch(() => ({ ok: true }))
    },
  })

  const openRecentlyPage = () => {
    if (!adminUrl) return
    window.open(adminUrl, '_blank', 'noopener,noreferrer')
  }

  const refreshRecently = async () => {
    await refetch()
  }

  const loadMoreRecently = () => {
    void fetchNextPage()
  }

  const triggerRecentlyTranslation = async (
    item: RecentlyListItem,
    lang: RecentlyTranslationLang,
    translated: boolean,
  ) => {
    setTranslatingTarget({ itemId: item.id, lang })

    try {
      await requestRecentlyTranslation({ itemId: item.id, lang })
      await queryClient.invalidateQueries({
        queryKey: [...RECENTLY_TRANSLATION_LANGUAGES_QUERY_KEY, item.id],
      })
      toast.success(getRecentlyTranslationToastLabel(lang, translated))
      await refreshRecently()
    } catch (error) {
      toast.error(getErrorMessageFromRequestError(error as any))
    } finally {
      setTranslatingTarget(null)
    }
  }

  const openCreateModal = () => {
    present({
      title: '新建速记',
      content: ({ dismiss }) => (
        <RecentlyEditorModal
          mode="create"
          onSaved={async () => {
            await refreshRecently()
            dismiss()
          }}
        />
      ),
    })
  }

  const openEditModal = (item: RecentlyListItem) => {
    present({
      title: t('actions_edit'),
      content: ({ dismiss }) => (
        <RecentlyEditorModal
          item={item}
          mode="edit"
          onSaved={async () => {
            await refreshRecently()
            dismiss()
          }}
        />
      ),
    })
  }

  const openDeleteModal = (item: RecentlyListItem) => {
    present({
      title: t('delete_confirm_default'),
      content: ({ dismiss }) => (
        <RecentlyDeleteModal
          itemId={item.id}
          onDeleted={async () => {
            await refreshRecently()
            dismiss()
          }}
        />
      ),
    })
  }

  return (
    <RecentlySectionView
      adminUrl={adminUrl}
      hasNextPage={!!hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isLoading={isLoading}
      items={itemsWithTranslations}
      recentlyCount={recentlyCount ?? itemsWithTranslations.length}
      showOwnerActions={isOwnerLogged}
      translatingTarget={translatingTarget}
      onCreate={openCreateModal}
      onDelete={openDeleteModal}
      onEdit={openEditModal}
      onLoadMore={loadMoreRecently}
      onManage={openRecentlyPage}
      onTranslate={triggerRecentlyTranslation}
    />
  )
}

export const RecentlySectionView = ({
  adminUrl,
  hasNextPage = false,
  isFetchingNextPage = false,
  isLoading = false,
  items,
  recentlyCount,
  showOwnerActions = false,
  onCreate,
  onDelete,
  onEdit,
  onLoadMore,
  onManage,
  onTranslate,
  translatingTarget,
}: {
  adminUrl: string
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  isLoading?: boolean
  items: RecentlyListItem[]
  recentlyCount: number
  showOwnerActions?: boolean
  onCreate?: () => void
  onDelete?: (item: RecentlyListItem) => void
  onEdit?: (item: RecentlyListItem) => void
  onLoadMore?: () => void
  onManage?: () => void
  onTranslate?: (
    item: RecentlyListItem,
    lang: RecentlyTranslationLang,
    translated: boolean,
  ) => void
  translatingTarget?: RecentlyTranslationTarget | null
}) => (
  <SectionCard
    description="复用现有后台里的速记模块，在这里可以快速查看并跳转管理。"
    title="速记"
  >
    <div className="rounded-2xl border border-neutral-3/80 bg-neutral-2/30 p-4">
      <div className="text-sm text-neutral-6">速记</div>
      <div className="mt-2 text-4xl font-semibold text-neutral-9">
        {recentlyCount}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <StyledButton type="button" onClick={onCreate}>
          新建速记
        </StyledButton>
      </div>
    </div>

    <div className="overflow-hidden rounded-2xl border border-neutral-3/80 bg-neutral-1/70">
      <div className="flex items-center justify-between border-b border-neutral-3/80 px-4 py-3">
        <div>
          <div className="text-sm font-medium text-neutral-8">速记内容</div>
          <p className="mt-1 text-xs text-neutral-5">
            下面直接显示当前速记内容。
          </p>
        </div>
        {adminUrl ? (
          <StyledButton type="button" variant="ghost" onClick={onManage}>
            打开完整后台
          </StyledButton>
        ) : null}
      </div>

      <div className="space-y-3 p-4">
        {isLoading ? (
          RECENTLY_SKELETON_IDS.map((id) => (
            <div
              className="rounded-2xl border border-neutral-3/60 bg-neutral-1 p-5 shadow-[0_1px_6px_rgba(0,0,0,0.04)]"
              key={id}
            >
              <div
                className="h-4 animate-pulse rounded bg-neutral-3/50"
                style={{ width: RECENTLY_SKELETON_WIDTHS[0] }}
              />
              <div
                className="mt-3 h-4 animate-pulse rounded bg-neutral-3/40"
                style={{ width: RECENTLY_SKELETON_WIDTHS[1] }}
              />
              <div
                className="mt-6 h-3 animate-pulse rounded bg-neutral-3/30"
                style={{ width: RECENTLY_SKELETON_WIDTHS[2] }}
              />
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-3/80 px-4 py-8 text-center text-sm text-neutral-5">
            还没有速记内容
          </div>
        ) : (
          items.map((item) => {
            const translationStatuses = getRecentlyTranslationStatuses(
              item.availableTranslations,
            )
            const isItemTranslating = translatingTarget?.itemId === item.id

            return (
              <article
                className="rounded-3xl border border-neutral-3/70 bg-neutral-1 px-5 py-4 shadow-[0_1px_10px_rgba(0,0,0,0.035)] transition-shadow hover:shadow-[0_2px_14px_rgba(0,0,0,0.05)]"
                key={item.id}
              >
                <div className="text-[15px] leading-8 text-neutral-9">
                  {item.content}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-neutral-5">
                  <span className="font-medium text-neutral-6">
                    <RelativeTime date={item.created} />
                  </span>
                  {item.modified ? (
                    <span>
                      编辑于 <RelativeTime date={item.modified} />
                    </span>
                  ) : null}
                  <span>赞 {item.up}</span>
                  <span>踩 {item.down}</span>
                  {showOwnerActions
                    ? translationStatuses.map((status) => (
                        <span
                          key={status.lang}
                          className={
                            status.translated
                              ? 'rounded-full border border-emerald-300/70 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700'
                              : 'rounded-full border border-neutral-3/80 bg-neutral-2/60 px-2 py-0.5 text-[11px] font-medium text-neutral-6'
                          }
                        >
                          {status.code}{' '}
                          {status.translated ? '已翻译' : '未翻译'}
                        </span>
                      ))
                    : null}
                </div>

                {showOwnerActions ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StyledButton
                      type="button"
                      variant="secondary"
                      onClick={() => onEdit?.(item)}
                    >
                      编辑
                    </StyledButton>
                    <StyledButton
                      type="button"
                      variant="ghost"
                      onClick={() => onDelete?.(item)}
                    >
                      删除
                    </StyledButton>
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <StyledButton
                          disabled={isItemTranslating}
                          type="button"
                          variant="secondary"
                        >
                          {isItemTranslating ? 'AI 翻译中' : 'AI 翻译'}
                        </StyledButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent keepMounted align="end">
                        {translationStatuses.map((status) => {
                          const isTranslating =
                            isRecentlyTranslationPendingTarget(
                              translatingTarget,
                              item.id,
                              status.lang,
                            )

                          return (
                            <DropdownMenuItem
                              disabled={isTranslating}
                              key={status.lang}
                              onClick={() =>
                                onTranslate?.(
                                  item,
                                  status.lang,
                                  status.translated,
                                )
                              }
                            >
                              {isTranslating
                                ? `${getRecentlyTranslationActionLabel(
                                    status.lang,
                                    status.translated,
                                  )}中`
                                : getRecentlyTranslationActionLabel(
                                    status.lang,
                                    status.translated,
                                  )}
                            </DropdownMenuItem>
                          )
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : null}
              </article>
            )
          })
        )}

        {hasNextPage ? (
          <LoadMoreIndicator
            className="rounded-2xl border border-dashed border-neutral-3/80 py-4"
            onLoading={() => onLoadMore?.()}
          >
            <div className="text-center text-sm text-neutral-5">
              {isFetchingNextPage ? '正在加载更多速记…' : '下滑继续加载速记'}
            </div>
          </LoadMoreIndicator>
        ) : null}
      </div>
    </div>
  </SectionCard>
)

const RecentlyEditorModal = ({
  item,
  mode,
  onSaved,
}: {
  item?: RecentlyListItem
  mode: 'create' | 'edit'
  onSaved: () => Promise<void>
}) => {
  const t = useTranslations('common')
  const [content, setContent] = useState(item?.content || '')

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      if (!content.trim()) {
        throw new Error(t('content_empty'))
      }

      if (mode === 'create') {
        await apiClient.shorthand.proxy.post({
          data: { content: content.trim() },
        })
      } else if (item) {
        await apiClient.shorthand.proxy(item.id).put({
          data: { content: content.trim() },
        })
      }
    },
  })

  const handleSave = async () => {
    try {
      await mutateAsync()
      toast.success(mode === 'create' ? '创建成功' : t('edit_success'))
      await onSaved()
    } catch (error) {
      toast.error(getErrorMessageFromRequestError(error as any))
    }
  }

  return (
    <div className="w-[480px] max-w-[92vw] space-y-4">
      <TextArea
        autoFocus
        className="min-h-[220px]"
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />
      <div className="flex justify-end gap-3">
        <StyledButton disabled={isPending} type="button" onClick={handleSave}>
          {isPending
            ? t('actions_saving')
            : mode === 'create'
              ? '创建'
              : t('actions_save')}
        </StyledButton>
      </div>
    </div>
  )
}

const RecentlyDeleteModal = ({
  itemId,
  onDeleted,
}: {
  itemId: string
  onDeleted: () => Promise<void>
}) => {
  const t = useTranslations('common')

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      await apiClient.shorthand.proxy(itemId).delete()
    },
  })

  const handleDelete = async () => {
    try {
      await mutateAsync()
      toast.success(t('delete_success'))
      await onDeleted()
    } catch (error) {
      toast.error(getErrorMessageFromRequestError(error as any))
    }
  }

  return (
    <div className="w-[320px] max-w-[90vw] space-y-4">
      <p className="text-sm text-neutral-7">删除后无法恢复，确认继续吗？</p>
      <div className="flex justify-end gap-3">
        <StyledButton
          className="bg-neutral-2/80 text-red-500!"
          disabled={isPending}
          type="button"
          variant="secondary"
          onClick={handleDelete}
        >
          {t('actions_confirm')}
        </StyledButton>
      </div>
    </div>
  )
}
