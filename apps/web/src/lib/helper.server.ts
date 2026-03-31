import 'server-only'

import { simpleCamelcaseKeys } from '@mx-space/api-client'
import chroma from 'chroma-js'
import uniqolor from 'uniqolor'

import { appStaticConfig } from '~/app.static.config'
import { AGGREGATE_CACHE_TAG, withCacheTag } from '~/lib/cache-tags'

import { fetchServerApiJson } from './server-api-fetch'

export function escapeXml(unsafe: string) {
  return unsafe.replaceAll(/["&'<>]/g, (c) => {
    switch (c) {
      case '<': {
        return '&lt;'
      }
      case '>': {
        return '&gt;'
      }
      case '&': {
        return '&amp;'
      }
      case "'": {
        return '&apos;'
      }
      case '"': {
        return '&quot;'
      }
    }
    return c
  })
}

export const getOgUrl = async (
  type: 'post' | 'note' | 'page',
  data: any,
  locale?: string,
) => {
  const site = simpleCamelcaseKeys<{
    url: { webUrl: string }
  }>(
    await fetchServerApiJson('aggregate/site', {
      next: withCacheTag(AGGREGATE_CACHE_TAG, {
        revalidate: appStaticConfig.cache.ttl.aggregation,
      }),
    }),
  )

  const ogUrl = new URL(`/${locale || 'zh'}/og`, site.url.webUrl)
  ogUrl.searchParams.set(
    'data',
    encodeURIComponent(
      JSON.stringify({
        type,
        ...data,
      }),
    ),
  )
  return ogUrl
}
export const getBackgroundGradientBySeed = (seed: string) => {
  const bgAccent = uniqolor(seed, {
    saturation: [40, 55],
    lightness: [45, 55],
  }).color

  const bgAccentLight = uniqolor(seed, {
    saturation: [35, 45],
    lightness: [65, 75],
  }).color

  const bgAccentUltraLight = uniqolor(seed, {
    saturation: [25, 35],
    lightness: [80, 88],
  }).color

  return [bgAccent, bgAccentLight, bgAccentUltraLight]
}
export const getBackgroundGradientByBaseColor = (baseColor: string) => {
  const bgAccent = chroma(baseColor).set('hsl.s', 0.45).set('hsl.l', 0.5).hex()
  const bgAccentLight = chroma(baseColor)
    .set('hsl.s', 0.4)
    .set('hsl.l', 0.7)
    .hex()
  const bgAccentUltraLight = chroma(baseColor)
    .set('hsl.s', 0.3)
    .set('hsl.l', 0.85)
    .hex()

  return [bgAccent, bgAccentLight, bgAccentUltraLight]
}
