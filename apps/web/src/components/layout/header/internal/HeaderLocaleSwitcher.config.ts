export const getHeaderLocaleTriggerLabel = (locale: string) => {
  if (locale === 'zh') return '中'
  if (locale === 'en') return 'EN'
  if (locale === 'ja') return '日'

  return locale.toUpperCase()
}
