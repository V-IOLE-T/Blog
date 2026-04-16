// reverse proxy to github api
//

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { buildGitHubProxyHeaders } from '../shared'

export const revalidate = 86400 // 24 hours
export const GET = async (req: NextRequest) => {
  const pathname = req.nextUrl.pathname.split('/').slice(3)
  const query = req.nextUrl.searchParams

  query.delete('all')

  const searchString = query.toString()

  const url = `https://api.github.com/${pathname.join('/')}${
    searchString ? `?${searchString}` : ''
  }`

  const headers = buildGitHubProxyHeaders(process.env.GH_TOKEN)

  const response = await fetch(url, {
    headers,
  })

  const data = await response.json().catch(() => null)

  return NextResponse.json(data, {
    status: response.status,
  })
}
