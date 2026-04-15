export const buildPageQueryParams = (locale: string) => {
  if (locale === 'zh') {
    return {
      prefer: 'lexical' as const,
    }
  }

  return {
    lang: locale,
    prefer: 'lexical' as const,
  }
}
