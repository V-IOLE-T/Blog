import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

import { useResolveAdminUrl } from '~/atoms/hooks/url'
import { StyledButton } from '~/components/ui/button'
import { apiClient } from '~/lib/request'

import { SectionCard } from './sections'

const RECENTLY_ADMIN_PATH = '#/recently'

export const buildRecentlyAdminUrl = (
  resolveAdminUrl: (path?: string) => string,
) => resolveAdminUrl(RECENTLY_ADMIN_PATH)

export const RecentlySection = () => {
  const resolveAdminUrl = useResolveAdminUrl()
  const embeddedUrl = buildRecentlyAdminUrl(resolveAdminUrl)
  const embedContainerRef = useRef<HTMLDivElement | null>(null)
  const [showEmbedFallback, setShowEmbedFallback] = useState(false)
  const [showCreateHint, setShowCreateHint] = useState(false)

  const { data: recentlyCount } = useQuery({
    queryKey: ['site-recently-count'],
    queryFn: async () => {
      const payload = (await apiClient.recently.getAll()).$serialized
      return payload.data.length
    },
    staleTime: 60 * 1000,
  })

  useEffect(() => {
    if (!embeddedUrl) return

    const timer = window.setTimeout(() => {
      setShowEmbedFallback(true)
    }, 5000)

    return () => window.clearTimeout(timer)
  }, [embeddedUrl])

  const openRecentlyPage = () => {
    if (!embeddedUrl) return
    window.open(embeddedUrl, '_blank', 'noopener,noreferrer')
  }

  const focusEmbeddedRecently = () => {
    embedContainerRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
    setShowCreateHint(true)
    window.setTimeout(() => {
      setShowCreateHint(false)
    }, 2500)
  }

  return (
    <RecentlySectionView
      embedContainerRef={embedContainerRef}
      embeddedUrl={embeddedUrl}
      recentlyCount={recentlyCount ?? null}
      showCreateHint={showCreateHint}
      showEmbedFallback={showEmbedFallback || !embeddedUrl}
      onCreate={focusEmbeddedRecently}
      onFrameLoad={() => setShowEmbedFallback(false)}
      onManage={openRecentlyPage}
    />
  )
}

export const RecentlySectionView = ({
  embeddedUrl,
  recentlyCount,
  showEmbedFallback,
  onCreate,
  onFrameLoad,
  onManage,
  showCreateHint = false,
  embedContainerRef,
}: {
  embeddedUrl: string
  recentlyCount: number | null
  showEmbedFallback: boolean
  onCreate?: () => void
  onFrameLoad?: () => void
  onManage?: () => void
  showCreateHint?: boolean
  embedContainerRef?: React.RefObject<HTMLDivElement | null>
}) => (
  <SectionCard
    description="复用现有后台里的速记模块，在这里可以快速查看并跳转管理。"
    title="速记"
  >
    <div className="rounded-2xl border border-neutral-3/80 bg-neutral-2/30 p-4">
      <div className="text-sm text-neutral-6">速记</div>
      <div className="mt-2 text-4xl font-semibold text-neutral-9">
        {recentlyCount ?? '-'}
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

    <div
      className="overflow-hidden rounded-2xl border border-neutral-3/80 bg-neutral-1/70"
      ref={embedContainerRef}
    >
      <div className="flex items-center justify-between border-b border-neutral-3/80 px-4 py-3">
        <div>
          <div className="text-sm font-medium text-neutral-8">速记内容</div>
          <p className="mt-1 text-xs text-neutral-5">
            下面直接显示后台里的现有速记模块。
          </p>
        </div>
        {showCreateHint && (
          <span className="rounded-full bg-neutral-2 px-3 py-1 text-xs text-neutral-6">
            请在下方右上角点击 + 新建速记
          </span>
        )}
      </div>

      {embeddedUrl ? (
        <iframe
          className="min-h-[720px] w-full bg-white"
          src={embeddedUrl}
          title="速记管理"
          onLoad={onFrameLoad}
        />
      ) : null}

      {showEmbedFallback && (
        <div className="border-t border-neutral-3/80 px-4 py-4 text-sm text-neutral-6">
          当前无法直接内嵌速记模块，请使用上方按钮打开后台速记页面。
        </div>
      )}
    </div>
  </SectionCard>
)
