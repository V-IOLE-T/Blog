'use client'

import Image from 'next/image'

import type { OwnerStatus as TOwnerStatus } from '~/atoms/status'
import {
  getOwnerStatusPopoverClassNames,
  getOwnerStatusTooltipText,
} from '~/components/layout/header/internal/owner-status-tooltip'
import { OwnerStatusPopoverContent } from '~/components/layout/header/internal/OwnerStatus'
import { FloatPopover } from '~/components/ui/float-popover'
import { clsxm } from '~/lib/helper'

type HeroOwnerAvatarProps = {
  alt: string
  className?: string
  ownerStatus: TOwnerStatus | null
  size: number
  src: string
}

export const HeroOwnerAvatar = ({
  alt,
  className,
  ownerStatus,
  size,
  src,
}: HeroOwnerAvatarProps) => {
  const tooltipText = getOwnerStatusTooltipText(ownerStatus)

  const avatar = (
    <div className={clsxm('relative inline-flex shrink-0', className)}>
      <Image
        alt={alt}
        className="rounded-full border border-neutral-4 shadow-sm"
        height={size}
        src={src}
        width={size}
      />
      {ownerStatus && (
        <div className="pointer-events-none absolute bottom-0 right-0 z-10 flex size-5 items-center justify-center rounded-full bg-paper text-[12px] shadow-[0_1px_4px_rgba(0,0,0,0.08)] ring-1 ring-black/6">
          {ownerStatus.emoji}
        </div>
      )}
    </div>
  )

  if (!ownerStatus) {
    return avatar
  }

  return (
    <FloatPopover
      placement="bottom"
      trigger="both"
      type="tooltip"
      popoverClassNames={clsxm(
        '!break-normal !px-4 !py-3',
        getOwnerStatusPopoverClassNames(),
      )}
      triggerElement={
        <button
          aria-label={tooltipText ? `${alt} - ${tooltipText}` : alt}
          className="rounded-full"
          type="button"
        >
          {avatar}
        </button>
      }
    >
      <OwnerStatusPopoverContent isLogged={false} ownerStatus={ownerStatus} />
    </FloatPopover>
  )
}
