'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import type { SyntheticEvent } from 'react'

import { useOwnerStatus } from '~/atoms/hooks/status'
import { clsxm } from '~/lib/helper'
import { useAggregationSelector } from '~/providers/root/aggregation-data-provider'

import { OwnerStatus } from './OwnerStatus'
import { useLiveQuery } from './useLiveQuery'

type SiteOwnerAvatarVariant = 'guest' | 'owner' | 'reader'

type SiteOwnerAvatarProps = {
  alt?: string
  className?: string
  showLiveAffordance?: boolean
  src?: string
  variant?: SiteOwnerAvatarVariant
}

export const SiteOwnerAvatar = ({
  alt,
  className,
  showLiveAffordance = true,
  src,
  variant = 'owner',
}: SiteOwnerAvatarProps) => {
  const t = useTranslations('common')
  const ownerAvatar = useAggregationSelector((data) => data.user.avatar)

  const { data: isLiving } = useLiveQuery()

  const ownerStatus = useOwnerStatus()
  const avatar =
    variant === 'owner'
      ? src || ownerAvatar || '/enter.svg'
      : src || '/enter.svg'
  const isOwnerAvatar = variant === 'owner'
  const isGuestAvatar = variant === 'guest'
  const isInteractiveLive = isOwnerAvatar && isLiving && showLiveAffordance
  const imageAlt =
    alt || (variant === 'guest' ? t('auth_login') : t('aria_site_owner_avatar'))
  const stopTriggerPropagation = (event: SyntheticEvent) => {
    event.stopPropagation()
  }

  return (
    <div
      className={clsxm(
        'pointer-events-none relative z-[9] size-[40px] select-none',
        isInteractiveLive ? 'rounded-full' : '',
        className,
      )}
    >
      <div
        className={clsxm(
          isInteractiveLive
            ? 'rounded-full'
            : isOwnerAvatar
              ? 'mask mask-squircle'
              : 'rounded-full',
          isGuestAvatar ? 'overflow-visible' : 'overflow-hidden',
        )}
      >
        <Image
          alt={imageAlt}
          height={40}
          src={avatar}
          width={40}
          className={clsxm(
            isGuestAvatar
              ? 'scale-110 object-contain p-1'
              : 'ring-2 ring-neutral-3',
          )}
          style={
            isGuestAvatar
              ? {
                  objectFit: 'contain',
                }
              : isOwnerAvatar && ownerStatus
                ? {
                    maskImage: `url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0wIDBINDBWMjcuMzQyN0MzOC4zNSAyNS4zMDM3IDM1LjgyNzMgMjQgMzMgMjRDMjguMDI5NCAyNCAyNCAyOC4wMjk0IDI0IDMzQzI0IDM1LjgyNzMgMjUuMzAzNyAzOC4zNSAyNy4zNDI3IDQwSDBWMFoiIGZpbGw9IiNEOUQ5RDkiLz4KPC9zdmc+Cg==")`,
                  }
                : undefined
          }
        />
      </div>
      {isOwnerAvatar && !isLiving && (
        <div
          className="pointer-events-auto"
          onClick={stopTriggerPropagation}
          onKeyDown={stopTriggerPropagation}
          onMouseDown={stopTriggerPropagation}
          onPointerDown={stopTriggerPropagation}
        >
          <OwnerStatus />
        </div>
      )}
      {isInteractiveLive && (
        <>
          <p className="absolute bottom-0 right-0 z-[1] rounded-md bg-red-400 p-1 font-[system-ui] text-[6px] text-white dark:bg-orange-700">
            LIVE
          </p>

          <div className="absolute inset-0 scale-100 animate-ping rounded-full ring-2 ring-red-500/80" />
        </>
      )}
    </div>
  )
}
