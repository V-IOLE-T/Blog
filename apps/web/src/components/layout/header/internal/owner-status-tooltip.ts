import type { OwnerStatus } from '~/atoms/status'

export const getOwnerStatusTooltipText = (status: OwnerStatus | null) => {
  if (!status?.desc?.trim() || !status?.emoji?.trim()) {
    return null
  }

  return `${status.emoji.trim()} ${status.desc.trim()}`
}

export const getOwnerStatusPopoverClassNames = () =>
  'w-max min-w-[10.5rem] max-w-[14rem]'
