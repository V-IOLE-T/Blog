export const normalizeHeaderTheme = (theme?: string | null) => {
  if (theme === 'light' || theme === 'dark' || theme === 'system') {
    return theme
  }

  return 'system'
}

export const getHeaderThemeIconName = (theme?: string | null) => {
  const normalizedTheme = normalizeHeaderTheme(theme)

  if (normalizedTheme === 'light') return 'sun'
  if (normalizedTheme === 'dark') return 'moon'

  return 'computer'
}
