import { simpleCamelcaseKeys } from '@mx-space/api-client'
import type { NextRequest } from 'next/server'

import { NextServerResponse } from '~/lib/edge-function.server'
import { fetchServerApiJson } from '~/lib/server-api-fetch'

import { revalidateAggregatePaths } from '../../webhook/revalidate-aggregate'

type SessionPayload = {
  role?: string
} | null

export const POST = async (request: NextRequest) => {
  const response = new NextServerResponse()
  const cookie = request.headers.get('cookie')

  if (!cookie) {
    return response.status(401).json({
      ok: false,
      message: 'Missing session cookie',
    })
  }

  try {
    const session = simpleCamelcaseKeys<SessionPayload>(
      await fetchServerApiJson('auth/session', {
        headers: {
          cookie,
        },
      }),
    )

    if (!session || session.role !== 'owner') {
      return response.status(403).json({
        ok: false,
        message: 'Forbidden',
      })
    }

    const result = await revalidateAggregatePaths()

    return response.status(result.failed.length ? 207 : 200).json({
      ok: result.failed.length === 0,
      ...result,
    })
  } catch (error) {
    return response.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    })
  }
}
