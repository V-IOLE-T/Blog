import { describe, expect, it } from 'vitest'

import { normalizeOwnerSession } from './session'

describe('normalizeOwnerSession', () => {
  it('unwraps session payload nested in data', () => {
    expect(
      normalizeOwnerSession({
        data: {
          role: 'owner',
          name: 'OO',
        },
      }),
    ).toMatchObject({
      role: 'owner',
      name: 'OO',
    })
  })

  it('keeps direct session payloads intact', () => {
    expect(
      normalizeOwnerSession({
        role: 'owner',
        name: 'OO',
      }),
    ).toMatchObject({
      role: 'owner',
      name: 'OO',
    })
  })
})
