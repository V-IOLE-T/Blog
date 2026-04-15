export const RECENTLY_TRANSLATION_LANGS = [
  { code: 'EN', label: '英文', lang: 'en' },
  { code: 'JA', label: '日文', lang: 'ja' },
] as const

export type RecentlyTranslationLang =
  (typeof RECENTLY_TRANSLATION_LANGS)[number]['lang']

export type RecentlyTranslationTarget = {
  itemId: string
  lang: RecentlyTranslationLang
}

export type RecentlyTranslationListItem = {
  id: string
  availableTranslations?: string[]
}

export const normalizeRecentlyTranslationLanguages = (
  value: unknown,
): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }

  if (value && typeof value === 'object' && 'data' in value) {
    return normalizeRecentlyTranslationLanguages(
      (value as { data?: unknown }).data,
    )
  }

  return []
}

export const getRecentlyTranslationStatuses = (
  availableTranslations?: string[],
) =>
  RECENTLY_TRANSLATION_LANGS.map((item) => ({
    ...item,
    translated: normalizeRecentlyTranslationLanguages(
      availableTranslations,
    ).includes(item.lang),
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

export const buildRecentlyTranslationTriggerPath = ({
  itemId: _itemId,
  lang: _lang,
}: {
  itemId: string
  lang: RecentlyTranslationLang
}) => '/api/internal/recently-translations/generate'

export const getRecentlyTranslationItemsWithLanguages = <
  T extends RecentlyTranslationListItem,
>(
  items: T[],
  languagesById: Record<string, string[] | undefined>,
) =>
  items.map((item) => ({
    ...item,
    availableTranslations: normalizeRecentlyTranslationLanguages(
      languagesById[item.id] ?? item.availableTranslations,
    ),
  }))

export const isRecentlyTranslationPendingTarget = (
  target: RecentlyTranslationTarget | null | undefined,
  itemId: string,
  lang: RecentlyTranslationLang,
) => target?.itemId === itemId && target.lang === lang
