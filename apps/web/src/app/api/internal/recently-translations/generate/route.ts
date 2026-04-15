import { simpleCamelcaseKeys } from '@mx-space/api-client'
import type { NextRequest } from 'next/server'

import { normalizeOwnerSession } from '~/app/api/owner-status/session'
import { NextServerResponse } from '~/lib/edge-function.server'
import { buildServerApiUrl, fetchServerApiJson } from '~/lib/server-api-fetch'

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
  const cookie = request.headers.get('cookie')

  if (!cookie) {
    return response.status(401).json({
      ok: false,
      message: 'Missing session cookie',
    })
  }

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
    const session = normalizeOwnerSession(
      simpleCamelcaseKeys(
        await fetchServerApiJson('auth/session', {
          headers: {
            cookie,
          },
        }),
      ),
    )

    if (!session || session.role !== 'owner') {
      return response.status(403).json({
        ok: false,
        message: 'Forbidden',
      })
    }

    const url = buildServerApiUrl(`ai/translations/article/${itemId}/generate`)
    url.searchParams.set('lang', lang)

    const upstream = await fetch(url, {
      cache: 'no-store',
      headers: {
        Accept: 'text/event-stream',
        cookie,
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
