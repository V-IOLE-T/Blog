import type { EditableLinkSection } from './form-state'

export type SiteTranslationKeyPath =
  | 'theme.hero.title'
  | 'theme.hero.description'
  | 'theme.hero.quote'
  | 'theme.footer.section.name'
  | 'theme.footer.link.name'

export type SiteTranslationField = {
  fieldId: string
  keyPath: SiteTranslationKeyPath
  keyType: 'entity'
  lookupKey: string
  sourceText: string
}

export type SiteTranslationEntry = {
  keyPath: SiteTranslationKeyPath
  lookupKey: string
  sourceText: string
}

export type SiteTranslationStatusMap = Record<
  string,
  Record<SiteTranslationLang, boolean>
>

export type SiteTranslationLang = 'en' | 'ja'

export const buildHeroTranslationFields = ({
  heroTitle,
  heroDescription,
  heroQuote,
}: {
  heroTitle: string
  heroDescription: string
  heroQuote: string
}): SiteTranslationField[] =>
  [
    {
      fieldId: 'hero.title',
      keyPath: 'theme.hero.title',
      keyType: 'entity',
      lookupKey: 'hero.title',
      sourceText: heroTitle.trim(),
    },
    {
      fieldId: 'hero.description',
      keyPath: 'theme.hero.description',
      keyType: 'entity',
      lookupKey: 'hero.description',
      sourceText: heroDescription.trim(),
    },
    {
      fieldId: 'hero.quote',
      keyPath: 'theme.hero.quote',
      keyType: 'entity',
      lookupKey: 'hero.quote',
      sourceText: heroQuote.trim(),
    },
  ].filter((field) => !!field.sourceText)

export const buildFooterTranslationFields = (
  sections: EditableLinkSection[],
): SiteTranslationField[] =>
  sections.flatMap((section, sectionIndex) => {
    const fields: SiteTranslationField[] = []
    const sectionName = section.name.trim()

    if (sectionName) {
      fields.push({
        fieldId: `footer.section.${sectionIndex}.name`,
        keyPath: 'theme.footer.section.name',
        keyType: 'entity',
        lookupKey: `footer.section.${sectionIndex}.name`,
        sourceText: sectionName,
      })
    }

    section.links.forEach((link, linkIndex) => {
      const linkName = link.name.trim()
      if (!linkName) return

      fields.push({
        fieldId: `footer.section.${sectionIndex}.link.${linkIndex}.name`,
        keyPath: 'theme.footer.link.name',
        keyType: 'entity',
        lookupKey: `footer.section.${sectionIndex}.link.${linkIndex}.name`,
        sourceText: linkName,
      })
    })

    return fields
  })

export const groupSiteTranslationFieldsByKeyPath = (
  fields: SiteTranslationField[],
) =>
  Object.entries(
    fields.reduce(
      (acc, field) => {
        acc[field.keyPath] ??= []
        acc[field.keyPath].push(field.lookupKey)
        return acc
      },
      {} as Record<SiteTranslationKeyPath, string[]>,
    ),
  ).map(([keyPath, lookupKeys]) => ({
    keyPath: keyPath as SiteTranslationKeyPath,
    lookupKeys,
  }))

export const buildSiteTranslationStatusMap = (
  fields: SiteTranslationField[],
  entriesByLang: Partial<Record<SiteTranslationLang, SiteTranslationEntry[]>>,
): SiteTranslationStatusMap =>
  Object.fromEntries(
    fields.map((field) => {
      const fieldStatus = {
        en: false,
        ja: false,
      }

      ;(['en', 'ja'] as const).forEach((lang) => {
        fieldStatus[lang] = !!entriesByLang[lang]?.some(
          (entry) =>
            entry.keyPath === field.keyPath &&
            entry.lookupKey === field.lookupKey &&
            entry.sourceText === field.sourceText,
        )
      })

      return [field.fieldId, fieldStatus]
    }),
  )

export const getSiteTranslationActionLabel = (
  lang: SiteTranslationLang,
  hasTranslated: boolean,
) => `${hasTranslated ? '更新' : '生成'}${lang === 'en' ? '英文' : '日文'}`

export const getGroupHasTranslation = (
  fields: SiteTranslationField[],
  statusMap: SiteTranslationStatusMap,
  lang: SiteTranslationLang,
) => fields.some((field) => !!statusMap[field.fieldId]?.[lang])

export const normalizeSiteTranslationEntries = (
  value: unknown,
): SiteTranslationEntry[] => {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is SiteTranslationEntry =>
        !!item &&
        typeof item === 'object' &&
        'keyPath' in item &&
        'lookupKey' in item &&
        'sourceText' in item,
    )
  }

  if (value && typeof value === 'object' && 'data' in value) {
    return normalizeSiteTranslationEntries((value as { data?: unknown }).data)
  }

  return []
}
