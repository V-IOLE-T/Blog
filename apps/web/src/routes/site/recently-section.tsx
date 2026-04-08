import type { RecentlyModel } from '@mx-space/api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import { useIsOwnerLogged } from '~/atoms/hooks/owner'
import { useResolveAdminUrl } from '~/atoms/hooks/url'
import { StyledButton } from '~/components/ui/button'
import { TextArea } from '~/components/ui/input'
import { useModalStack } from '~/components/ui/modal'
import { RelativeTime } from '~/components/ui/relative-time'
import { apiClient } from '~/lib/request'
import { getErrorMessageFromRequestError } from '~/lib/request.shared'
import { toast } from '~/lib/toast'

import { SectionCard } from './sections'

const RECENTLY_ADMIN_PATH = '#/recently'
const RECENTLY_QUERY_KEY = ['dashboard-recently-list']
const RECENTLY_SKELETON_IDS = [
  'recently-a',
  'recently-b',
  'recently-c',
] as const
const RECENTLY_SKELETON_WIDTHS = ['100%', '82%', '36%'] as const

type RecentlyListItem = Pick<
  RecentlyModel,
  'content' | 'created' | 'down' | 'id' | 'modified' | 'up'
>

export const buildRecentlyAdminUrl = (
  resolveAdminUrl: (path?: string) => string,
) => resolveAdminUrl(RECENTLY_ADMIN_PATH)

export const RecentlySection = () => {
  const t = useTranslations('common')
  const isOwnerLogged = useIsOwnerLogged()
  const resolveAdminUrl = useResolveAdminUrl()
  const adminUrl = buildRecentlyAdminUrl(resolveAdminUrl)
  const queryClient = useQueryClient()
  const { present } = useModalStack()

  const { data: recentlyItems, isLoading } = useQuery({
    queryKey: RECENTLY_QUERY_KEY,
    queryFn: async () => {
      const payload = (await apiClient.recently.getAll()).$serialized
      return payload.data as RecentlyModel[]
    },
    staleTime: 60 * 1000,
  })

  const items = useMemo(
    () =>
      (recentlyItems || []).map((item) => ({
        content: item.content,
        created: item.created,
        down: item.down,
        id: item.id,
        modified: item.modified,
        up: item.up,
      })),
    [recentlyItems],
  )

  const openRecentlyPage = () => {
    if (!adminUrl) return
    window.open(adminUrl, '_blank', 'noopener,noreferrer')
  }

  const openCreateModal = () => {
    present({
      title: '新建速记',
      content: ({ dismiss }) => (
        <RecentlyEditorModal
          mode="create"
          onSaved={async () => {
            await queryClient.invalidateQueries({
              queryKey: RECENTLY_QUERY_KEY,
            })
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
            await queryClient.invalidateQueries({
              queryKey: RECENTLY_QUERY_KEY,
            })
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
            await queryClient.invalidateQueries({
              queryKey: RECENTLY_QUERY_KEY,
            })
            dismiss()
          }}
        />
      ),
    })
  }

  return (
    <RecentlySectionView
      adminUrl={adminUrl}
      isLoading={isLoading}
      items={items}
      recentlyCount={items.length}
      showOwnerActions={isOwnerLogged}
      onCreate={openCreateModal}
      onDelete={openDeleteModal}
      onEdit={openEditModal}
      onManage={openRecentlyPage}
    />
  )
}

export const RecentlySectionView = ({
  adminUrl,
  isLoading = false,
  items,
  recentlyCount,
  showOwnerActions = false,
  onCreate,
  onDelete,
  onEdit,
  onManage,
}: {
  adminUrl: string
  isLoading?: boolean
  items: RecentlyListItem[]
  recentlyCount: number
  showOwnerActions?: boolean
  onCreate?: () => void
  onDelete?: (item: RecentlyListItem) => void
  onEdit?: (item: RecentlyListItem) => void
  onManage?: () => void
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
        <StyledButton type="button" variant="secondary" onClick={onManage}>
          管理
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
              className="rounded-2xl border border-neutral-3/60 bg-neutral-1 p-4"
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
                className="mt-4 h-3 animate-pulse rounded bg-neutral-3/30"
                style={{ width: RECENTLY_SKELETON_WIDTHS[2] }}
              />
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-3/80 px-4 py-8 text-center text-sm text-neutral-5">
            还没有速记内容
          </div>
        ) : (
          items.map((item) => (
            <article
              className="rounded-2xl border border-neutral-3/80 bg-neutral-1 p-4 shadow-sm"
              key={item.id}
            >
              <div className="whitespace-pre-wrap text-sm leading-7 text-neutral-8">
                {item.content}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-neutral-5">
                <RelativeTime date={item.created} />
                {item.modified ? (
                  <span>
                    编辑于 <RelativeTime date={item.modified} />
                  </span>
                ) : null}
                <span>赞 {item.up}</span>
                <span>踩 {item.down}</span>
              </div>

              {showOwnerActions ? (
                <div className="mt-4 flex gap-2">
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
                </div>
              ) : null}
            </article>
          ))
        )}
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
