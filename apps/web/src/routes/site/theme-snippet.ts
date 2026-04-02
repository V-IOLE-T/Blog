import { RequestError } from '@mx-space/api-client'

export type ThemeSnippetRecord = {
  id?: string
  _id?: string
  name: string
  reference: string
  type: string
  private?: boolean
  raw: string
}

type ThemeSnippetClientLike = {
  snippet: {
    proxy: (path: string) => {
      get: () => Promise<ThemeSnippetRecord[] | { data?: unknown }>
    }
  }
}

export const THEME_SNIPPET_REFERENCE = 'theme'
export const THEME_SNIPPET_NAME = 'shiro'

const unwrapThemeSnippetRecord = (
  record: ThemeSnippetRecord | { data?: unknown } | null | undefined,
): ThemeSnippetRecord | null => {
  if (!record || typeof record !== 'object') return null

  if (
    'name' in record &&
    'reference' in record &&
    'type' in record &&
    'raw' in record
  ) {
    return record as ThemeSnippetRecord
  }

  if ('data' in record) {
    return unwrapThemeSnippetRecord(record.data as ThemeSnippetRecord | null)
  }

  return null
}

const unwrapThemeSnippetRecords = (
  payload: ThemeSnippetRecord[] | { data?: unknown } | null | undefined,
): ThemeSnippetRecord[] => {
  if (Array.isArray(payload)) {
    return payload
      .map((item) => unwrapThemeSnippetRecord(item))
      .filter((item): item is ThemeSnippetRecord => !!item)
  }

  if (payload && typeof payload === 'object' && 'data' in payload) {
    return unwrapThemeSnippetRecords(
      payload.data as ThemeSnippetRecord[] | null,
    )
  }

  return []
}

export const normalizeThemeSnippetRecord = (
  record: ThemeSnippetRecord | { data?: unknown } | null | undefined,
) => {
  const unwrappedRecord = unwrapThemeSnippetRecord(record)
  return unwrappedRecord
    ? { ...unwrappedRecord, id: unwrappedRecord.id || unwrappedRecord._id }
    : null
}

export const fetchThemeSnippetRecord = async (
  client: ThemeSnippetClientLike,
) => {
  try {
    const records = await client.snippet.proxy('group/theme').get()
    const record = unwrapThemeSnippetRecords(records).find(
      (item) => item.name === THEME_SNIPPET_NAME,
    )

    return normalizeThemeSnippetRecord(record)
  } catch (error) {
    if (error instanceof RequestError && error.status === 404) {
      return null
    }

    throw error
  }
}
