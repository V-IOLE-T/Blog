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

  it('returns null when exact theme snippet does not exist', async () => {
    const client = {
      snippet: {
        getByReferenceAndName: vi
          .fn()
          .mockRejectedValue(
            new RequestError('Not Found', 404, '/snippets/theme/shiro'),
          ),
      },
    }

    await expect(fetchThemeSnippetRecord(client as any)).resolves.toBeNull()
    expect(client.snippet.getByReferenceAndName).toHaveBeenCalledWith(
      'theme',
      'shiro',
    )
  })

  it('unwraps data-wrapped snippet responses before normalizing fields', async () => {
    const client = {
      snippet: {
        getByReferenceAndName: vi.fn().mockResolvedValue({
          data: {
            _id: 'wrapped-id',
            name: 'shiro',
            raw: '{"config":{}}',
            reference: 'theme',
            type: 'json',
          },
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

  it('rethrows non-404 errors from exact theme snippet lookup', async () => {
    const error = new RequestError(
      'Internal Server Error',
      500,
      '/snippets/theme/shiro',
    )
    const client = {
      snippet: {
        getByReferenceAndName: vi.fn().mockRejectedValue(error),
      },
    }

    await expect(fetchThemeSnippetRecord(client as any)).rejects.toBe(error)
  })
})
