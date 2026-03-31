import { layout, prepare } from '@chenglou/pretext'
import type { ReactEventHandler, RefObject } from 'react'

export const stopPropagation: ReactEventHandler<any> = (e) =>
  e.stopPropagation()

export const preventDefault: ReactEventHandler<any> = (e) => e.preventDefault()

export const transitionViewIfSupported = (updateCb: () => any) => {
  if (window.matchMedia(`(prefers-reduced-motion: reduce)`).matches) {
    updateCb()
    return
  }
  if (document.startViewTransition) {
    document.startViewTransition(updateCb)
  } else {
    updateCb()
  }
}

export function escapeSelector(selector: string) {
  return selector.replaceAll(/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~]/g, '\\$&')
}

export const nextFrame = (fn: () => void) =>
  requestAnimationFrame(() => requestAnimationFrame(fn))

export const scrollTextareaToCursor = (
  taRef: RefObject<HTMLTextAreaElement | null>,
) => {
  const $ta = taRef.current
  if (!$ta) return

  const styles = getComputedStyle($ta)
  const font = styles.font
  const lineHeight = parseFloat(styles.lineHeight)
  const contentWidth =
    $ta.clientWidth -
    parseFloat(styles.paddingLeft) -
    parseFloat(styles.paddingRight)

  if (!contentWidth || !font || !lineHeight) return

  const start = $ta.selectionStart
  const textBeforeCursor = $ta.value.slice(0, Math.max(0, start))

  let cursorLine: number
  if (!textBeforeCursor) {
    cursorLine = 1
  } else {
    const prepared = prepare(textBeforeCursor, font, { whiteSpace: 'pre-wrap' })
    const { lineCount } = layout(prepared, contentWidth, lineHeight)
    cursorLine = Math.max(1, lineCount)
  }

  const cursorY = (cursorLine - 1) * lineHeight
  const scrollTop = cursorY - $ta.clientHeight / 2 + lineHeight / 2
  $ta.scrollTop = Math.max(0, scrollTop)
}
