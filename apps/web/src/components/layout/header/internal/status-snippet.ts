import { RequestError } from '@mx-space/api-client'

import type { OwnerStatus } from '~/atoms/status'

export type OwnerStatusSnippetRecord = {
  id?: string
  _id?: string
  name: string
  reference: string
  type: string
  private?: boolean
  raw: string
}

type StatusSnippetClientLike = {
  snippet: {
    proxy: (path: string) => {
      get: () => Promise<OwnerStatusSnippetRecord[] | { data?: unknown }>
    }
  }
}

export const OWNER_STATUS_SNIPPET_REFERENCE = 'status'
export const OWNER_STATUS_SNIPPET_NAME = 'owner'

const unwrapStatusSnippetRecord = (
  record: OwnerStatusSnippetRecord | { data?: unknown } | null | undefined,
): OwnerStatusSnippetRecord | null => {
  if (!record || typeof record !== 'object') return null

  if (
    'name' in record &&
    'reference' in record &&
    'type' in record &&
    'raw' in record
  ) {
    return record as OwnerStatusSnippetRecord
  }

  if ('data' in record) {
    return unwrapStatusSnippetRecord(
      record.data as OwnerStatusSnippetRecord | null,
    )
  }

  return null
}

const unwrapStatusSnippetRecords = (
  payload: OwnerStatusSnippetRecord[] | { data?: unknown } | null | undefined,
): OwnerStatusSnippetRecord[] => {
  if (Array.isArray(payload)) {
    return payload
      .map((item) => unwrapStatusSnippetRecord(item))
      .filter((item): item is OwnerStatusSnippetRecord => !!item)
  }

  if (payload && typeof payload === 'object' && 'data' in payload) {
    return unwrapStatusSnippetRecords(
      payload.data as OwnerStatusSnippetRecord[] | null,
    )
  }

  return []
}

export const normalizeStatusSnippetRecord = (
  record: OwnerStatusSnippetRecord | { data?: unknown } | null | undefined,
) => {
  const unwrappedRecord = unwrapStatusSnippetRecord(record)
  return unwrappedRecord
    ? { ...unwrappedRecord, id: unwrappedRecord.id || unwrappedRecord._id }
    : null
}

export const fetchStatusSnippetRecord = async (
  client: StatusSnippetClientLike,
) => {
  try {
    const records = await client.snippet
      .proxy(`group/${OWNER_STATUS_SNIPPET_REFERENCE}`)
      .get()
    const record = unwrapStatusSnippetRecords(records).find(
      (item) => item.name === OWNER_STATUS_SNIPPET_NAME,
    )

    return normalizeStatusSnippetRecord(record)
  } catch (error) {
    if (error instanceof RequestError && error.status === 404) {
      return null
    }

    throw error
  }
}

export const buildStatusSnippetMutationPayload = ({
  previousSnippet,
  status,
}: {
  previousSnippet: OwnerStatusSnippetRecord | null
  status: OwnerStatus | null
}) => ({
  ...(previousSnippet || {
    name: OWNER_STATUS_SNIPPET_NAME,
    reference: OWNER_STATUS_SNIPPET_REFERENCE,
    type: 'json',
  }),
  private: previousSnippet?.private ?? false,
  raw: JSON.stringify(status),
})
