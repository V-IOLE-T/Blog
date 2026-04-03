import { simpleCamelcaseKeys } from '@mx-space/api-client'
import type { NextRequest } from 'next/server'

import { buildServerApiUrl, fetchServerApiJson } from '~/lib/server-api-fetch'

import {
  type OwnerStatusPayload,
  parseOwnerStatusSnippet,
} from './helpers'

export const OWNER_STATUS_REFERENCE = 'status'
export const OWNER_STATUS_NAME = 'owner'

type SessionPayload = {
  role?: string
} | null

type SnippetRecord = {
  id?: string
  _id?: string
  name: string
  private?: boolean
  raw: string
  reference: string
  type: string
}

const unwrapSnippetRecord = (
  value: SnippetRecord | { data?: unknown } | null | undefined,
): SnippetRecord | null => {
  if (!value || typeof value !== 'object') return null

  if (
    'name' in value &&
    'reference' in value &&
    'type' in value &&
    'raw' in value
  ) {
    return value as SnippetRecord
  }

  if ('data' in value) {
    return unwrapSnippetRecord(value.data as SnippetRecord | null)
  }

  return null
}

const unwrapSnippetRecords = (
  payload: SnippetRecord[] | { data?: unknown } | null | undefined,
): SnippetRecord[] => {
  if (Array.isArray(payload)) {
    return payload
      .map((item) => unwrapSnippetRecord(item))
      .filter((item): item is SnippetRecord => !!item)
  }

  if (payload && typeof payload === 'object' && 'data' in payload) {
    return unwrapSnippetRecords(payload.data as SnippetRecord[] | null)
  }

  return []
}

export const readPublicOwnerStatus = async (
  origin?: string,
): Promise<OwnerStatusPayload> => {
  try {
    const payload = await fetchServerApiJson(
      `snippets/${OWNER_STATUS_REFERENCE}/${OWNER_STATUS_NAME}`,
      {
        next: { revalidate: 0 },
        origin,
      },
    )

    return parseOwnerStatusSnippet(payload)
  } catch {
    return null
  }
}

export const requireOwnerSession = async (request: NextRequest) => {
  const cookie = request.headers.get('cookie')

  if (!cookie) {
    return { ok: false as const, cookie: null, status: 401 }
  }

  const origin = new URL(request.url).origin
  const session = simpleCamelcaseKeys<SessionPayload>(
    await fetchServerApiJson('auth/session', {
      headers: {
        cookie,
      },
      origin,
    }),
  )

  if (!session || session.role !== 'owner') {
    return { ok: false as const, cookie, status: 403 }
  }

  return { ok: true as const, cookie, origin }
}

export const fetchOwnerStatusSnippetRecord = async ({
  cookie,
  origin,
}: {
  cookie: string
  origin: string
}) => {
  const response = await fetch(
    buildServerApiUrl(`snippets/group/${OWNER_STATUS_REFERENCE}`, { origin }),
    {
      headers: {
        Accept: 'application/json',
        cookie,
      },
      cache: 'no-store',
    },
  )

  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`)
  }

  const payload = await response.json()
  const record = unwrapSnippetRecords(payload).find(
    (item) => item.name === OWNER_STATUS_NAME,
  )

  return record ? { ...record, id: record.id || record._id } : null
}
