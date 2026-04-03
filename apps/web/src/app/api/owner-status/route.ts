import type { NextRequest } from 'next/server'

import { NextServerResponse } from '~/lib/edge-function.server'

import { readPublicOwnerStatus } from './shared'

export const dynamic = 'force-dynamic'

export const GET = async (request: NextRequest) => {
  const response = new NextServerResponse()
  const origin = new URL(request.url).origin
  const data = await readPublicOwnerStatus(origin)

  return response.json({
    ok: true,
    data,
  })
}
