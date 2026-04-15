import { defaultLocale } from './config'

export const buildApiLangQuery = (locale?: string) => {
  if (!locale || locale === defaultLocale) {
    return {}
  }

  return {
    lang: locale,
  }
}
