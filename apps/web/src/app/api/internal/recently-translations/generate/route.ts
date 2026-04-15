import type { NextRequest } from 'next/server'

import { NextServerResponse } from '~/lib/edge-function.server'
import { buildServerApiUrl } from '~/lib/server-api-fetch'

const SUPPORTED_LANGS = new Set(['en', 'ja'])

type TriggerRecentlyTranslationPayload = {
  itemId?: string
  lang?: string
}

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export const POST = async (request: NextRequest) => {
  const response = new NextServerResponse().headers({
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  })

  let payload: TriggerRecentlyTranslationPayload

  try {
    payload = (await request.json()) as TriggerRecentlyTranslationPayload
  } catch {
    return response.status(400).json({
      ok: false,
      message: 'Invalid request body',
    })
  }

  const itemId = payload.itemId?.trim()
  const lang = payload.lang?.trim()

  if (!itemId || !lang || !SUPPORTED_LANGS.has(lang)) {
    return response.status(400).json({
      ok: false,
      message: 'Invalid translation target',
    })
  }

  try {
    const url = buildServerApiUrl(`ai/translations/article/${itemId}/generate`)
    url.searchParams.set('lang', lang)

    const upstream = await fetch(url, {
      cache: 'no-store',
      headers: {
        Accept: 'text/event-stream',
      },
    })

    if (!upstream.ok) {
      return response.status(upstream.status).json({
        ok: false,
        message: await upstream.text(),
      })
    }

    await upstream.text()

    return response.json({
      ok: true,
    })
  } catch (error) {
    return response.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    })
  }
}
