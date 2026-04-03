'use client'

import { m } from 'motion/react'
import { useTranslations } from 'next-intl'

import { useIsOwnerLogged } from '~/atoms/hooks/owner'
import { useSessionReader } from '~/atoms/hooks/reader'
import { useOwnerStatus } from '~/atoms/hooks/status'
import { useViewport } from '~/atoms/hooks/viewport'
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { FloatPopover } from '~/components/ui/float-popover'
import { GATEWAY_URL } from '~/constants/env'
import { useIsClient } from '~/hooks/common/use-is-client'
import { useOauthLoginModal } from '~/queries/hooks/authjs'

import { Activity } from './Activity'
import { getOwnerStatusTooltipText } from './owner-status-tooltip'
import { OwnerStatus, OwnerStatusPopoverContent } from './OwnerStatus'
import { SiteOwnerAvatar } from './SiteOwnerAvatar'
import { useLoginProvidersAvailability, UserAuthMenuContent } from './UserAuth'

const TapableLogo = () => {
  const t = useTranslations('common')
  const isOwner = useIsOwnerLogged()
  const session = useSessionReader()
  const ownerStatus = useOwnerStatus()
  const presentOauthModal = useOauthLoginModal()
  const isAuthenticated = isOwner || !!session
  const { canTriggerLogin } = useLoginProvidersAvailability()
  const ownerStatusTooltip = isOwner
    ? getOwnerStatusTooltipText(ownerStatus)
    : null

  const avatarVariant = isOwner ? 'owner' : session ? 'reader' : 'guest'
  const baseAriaLabel = !isAuthenticated
    ? t('auth_login')
    : isOwner
      ? t('aria_site_owner_avatar')
      : session?.name || t('auth_account')
  const triggerAriaLabel = ownerStatusTooltip
    ? `${baseAriaLabel} - ${ownerStatusTooltip}`
    : baseAriaLabel

  const avatar = (
    <SiteOwnerAvatar
      alt={baseAriaLabel}
      className="cursor-pointer"
      showLiveAffordance={false}
      showOwnerStatus={false}
      src={!isOwner ? session?.image || undefined : undefined}
      variant={avatarVariant}
    />
  )

  const trigger = (
    <button
      aria-label={triggerAriaLabel}
      className="rounded-full"
      type="button"
      onClick={() => {
        if (canTriggerLogin) {
          presentOauthModal()
          return
        }

        const gatewayUrl = GATEWAY_URL.replace(/\/$/, '')
        const adminLoginUrl = `${gatewayUrl || ''}/proxy/qaqdmin`
        window.location.assign(adminLoginUrl)
      }}
    >
      {avatar}
    </button>
  )

  if (!isAuthenticated) {
    return (
      <FloatPopover triggerElement={trigger} type="tooltip">
        <span>{t('auth_login')}</span>
      </FloatPopover>
    )
  }

  return (
    <DropdownMenu modal={false}>
      <div className="group relative overflow-visible">
        <DropdownMenuTrigger
          aria-haspopup="menu"
          aria-label={triggerAriaLabel}
          className="rounded-full"
          nativeButton={false}
        >
          {avatar}
        </DropdownMenuTrigger>
        {isOwner && <OwnerStatus />}
        <div className="pointer-events-none absolute left-1/2 top-[calc(100%+0.75rem)] z-[120] w-fit max-w-[18rem] -translate-x-1/2 rounded-xl border border-black/5 bg-paper px-4 py-2 opacity-0 shadow-[0_2px_12px_rgba(0,0,0,0.04),0_0_0_0.5px_rgba(0,0,0,0.03)] transition-opacity duration-150 group-hover:opacity-100 dark:border-white/8 dark:shadow-[0_4px_24px_rgba(0,0,0,0.3),0_0_0_0.5px_rgba(255,255,255,0.04)]">
          <OwnerStatusPopoverContent
            isLogged={isOwner}
            ownerStatus={ownerStatus}
          />
        </div>
      </div>
      <UserAuthMenuContent align="start" variant="entry" />
    </DropdownMenu>
  )
}
export const AnimatedLogo = () => {
  const isDesktop = useViewport(($) => $.lg && $.w !== 0)

  const isClient = useIsClient()
  if (!isClient) return null

  if (isDesktop)
    return (
      <>
        <TapableLogo />
        <Activity />
      </>
    )

  return (
    <m.div
      layout
      animate={{ opacity: 1 }}
      className="flex items-center will-change-[unset]!"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
    >
      <Activity />
      <TapableLogo />
    </m.div>
  )
}
