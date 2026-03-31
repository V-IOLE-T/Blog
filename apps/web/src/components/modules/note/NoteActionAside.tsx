'use client'

import { m, useAnimationControls } from 'motion/react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { useIsMobile } from '~/atoms/hooks/viewport'
import { MotionButtonBase } from '~/components/ui/button'
import { useModalStack } from '~/components/ui/modal'
import { NumberSmoothTransition } from '~/components/ui/number-transition/NumberSmoothTransition'
import { PresentSheet } from '~/components/ui/sheet'
import { useForceUpdate } from '~/hooks/common/use-force-update'
import { useIsClient } from '~/hooks/common/use-is-client'
import { isLikedBefore, setLikeId } from '~/lib/cookie'
import { clsxm } from '~/lib/helper'
import { buildNotePath } from '~/lib/note-route'
import { apiClient } from '~/lib/request'
import { toast } from '~/lib/toast'
import { urlBuilder } from '~/lib/url-builder'
import {
  getCurrentNoteData,
  setCurrentNoteData,
  useCurrentNoteDataSelector,
} from '~/providers/note/CurrentNoteDataProvider'
import { useCurrentNoteNid } from '~/providers/note/CurrentNoteIdProvider'
import { useAppConfigSelector } from '~/providers/root/aggregation-data-provider'
import { useIsEoFWrappedElement } from '~/providers/shared/WrappedElementProvider'

import { ArticleRightAside } from '../shared/ArticleRightAside'
import {
  AsideActionTab,
  AsideDonatePopover,
  useDonateAction,
} from '../shared/AsideActionControl'
import { DonateContent } from '../shared/AsideDonateButton'
import type { CommentModalProps } from '../shared/CommentModal'
import { ShareModal } from '../shared/ShareModal'
import { usePresentCommentModal } from '../shared/usePresentCommentModal'
import { usePresentSubscribeModal } from '../subscribe'
import { NoteTocAccessory } from './NoteFontFab'

export const NoteBottomBarAction: Component = () => {
  const isMobile = useIsMobile()
  if (!isMobile) return null
  return (
    <div className="relative -mx-4 my-4 md:-mx-0">
      {/* Tape body */}
      <div
        className={clsxm(
          'relative flex items-center justify-around',
          'px-5 py-3.5',
          // Light: warm gray kraft paper
          'bg-linear-to-r from-[rgba(180,160,140,0.08)] via-[rgba(180,160,140,0.13)] to-[rgba(180,160,140,0.08)]',
          // Dark: warm dark brown
          'dark:from-[rgba(90,75,60,0.15)] dark:via-[rgba(90,75,60,0.22)] dark:to-[rgba(90,75,60,0.15)]',
          // Subtle borders
          'border-y border-y-[rgba(160,140,120,0.06)] dark:border-y-[rgba(120,100,80,0.08)]',
        )}
      >
        {/* Fiber texture overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(255,255,255,0.04) 3px, rgba(255,255,255,0.04) 4px)',
          }}
        />
        {/* Torn edge top */}
        <div
          className="pointer-events-none absolute top-[-1px] right-0 left-0 h-[2px]"
          style={{
            background:
              'repeating-linear-gradient(90deg, transparent 0px, var(--color-neutral-1) 1px, transparent 3px)',
          }}
        />
        {/* Torn edge bottom */}
        <div
          className="pointer-events-none absolute right-0 bottom-[-1px] left-0 h-[2px]"
          style={{
            background:
              'repeating-linear-gradient(90deg, transparent 0px, var(--color-neutral-1) 2px, transparent 4px)',
          }}
        />

        <WashiLikeButton />
        <WashiSeparator />
        <WashiShareButton />
        <WashiSeparator />
        <WashiSubscribeButton />
        <WashiDonateSection />
      </div>
    </div>
  )
}

const WashiSeparator = () => (
  <div className="h-[18px] w-px bg-[rgba(140,120,100,0.08)] dark:bg-[rgba(120,100,80,0.12)]" />
)

/**
 * NoteActionAside - 纸张书签风格（外置版本，使用 Portal 渲染到右侧栏）
 */
export const NoteActionAside: Component = ({ className }) => {
  return (
    <ArticleRightAside accessory={NoteTocAccessory}>
      <aside
        aria-label="文章操作"
        className={clsxm(
          'absolute bottom-0 left-0 -mb-4 flex max-h-[400px] flex-col gap-3 p-4',
          'transition-opacity duration-300',
          className,
        )}
      >
        <LikeTab />
        <ShareTab />
        <SubscribeTab />
        <NoteAsideCommentTab />
        <DonateTab />
      </aside>
    </ArticleRightAside>
  )
}

