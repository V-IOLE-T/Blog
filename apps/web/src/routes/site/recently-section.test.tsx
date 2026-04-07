import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { buildRecentlyAdminUrl, RecentlySectionView } from './recently-section'

describe('recently section', () => {
  it('builds the existing admin recently url from the admin base url', () => {
    const resolveAdminUrl = (path?: string) =>
      `https://api.418122.xyz/proxy/qaqdmin${path || ''}`

    expect(buildRecentlyAdminUrl(resolveAdminUrl)).toBe(
      'https://api.418122.xyz/proxy/qaqdmin#/recently',
    )
  })

  it('renders the summary card and embedded recently iframe together', () => {
    const html = renderToStaticMarkup(
      <RecentlySectionView
        embeddedUrl="https://api.418122.xyz/proxy/qaqdmin#/recently"
        recentlyCount={2}
        showEmbedFallback={false}
      />,
    )

    expect(html).toContain('速记')
    expect(html).toContain('>2<')
    expect(html).toContain('新建速记')
    expect(html).toContain('管理')
    expect(html).toContain(
      'src="https://api.418122.xyz/proxy/qaqdmin#/recently"',
    )
  })
})
