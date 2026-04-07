import { NextIntlClientProvider } from 'next-intl'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { HeroOwnerAvatar } from './HeroOwnerAvatar'

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => <img {...props} />,
}))

vi.mock('~/components/ui/float-popover', () => ({
  FloatPopover: ({ children, trigger, triggerElement }: any) => (
    <div data-float-popover="true" data-float-trigger={trigger}>
      {triggerElement}
      <div data-float-content="true">{children}</div>
    </div>
  ),
}))

describe('HeroOwnerAvatar', () => {
  const messages = {
    common: {
      status_until: '持续到',
      status_click_to_set: '点击设置状态',
    },
  }

  it('renders a read-only owner status popover for public viewers', () => {
    const html = renderToStaticMarkup(
      <NextIntlClientProvider locale="zh" messages={messages} timeZone="UTC">
        <HeroOwnerAvatar
          alt="站长头像"
          size={80}
          src="/avatar.png"
          ownerStatus={{
            emoji: '🥰',
            desc: '开心',
            untilAt: 1_234,
          }}
        />
      </NextIntlClientProvider>,
    )

    expect(html).toContain('data-float-popover="true"')
    expect(html).toContain('data-float-trigger="both"')
    expect(html).toContain('🥰 开心')
    expect(html).toContain('持续到')
    expect(html).not.toContain('点击设置状态')
  })

  it('renders a plain avatar when there is no owner status', () => {
    const html = renderToStaticMarkup(
      <NextIntlClientProvider locale="zh" messages={messages} timeZone="UTC">
        <HeroOwnerAvatar
          alt="站长头像"
          ownerStatus={null}
          size={80}
          src="/avatar.png"
        />
      </NextIntlClientProvider>,
    )

    expect(html).not.toContain('data-float-popover="true"')
    expect(html).toContain('avatar.png')
  })
})
