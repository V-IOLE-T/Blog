import clsx from 'clsx'
import type { CSSProperties, PropsWithChildren } from 'react'
import {
  createElement,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'

import { getViewport } from '~/atoms/hooks/viewport'
import { AutoResizeHeight } from '~/components/modules/shared/AutoResizeHeight'
import { useMaskScrollArea } from '~/hooks/shared/use-mask-scrollarea'
import { withOpacity } from '~/lib/color'
import { stopPropagation } from '~/lib/dom'
import { clsxm } from '~/lib/helper'

import { MotionButtonBase } from '../../button'
import { IconScaleTransition } from '../../transition/IconScaleTransnsition'
import { languageToColorMap, languageToIconMap } from '../constants'
import { parseFilenameFromAttrs } from './utils'

interface Props {
  attrs?: string
  content: string

  lang: string | undefined
  renderedHTML?: string
}

const formatLanguageLabel = (language: string | undefined) => {
  if (!language) return ''

  const normalized = language.toLowerCase()
  const labelMap: Record<string, string> = {
    javascript: 'JS',
    javascriptreact: 'JSX',
    js: 'JS',
    jsx: 'JSX',
    markdown: 'MD',
    md: 'MD',
    objectivec: 'OBJC',
    objectivecpp: 'OBJCPP',
    objc: 'OBJC',
    objcpp: 'OBJCPP',
    shell: 'SH',
    typescript: 'TS',
    typescriptreact: 'TSX',
  }

  return labelMap[normalized] || normalized.toUpperCase()
}

export const ShikiHighLighterWrapper = ({
  ref,
  ...props
}: PropsWithChildren<
  Props & {
    shouldCollapsed?: boolean
  }
> & { ref?: React.Ref<HTMLDivElement | null> }) => {
  const {
    shouldCollapsed = true,
    lang: language,
    content: value,
    attrs,
  } = props

  const [copied, setCopied] = useState(false)
  const copiedTimerRef = useRef<any>(undefined)
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value)
    setCopied(true)

    clearTimeout(copiedTimerRef.current)
    copiedTimerRef.current = setTimeout(() => {
      setCopied(false)
    }, 2000)
  }, [value])

  const [codeBlockRef, setCodeBlockRef] = useState<HTMLDivElement | null>(null)

  useImperativeHandle(ref, () => codeBlockRef!)

  const [isCollapsed, setIsCollapsed] = useState(shouldCollapsed)
  const [isOverflow, setIsOverflow] = useState(false)

  useEffect(() => {
    if (!shouldCollapsed) {
      return
    }
    const $el = codeBlockRef

    if (!$el) return

    const windowHeight = getViewport().h
    const halfWindowHeight = windowHeight / 2
    const $elScrollHeight = $el.scrollHeight

    if ($elScrollHeight >= halfWindowHeight) {
      setIsOverflow(true)

      const $hightlighted = $el.querySelector('.highlighted')
      if ($hightlighted) {
        const lineHeight = Number.parseInt(
          getComputedStyle($hightlighted).height || '0',
          10,
        )
        const $code = $el.querySelector('pre > code')!
        const childIndexInParent = Array.from($code.children).indexOf(
          $hightlighted,
        )

        $el.scrollTop = lineHeight * childIndexInParent - $el.clientHeight / 2
      }
    } else {
      setIsOverflow(false)
    }
  }, [value, codeBlockRef, shouldCollapsed])

  const filename = useMemo(() => parseFilenameFromAttrs(attrs || ''), [attrs])
  const [, maskClassName] = useMaskScrollArea({
    element: codeBlockRef!,
    size: 'lg',
  })

  const hasFilename = !!filename
  const hasLanguage = !!language
  const showMetaRow = hasFilename || hasLanguage
  const languageLabel = useMemo(() => formatLanguageLabel(language), [language])
  const languageIcon =
    languageToIconMap[language as keyof typeof languageToIconMap]
  const languageColor =
    languageToColorMap[language as keyof typeof languageToColorMap]

  const codeCardStyle = useMemo(() => {
    if (!languageColor) return undefined
    return {
      '--code-accent': languageColor,
      '--code-accent-line': withOpacity(languageColor, 0.22),
      '--code-accent-soft': withOpacity(languageColor, 0.08),
      '--code-accent-tint': withOpacity(languageColor, 0.03),
      '--code-accent-icon': withOpacity(languageColor, 0.06),
      '--code-accent-foreground': withOpacity(languageColor, 0.82),
    } as CSSProperties
  }, [languageColor])

  const copyButton = (
    <MotionButtonBase
      aria-label="Copy code"
      className="shiki-code-copy-button"
      title="Copy code"
      onClick={handleCopy}
    >
      <IconScaleTransition
        className="size-4"
        icon1="i-material-symbols-content-copy-outline-rounded"
        icon2="i-material-symbols-check-rounded"
        status={copied ? 'done' : 'init'}
      />
    </MotionButtonBase>
  )

  return (
    <div
      className={clsx('shiki-code-card', 'shiki-block group')}
      style={codeCardStyle}
      onCopy={stopPropagation}
    >
      <div className="shiki-code-surface">
        <div aria-hidden className="shiki-code-topline" />
        {showMetaRow ? (
          <>
            <div
              className={clsx(
                'shiki-code-header',
                !hasFilename && 'shiki-code-header--meta-only',
              )}
            >
              <div className="shiki-code-header-left">
                {hasLanguage && languageIcon && (
                  <span aria-hidden className="shiki-code-language-icon">
                    {createElement(languageIcon, { className: 'size-4' })}
                  </span>
                )}
                {hasFilename ? (
                  <span className="shiki-code-filename">{filename}</span>
                ) : hasLanguage ? (
                  <span className="shiki-code-language-label">
                    {languageLabel}
                  </span>
                ) : null}
              </div>
              <div className="shiki-code-header-right">
                {hasFilename && hasLanguage && (
                  <span className="shiki-code-language-text">
                    {languageLabel}
                  </span>
                )}
                {copyButton}
              </div>
            </div>
            <div aria-hidden className="shiki-code-divider" />
          </>
        ) : (
          <>
            <div className="shiki-code-header shiki-code-header--utility-only">
              <div />
              <div className="shiki-code-header-right">{copyButton}</div>
            </div>
            <div aria-hidden className="shiki-code-divider" />
          </>
        )}
        <AutoResizeHeight spring className="relative">
          {props.renderedHTML ? (
            <div
              ref={setCodeBlockRef}
              className={clsxm(
                'relative max-h-[50vh] py-2 w-full overflow-auto',
                !isCollapsed ? 'max-h-full!' : isOverflow ? maskClassName : '',
                'shiki-scroll-container',
              )}
              dangerouslySetInnerHTML={
                {
                  __html: props.renderedHTML,
                } as any
              }
              style={
                {
                  '--sr-margin': '1rem',
                } as any
              }
              onCopy={stopPropagation}
            />
          ) : (
            <div
              ref={setCodeBlockRef}
              className={clsxm(
                'relative max-h-[50vh] w-full py-2 overflow-auto',
                !isCollapsed ? 'max-h-full!' : isOverflow ? maskClassName : '',
                'shiki-scroll-container',
              )}
              style={
                {
                  '--sr-margin': '1rem',
                } as any
              }
              onCopy={stopPropagation}
            >
              {props.children}
            </div>
          )}

          {isOverflow && isCollapsed && (
            <div
              className={`absolute inset-x-0 bottom-0 flex justify-center py-2 duration-200 ${
                maskClassName.includes('mask-both') ||
                maskClassName.includes('mask-b')
                  ? ''
                  : 'pointer-events-none opacity-0'
              }`}
            >
              <button
                aria-hidden
                className="shiki-code-expand-button"
                type="button"
                onClick={() => setIsCollapsed(false)}
              >
                <i className="i-mingcute-arrow-to-down-line" />
                <span>展开</span>
              </button>
            </div>
          )}
        </AutoResizeHeight>
      </div>
    </div>
  )
}

ShikiHighLighterWrapper.displayName = 'ShikiHighLighterWrapper'
