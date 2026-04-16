import { describe, expect, it } from 'vitest'

import { buildGitHubProxyHeaders } from './shared'

describe('github proxy headers', () => {
  it('omits authorization when token is missing', () => {
    const headers = buildGitHubProxyHeaders()

    expect(headers.get('Authorization')).toBeNull()
    expect(headers.get('User-Agent')).toContain('Shiro')
  })

  it('includes bearer authorization when token exists', () => {
    const headers = buildGitHubProxyHeaders('test-token')

    expect(headers.get('Authorization')).toBe('Bearer test-token')
  })
})
