import { NextIntlClientProvider } from 'next-intl'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { SiteOwnerAvatar } from './SiteOwnerAvatar'

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => <img {...props} />,
}))

vi.mock('~/providers/root/aggregation-data-provider', () => ({
  useAggregationSelector: () => '/avatar.png',
}))

vi.mock('~/lib/helper', () => ({
  clsxm: (...values: Array<string | false | null | undefined>) =>
    values.filter(Boolean).join(' '),
}))

vi.mock('./useLiveQuery', () => ({
  useLiveQuery: () => ({ data: false }),
}))

vi.mock('~/atoms/hooks/status', () => ({
  useOwnerStatus: () => ({
    emoji: '🥰',
    desc: '开心',
    untilAt: 1_234,
  }),
}))

vi.mock('./OwnerStatus', () => ({
  OwnerStatus: () => <span data-owner-status-dot="true" />,
}))

describe('SiteOwnerAvatar', () => {
  const messages = {
    common: {
      auth_login: '登录',
      aria_site_owner_avatar: '站点头像',
    },
  }

  it('can render without embedding the owner status dot', () => {
    const html = renderToStaticMarkup(
      <NextIntlClientProvider locale="zh" messages={messages} timeZone="UTC">
        <SiteOwnerAvatar showOwnerStatus={false} variant="owner" />
      </NextIntlClientProvider>,
    )

    expect(html).not.toContain('data-owner-status-dot="true"')
  })
})
