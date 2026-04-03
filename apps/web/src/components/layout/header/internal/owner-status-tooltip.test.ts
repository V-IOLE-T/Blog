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

  it('uses compact popover sizing so the empty-state box wraps its text', () => {
    expect(getOwnerStatusPopoverClassNames()).toBe('w-fit max-w-[18rem]')
  })
})
