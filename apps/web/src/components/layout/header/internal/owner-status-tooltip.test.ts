import { describe, expect, it } from 'vitest'

import {
  getOwnerStatusPopoverClassNames,
  getOwnerStatusTooltipText,
} from './owner-status-tooltip'

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

  it('uses a wider status card shape instead of a tall narrow tooltip', () => {
    expect(getOwnerStatusPopoverClassNames()).toBe(
      'w-max min-w-[10.5rem] max-w-[14rem]',
    )
  })
})
