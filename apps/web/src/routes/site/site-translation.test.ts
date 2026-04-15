import { describe, expect, it } from 'vitest'

import {
  buildFooterTranslationFields,
  buildHeroTranslationFields,
} from './site-translation'

describe('site translation helpers', () => {
  it('builds hero fields with stable keyPath and lookupKey', () => {
    expect(
      buildHeroTranslationFields({
        heroTitle: 'OO Blog',
        heroDescription: 'Hello world',
        heroQuote: 'Keep building',
      }),
    ).toEqual([
      {
        fieldId: 'hero.title',
        keyPath: 'theme.hero.title',
        keyType: 'entity',
        lookupKey: 'hero.title',
        sourceText: 'OO Blog',
      },
      {
        fieldId: 'hero.description',
        keyPath: 'theme.hero.description',
        keyType: 'entity',
        lookupKey: 'hero.description',
        sourceText: 'Hello world',
      },
      {
        fieldId: 'hero.quote',
        keyPath: 'theme.hero.quote',
        keyType: 'entity',
        lookupKey: 'hero.quote',
        sourceText: 'Keep building',
      },
    ])
  })

  it('builds footer fields without translating href', () => {
    expect(
      buildFooterTranslationFields([
        {
          name: '关于',
          links: [
            { href: '/timeline', name: '时间线' },
            { href: '/about', name: '关于我' },
          ],
        },
      ]),
    ).toEqual([
      {
        fieldId: 'footer.section.0.name',
        keyPath: 'theme.footer.section.name',
        keyType: 'entity',
        lookupKey: 'footer.section.0.name',
        sourceText: '关于',
      },
      {
        fieldId: 'footer.section.0.link.0.name',
        keyPath: 'theme.footer.link.name',
        keyType: 'entity',
        lookupKey: 'footer.section.0.link.0.name',
        sourceText: '时间线',
      },
      {
        fieldId: 'footer.section.0.link.1.name',
        keyPath: 'theme.footer.link.name',
        keyType: 'entity',
        lookupKey: 'footer.section.0.link.1.name',
        sourceText: '关于我',
      },
    ])
  })
})
