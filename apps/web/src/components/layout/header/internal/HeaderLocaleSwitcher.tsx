'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useTransition } from 'react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import type { Locale } from '~/i18n/config'
import { locales } from '~/i18n/config'
import { usePathname, useRouter } from '~/i18n/navigation'
import { clsxm } from '~/lib/helper'

import { getHeaderLocaleTriggerLabel } from './HeaderLocaleSwitcher.config'

export const HeaderLocaleSwitcher = () => {
  const t = useTranslations('common')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const localeLabels: Record<Locale, string> = {
    zh: t('locale_zh'),
    en: t('locale_en'),
    ja: t('locale_ja'),
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={t('aria_header_action')}
          disabled={isPending}
          type="button"
          className={clsxm(
            'flex size-10 items-center justify-center rounded-full bg-neutral-1 text-[11px] font-semibold tracking-[0.08em] text-neutral-8 ring-1 ring-neutral-9/5 transition',
            'hover:bg-neutral-2 data-[open]:bg-neutral-2',
            isPending && 'opacity-50',
          )}
        >
          {getHeaderLocaleTriggerLabel(locale)}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {locales.map((nextLocale) => {
          const isCurrent = nextLocale === locale

          return (
            <DropdownMenuItem
              className={isCurrent ? 'bg-neutral-2/80' : ''}
              key={nextLocale}
              onClick={() => {
                if (isCurrent) return

                startTransition(() => {
                  router.push(pathname, { locale: nextLocale })
                })
              }}
            >
              <span className="flex w-full items-center justify-between gap-3">
                <span>{localeLabels[nextLocale]}</span>
                {isCurrent && (
                  <i className="i-mingcute-check-line text-accent" />
                )}
              </span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
