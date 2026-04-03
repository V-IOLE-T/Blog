import { describe, expect, it } from 'vitest'

import { getOwnerStatusTooltipText } from './owner-status-tooltip'

describe('getOwnerStatusTooltipText', () => {
  it('returns null when there is no status', () => {
    expect(getOwnerStatusTooltipText(null)).toBeNull()
  })

  it('formats emoji and description for hover text', () => {
    expect(
      getOwnerStatusTooltipText({
        emoji: '✍️',
        desc: 'Writing',
        untilAt: 1_234,
      }),
    ).toBe('✍️ Writing')
  })
})
