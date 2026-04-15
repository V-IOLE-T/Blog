import { describe, expect, it } from 'vitest'

import {
  buildRecentlyTranslationTriggerPath,
  getRecentlyTranslationActionLabel,
  getRecentlyTranslationStatuses,
  isRecentlyTranslationPendingTarget,
} from './recently-translation'

describe('recently translation helpers', () => {
  it('marks both languages as untranslated when list is empty', () => {
    expect(getRecentlyTranslationStatuses(undefined)).toEqual([
      { code: 'EN', label: '英文', lang: 'en', translated: false },
      { code: 'JA', label: '日文', lang: 'ja', translated: false },
    ])
  })

  it('marks only english as translated when en exists', () => {
    expect(getRecentlyTranslationStatuses(['en'])).toEqual([
      { code: 'EN', label: '英文', lang: 'en', translated: true },
      { code: 'JA', label: '日文', lang: 'ja', translated: false },
    ])
  })

  it('returns update labels for translated languages', () => {
    expect(getRecentlyTranslationActionLabel('en', true)).toBe('更新英文')
    expect(getRecentlyTranslationActionLabel('ja', false)).toBe('生成日文')
  })

  it('builds the same-origin trigger path for translation requests', () => {
    expect(
      buildRecentlyTranslationTriggerPath({
        itemId: 'recently-1',
        lang: 'en',
      }),
    ).toBe('/api/internal/recently-translations/generate')
  })

  it('matches only the active translating target', () => {
    expect(
      isRecentlyTranslationPendingTarget(
        { itemId: 'recently-1', lang: 'en' },
        'recently-1',
        'en',
      ),
    ).toBe(true)
    expect(
      isRecentlyTranslationPendingTarget(
        { itemId: 'recently-1', lang: 'en' },
        'recently-1',
        'ja',
      ),
    ).toBe(false)
    expect(
      isRecentlyTranslationPendingTarget(
        { itemId: 'recently-1', lang: 'en' },
        'recently-2',
        'en',
      ),
    ).toBe(false)
  })
})
