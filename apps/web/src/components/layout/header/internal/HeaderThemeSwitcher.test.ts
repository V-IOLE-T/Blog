import { describe, expect, it } from 'vitest'

import {
  getHeaderThemeIconName,
  normalizeHeaderTheme,
} from './HeaderThemeSwitcher.config'

describe('HeaderThemeSwitcher config', () => {
  it('normalizes unsupported theme values to system', () => {
    expect(normalizeHeaderTheme(undefined)).toBe('system')
    expect(normalizeHeaderTheme(null)).toBe('system')
    expect(normalizeHeaderTheme('weird')).toBe('system')
  })

  it('maps themes to the expected icon names', () => {
    expect(getHeaderThemeIconName('light')).toBe('sun')
    expect(getHeaderThemeIconName('system')).toBe('computer')
    expect(getHeaderThemeIconName('dark')).toBe('moon')
  })
})
