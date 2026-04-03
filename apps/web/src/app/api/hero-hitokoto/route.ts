import type { NextRequest } from 'next/server'

import { NextServerResponse } from '~/lib/edge-function.server'
import { fetchServerApiJson } from '~/lib/server-api-fetch'

export const dynamic = 'force-dynamic'

type HeroHitokotoPayload = {
  custom?: string
  random?: boolean
}

export const GET = async (request: NextRequest) => {
  const response = new NextServerResponse()
  const origin = new URL(request.url).origin

  try {
    const aggregate = await fetchServerApiJson<{
      theme?: {
        config?: {
          hero?: {
            hitokoto?: HeroHitokotoPayload
          }
        }
      }
    }>('aggregate', {
      origin,
      query: {
        theme: 'shiro',
      },
      next: {
        revalidate: 0,
      },
    })

    return response.json({
      ok: true,
      data: aggregate.theme?.config?.hero?.hitokoto || null,
    })
  } catch (error) {
    return response.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    })
  }
}
