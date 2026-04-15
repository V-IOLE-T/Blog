import { describe, expect, it } from 'vitest'

import { buildPageQueryParams } from './page-query'

describe('buildPageQueryParams', () => {
  it('omits lang for chinese locale', () => {
    expect(buildPageQueryParams('zh')).toEqual({
      prefer: 'lexical',
    })
  })

  it('passes english lang for english locale', () => {
    expect(buildPageQueryParams('en')).toEqual({
      lang: 'en',
      prefer: 'lexical',
    })
  })

  it('passes japanese lang for japanese locale', () => {
    expect(buildPageQueryParams('ja')).toEqual({
      lang: 'ja',
      prefer: 'lexical',
    })
  })
})
