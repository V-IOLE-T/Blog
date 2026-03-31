'use client'

import type {
  DetailedHTMLProps,
  PropsWithChildren,
  TextareaHTMLAttributes,
} from 'react'
import { useCallback } from 'react'

import { useInputComposition } from '~/hooks/common/use-input-composition'
import { clsxm } from '~/lib/helper'

import {
  fieldWrapperBaseClassName,
  fieldWrapperFocusClassName,
  inputRoundedMap,
  noteFieldSurfaceClassName,
} from './styles'

export const TextArea = ({
  ref,
  ...props
}: DetailedHTMLProps<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  HTMLTextAreaElement
> &
  PropsWithChildren<{
    wrapperClassName?: string
    onCmdEnter?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
    rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'default'
    bordered?: boolean
  }>) => {
  const {
    className,
    wrapperClassName,
    children,
    rounded = 'xl',
    bordered = true,
    onCmdEnter,
    onKeyDown,
    ...rest
  } = props
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        onCmdEnter?.(e)
      }
      onKeyDown?.(e)
    },
    [onCmdEnter, onKeyDown],
  )
  const inputProps = useInputComposition(
    Object.assign({}, props, { onKeyDown: handleKeyDown }),
  )
  return (
    <div
      className={clsxm(
        'relative',
        inputRoundedMap[rounded],
        bordered && [
          fieldWrapperBaseClassName,
          fieldWrapperFocusClassName,
          noteFieldSurfaceClassName,
        ],
        !bordered && 'border-transparent bg-transparent shadow-none',
        wrapperClassName,
      )}
    >
      <textarea
        ref={ref as any}
        className={clsxm(
          'size-full resize-none bg-transparent font-sans text-sm text-neutral-8',
          'overflow-auto px-3.5 py-3.5',
          'focus:outline-hidden',
          'placeholder:text-neutral-5',
          rounded === 'default'
            ? inputRoundedMap.default
            : inputRoundedMap[rounded],
          className,
        )}
        {...rest}
        {...inputProps}
      />

      {children}
    </div>
  )
}
TextArea.displayName = 'TextArea'
