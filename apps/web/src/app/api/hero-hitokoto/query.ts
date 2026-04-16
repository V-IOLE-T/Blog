import { buildApiLangQuery } from '~/i18n/build-api-lang-query'

export const buildHeroHitokotoAggregateQuery = (locale?: string) => ({
  theme: 'shiro',
  ...buildApiLangQuery(locale),
})
