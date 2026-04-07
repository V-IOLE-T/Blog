import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useIsOwnerLogged } from '~/atoms/hooks/owner'
import { setOwnerStatus, useOwnerStatus } from '~/atoms/hooks/status'
import type { OwnerStatus as TOwnerStatus } from '~/atoms/status'
import { StyledButton } from '~/components/ui/button'
import { FloatPopover } from '~/components/ui/float-popover'
import type { FormContextType, InputFieldProps } from '~/components/ui/form'
import { Form, FormInput } from '~/components/ui/form'
import { useCurrentModal, useModalStack } from '~/components/ui/modal'
import { Select } from '~/components/ui/select'
import { usePageIsActive } from '~/hooks/common/use-is-active'
import { stopPropagation } from '~/lib/dom'
import { apiClient } from '~/lib/request'
import { getErrorMessageFromRequestError } from '~/lib/request.shared'
import { toast } from '~/lib/toast'
import { queryClient } from '~/providers/root/react-query-provider'

import {
  buildStatusSnippetMutationPayload,
  fetchStatusSnippetRecord,
} from './status-snippet'

const EmojiPicker = dynamic(
  () =>
    import('~/components/modules/shared/EmojiPicker').then(
      (mod) => mod.EmojiPicker,
    ),
  { loading: () => <div className="h-[400px] w-[400px]" /> },
)

