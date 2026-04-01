'use client'

import { useQuery } from '@tanstack/react-query'
import { AnimatePresence } from 'motion/react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import type { CSSProperties } from 'react'
import { Fragment } from 'react'

import { getAdminUrl } from '~/atoms'
import { useIsOwnerLogged } from '~/atoms/hooks/owner'
import { useSessionReader } from '~/atoms/hooks/reader'
import { useIsMobile } from '~/atoms/hooks/viewport'
import { UserArrowLeftIcon } from '~/components/icons/user-arrow-left'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { EllipsisHorizontalTextWithTooltip } from '~/components/ui/typography'
import { useIsClient } from '~/hooks/common/use-is-client'
import { authClient } from '~/lib/authjs'
import { apiClient } from '~/lib/request'
import { useAggregationSelector } from '~/providers/root/aggregation-data-provider'
import { useOauthLoginModal } from '~/queries/hooks/authjs'

import { HeaderActionButton } from './HeaderActionButton'
import { useMenuOpacity } from './hooks'
import { UserAuthFromIcon } from './UserAuthFromIcon'

const OwnerAvatar = () => {
  const t = useTranslations('common')
  const ownerAvatar = useAggregationSelector((s) => s.user.avatar)!

  return (
    <div className="pointer-events-auto relative flex items-center justify-center">
      <Image
        alt={t('aria_site_owner_avatar')}
        className="rounded-full"
        height={36}
        src={ownerAvatar}
        width={36}
      />
      <UserAuthFromIcon className="absolute -bottom-1 right-0" />
    </div>
  )
}

type UserAuthMenuVariant = 'default' | 'entry'

type UserAuthMenuContentProps = {
  align?: 'center' | 'end' | 'start'
  variant?: UserAuthMenuVariant
}

export const useLoginProvidersAvailability = () => {
  const {
    data: providers,
    fetchStatus,
    status,
  } = useQuery({
    queryKey: ['providers'],
    queryFn: () =>
      apiClient.proxy.auth.providers
        .get<{
          data: string[]
        }>()
        .then((res) => res.data),
    refetchOnMount: 'always',
    meta: {
      persist: true,
    },
  })

  const hasProviders = !!providers?.length
  const isPending = fetchStatus === 'fetching'
  const canTriggerLogin =
    status === 'success' && fetchStatus !== 'fetching' && hasProviders
  const canShowLoginEntry = isPending || canTriggerLogin

  return {
    canShowLoginEntry,
    canTriggerLogin,
    hasProviders,
    isPending,
    shouldHideLoginEntry: !isPending && !canTriggerLogin,
  }
}

export const UserAuthMenuContent = ({
  align = 'end',
  variant = 'default',
}: UserAuthMenuContentProps) => {
  const t = useTranslations('common')
  const isOwner = useIsOwnerLogged()
  const session = useSessionReader()

  if (!session && !isOwner) return null

  const showReaderSummary = !!session && (!isOwner || variant === 'default')

  return (
    <DropdownMenuContent
      keepMounted
      align={align}
      className="relative flex max-w-[30ch] flex-col"
      positionMethod="fixed"
      sideOffset={8}
    >
      {showReaderSummary && (
        <Fragment>
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs text-neutral-9/60">
              {t('auth_account')}
            </DropdownMenuLabel>
            <DropdownMenuLabel className="min-w-0">
              <div className="-mt-1 flex min-w-0 items-center gap-2">
                <img
                  alt={session.name || t('auth_account')}
                  className="size-8 rounded-full"
                  src={session.image}
                />
                <div className="min-w-0 max-w-40 leading-none">
                  <div className="truncate">{session.name}</div>
                  <EllipsisHorizontalTextWithTooltip className="min-w-0 truncate text-xs text-neutral-9/60">
                    {session.handle ? `@${session.handle}` : session.email}
                  </EllipsisHorizontalTextWithTooltip>
                </div>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
        </Fragment>
      )}

      {isOwner && (
        <Fragment>
          <DropdownMenuItem
            icon={<i className="i-mingcute-dashboard-3-line size-4" />}
            onClick={() => {
              window.open('/dashboard', '_blank')
            }}
          >
            {t('auth_dashboard')}
          </DropdownMenuItem>
          <DropdownMenuItem
            icon={<i className="i-mingcute-dashboard-2-line size-4" />}
            onClick={() => {
              const adminUrl = getAdminUrl()
              if (adminUrl) {
                window.open(adminUrl, '_blank')
              }
            }}
          >
            {t('auth_console')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
        </Fragment>
      )}
      <DropdownMenuItem
        icon={<i className="i-mingcute-exit-line size-4" />}
        onClick={async () => {
          await apiClient.owner.logout().catch(() => {})
          await authClient.signOut().then((res) => {
            if (res.data?.success) window.location.reload()
          })
        }}
      >
        {t('auth_logout')}
      </DropdownMenuItem>
    </DropdownMenuContent>
  )
}

export function UserAuth() {
  const t = useTranslations('common')
  const isOwner = useIsOwnerLogged()
  const isClient = useIsClient()
  const session = useSessionReader()
  const isMobile = useIsMobile()
  const menuOpacity = useMenuOpacity()
  const opacityStyle: CSSProperties | undefined =
    isMobile && menuOpacity !== undefined
      ? {
          opacity: menuOpacity,
          visibility: menuOpacity === 0 ? 'hidden' : 'visible',
        }
      : undefined

  const presentOauthModal = useOauthLoginModal()
  const isAuthenticated = isOwner || !!session
  const { canShowLoginEntry, canTriggerLogin, shouldHideLoginEntry } =
    useLoginProvidersAvailability()

  const hoverOnly = !isMobile

  if (!isClient || (!isAuthenticated && shouldHideLoginEntry)) return null

  return (
    <AnimatePresence>
      <div style={opacityStyle}>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger nativeButton={false} openOnHover={hoverOnly}>
            {isOwner ? (
              <OwnerAvatar />
            ) : session ? (
              <ReaderAvatar />
            ) : (
              canShowLoginEntry && (
                <HeaderActionButton
                  aria-disabled={!canTriggerLogin}
                  aria-label={t('aria_login')}
                  title={t('auth_login')}
                  onClick={
                    canTriggerLogin ? () => presentOauthModal() : undefined
                  }
                >
                  <UserArrowLeftIcon className="size-4" />
                </HeaderActionButton>
              )
            )}
          </DropdownMenuTrigger>

          {isAuthenticated && <UserAuthMenuContent />}
        </DropdownMenu>
      </div>
    </AnimatePresence>
  )
}

const ReaderAvatar = () => {
  const session = useSessionReader()!

  return (
    <div className="pointer-events-auto relative flex items-center justify-center">
      <Image
        alt={session.name}
        className="rounded-full"
        height={36}
        src={session.image}
        width={36}
      />
      <UserAuthFromIcon className="absolute -bottom-1 right-0" />
    </div>
  )
}
