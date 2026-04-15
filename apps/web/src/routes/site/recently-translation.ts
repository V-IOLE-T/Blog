export const RECENTLY_TRANSLATION_LANGS = [
  { code: 'EN', label: '英文', lang: 'en' },
  { code: 'JA', label: '日文', lang: 'ja' },
] as const

export type RecentlyTranslationLang =
  (typeof RECENTLY_TRANSLATION_LANGS)[number]['lang']

export const getRecentlyTranslationStatuses = (
  availableTranslations?: string[],
) =>
  RECENTLY_TRANSLATION_LANGS.map((item) => ({
    ...item,
    translated: !!availableTranslations?.includes(item.lang),
  }))

export const getRecentlyTranslationActionLabel = (
  lang: RecentlyTranslationLang,
  translated: boolean,
) => {
  const label = lang === 'en' ? '英文' : '日文'
  return `${translated ? '更新' : '生成'}${label}`
}

export const getRecentlyTranslationToastLabel = (
  lang: RecentlyTranslationLang,
  translated: boolean,
) => {
  const label = lang === 'en' ? '英文' : '日文'
  return `已提交${label}${translated ? '重翻译' : '翻译'}`
}
