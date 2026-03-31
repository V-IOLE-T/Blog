// @see https://x.com/huozhi/status/1921693249577889878
import '../styles/index.css'

import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

import { NotFound404 } from '~/components/common/404'
import { Global } from '~/components/common/Global'
import { AccentColorStyleInjector } from '~/components/modules/shared/AccentColorStyleInjector'
import { defaultLocale } from '~/i18n/config'
import { sansFont, serifFont } from '~/lib/fonts'

import defaultMessages from '../messages/zh'
import { fetchAggregationData } from './[locale]/api'

export default async function GlobalNotFound() {
  const locale = defaultLocale
  setRequestLocale(locale)
  const messages = defaultMessages

  const data = await fetchAggregationData({ locale }).catch(() => null)

  return (
    <html suppressHydrationWarning className="noise themed" lang={locale}>
      <head>
        <Global />
        {data?.theme.config?.color && (
          <AccentColorStyleInjector color={data.theme.config.color} />
        )}
      </head>
      <body
        suppressHydrationWarning
        className={`${sansFont.variable} ${serifFont.variable} m-0 h-full p-0 font-sans`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <div data-theme className="min-h-screen" id="root">
            <NotFound404 />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  title: "This planet doesn't have knowledge yet, go explore other places.",
  robots: {
    index: false,
  },
}
