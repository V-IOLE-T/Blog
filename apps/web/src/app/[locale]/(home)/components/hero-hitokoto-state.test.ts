import { describe, expect, it } from 'vitest'

import { resolveHeroHitokotoState } from './hero-hitokoto-state'

describe('resolveHeroHitokotoState', () => {
  it('holds custom copy until latest config is ready', () => {
    expect(
      resolveHeroHitokotoState({
        appConfigHitokoto: {
          custom: 'Old copy',
          random: false,
        },
        latestHitokotoConfig: null,
        hasResolvedLatestHitokoto: false,
      }),
    ).toEqual({
      custom: null,
      random: false,
    })
  })

  it('uses latest custom copy once available', () => {
    expect(
      resolveHeroHitokotoState({
        appConfigHitokoto: {
          custom: 'Old copy',
          random: false,
        },
        latestHitokotoConfig: {
          custom: 'New copy',
          random: false,
        },
        hasResolvedLatestHitokoto: true,
      }),
    ).toEqual({
      custom: 'New copy',
      random: false,
    })
  })
})
