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
      src={!isOwner ? session?.image || undefined : undefined}
      variant={avatarVariant}
    />
  )

  const trigger = (
    <button
      aria-label={triggerAriaLabel}
      className="rounded-full"
      title={ownerStatusTooltip || t('auth_login')}
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
      <DropdownMenuTrigger
        aria-haspopup="menu"
        aria-label={triggerAriaLabel}
        className="rounded-full"
        nativeButton={false}
        title={ownerStatusTooltip || undefined}
      >
        {avatar}
      </DropdownMenuTrigger>
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
