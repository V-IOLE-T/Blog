'use client'

import { useCurrentPageDataSelector } from '~/providers/page/CurrentPageDataProvider'

import { ActionAsideContainer } from '../shared/ActionAsideContainer'
import {
  AsideActionMark,
  AsideDonatePopover,
  useDonateAction,
} from '../shared/AsideActionControl'
import type { CommentModalProps } from '../shared/CommentModal'
import { usePresentCommentModal } from '../shared/usePresentCommentModal'

/**
 * PageActionAside - 排版边注风格
 *
 * 设计语言：与 Post 风格一致
 * - 简洁图标 + 文字，无边框无背景
 * - hover 时显示标签文字
 */
export const PageActionAside: Component = ({ className }) => {
  return (
    <ActionAsideContainer className={className}>
      <PageAsideCommentMark />
      <DonateMark />
    </ActionAsideContainer>
  )
}

const PageAsideCommentMark = () => {
  const { title, id, allowComment } =
    useCurrentPageDataSelector((data) => ({
      title: data?.title,
      id: data?.id,
      allowComment: data?.allowComment,
    })) || {}
  if (!id || !allowComment) return null
  return <AsideCommentMark refId={id} title={title!} />
}

const DonateMark = () => {
  const { canRender, donateLabel, openDonate } = useDonateAction()

  if (!canRender) return null

  return (
    <AsideDonatePopover
      triggerElement={
        <AsideActionMark
          activeColor="text-red-400"
          iconClass="i-mingcute-gift-line"
          iconClassActive="i-mingcute-gift-fill"
          label={donateLabel}
          onClick={openDonate}
        />
      }
    />
  )
}

const AsideCommentMark = (props: CommentModalProps) => {
  const { canPresent, commentLabel, presentCommentModal } =
    usePresentCommentModal(props)

  if (!canPresent) return null

  return (
    <AsideActionMark
      activeColor="text-pink-500"
      iconClass="i-mingcute-comment-line"
      iconClassActive="i-mingcute-comment-fill"
      label={commentLabel}
      onClick={presentCommentModal}
    />
  )
}