export const OwnerStatus = () => {
  const t = useTranslations('common')
  const pageIsActive = usePageIsActive()
  const { data: statusFromRequest, isLoading: statusLoading } = useQuery({
    queryKey: ['shiro-status'],
    queryFn: async () => {
      const response = await fetch('/api/owner-status', {
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`)
      }

      const payload = (await response.json()) as {
        data: TOwnerStatus | null
      }

      return payload.data
    },
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    enabled: pageIsActive,
    meta: {
      persist: false,
    },
  })

  useEffect(() => {
    if (statusLoading) return
    if (!statusFromRequest) {
      setOwnerStatus(null)
    } else setOwnerStatus({ ...statusFromRequest })
  }, [statusFromRequest, statusLoading])

  const ownerStatus = useOwnerStatus()
  const isLogged = useIsOwnerLogged()

  const [mouseEnter, setMouseEnter] = useState(false)
  const { present } = useModalStack()
  const openSettingModal = useCallback(() => {
    present({
      title: t('status_set'),
      content: SettingStatusModalContent,
    })
  }, [present, t])
  const triggerElement = (
    <div
      role={isLogged ? 'button' : 'img'}
      tabIndex={isLogged ? 0 : -1}
      className={clsx(
        'pointer-events-auto absolute bottom-0 right-0 z-10 flex size-4 cursor-default items-center justify-center rounded-full text-accent duration-200',
        isLogged && mouseEnter && !ownerStatus
          ? 'size-6 rounded-full bg-neutral-1'
          : '',
        isLogged && mouseEnter && 'cursor-pointer',
      )}
      onClick={
        isLogged
          ? (e) => {
              e.stopPropagation()
              openSettingModal()
            }
          : stopPropagation
      }
      onKeyDown={
        isLogged
          ? (e) => {
              if (e.key !== 'Enter' && e.key !== ' ') return
              e.preventDefault()
              e.stopPropagation()
              openSettingModal()
            }
          : undefined
      }
      onMouseEnter={() => {
        setMouseEnter(true)
      }}
      onMouseLeave={() => {
        setMouseEnter(false)
      }}
    >
      {isLogged && mouseEnter ? (
        <i className="i-mingcute-emoji-line" />
      ) : (
        ownerStatus?.emoji
      )}
    </div>
  )

  if (!isLogged && !ownerStatus) return null
  return triggerElement
}

export const OwnerStatusPopoverContent = ({
  isLogged,
  ownerStatus,
}: {
  isLogged: boolean
  ownerStatus: TOwnerStatus | null
}) => {
  const t = useTranslations('common')

  if (!ownerStatus) {
    return isLogged ? (
      <p className="w-fit whitespace-nowrap text-base text-neutral-9">
        {t('status_click_to_set')}
      </p>
    ) : null
  }

  return (
    <div className="w-fit max-w-[18rem] text-lg">
      <p className="text-neutral-9">
        {ownerStatus.emoji} {ownerStatus.desc}
      </p>
      {!!ownerStatus.untilAt && (
        <p className="mt-1 text-sm text-neutral-7">
          {t('status_until')} {formatDatetime(ownerStatus.untilAt)}
        </p>
      )}
    </div>
  )
}
const formatDatetime = (ts: number) => {
  const date = new Date(ts)
  // 如果在明天
  if (new Date().getDate() !== date.getDate()) {
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
  }

  return date.toLocaleTimeString()
}

const SettingStatusModalContent = () => {
  const t = useTranslations('common')
  const ownerStatus = useOwnerStatus()
  const inputs = [
    {
      name: 'emoji',
      placeholder: 'Emoji *',
      defaultValue: ownerStatus?.emoji,
      rules: [
        {
          validator: (value: string) => !!value,
          message: t('status_emoji_required'),
        },
      ],
    },
    {
      name: 'desc',
      placeholder: t('status_desc_placeholder'),
      defaultValue: ownerStatus?.desc,
      rules: [
        {
          validator: (value: string) => !!value,
          message: t('status_desc_required'),
        },
      ],
    },
    {
      name: 'ttl',
      placeholder: t('status_duration_placeholder'),
      type: 'number',
      defaultValue: 1,
      rules: [
        {
          validator: (value: string) => !Number.isNaN(Number(value)),
          message: t('status_duration_number'),
        },
      ],
      transform(value) {
        return +value
      },
    },
  ] as InputFieldProps[]
  const formRef = useRef<FormContextType>(null)
  const { dismiss } = useCurrentModal()
  const [isLoading, setIsLoading] = useState(false)
  const [timeType, setTimeType] = useState<'m' | 's' | 'h' | 'd'>('m')

  const handleSubmit = useCallback(async () => {
    if (!formRef.current) return
    const currentValues = formRef.current.getCurrentValues()
    setIsLoading(true)
    const ttlSeconds =
      currentValues.ttl *
      {
        m: 60,
        s: 1,
        h: 60 * 60,
        d: 60 * 60 * 24,
      }[timeType]

    try {
      const nextStatus = {
        emoji: currentValues.emoji.trim(),
        desc: currentValues.desc.trim(),
        untilAt: Date.now() + ttlSeconds * 1000,
      }
      const existingSnippet = await fetchStatusSnippetRecord(apiClient)
      const payload = buildStatusSnippetMutationPayload({
        previousSnippet: existingSnippet,
        status: nextStatus,
      })

      if (payload.id) {
        await apiClient.proxy(`snippets/${payload.id}`).put({
          data: payload,
        })
      } else {
        const { id: _id, ...snippetPayload } = payload
        await apiClient.proxy('snippets').post({
          data: snippetPayload,
        })
      }

      setOwnerStatus(nextStatus)
      queryClient.invalidateQueries({
        queryKey: ['shiro-status'],
      })
      toast.success(t('status_set_success'))
      dismiss()
    } catch (error) {
      toast.error(getErrorMessageFromRequestError(error as any))
    } finally {
      setIsLoading(false)
    }
  }, [dismiss, timeType, t])

  const handleReset = useCallback(async () => {
    setIsLoading(true)
    try {
      const existingSnippet = await fetchStatusSnippetRecord(apiClient)
      const payload = buildStatusSnippetMutationPayload({
        previousSnippet: existingSnippet,
        status: null,
      })

      if (payload.id) {
        await apiClient.proxy(`snippets/${payload.id}`).put({
          data: payload,
        })
      } else {
        const { id: _id, ...snippetPayload } = payload
        await apiClient.proxy('snippets').post({
          data: snippetPayload,
        })
      }

      setOwnerStatus(null)
      queryClient.invalidateQueries({
        queryKey: ['shiro-status'],
      })
      toast.success(t('status_set_success'))
      dismiss()
    } catch (error) {
      toast.error(getErrorMessageFromRequestError(error as any))
    } finally {
      setIsLoading(false)
    }
  }, [dismiss, t])

  const wrapperRef = useRef<HTMLDivElement>(null)

  return (
    <Form className="flex flex-col gap-2" ref={formRef} onSubmit={handleSubmit}>
      <div className="relative flex flex-col gap-1" ref={wrapperRef}>
        <FormInput {...inputs[0]} />
        <FloatPopover
          headless
          mobileAsSheet
          popoverWrapperClassNames="z-[999]"
          trigger="click"
          triggerElement={
            <div
              className="center absolute right-2 top-3 flex"
              role="button"
              tabIndex={0}
            >
              <i className="i-mingcute-emoji-line" />
              <span className="sr-only">{t('emoji_label')}</span>
            </div>
          }
        >
          <EmojiPicker
            onEmojiSelect={(val) => {
              formRef.current?.setValue('emoji', val)
            }}
          />
        </FloatPopover>
      </div>
      {inputs.slice(1, -1).map((input) => (
        <FormInput key={input.name} {...input} />
      ))}

      <div className="mb-4 flex gap-2">
        <FormInput {...(inputs.at(-1) as InputFieldProps)} />
        <Select
          value={timeType}
          values={[
            { label: t('time_minute'), value: 'm' },
            { label: t('time_second'), value: 's' },
            { label: t('time_hour'), value: 'h' },
            { label: t('time_day'), value: 'd' },
          ]}
          onChange={setTimeType}
        />
      </div>

      <div className="center flex w-full gap-2">
        <StyledButton
          className="rounded-md"
          isLoading={isLoading}
          variant="secondary"
          onClick={handleReset}
        >
          {t('actions_reset')}
        </StyledButton>
        <StyledButton isLoading={isLoading} type="submit" variant="primary">
          {t('actions_submit')}
        </StyledButton>
      </div>
    </Form>
  )
}
