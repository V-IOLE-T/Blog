export const FALLBACK_SITE_ICON_PATH = '/favicon.ico'

const normalizeIconCandidate = (value: null | string | undefined) => {
  const trimmed = value?.trim()
  return trimmed || null
}

export const resolveSiteIconSource = ({
  ownerAvatar,
  seoIcon,
  themeFavicon,
}: {
  ownerAvatar?: null | string
  seoIcon?: null | string
  themeFavicon?: null | string
}) =>
  normalizeIconCandidate(ownerAvatar) ||
  normalizeIconCandidate(seoIcon) ||
  normalizeIconCandidate(themeFavicon) ||
  FALLBACK_SITE_ICON_PATH
