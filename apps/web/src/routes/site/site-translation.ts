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
