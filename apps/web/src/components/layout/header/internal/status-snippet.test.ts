import { describe, expect, it, vi } from 'vitest'

import {
  buildStatusSnippetMutationPayload,
  fetchStatusSnippetRecord,
} from './status-snippet'

describe('status snippet helpers', () => {
  it('unwraps group payloads and returns the owner status snippet', async () => {
    const client = {
      snippet: {
        proxy: vi.fn(() => ({
          get: vi.fn(async () => ({
            data: [
              {
                data: {
                  _id: 'snippet-id',
                  name: 'owner',
                  reference: 'status',
                  type: 'json',
                  private: false,
                  raw: '{"emoji":"✍️","desc":"Writing"}',
                },
              },
            ],
          })),
        })),
      },
    }

    await expect(fetchStatusSnippetRecord(client)).resolves.toMatchObject({
      id: 'snippet-id',
      name: 'owner',
      reference: 'status',
    })
  })

  it('builds a create payload when snippet does not exist', () => {
    expect(
      buildStatusSnippetMutationPayload({
        previousSnippet: null,
        status: {
          emoji: '✍️',
          desc: 'Writing',
          untilAt: 1_234,
        },
      }),
    ).toEqual({
      name: 'owner',
      reference: 'status',
      type: 'json',
      private: false,
      raw: '{"emoji":"✍️","desc":"Writing","untilAt":1234}',
    })
  })
})
