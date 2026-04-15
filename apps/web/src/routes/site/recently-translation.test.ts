import { describe, expect, it } from 'vitest'

import {
  getRecentlyTranslationActionLabel,
  getRecentlyTranslationStatuses,
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
})
