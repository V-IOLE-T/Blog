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
    getByReferenceAndName: (
      reference: string,
      name: string,
    ) => Promise<ThemeSnippetRecord>
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
    const record = await client.snippet.getByReferenceAndName(
      THEME_SNIPPET_REFERENCE,
      THEME_SNIPPET_NAME,
    )

    return normalizeThemeSnippetRecord(record)
  } catch (error) {
    if (error instanceof RequestError && error.status === 404) {
      return null
    }

    throw error
  }
}