export const NoteTocAside: Component = () => {
  return <ArticleRightAside accessory={NoteTocAccessory} />
}

/**
 * NoteActionAsideEmbedded - 纸张书签风格（内嵌版本）
 *
 * 设计：
 * - 使用 right-0 translate-x-full 贴在父元素右边缘并向外伸展
 * - z-index: 99 确保在内容之上
 * - 灰阶色风格：neutral 半透明背景 + 阴影立体感
 */
export const NoteActionAsideEmbedded: Component = ({ className }) => {
  return (
    <aside
      aria-label="文章操作"
      className={clsxm(
        'absolute bottom-24 right-0 z-[99] hidden max-h-[400px] flex-col gap-3 xl:flex',
        'translate-x-full',
        'transition-opacity duration-300',
        className,
      )}
    >
      <LikeTab />
      <ShareTab />
      <SubscribeTab />
      <NoteAsideCommentTab />
      <DonateTab />
    </aside>
  )
}

const NoteAsideCommentTab = () => {
  const { title, id, allowComment } =
    useCurrentNoteDataSelector((_data) => {
      const { data } = _data || {}
      return {
        title: data?.title,
        id: data?.id,
        allowComment: data?.allowComment,
      }
    }) || {}

  const isEoF = useIsEoFWrappedElement()
  if (!id) return null
  if (isEoF) return null
  if (!allowComment) return null
  return <AsideCommentTab refId={id} title={title!} />
}

const LikeTab = () => {
  const t = useTranslations('common')
  const control = useAnimationControls()
  const [update] = useForceUpdate()

  const likeCount = useCurrentNoteDataSelector((data) => data?.data.count.like)
  const id = useCurrentNoteDataSelector((data) => data?.data.id)
  const nid = useCurrentNoteNid()

  if (!id) return null

  const handleLike = () => {
    if (isLikedBefore(id)) return
    if (!nid) return
    apiClient.activity.likeIt('Note', id).then(() => {
      setLikeId(id)
      setCurrentNoteData((draft) => {
        draft.data.count.like += 1
      })
      update()
    })
  }

  const isLiked = isLikedBefore(id)

  return (
    <AsideActionTab
      active={isLiked}
      activeColor="text-error"
      count={likeCount || undefined}
      iconClass="i-mingcute-heart-line"
      iconClassActive="i-mingcute-heart-fill"
      label={t('aria_like_note')}
      onClick={() => {
        handleLike()
        control.start('tap', { repeat: 5 })
        toast.success(t('thanks'), {
          iconElement: (
            <m.i
              animate={{ scale: 1.22 }}
              className="i-mingcute-heart-fill text-error"
              initial={{ scale: 0.96 }}
              transition={{
                ease: 'easeInOut',
                delay: 0.3,
                repeat: 5,
                repeatDelay: 0.3,
              }}
            />
          ),
        })
      }}
    />
  )
}

const SubscribeTab = () => {
  const { present } = usePresentSubscribeModal(['note_c'])
  return (
    <AsideActionTab
      iconClass="i-mingcute-notification-line"
      iconClassActive="i-mingcute-notification-fill"
      label="订阅"
      onClick={present}
    />
  )
}

const ShareTab = () => {
  const t = useTranslations('common')
  const isClient = useIsClient()
  const { present } = useModalStack()

  if (!isClient) return null

  return (
    <AsideActionTab
      iconClass="i-mingcute-share-forward-line"
      label={t('aria_share_note')}
      onClick={() => {
        const note = getCurrentNoteData()?.data

        if (!note) return

        const hasShare = 'share' in navigator

        const title = t('share_treasure')
        const url = urlBuilder(buildNotePath(note)).href

        const text = t('share_message', { title: note.title })

        if (hasShare)
          navigator.share({
            title: note.title,
            text: note.text,
            url,
          })
        else {
          present({
            title: t('share_content'),
            clickOutsideToDismiss: true,
            content: () => <ShareModal text={text} title={title} url={url} />,
          })
        }
      }}
    />
  )
}

const DonateTab = () => {
  const { canRender, donateLabel, openDonate } = useDonateAction()

  if (!canRender) return null

  return (
    <AsideDonatePopover
      triggerElement={
        <AsideActionTab
          iconClass="i-mingcute-gift-line"
          iconClassActive="i-mingcute-gift-fill"
          label={donateLabel}
          onClick={openDonate}
        />
      }
    />
  )
}

const AsideCommentTab = (props: CommentModalProps) => {
  const { canPresent, commentLabel, presentCommentModal } =
    usePresentCommentModal(props)

  if (!canPresent) return null

  return (
    <AsideActionTab
      iconClass="i-mingcute-comment-line"
      iconClassActive="i-mingcute-comment-fill"
      label={commentLabel}
      onClick={presentCommentModal}
    />
  )
}

