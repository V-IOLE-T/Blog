'use client'

import type { NoteTimelineItem as NoteTimelineItemData } from '@mx-space/api-client'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { memo } from 'react'

import { PresentSheet } from '~/components/ui/sheet/Sheet'
import { OnlyMobile } from '~/components/ui/viewport/OnlyMobile'
import { Link } from '~/i18n/navigation'
import { apiClient } from '~/lib/request'
import { routeBuilder, Routes } from '~/lib/route-builder'
import { springScrollToTop } from '~/lib/scroller'
import { useCurrentNoteDataSelector } from '~/providers/note/CurrentNoteDataProvider'
import { useCurrentNoteNid } from '~/providers/note/CurrentNoteIdProvider'

export const NoteFooterNavigationMobile = memo(() => {
  return (
    <OnlyMobile>
      <NoteFooterNavigationMobileImpl />
    </OnlyMobile>
  )
})
NoteFooterNavigationMobile.displayName = 'NoteFooterNavigationMobile'

const NoteFooterNavigationMobileImpl = () => {
  const noteNid = useCurrentNoteNid()

  const data = useCurrentNoteDataSelector((data) =>
    !data
      ? null
      : {
          next:
            data.next && data.next.nid
              ? {
                  nid: data.next.nid,
                  title: data.next.title,
                  slug: data.next.slug,
                  created: data.next.created,
                }
              : null,
          prev:
            data.prev && data.prev.nid
              ? {
                  nid: data.prev.nid,
                  title: data.prev.title,
                  slug: data.prev.slug,
                  created: data.prev.created,
                }
              : null,
          noteId: data.data.id,
          currentNote: {
            id: data.data.id,
            nid: data.data.nid,
            title: data.data.title,
            created: data.data.created,
          },
        },
  )

  if (!data) return null

  const { next, prev } = data
  const hasPrevNext = !!prev || !!next

  return (
    <section data-hide-print className="mt-4">
      {hasPrevNext && <PrevNextBar next={next} prev={prev} />}
      <TimelineSheetTrigger
        currentNote={data.currentNote}
        noteId={data.noteId}
        noteNid={noteNid}
      />
    </section>
  )
}

const PrevNextBar = memo<{
  prev: {
    nid: number
    title?: string
    slug?: string | null
    created?: Date | string
  } | null
  next: {
    nid: number
    title?: string
    slug?: string | null
    created?: Date | string
  } | null
}>(({ prev, next }) => {
  const t = useTranslations('note')
  return (
    <div className="flex items-end justify-between border-t border-neutral-3/50 pt-3">
      {next ? (
        <Link
          className="max-w-[45%] text-neutral-8 transition-colors hover:text-accent"
          href={routeBuilder(Routes.Note, {
            id: next.nid.toString(),
            slug: next.slug || undefined,
            created: next.created,
          })}
          onClick={springScrollToTop}
        >
          <div className="text-[9px] uppercase tracking-[1.5px] opacity-50">
            {t('previous_note')}
          </div>
          <div className="truncate text-[13px]">
            {next.title || `#${next.nid}`}
          </div>
        </Link>
      ) : (
        <div />
      )}
      {prev ? (
        <Link
          className="max-w-[45%] text-right text-neutral-8 transition-colors hover:text-accent"
          href={routeBuilder(Routes.Note, {
            id: prev.nid.toString(),
            slug: prev.slug || undefined,
            created: prev.created,
          })}
          onClick={springScrollToTop}
        >
          <div className="text-[9px] uppercase tracking-[1.5px] opacity-50">
            {t('next_note')}
          </div>
          <div className="truncate text-[13px]">
            {prev.title || `#${prev.nid}`}
          </div>
        </Link>
      ) : (
        <div />
      )}
    </div>
  )
})
PrevNextBar.displayName = 'PrevNextBar'

interface CurrentNoteInfo {
  created: Date | string
  id: string
  nid: number
  title: string
}

const TimelineSheetTrigger = memo<{
  currentNote: CurrentNoteInfo
  noteId: string
  noteNid: string | null | undefined
}>(({ noteId, noteNid, currentNote }) => {
  const t = useTranslations('note')

  return (
    <div className="mt-4">
      <PresentSheet
        triggerAsChild
        title={t('more_notes')}
        content={
          <TimelineSheetContent
            currentNote={currentNote}
            noteId={noteId}
            noteNid={noteNid}
          />
        }
      >
        <button
          className="flex w-full cursor-pointer items-center gap-2 py-2"
          type="button"
        >
          <span className="h-px flex-1 bg-neutral-3/30" />
          <span className="text-[10px] tracking-[0.5px] text-neutral-5">
            {t('more_notes')}
          </span>
          <span className="h-px flex-1 bg-neutral-3/30" />
        </button>
      </PresentSheet>
    </div>
  )
})
TimelineSheetTrigger.displayName = 'TimelineSheetTrigger'

const TimelineSheetContent = memo<{
  currentNote: CurrentNoteInfo
  noteId: string
  noteNid: string | null | undefined
}>(({ noteId, noteNid, currentNote }) => {
  const locale = useLocale()

  const { data: timelineData } = useQuery({
    queryKey: ['note_timeline', noteId, locale],
    queryFn: async ({ queryKey }) => {
      const [, noteId, lang] = queryKey
      if (!noteId) throw new Error('Missing noteId')
      const data = await apiClient.note.proxy.list(noteId).get<{
        data: NoteTimelineItemData[]
        size: number
      }>({
        params: { size: 10, lang },
      })
      return data.data
    },
    enabled: noteId !== undefined,
    placeholderData: keepPreviousData,
  })

  const initialData: NoteTimelineItemData[] = [
    {
      title: currentNote.title,
      nid: currentNote.nid,
      id: currentNote.id,
      created: currentNote.created as string,
    } as NoteTimelineItemData,
  ]

  const items = timelineData || initialData
  const currentNid = Number.parseInt(noteNid || '0')

  return (
    <div className="flex flex-col">
      {items.map((item) => {
        const isActive = item.nid === currentNid
        return (
          <Link
            key={item.id}
            className={`flex items-center rounded-md px-3 py-[7px] text-xs ${
              isActive
                ? 'bg-accent/7 font-medium text-accent'
                : 'text-neutral-6'
            }`}
            href={routeBuilder(Routes.Note, {
              id: item.nid,
              slug:
                'slug' in item && typeof item.slug === 'string'
                  ? item.slug
                  : undefined,
              created: item.created,
            })}
            onClick={springScrollToTop}
          >
            <span
              className={`mr-2 size-1 shrink-0 rounded-full ${
                isActive ? 'bg-accent' : 'bg-neutral-4'
              }`}
            />
            <span className="truncate">{item.title}</span>
          </Link>
        )
      })}
    </div>
  )
})
TimelineSheetContent.displayName = 'TimelineSheetContent'
