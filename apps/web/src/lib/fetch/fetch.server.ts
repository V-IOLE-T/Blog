import 'server-only'

import { createFetch } from 'ofetch'

import PKG from '~/../package.json'

import { createApiClient, createFetchAdapter } from './shared'

const isDev = process.env.NODE_ENV === 'development'

/**
 * Server-side fetch client.
 *
 * IMPORTANT: This client intentionally does NOT call `cookies()` or
 * `headers()` from `next/headers`.  Calling those dynamic APIs would opt
 * every route that uses apiClient into dynamic rendering, preventing ISR
 * and on-demand revalidation via webhooks.
 *
 * - Auth is handled entirely client-side by `AuthSessionProvider`.
 * - Locale is set via the explicit `x-lang` header attached by callers.
 * - IP forwarding is unnecessary for cached/ISR renders.
 */
export const $fetch = createFetch({
  defaults: {
    timeout: 8000,
    async onRequest(context) {
      let headers: any = context.options.headers
      if (headers && headers instanceof Headers) {
        headers = Object.fromEntries(headers.entries())
      } else {
        headers = {}
      }

      context.options.params ??= {}

      if (isDev) {
        console.info(`[Request/Server]: ${context.request}`)
      }

      headers['User-Agent'] =
        `NextJS/v${PKG.dependencies.next} ${PKG.name}/${PKG.version}`

      context.options.headers = headers
    },
    onResponse(context) {
      console.info(
        `[Response/Server]: ${context.request}`,
        context.response.status,
      )
    },
  },
})
export const apiClient = createApiClient(createFetchAdapter($fetch))

const Noop = () => null
export const attachFetchHeader = () => Noop

export const setGlobalSearchParams = Noop
export const clearGlobalSearchParams = Noop

export const isReactServer = true
