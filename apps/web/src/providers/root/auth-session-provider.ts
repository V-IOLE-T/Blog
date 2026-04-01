import { simpleCamelcaseKeys } from '@mx-space/api-client'
import { useQuery } from '@tanstack/react-query'
import { nanoid } from 'nanoid'
import { useEffect } from 'react'

import { setAdminUrl } from '~/atoms'
import { setIsOwnerLogged } from '~/atoms/hooks/owner'
import { setSessionReader } from '~/atoms/hooks/reader'
import type { authClient } from '~/lib/authjs'
import { getOpenPanel } from '~/lib/openpanel'
import { apiClient } from '~/lib/request'

type AdapterUser = typeof authClient.$Infer.Session
export const AuthSessionProvider: Component = ({ children }) => {
  const { data: session } = useQuery({
    queryKey: ['session'],
    refetchOnMount: 'always',
    queryFn: () =>
      apiClient.proxy.auth.session.get<AdapterUser>({
        params: {
          r: nanoid(),
        },
      }),
  })
  useEffect(() => {
    let disposed = false

    if (!session) {
      setIsOwnerLogged(false)
      setSessionReader(null)
      setAdminUrl(null)
      return
    }
    const transformedData = simpleCamelcaseKeys(session)
    const isOwner = transformedData.role === 'owner'

    setSessionReader(transformedData)
    setIsOwnerLogged(isOwner)
    if (!isOwner) {
      setAdminUrl(null)
    } else {
      void apiClient
        .proxy('config/url')
        .get<{ data?: { adminUrl?: string | null } }>()
        .then((response) => {
          if (disposed) return
          const urlConfig = simpleCamelcaseKeys(response.data || {})
          setAdminUrl(urlConfig.adminUrl || null)
        })
        .catch(() => {
          if (disposed) return
          setAdminUrl(null)
        })
    }
    const op = getOpenPanel()
    if (op) {
      op.identify({
        profileId: transformedData.id,
        email: transformedData.email,
        lastName: transformedData.name,
        avatar: transformedData.avatar,
      })
    }
    return () => {
      disposed = true
    }
  }, [session])
  return children
}
