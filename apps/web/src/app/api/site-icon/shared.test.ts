import { describe, expect, it } from 'vitest'

import { FALLBACK_SITE_ICON_PATH, resolveSiteIconSource } from './shared'

describe('resolveSiteIconSource', () => {
  it('prefers the owner avatar when available', () => {
    expect(
      resolveSiteIconSource({
        ownerAvatar: 'https://cdn.example.com/avatar.jpg',
        seoIcon: 'https://cdn.example.com/seo.svg',
        themeFavicon: '/favicon.ico',
      }),
    ).toBe('https://cdn.example.com/avatar.jpg')
  })

  it('falls back to seo icon before theme favicon', () => {
    expect(
      resolveSiteIconSource({
        ownerAvatar: '',
        seoIcon: 'https://cdn.example.com/seo.svg',
        themeFavicon: '/favicon.ico',
      }),
    ).toBe('https://cdn.example.com/seo.svg')
  })

  it('falls back to the bundled favicon when no source exists', () => {
    expect(
      resolveSiteIconSource({
        ownerAvatar: null,
        seoIcon: '',
        themeFavicon: undefined,
      }),
    ).toBe(FALLBACK_SITE_ICON_PATH)
  })
})
