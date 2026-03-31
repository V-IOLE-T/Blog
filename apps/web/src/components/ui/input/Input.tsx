import type { DetailedHTMLProps, InputHTMLAttributes } from 'react'

import { useInputComposition } from '~/hooks/common/use-input-composition'
import { clsxm } from '~/lib/helper'

import { fieldFocusClassName, fieldSurfaceClassName } from './styles'

// This composition handler is not perfect
// @see https://foxact.skk.moe/use-composition-input
export const Input = ({
  ref,
  className,
  ...props
}: DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>) => {
  const inputProps = useInputComposition(props)
  return (
    <input
      ref={ref as any}
      className={clsxm(
        'min-w-0 flex-auto appearance-none rounded-xl px-3.5 py-[calc(.625rem-1px)] font-sans text-sm text-neutral-8 duration-200 sm:text-sm lg:text-base',
        'placeholder:text-neutral-5 focus-visible:outline-hidden',
        'disabled:cursor-not-allowed disabled:opacity-55',
        fieldSurfaceClassName,
        fieldFocusClassName,
        props.type === 'password'
          ? 'font-mono placeholder:font-sans'
          : 'font-sans',
        className,
      )}
      {...props}
      {...inputProps}
    />
  )
}
Input.displayName = 'Input'
