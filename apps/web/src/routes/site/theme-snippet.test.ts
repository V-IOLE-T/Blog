import { RequestError } from '@mx-space/api-client'
import { describe, expect, it, vi } from 'vitest'

import {
  fetchThemeSnippetRecord,
  normalizeThemeSnippetRecord,
} from './theme-snippet'

describe('theme snippet helpers', () => {
  it('normalizes snippet id from _id when id is missing', () => {
    expect(
      normalizeThemeSnippetRecord({
        _id: 'mongo-id',
        name: 'shiro',
        raw: '{}',
        reference: 'theme',
        type: 'json',
      }),
    ).toMatchObject({
      _id: 'mongo-id',
      id: 'mongo-id',
      name: 'shiro',
    })
  })

  it('returns null when theme metadata list does not contain shiro', async () => {
    const client = {
      snippet: {
        proxy: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue([
            {
              _id: 'another-id',
              name: 'notes',
              raw: '{}',
              reference: 'theme',
              type: 'json',
            },
          ]),
        }),
      },
    }

    await expect(fetchThemeSnippetRecord(client as any)).resolves.toBeNull()
    expect(client.snippet.proxy).toHaveBeenCalledWith('group/theme')
  })

  it('finds shiro metadata from data-wrapped group listing responses', async () => {
    const client = {
      snippet: {
        proxy: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            data: [
              {
                _id: 'wrapped-id',
                name: 'shiro',
                raw: '{"config":{}}',
                reference: 'theme',
                type: 'json',
              },
            ],
          }),
        }),
      },
    }

    await expect(fetchThemeSnippetRecord(client as any)).resolves.toMatchObject(
      {
        id: 'wrapped-id',
        name: 'shiro',
        reference: 'theme',
        type: 'json',
      },
    )
  })

  it('unwraps data-wrapped snippet responses before normalizing fields', () => {
    expect(
      normalizeThemeSnippetRecord({
        data: {
          _id: 'wrapped-id',
          name: 'shiro',
          raw: '{"config":{}}',
          reference: 'theme',
          type: 'json',
        },
      }),
    ).toMatchObject({
      id: 'wrapped-id',
      name: 'shiro',
      reference: 'theme',
      type: 'json',
    })
  })

  it('rethrows non-auth failures from theme metadata list lookup', async () => {
    const error = new RequestError('Internal Server Error', 500, '/group/theme')
    const client = {
      snippet: {
        proxy: vi.fn().mockReturnValue({
          get: vi.fn().mockRejectedValue(error),
        }),
      },
    }

    await expect(fetchThemeSnippetRecord(client as any)).rejects.toBe(error)
  })
})
