// @vitest-environment happy-dom

import { NextIntlClientProvider } from 'next-intl'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { OwnerStatus } from './OwnerStatus'

let capturedModalContent: any = null
const mountedRoots: Root[] = []

globalThis.IS_REACT_ACT_ENVIRONMENT = true

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: null,
    isLoading: false,
  }),
}))

vi.mock('next/dynamic', () => ({
  default: () => () => <div data-emoji-picker="true" />,
}))

vi.mock('~/atoms/hooks/owner', () => ({
  useIsOwnerLogged: () => true,
}))

vi.mock('~/atoms/hooks/status', () => ({
  setOwnerStatus: vi.fn(),
  useOwnerStatus: () => null,
}))

vi.mock('~/components/ui/button', () => ({
  StyledButton: ({ isLoading: _isLoading, ...props }: any) => (
    <button {...props}>{props.children}</button>
  ),
}))

vi.mock('~/components/ui/form', () => ({
  Form: (props: any) => <form>{props.children}</form>,
  FormInput: (props: any) => (
    <input
      aria-label={props.name || props.placeholder || 'input'}
      defaultValue={props.defaultValue}
    />
  ),
}))

vi.mock('~/components/ui/modal', () => ({
  useCurrentModal: () => ({
    dismiss: vi.fn(),
  }),
  useModalStack: () => ({
    present: ({ content }: { content: any }) => {
      capturedModalContent = content
    },
  }),
}))

vi.mock('~/components/ui/select', () => ({
  Select: () => <select aria-label="time-type" />,
}))

vi.mock('~/hooks/common/use-is-active', () => ({
  usePageIsActive: () => true,
}))

vi.mock('~/lib/dom', () => ({
  stopPropagation: (event: Event) => event.stopPropagation(),
}))

vi.mock('~/lib/request', () => ({
  apiClient: {
    proxy: () => ({
      post: vi.fn(),
      put: vi.fn(),
    }),
  },
}))

vi.mock('~/lib/request.shared', () => ({
  getErrorMessageFromRequestError: () => 'request error',
}))

vi.mock('~/lib/toast', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock('~/providers/root/react-query-provider', () => ({
  queryClient: {
    invalidateQueries: vi.fn(),
  },
}))

vi.mock('./status-snippet', () => ({
  buildStatusSnippetMutationPayload: vi.fn(),
  fetchStatusSnippetRecord: vi.fn(),
}))

const messages = {
  common: {
    actions_reset: 'Reset',
    actions_submit: 'Submit',
    emoji_label: 'Emoji',
    status_click_to_set: 'Click to set status',
    status_desc_placeholder: 'Describe your status',
    status_desc_required: 'Status is required',
    status_duration_number: 'Duration should be a number',
    status_duration_placeholder: 'Duration',
    status_emoji_required: 'Emoji is required',
    status_set: 'Set status',
    time_day: 'Day',
    time_hour: 'Hour',
    time_minute: 'Minute',
    time_second: 'Second',
  },
}

const renderWithIntl = (element: JSX.Element) => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  mountedRoots.push(root)

  act(() => {
    root.render(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        {element}
      </NextIntlClientProvider>,
    )
  })

  return container
}

afterEach(() => {
  while (mountedRoots.length > 0) {
    const root = mountedRoots.pop()
    if (root) {
      act(() => {
        root.unmount()
      })
    }
  }
  capturedModalContent = null
  document.body.innerHTML = ''
})

describe('OwnerStatus', () => {
  it('can render the status modal content after clicking the trigger', () => {
    const container = renderWithIntl(<OwnerStatus />)
    const trigger = container.querySelector('div[role="button"]')

    expect(trigger).not.toBeNull()

    act(() => {
      trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(capturedModalContent).toBeTypeOf('function')

    const CapturedModalContent = capturedModalContent

    expect(() => {
      renderWithIntl(createElement(CapturedModalContent))
    }).not.toThrow()
  })
})
