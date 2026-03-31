import type {
  ModelWithLiked,
  ModelWithTranslation,
  NoteModel,
  NoteWrappedWithLikedAndTranslationPayload,
} from '@mx-space/api-client'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import type { BreadcrumbList, WithContext } from 'schema-dts'

import { AckRead } from '~/components/common/AckRead'
import { ClientOnly } from '~/components/common/ClientOnly'
import { PageColorGradient } from '~/components/common/PageColorGradient'
import { Paper } from '~/components/layout/container/Paper'
import {
  buildRoomName,
  Presence,
  RoomProvider,
} from '~/components/modules/activity'
import { CommentAreaRootLazy } from '~/components/modules/comment'
import {
  NoteActionAsideEmbedded,
  NoteBanner,
  NoteBottomBarAction,
  NoteBottomTopic,
  NoteFontAdjuster,
  NoteFooterNavigationMobile,
  NoteMetaBar,
  NoteMetaReadingCount,
  NoteRootBanner,
  NoteTocAside,
  NoteTopicBinderClip,
  NoteTopicInlineTag,
} from '~/components/modules/note'
import { NoteHeadCover } from '~/components/modules/note/NoteHeadCover'
import { NoteHideIfSecret } from '~/components/modules/note/NoteHideIfSecret'
import { NoteMainContainer } from '~/components/modules/note/NoteMainContainer'
import {
  NoticeCard,
  NoticeCardItem,
  TranslationNoticeContent,
} from '~/components/modules/shared/NoticeCard'
import { ReadIndicatorForMobile } from '~/components/modules/shared/ReadIndicator'
import { Signature } from '~/components/modules/shared/Signature'
import { SummarySwitcher } from '~/components/modules/shared/SummarySwitcher'
import { TocFAB } from '~/components/modules/toc/TocFAB'
import { TocHeadingStrategyProvider } from '~/components/modules/toc/TocHeadingStrategy'
import { BottomToUpSoftScaleTransitionView } from '~/components/ui/transition'
import { OnlyMobile } from '~/components/ui/viewport/OnlyMobile'
import { getOgUrl } from '~/lib/helper.server'
import { getSummaryFromMd } from '~/lib/markdown'
import { buildNotePath } from '~/lib/note-route'
import {
  buildLanguageAlternates,
  buildLocalePrefixedPath,
  getSupportedLocalesFromTranslations,
} from '~/lib/seo/hreflang'
import {
  CurrentNoteDataProvider,
  SyncNoteDataAfterLoggedIn,
} from '~/providers/note/CurrentNoteDataProvider'
import { CurrentNoteNidProvider } from '~/providers/note/CurrentNoteIdProvider'
import { LayoutRightSidePortal } from '~/providers/shared/LayoutRightSideProvider'
import { WrappedElementProvider } from '~/providers/shared/WrappedElementProvider'

import { NoteContent } from './[id]/NoteContent'
import {
  IndentArticleContainer,
  MarkdownSelection,
  NoteDataReValidate,
  NoteHeaderDate,
  NoteMarkdownImageRecordProvider,
  NoteTitle,
} from './[id]/pageExtra'
import { Transition } from './[id]/Transition'

type NoteWithTranslation = ModelWithLiked<ModelWithTranslation<NoteModel>>

