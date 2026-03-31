import type { FC } from 'react'
import { memo, useEffect, useRef, useState } from 'react'

import { usePretextLayout } from '~/hooks/common/use-pretext-layout'

const REFERENCE_FONT_SIZE = 100

export const FlexText: FC<{ text: string; scale: number }> = memo((props) => {
  const ref = useRef<HTMLSpanElement>(null)
  const [fontSize, setFontSize] = useState<number>()
  const { measureTextWidth } = usePretextLayout()

  useEffect(() => {
    const $el = ref.current
    if (!$el) return

    const $parent = $el.parentElement
    if (!$parent) return

    const calculate = () => {
      const style = getComputedStyle($el)
      const fontFamily = style.fontFamily
      if (!fontFamily) return

      const referenceFont = `${style.fontStyle} ${style.fontWeight} ${REFERENCE_FONT_SIZE}px ${fontFamily}`
      const parentWidth = $parent.clientWidth
      if (!parentWidth) return

      const textWidthAtRef = measureTextWidth(props.text, referenceFont)
      if (textWidthAtRef > 0) {
        const targetFontSize =
          (parentWidth / textWidthAtRef) * REFERENCE_FONT_SIZE * props.scale
        setFontSize(targetFontSize)
      }
    }

    calculate()

    const observer = new ResizeObserver(calculate)
    observer.observe($parent)

    return () => observer.disconnect()
  }, [props.text, props.scale, measureTextWidth])

  return (
    <span
      className={fontSize ? '' : 'invisible'}
      ref={ref}
      style={fontSize ? { fontSize: `${fontSize}px` } : undefined}
    >
      {props.text}
    </span>
  )
})

FlexText.displayName = 'FlexText'
