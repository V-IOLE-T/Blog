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

export const normalizeThemeSnippetRecord = (
  record: ThemeSnippetRecord | null | undefined,
) => (record ? { ...record, id: record.id || record._id } : null)

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
