import { describe, expect, it } from 'vitest'

import { buildApiLangQuery } from './build-api-lang-query'

describe('buildApiLangQuery', () => {
  it('omits lang for chinese locale', () => {
    expect(buildApiLangQuery('zh')).toEqual({})
  })

  it('adds lang for english locale', () => {
    expect(buildApiLangQuery('en')).toEqual({ lang: 'en' })
  })

  it('adds lang for japanese locale', () => {
    expect(buildApiLangQuery('ja')).toEqual({ lang: 'ja' })
  })
})
