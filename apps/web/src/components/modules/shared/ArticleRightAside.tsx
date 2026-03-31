'use client'

import type { FC, ReactNode } from 'react'

import { useIsMobile } from '~/atoms/hooks/viewport'

import { TocAside } from '../toc'
import { ReadIndicator } from './ReadIndicator'

export const ArticleRightAside: Component<{
  accessory?: ReactNode | FC
  tocFooterSlot?: ReactNode
}> = ({ children, accessory, tocFooterSlot }) => {
  const isMobile = useIsMobile()
  if (isMobile) return <div />

  return (
    <ArticleRightAsideImpl accessory={accessory} tocFooterSlot={tocFooterSlot}>
      {children}
    </ArticleRightAsideImpl>
  )
}

const ArticleRightAsideImpl: FC<{
  children?: ReactNode
  accessory?: ReactNode | FC
  tocFooterSlot?: ReactNode
}> = ({ children, accessory, tocFooterSlot }) => (
  <aside className="sticky top-[120px] mt-[120px] h-[calc(100vh-6rem-4.5rem-150px-120px)]">
    <div className="relative h-full">
      <TocAside
        accessory={accessory ?? ReadIndicator}
        as="div"
        className="static ml-4"
        footerSlot={tocFooterSlot}
        treeClassName="min-h-[120px]"
      />
    </div>
    {children && (
      <div className="translate-y-[calc(100%+24px)]">{children}</div>
    )}
  </aside>
)
