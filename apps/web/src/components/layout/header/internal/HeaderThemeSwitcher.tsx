'use client'

import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { flushSync } from 'react-dom'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { useIsClient } from '~/hooks/common/use-is-client'
import { transitionViewIfSupported } from '~/lib/dom'
import { clsxm } from '~/lib/helper'

import {
  getHeaderThemeIconName,
  normalizeHeaderTheme,
} from './HeaderThemeSwitcher.config'

const themes = ['light', 'system', 'dark'] as const

const ThemeIcon = ({
  name,
}: {
  name: ReturnType<typeof getHeaderThemeIconName>
}) => {
  if (name === 'sun') {
    return <i className="i-mingcute-sun-line text-[18px]" />
  }

  if (name === 'moon') {
    return <i className="i-mingcute-moon-line text-[18px]" />
  }

  return <i className="i-mingcute-computer-line text-[18px]" />
}

export const HeaderThemeSwitcher = () => {
  const t = useTranslations('common')
  const { theme, setTheme } = useTheme()
  const isClient = useIsClient()

  const currentTheme = normalizeHeaderTheme(isClient ? theme : undefined)
  const currentIcon = getHeaderThemeIconName(currentTheme)

  const labels = {
    light: t('aria_theme_light'),
    system: t('aria_theme_system'),
    dark: t('aria_theme_dark'),
  } as const
  const displayLabels = {
    light: t('theme_light'),
    system: t('theme_system'),
    dark: t('theme_dark'),
  } as const

  const handleSelect = (nextTheme: (typeof themes)[number]) => {
    if (nextTheme === currentTheme) return

    transitionViewIfSupported(() => {
      // eslint-disable-next-line @eslint-react/dom/no-flush-sync
      flushSync(() => setTheme(nextTheme))
    })
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={labels[currentTheme]}
          type="button"
          className={clsxm(
            'flex size-10 items-center justify-center rounded-full bg-neutral-1 text-neutral-8 ring-1 ring-neutral-9/5 transition',
            'hover:bg-neutral-2 data-[open]:bg-neutral-2',
          )}
        >
          <ThemeIcon name={currentIcon} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {themes.map((nextTheme) => {
          const isCurrent = nextTheme === currentTheme

          return (
            <DropdownMenuItem
              className={isCurrent ? 'bg-neutral-2/80' : ''}
              key={nextTheme}
              onClick={() => handleSelect(nextTheme)}
            >
              <span className="flex w-full items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <ThemeIcon name={getHeaderThemeIconName(nextTheme)} />
                  <span>{displayLabels[nextTheme]}</span>
                </span>
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
