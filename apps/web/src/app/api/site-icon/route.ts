import { simpleCamelcaseKeys } from '@mx-space/api-client'
import { NextResponse } from 'next/server'

import { fetchServerApiJson } from '~/lib/server-api-fetch'

import { resolveSiteIconSource } from './shared'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'CDN-Cache-Control': 'no-store',
  'Cloudflare-CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
}

type SiteIconPayload = {
  seo?: {
    icon?: string
  }
  theme?: {
    config?: {
      site?: {
        favicon?: string
      }
    }
  }
  user?: {
    avatar?: string
  }
}

export const GET = async (request: Request) => {
  const data = simpleCamelcaseKeys<SiteIconPayload>(
    await fetchServerApiJson('aggregate', {
      next: { revalidate: 0 },
      origin: new URL(request.url).origin,
      query: {
        theme: 'shiro',
      },
    }),
  )

  const source = resolveSiteIconSource({
    ownerAvatar: data.user?.avatar,
    seoIcon: data.seo?.icon,
    themeFavicon: data.theme?.config?.site?.favicon,
  })

  const location = source.startsWith('http')
    ? source
    : new URL(source, request.url).toString()

  return NextResponse.redirect(location, {
    headers: noStoreHeaders,
  })
}