const washiIconBase =
  'relative z-1 text-[18px] opacity-45 saturate-0 duration-200 active:scale-110'

const WashiLikeButton = () => {
  const t = useTranslations('common')
  const control = useAnimationControls()
  const [update] = useForceUpdate()

  const likeCount = useCurrentNoteDataSelector((data) => data?.data.count.like)
  const id = useCurrentNoteDataSelector((data) => data?.data.id)
  const nid = useCurrentNoteNid()

  if (!id) return null

  const handleLike = () => {
    if (isLikedBefore(id)) return
    if (!nid) return
    apiClient.activity.likeIt('Note', id).then(() => {
      setLikeId(id)
      setCurrentNoteData((draft) => {
        draft.data.count.like += 1
      })
      update()
    })
  }

  const isLiked = isLikedBefore(id)

  return (
    <MotionButtonBase
      aria-label={t('aria_like_note')}
      aria-pressed={isLiked}
      className="relative z-1 flex items-center gap-1.5"
      onClick={() => {
        handleLike()
        control.start('tap', { repeat: 5 })
        toast.success(t('thanks'), {
          iconElement: (
            <m.i
              animate={{ scale: 1.22 }}
              className="i-mingcute-heart-fill text-error"
              initial={{ scale: 0.96 }}
              transition={{
                ease: 'easeInOut',
                delay: 0.3,
                repeat: 5,
                repeatDelay: 0.3,
              }}
            />
          ),
        })
      }}
    >
      <span className="relative">
        {/* Ink bleed halo */}
        {isLiked && (
          <span
            className="absolute top-1/2 left-1/2 size-[30px] -translate-1/2 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(200,60,50,0.14) 0%, rgba(200,60,50,0.04) 60%, transparent 100%)',
            }}
          />
        )}
        <m.i
          animate={control}
          variants={{ tap: { scale: 1.3 } }}
          className={clsxm(
            'relative text-[18px] duration-200',
            !isLiked && 'i-mingcute-heart-line opacity-45 saturate-0',
            isLiked && 'i-mingcute-heart-fill text-error',
          )}
        />
      </span>
      {!!likeCount && (
        <span
          className={clsxm(
            'text-[11px] font-medium',
            isLiked
              ? 'text-[rgba(196,60,50,0.55)]'
              : 'text-[rgba(140,120,100,0.4)] dark:text-[rgba(160,140,120,0.4)]',
          )}
        >
          <NumberSmoothTransition>
            {likeCount > 99 ? '99+' : likeCount}
          </NumberSmoothTransition>
        </span>
      )}
    </MotionButtonBase>
  )
}

const WashiShareButton = () => {
  const t = useTranslations('common')
  const isClient = useIsClient()
  const { present } = useModalStack()

  if (!isClient) return null

  return (
    <MotionButtonBase
      aria-label={t('aria_share_note')}
      className="relative z-1"
      onClick={() => {
        const note = getCurrentNoteData()?.data
        if (!note) return
        const hasShare = 'share' in navigator
        const title = t('share_treasure')
        const url = urlBuilder(buildNotePath(note)).href
        const text = t('share_message', { title: note.title })

        if (hasShare)
          navigator.share({ title: note.title, text: note.text, url })
        else
          present({
            title: t('share_content'),
            clickOutsideToDismiss: true,
            content: () => <ShareModal text={text} title={title} url={url} />,
          })
      }}
    >
      <i className={clsxm('i-mingcute-share-forward-line', washiIconBase)} />
    </MotionButtonBase>
  )
}

const WashiSubscribeButton = () => {
  const { present } = usePresentSubscribeModal(['note_c'])
  return (
    <MotionButtonBase
      aria-label="Subscribe"
      className="relative z-1"
      onClick={present}
    >
      <i className={clsxm('i-mingcute-notification-line', washiIconBase)} />
    </MotionButtonBase>
  )
}

const WashiDonateSection = () => {
  const t = useTranslations('common')
  const isClient = useIsClient()
  const donate = useAppConfigSelector((config) => config.module?.donate)

  const [sheetOpen, setSheetOpen] = useState(false)

  if (!isClient) return null
  if (!donate?.enable) return null

  return (
    <>
      <WashiSeparator />
      <MotionButtonBase
        aria-label={t('aria_donate')}
        className="relative z-1"
        onClick={() => setSheetOpen(true)}
      >
        <i className={clsxm('i-mingcute-gift-line', washiIconBase)} />
      </MotionButtonBase>
      <PresentSheet
        dismissible
        content={DonateContent}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  )
}
