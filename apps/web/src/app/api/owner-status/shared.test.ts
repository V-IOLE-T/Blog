import { describe, expect, it } from 'vitest'

import { normalizeOwnerStatus, parseOwnerStatusSnippet } from './helpers'

describe('owner status helpers', () => {
  it('returns null for expired owner status payloads', () => {
    expect(
      normalizeOwnerStatus({
        desc: 'Away',
        emoji: '🌙',
        untilAt: Date.now() - 1000,
      }),
    ).toBeNull()
  })

  it('keeps valid owner status payloads', () => {
    expect(
      normalizeOwnerStatus({
        desc: 'Writing',
        emoji: '✍️',
        untilAt: Date.now() + 60_000,
      }),
    ).toMatchObject({
      desc: 'Writing',
      emoji: '✍️',
    })
  })

  it('parses null snippet payloads as empty status', () => {
    expect(parseOwnerStatusSnippet(null)).toBeNull()
  })
})
