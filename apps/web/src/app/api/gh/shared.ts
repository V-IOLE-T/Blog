export const buildGitHubProxyHeaders = (token?: string) => {
  const headers = new Headers()
  headers.set(
    'User-Agent',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko), Shiro',
  )

  if (token?.trim()) {
    headers.set('Authorization', `Bearer ${token.trim()}`)
  }

  return headers
}
