import { describe, expect, it, vi } from 'vitest'

import { getDashboardPoem, getJinRiShiCiOne } from './Shiju.data'

describe('Shiju helpers', () => {
  it('returns jinrishici poem data when primary source is available', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          content: '山重水复疑无路，柳暗花明又一村。',
          id: 1,
          origin: {
            title: '游山西村',
            dynasty: '宋代',
            author: '陆游',
            content: ['山重水复疑无路，柳暗花明又一村。'],
            matchTags: [],
          },
        },
      }),
    })

    await expect(getJinRiShiCiOne(fetcher as any)).resolves.toMatchObject({
      content: '山重水复疑无路，柳暗花明又一村。',
      origin: {
        title: '游山西村',
      },
    })
  })

  it('falls back to hitokoto poem when jinrishici is unavailable', async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hitokoto: '乱花渐欲迷人眼，浅草才能没马蹄。',
          from: '钱塘湖春行',
          from_who: '白居易',
        }),
      })

    await expect(getDashboardPoem(fetcher as any)).resolves.toEqual({
      type: 'hitokoto',
      content: '乱花渐欲迷人眼，浅草才能没马蹄。',
      from: '钱塘湖春行',
      fromWho: '白居易',
    })
  })

  it('returns null when both sources fail', async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error('timeout'))
      .mockRejectedValueOnce(new Error('network'))

    await expect(getDashboardPoem(fetcher as any)).resolves.toBeNull()
  })
})
