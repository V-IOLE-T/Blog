type SessionPayload = {
  role?: string
} | null

const unwrapSessionPayload = (value: unknown): SessionPayload | undefined => {
  if (!value || typeof value !== 'object') return undefined

  if ('role' in value) {
    return value as SessionPayload
  }

  if ('data' in value) {
    return unwrapSessionPayload((value as { data?: unknown }).data)
  }

  return undefined
}

export const normalizeOwnerSession = (value: unknown): SessionPayload =>
  unwrapSessionPayload(value) ?? null
