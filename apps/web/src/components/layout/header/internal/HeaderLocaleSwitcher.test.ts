import { describe, expect, it } from 'vitest'

import { getHeaderLocaleTriggerLabel } from './HeaderLocaleSwitcher.config'

describe('getHeaderLocaleTriggerLabel', () => {
  it('uses compact labels for supported locales', () => {
    expect(getHeaderLocaleTriggerLabel('zh')).toBe('中')
    expect(getHeaderLocaleTriggerLabel('en')).toBe('EN')
    expect(getHeaderLocaleTriggerLabel('ja')).toBe('日')
  })

  it('falls back to uppercased locale for unknown values', () => {
    expect(getHeaderLocaleTriggerLabel('fr')).toBe('FR')
  })
})
