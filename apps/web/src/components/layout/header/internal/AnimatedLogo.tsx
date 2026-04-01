'use client'

import { m } from 'motion/react'
import { useTranslations } from 'next-intl'

import { useIsOwnerLogged } from '~/atoms/hooks/owner'
import { useSessionReader } from '~/atoms/hooks/reader'
import { useViewport } from '~/atoms/hooks/viewport'
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { useIsClient } from '~/hooks/common/use-is-client'
import { useOauthLoginModal } from '~/queries/hooks/authjs'

import { Activity } from './Activity'
import { SiteOwnerAvatar } from './SiteOwnerAvatar'
import { useLoginProvidersAvailability, UserAuthMenuContent } from './UserAuth'

const TapableLogo = () => {
  const t = useTranslations('common')
  const isOwner = useIsOwnerLogged()
  const session = useSessionReader()
  const presentOauthModal = useOauthLoginModal()
  const isAuthenticated = isOwner || !!session
  const { shouldHideLoginEntry } = useLoginProvidersAvailability()

  const avatarVariant = isOwner ? 'owner' : session ? 'reader' : 'guest'
  const avatarAlt = !isAuthenticated
    ? t('auth_login')
    : isOwner
      ? t('aria_site_owner_avatar')
      : session?.name || t('auth_account')

  const avatar = (
    <SiteOwnerAvatar
      alt={avatarAlt}
      showLiveAffordance={false}
      src={!isOwner ? session?.image || undefined : undefined}
      variant={avatarVariant}
      className={
        !shouldHideLoginEntry || isAuthenticated ? 'cursor-pointer' : undefined
      }
    />
  )

  if (!isAuthenticated && shouldHideLoginEntry) {
    return avatar
  }

  const trigger = (
    <button
      className="rounded-full"
      title={t('auth_login')}
      type="button"
      aria-label={
        !isAuthenticated
          ? t('aria_login')
          : isOwner
            ? t('aria_site_owner_avatar')
            : session?.name || t('auth_account')
      }
      onClick={() => presentOauthModal()}
    >
      {avatar}
    </button>
  )

  if (!isAuthenticated) {
    return trigger
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-haspopup="menu"
        className="rounded-full"
        nativeButton={false}
        aria-label={
          isOwner
            ? t('aria_site_owner_avatar')
            : session?.name || t('auth_account')
        }
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
