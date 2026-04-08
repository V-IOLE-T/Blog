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
        items={[]}
        recentlyCount={2}
        showOwnerActions={false}
      />,
    )

    expect(html).toContain('还没有速记内容')
  })
})
