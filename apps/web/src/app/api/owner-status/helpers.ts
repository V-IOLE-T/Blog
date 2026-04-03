export type OwnerStatusPayload = {
  desc: string
  emoji: string
  untilAt: number
} | null

export const normalizeOwnerStatus = (value: unknown): OwnerStatusPayload => {
  if (!value || typeof value !== 'object') return null

  const candidate = value as Record<string, unknown>
  const desc = candidate.desc
  const emoji = candidate.emoji
  const untilAt = candidate.untilAt

  if (
    typeof desc !== 'string' ||
    typeof emoji !== 'string' ||
    typeof untilAt !== 'number'
  ) {
    return null
  }

  if (!desc.trim() || !emoji.trim() || untilAt <= Date.now()) {
    return null
  }

  return {
    desc: desc.trim(),
    emoji: emoji.trim(),
    untilAt,
  }
}

export const parseOwnerStatusSnippet = (
  payload: unknown,
): OwnerStatusPayload => {
  return normalizeOwnerStatus(payload)
}