function PageInner({
  data,
  privateLoginOnlyMessage,
}: {
  data: NoteWithTranslation
  privateLoginOnlyMessage: string
}) {
  const coverImage = data.images?.find((i) => i.src === data.meta?.cover)
  const { isTranslated, translationMeta } = data
  const contentLang = isTranslated
    ? translationMeta?.targetLang
    : translationMeta?.sourceLang

  return (
    <>
      <AckRead id={data.id} type="note" />

      <NoteHeadCover image={data.meta?.cover} />
      {!!data.meta?.cover && !!coverImage?.accent && (
        <PageColorGradient baseColor={coverImage.accent} />
      )}
      <div>
        <NoteTitle />
        <NoteTopicInlineTag />
        <span className="flex flex-wrap items-center text-sm text-neutral-8/60">
          <NoteHeaderDate />

          <NoteMetaBar />
          <NoteMetaReadingCount />
        </span>

        <NoteRootBanner />
        {!data.isPublished && (
          <NoteBanner message={privateLoginOnlyMessage} type="warning" />
        )}
      </div>

      <NoteHideIfSecret>
        <NoticeCard className="my-4">
          {isTranslated && translationMeta && (
            <NoticeCardItem>
              <TranslationNoticeContent translationMeta={translationMeta} />
            </NoticeCardItem>
          )}
          <NoticeCardItem variant="summary">
            <SummarySwitcher
              articleId={data.id!}
              lang={contentLang}
              variant="inline"
            />
          </NoticeCardItem>
        </NoticeCard>
        <WrappedElementProvider eoaDetect>
          <Presence />
          <ReadIndicatorForMobile />
          <NoteMarkdownImageRecordProvider>
            <MarkdownSelection>
              <IndentArticleContainer prose={data.contentFormat !== 'lexical'}>
                <header className="sr-only">
                  <NoteTitle />
                </header>
                <NoteContent contentFormat={data.contentFormat} />
              </IndentArticleContainer>
            </MarkdownSelection>
          </NoteMarkdownImageRecordProvider>

          <LayoutRightSidePortal>
            <NoteTocAside />
          </LayoutRightSidePortal>
        </WrappedElementProvider>
        <NoteActionAsideEmbedded />
      </NoteHideIfSecret>
      <Signature />
      <ClientOnly>
        <div data-hide-print className="mt-8" />
        <NoteBottomBarAction />
        <NoteBottomTopic />
        <NoteFooterNavigationMobile />
      </ClientOnly>
    </>
  )
}

export const buildNotePageMetadata = async ({
  locale,
  notePayload,
}: {
  locale: string
  notePayload: NoteWrappedWithLikedAndTranslationPayload
}): Promise<Metadata> => {
  const { data } = notePayload
  const description = getSummaryFromMd(data.text ?? '')

  const ogUrl = await getOgUrl(
    'note',
    {
      nid: data.nid.toString(),
    },
    locale,
  )

  const canonicalPathNoLocale = buildNotePath(data)
  const canonicalPath = buildLocalePrefixedPath(
    locale as any,
    canonicalPathNoLocale,
  )
  const supportedLocales = getSupportedLocalesFromTranslations({
    sourceLang: (data as any).translationMeta?.sourceLang,
    availableTranslations: (data as any).availableTranslations,
  })

  return {
    title: data.title,
    description,
    openGraph: {
      title: data.title,
      description,
      images: ogUrl,
      type: 'article',
    },
    twitter: {
      images: ogUrl,
      title: data.title,
      description,
      card: 'summary_large_image',
    },
    alternates: {
      canonical: canonicalPath,
      languages: {
        ...buildLanguageAlternates(canonicalPathNoLocale, supportedLocales),
        'x-default': canonicalPathNoLocale,
      },
    },
  } satisfies Metadata
}

export const NoteDetailPageContent = async ({
  fetchedAt,
  nid,
  notePayload,
}: {
  fetchedAt: string
  nid: string
  notePayload: NoteWrappedWithLikedAndTranslationPayload
}) => {
  const t = await getTranslations('note')
  const { data } = notePayload

  const breadcrumbLd: WithContext<BreadcrumbList> = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: '/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Notes',
        item: '/notes',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: data.title,
      },
    ],
  }

  return (
    <TocHeadingStrategyProvider
      contentFormat={notePayload.data.contentFormat}
      hasContent={!!notePayload.data.content}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbLd),
        }}
      />
      <CurrentNoteNidProvider nid={nid} />
      <CurrentNoteDataProvider data={notePayload} />
      <NoteDataReValidate fetchedAt={fetchedAt} />
      <SyncNoteDataAfterLoggedIn />
      <RoomProvider roomName={buildRoomName(notePayload.data.id)}>
        <Transition lcpOptimization className="min-w-0">
          <Paper as={NoteMainContainer} key={nid}>
            <NoteTopicBinderClip />
            <PageInner
              data={notePayload.data}
              privateLoginOnlyMessage={t('private_login_only')}
            />
          </Paper>
          <BottomToUpSoftScaleTransitionView delay={500}>
            <CommentAreaRootLazy
              allowComment={notePayload.data.allowComment}
              refId={notePayload.data.id}
            />
          </BottomToUpSoftScaleTransitionView>
        </Transition>
      </RoomProvider>

      <NoteFontAdjuster />

      <OnlyMobile>
        <TocFAB />
      </OnlyMobile>
    </TocHeadingStrategyProvider>
  )
}
