import { describe, expect, it } from 'vitest'

import {
  buildFooterTranslationFields,
  buildHeroTranslationFields,
  buildSiteTranslationStatusMap,
  getGroupHasTranslation,
  getSiteTranslationActionLabel,
  groupSiteTranslationFieldsByKeyPath,
  normalizeSiteTranslationEntries,
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

  it('groups fields by keyPath for batch lookup', () => {
    const fields = [
      ...buildHeroTranslationFields({
        heroTitle: 'OO Blog',
        heroDescription: 'Hello world',
        heroQuote: 'Keep building',
      }),
      ...buildFooterTranslationFields([
        {
          name: '关于',
          links: [{ href: '/timeline', name: '时间线' }],
        },
      ]),
    ]

    expect(groupSiteTranslationFieldsByKeyPath(fields)).toEqual([
      {
        keyPath: 'theme.hero.title',
        lookupKeys: ['hero.title'],
      },
      {
        keyPath: 'theme.hero.description',
        lookupKeys: ['hero.description'],
      },
      {
        keyPath: 'theme.hero.quote',
        lookupKeys: ['hero.quote'],
      },
      {
        keyPath: 'theme.footer.section.name',
        lookupKeys: ['footer.section.0.name'],
      },
      {
        keyPath: 'theme.footer.link.name',
        lookupKeys: ['footer.section.0.link.0.name'],
      },
    ])
  })

  it('marks fields translated only when entry source matches current source', () => {
    const fields = buildHeroTranslationFields({
      heroTitle: 'OO Blog',
      heroDescription: 'Hello world',
      heroQuote: 'Keep building',
    })

    const statusMap = buildSiteTranslationStatusMap(fields, {
      en: [
        {
          keyPath: 'theme.hero.title',
          lookupKey: 'hero.title',
          sourceText: 'OO Blog',
        },
        {
          keyPath: 'theme.hero.description',
          lookupKey: 'hero.description',
          sourceText: 'Old description',
        },
      ],
      ja: [],
    })

    expect(statusMap['hero.title']).toEqual({ en: true, ja: false })
    expect(statusMap['hero.description']).toEqual({ en: false, ja: false })
    expect(statusMap['hero.quote']).toEqual({ en: false, ja: false })
    expect(getGroupHasTranslation(fields, statusMap, 'en')).toBe(true)
    expect(getGroupHasTranslation(fields, statusMap, 'ja')).toBe(false)
    expect(getSiteTranslationActionLabel('en', true)).toBe('更新英文')
    expect(getSiteTranslationActionLabel('ja', false)).toBe('生成日文')
  })

  it('normalizes wrapped entry payloads', () => {
    expect(
      normalizeSiteTranslationEntries({
        data: [
          {
            keyPath: 'theme.hero.title',
            lookupKey: 'hero.title',
            sourceText: 'OO Blog',
          },
        ],
      }),
    ).toEqual([
      {
        keyPath: 'theme.hero.title',
        lookupKey: 'hero.title',
        sourceText: 'OO Blog',
      },
    ])
  })
})
