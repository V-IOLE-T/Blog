import { describe, expect, it } from 'vitest'

import { buildHeroHitokotoAggregateQuery } from './query'

describe('hero hitokoto aggregate query', () => {
  it('adds lang for non-default locales', () => {
    expect(buildHeroHitokotoAggregateQuery('en')).toEqual({
      lang: 'en',
      theme: 'shiro',
    })
    expect(buildHeroHitokotoAggregateQuery('ja')).toEqual({
      lang: 'ja',
      theme: 'shiro',
    })
  })

  it('omits lang for default locale', () => {
    expect(buildHeroHitokotoAggregateQuery('zh')).toEqual({
      theme: 'shiro',
    })
    expect(buildHeroHitokotoAggregateQuery(undefined)).toEqual({
      theme: 'shiro',
    })
  })
})
