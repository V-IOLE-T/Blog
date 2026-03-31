'use client'

import clsx from 'clsx'
import { typescriptHappyForwardRef } from 'foxact/typescript-happy-forward-ref'
import { atom, useAtomValue } from 'jotai'
import type { HTMLMotionProps } from 'motion/react'
import { AnimatePresence, m } from 'motion/react'
import { useTranslations } from 'next-intl'
import type * as React from 'react'
import type { JSX, PropsWithChildren, ReactNode } from 'react'
import { useEffect, useId } from 'react'

import { useIsMobile } from '~/atoms/hooks/viewport'
import { useTypeScriptHappyCallback } from '~/hooks/common/use-callback'
import { clsxm } from '~/lib/helper'
import { jotaiStore } from '~/lib/store'
import { usePageScrollDirectionSelector } from '~/providers/root/page-scroll-info-provider'

import { RootPortal } from '../portal'

const fabContainerElementAtom = atom(null as HTMLDivElement | null)

export interface FABConfig {
  icon: JSX.Element
  id: string
  onClick: () => void
}

export const FABBase = typescriptHappyForwardRef(
  (
    props: PropsWithChildren<
      {
        id: string
        show?: boolean
        children: JSX.Element
      } & HTMLMotionProps<'button'>
    >,
    ref: React.ForwardedRef<HTMLButtonElement>,
  ) => {
    const t = useTranslations('common')
    const { children, show = true, ...extra } = props
    const { className, ...rest } = extra

    return (
      <AnimatePresence initial={false}>
        {show && (
          <m.div
            className="mt-2 overflow-hidden"
            style={{ transformOrigin: 'right center' }}
            animate={{
              opacity: 1,
              x: 0,
              width: 44,
            }}
            exit={{
              opacity: 0,
              x: 18,
              width: 0,
            }}
            initial={{
              opacity: 0,
              x: 18,
              width: 0,
            }}
            transition={{
              duration: 0.28,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <m.button
              aria-label={rest['aria-label'] || t('aria_fab')}
              ref={ref}
              whileTap={{ x: 1 }}
              className={clsxm(
                'group relative flex h-14 w-11 items-center justify-center overflow-hidden rounded-l-2xl border border-r-0',
                'border-black/5 bg-paper/92 text-neutral-6 shadow-[0_2px_12px_rgba(0,0,0,0.04),0_0_0_0.5px_rgba(0,0,0,0.03)]',
                'transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
                'hover:bg-black/[0.02] hover:text-neutral-9',
                'active:bg-black/[0.04]',
                'focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-black/10',
                'dark:border-white/8 dark:bg-paper/95 dark:text-neutral-4 dark:hover:bg-white/4 dark:hover:text-neutral-1 dark:active:bg-white/6 dark:focus-visible:ring-white/12',
                className,
              )}
              {...rest}
            >
              <span className="relative flex text-[16px] opacity-75 transition-opacity duration-200 group-hover:opacity-100">
                {children}
              </span>
            </m.button>
          </m.div>
        )}
      </AnimatePresence>
    )
  },
)

export const FABPortable = typescriptHappyForwardRef(
  (
    props: Omit<HTMLMotionProps<'button'>, 'children' | 'onClick'> & {
      children: React.JSX.Element

      onClick: () => void
      onlyShowInMobile?: boolean
      show?: boolean
    },
    ref: React.ForwardedRef<HTMLButtonElement>,
  ) => {
    const { onClick, children, show = true, ...buttonProps } = props
    const id = useId()
    const portalElement = useAtomValue(fabContainerElementAtom, {
      store: jotaiStore,
    })
    const isMobile = useIsMobile()
    if (!isMobile) return null
    if (!portalElement) return null

    return (
      <RootPortal to={portalElement}>
        <FABBase
          id={id}
          ref={ref}
          show={show}
          onClick={onClick}
          {...buttonProps}
        >
          {children}
        </FABBase>
      </RootPortal>
    )
  },
)

export const FABContainer = (props: { children?: ReactNode }) => {
  const isMobile = useIsMobile()
  const handleContainerRef = useTypeScriptHappyCallback(
    (el: HTMLDivElement) => jotaiStore.set(fabContainerElementAtom, el),
    [],
  )

  useEffect(() => {
    if (!isMobile) {
      jotaiStore.set(fabContainerElementAtom, null)
    }
  }, [isMobile])

  const shouldHide = usePageScrollDirectionSelector(
    (direction) => isMobile && direction === 'down',
    [isMobile],
  )

  if (!isMobile) return null

  return (
    <m.div
      data-hide-print
      data-testid="fab-container"
      initial={false}
      ref={handleContainerRef}
      animate={{
        opacity: shouldHide ? 0 : 1,
        x: shouldHide ? 56 : 0,
      }}
      className={clsx(
        'fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-0 z-[9] flex flex-col items-end',
      )}
      transition={{
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {props.children}
    </m.div>
  )
}
