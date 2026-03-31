import type { MetadataRoute } from 'next'

import { AGGREGATE_CACHE_TAG, withCacheTag } from '~/lib/cache-tags'
import { fetchServerApiJson } from '~/lib/server-api-fetch'

export default async function robots(): Promise<MetadataRoute.Robots> {
  let sitemapUrl = '/sitemap'
  try {
    const data = (await fetchServerApiJson('aggregate/site', {
      next: withCacheTag(AGGREGATE_CACHE_TAG, { revalidate: 3600 }),
    })) as any
    const webUrl = data?.url?.webUrl || data?.url?.web_url
    if (webUrl) {
      sitemapUrl = `${webUrl}/sitemap`
    }
  } catch {}

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/login/', '/preview/', '/dashboard', '/_next'],
      },
    ],
    sitemap: sitemapUrl,
  }
}
