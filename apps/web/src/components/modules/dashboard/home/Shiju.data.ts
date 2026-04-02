const POEM_REQUEST_TIMEOUT = 4000

export type ShiJuOrigin = {
  title: string
  dynasty: string
  author: string
  content: string[]
  matchTags: string[]
}

export interface ShiJuData {
  content: string
  id: number
  origin: ShiJuOrigin
}

type HitokotoPoemData = {
  hitokoto: string
  from: string
  from_who: string | null
}

export type DailyPoemCard =
  | {
      type: 'jinrishici'
      content: string
      origin: ShiJuOrigin
    }
  | {
      type: 'hitokoto'
      content: string
      from: string
      fromWho: string | null
    }

const fetchJsonWithTimeout = async <T>(
  url: string,
  timeout = POEM_REQUEST_TIMEOUT,
  fetcher: typeof fetch = fetch,
): Promise<T> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  try {
    const res = await fetcher(url, { signal: controller.signal })
    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`)
    }
    return (await res.json()) as T
  } finally {
    clearTimeout(timer)
  }
}

export const getJinRiShiCiOne = async (
  fetcher: typeof fetch = fetch,
): Promise<ShiJuData> => {
  const json = await fetchJsonWithTimeout<{ data: ShiJuData }>(
    'https://v2.jinrishici.com/one.json',
    POEM_REQUEST_TIMEOUT,
    fetcher,
  )
  return json.data
}

const getHitokotoPoem = async (
  fetcher: typeof fetch = fetch,
): Promise<DailyPoemCard | null> => {
  const json = await fetchJsonWithTimeout<HitokotoPoemData>(
    'https://v1.hitokoto.cn/?c=i',
    POEM_REQUEST_TIMEOUT,
    fetcher,
  )

  if (!json.hitokoto) return null

  return {
    type: 'hitokoto',
    content: json.hitokoto,
    from: json.from || '未知出处',
    fromWho: json.from_who,
  }
}

export const getDashboardPoem = async (
  fetcher: typeof fetch = fetch,
): Promise<DailyPoemCard | null> => {
  try {
    const data = await getJinRiShiCiOne(fetcher)
    return {
      type: 'jinrishici',
      content: data.content,
      origin: data.origin,
    }
  } catch {
    try {
      return await getHitokotoPoem(fetcher)
    } catch {
      return null
    }
  }
}
