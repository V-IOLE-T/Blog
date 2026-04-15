import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { buildRecentlyAdminUrl, RecentlySectionView } from './recently-section'

vi.mock('~/components/ui/relative-time', () => ({
  RelativeTime: ({ date }: { date: string }) => <span>{date}</span>,
}))

describe('recently section', () => {
  const recentlyItems = [
    {
      content: '今天从杭州回来了，赶早上的飞机真的好困。',
      created: '2026-04-07T10:52:42.124Z',
      down: 0,
      id: 'recently-1',
      up: 0,
    },
  ]

  it('builds the existing admin recently url from the admin base url', () => {
    const resolveAdminUrl = (path?: string) =>
      `https://api.418122.xyz/proxy/qaqdmin${path || ''}`

    expect(buildRecentlyAdminUrl(resolveAdminUrl)).toBe(
      'https://api.418122.xyz/proxy/qaqdmin#/recently',
    )
  })

  it('renders the summary card and native recently list content', () => {
    const html = renderToStaticMarkup(
      <RecentlySectionView
        adminUrl="https://api.418122.xyz/proxy/qaqdmin#/recently"
        hasNextPage={false}
        isFetchingNextPage={false}
        items={recentlyItems}
        recentlyCount={2}
        showOwnerActions={false}
      />,
    )

    expect(html).toContain('速记')
    expect(html).toContain('>2<')
    expect(html).toContain('新建速记')
    expect(html).toContain('管理')
    expect(html).toContain('今天从杭州回来了，赶早上的飞机真的好困。')
    expect(html).not.toContain('<iframe')
  })

  it('renders empty state when there are no recently items', () => {
    const html = renderToStaticMarkup(
      <RecentlySectionView
        adminUrl="https://api.418122.xyz/proxy/qaqdmin#/recently"
        hasNextPage={false}
        isFetchingNextPage={false}
        items={[]}
        recentlyCount={2}
        showOwnerActions={false}
      />,
    )

    expect(html).toContain('还没有速记内容')
  })

  it('does not render the top manage button anymore', () => {
    const html = renderToStaticMarkup(
      <RecentlySectionView
        adminUrl="https://api.418122.xyz/proxy/qaqdmin#/recently"
        hasNextPage={false}
        isFetchingNextPage={false}
        items={recentlyItems}
        recentlyCount={2}
        showOwnerActions={false}
      />,
    )

    expect(html).not.toContain('>管理<')
    expect(html).toContain('打开完整后台')
  })

  it('renders translation status badges and ai translation entry for owner', () => {
    const html = renderToStaticMarkup(
      <RecentlySectionView
        showOwnerActions
        adminUrl="https://api.418122.xyz/proxy/qaqdmin#/recently"
        hasNextPage={false}
        isFetchingNextPage={false}
        recentlyCount={1}
        items={
          [
            {
              content: '今天从杭州回来了，赶早上的飞机真的好困。',
              created: '2026-04-07T10:52:42.124Z',
              down: 0,
              id: 'recently-1',
              modified: null,
              up: 0,
              availableTranslations: ['en'],
            },
          ] as any
        }
      />,
    )

    expect(html).toContain('EN 已翻译')
    expect(html).toContain('JA 未翻译')
    expect(html).toContain('AI 翻译')
  })
})
