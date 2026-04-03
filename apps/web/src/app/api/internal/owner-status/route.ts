import type { NextRequest } from 'next/server'

import { NextServerResponse } from '~/lib/edge-function.server'
import { buildServerApiUrl } from '~/lib/server-api-fetch'

import {
  fetchOwnerStatusSnippetRecord,
  OWNER_STATUS_NAME,
  OWNER_STATUS_REFERENCE,
  requireOwnerSession,
} from '../../owner-status/shared'

const validatePayload = (body: unknown) => {
  if (!body || typeof body !== 'object') return null

  const candidate = body as Record<string, unknown>
  const desc = candidate.desc
  const emoji = candidate.emoji
  const ttl = candidate.ttl

  if (
    typeof desc !== 'string' ||
    typeof emoji !== 'string' ||
    typeof ttl !== 'number'
  ) {
    return null
  }

  const nextDesc = desc.trim()
  const nextEmoji = emoji.trim()

  if (!nextDesc || !nextEmoji || !Number.isFinite(ttl) || ttl <= 0) {
    return null
  }

  return {
    desc: nextDesc,
    emoji: nextEmoji,
    ttl,
    untilAt: Date.now() + ttl * 1000,
  }
}

const saveStatusSnippet = async ({
  cookie,
  origin,
  status,
}: {
  cookie: string
  origin: string
  status: {
    desc: string
    emoji: string
    untilAt: number
  } | null
}) => {
  const existing = await fetchOwnerStatusSnippetRecord({ cookie, origin })
  const payload = existing
    ? {
        ...existing,
        private: false,
        raw: JSON.stringify(status),
      }
    : {
        name: OWNER_STATUS_NAME,
        private: false,
        raw: JSON.stringify(status),
        reference: OWNER_STATUS_REFERENCE,
        type: 'json',
      }

  const response = await fetch(
    buildServerApiUrl(existing ? `snippets/${existing.id}` : 'snippets', {
      origin,
    }),
    {
      method: existing ? 'PUT' : 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        cookie,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    },
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Request failed: ${response.status}`)
  }
}

export const POST = async (request: NextRequest) => {
  const response = new NextServerResponse()

  try {
    const session = await requireOwnerSession(request)
    if (!session.ok) {
      return response.status(session.status).json({
        ok: false,
        message:
          session.status === 401 ? 'Missing session cookie' : 'Forbidden',
      })
    }

    const body = await request.json().catch(() => null)
    const payload = validatePayload(body)

    if (!payload) {
      return response.status(400).json({
        ok: false,
        message: 'Invalid status payload',
      })
    }

    await saveStatusSnippet({
      cookie: session.cookie,
      origin: session.origin,
      status: {
        desc: payload.desc,
        emoji: payload.emoji,
        untilAt: payload.untilAt,
      },
    })

    return response.json({
      ok: true,
      data: {
        desc: payload.desc,
        emoji: payload.emoji,
        untilAt: payload.untilAt,
      },
    })
  } catch (error) {
    return response.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    })
  }
}

export const DELETE = async (request: NextRequest) => {
  const response = new NextServerResponse()

  try {
    const session = await requireOwnerSession(request)
    if (!session.ok) {
      return response.status(session.status).json({
        ok: false,
        message:
          session.status === 401 ? 'Missing session cookie' : 'Forbidden',
      })
    }

    await saveStatusSnippet({
      cookie: session.cookie,
      origin: session.origin,
      status: null,
    })

    return response.json({
      ok: true,
      data: null,
    })
  } catch (error) {
    return response.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    })
  }
}
