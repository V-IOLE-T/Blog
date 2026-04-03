import type { NextRequest } from 'next/server'

import { NextServerResponse } from '~/lib/edge-function.server'

import { readPublicOwnerStatus } from './shared'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'CDN-Cache-Control': 'no-store',
  'Cloudflare-CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
}

export const GET = async (request: NextRequest) => {
  const response = new NextServerResponse().headers(noStoreHeaders)
  const origin = new URL(request.url).origin
  const data = await readPublicOwnerStatus(origin)

  return response.json({
    ok: true,
    data,
  })
}
