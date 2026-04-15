import type { PageModel } from '@mx-space/api-client'
import { cache } from 'react'

import { attachServerFetch } from '~/lib/attach-fetch'
import { apiClient } from '~/lib/request'
import { requestErrorHandler } from '~/lib/request.server'

import { buildPageQueryParams } from './page-query'

export interface PageParams extends LocaleParams {
  slug: string
}

export { buildPageQueryParams } from './page-query'

export const getData = cache(async (slug: string, locale: string) => {
  await attachServerFetch()
  const data = await apiClient.page.proxy
    .slug(slug)
    .get<PageModel>({
      params: buildPageQueryParams(locale),
    })
    .catch(requestErrorHandler)
  return data
})
