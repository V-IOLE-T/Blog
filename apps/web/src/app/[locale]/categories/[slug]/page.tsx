import { getTranslations } from 'next-intl/server'

import { EmptyIcon } from '~/components/icons/empty'
import { MotionButtonBase } from '~/components/ui/button'
import { TimelineList } from '~/components/ui/list/TimelineList'
import { TimelineListItem } from '~/components/ui/list/TimelineListItem'
import { TimelineSpineLayout } from '~/components/ui/list/TimelineSpineLayout'
import { BottomToUpSoftScaleTransitionView } from '~/components/ui/transition'
import { definePrerenderPage } from '~/lib/request.server'
import { routeBuilder, Routes } from '~/lib/route-builder'
import { springScrollToTop } from '~/lib/scroller'

import { getData } from './api'

export default definePrerenderPage<{ slug: string; locale: string }>()({
  fetcher(params) {
    return getData({ slug: params.slug })
  },

  Component: async ({ data, params: { slug, locale } }) => {
    const { name, children } = data
    const t = await getTranslations({
      namespace: 'post',
      locale,
    })
    const tCommon = await getTranslations({
      namespace: 'common',
      locale,
    })

    return (
      <BottomToUpSoftScaleTransitionView>
        <TimelineSpineLayout
          title={`${t('category_prefix')}${name}`}
          description={
            children.length > 0
              ? `${t('category_count_prefix')} ${children.length} ${t('category_count_suffix')}`
              : t('category_empty')
          }
        >
          {children.length > 0 ? (
            <TimelineList>
              {children.map((child) => (
                <TimelineListItem
                  date={new Date(child.created)}
                  key={child.id}
                  label={child.title}
                  href={routeBuilder(Routes.Post, {
                    slug: child.slug,
                    category: slug as string,
                  })}
                />
              ))}
            </TimelineList>
          ) : (
            <div className="center flex flex-col gap-3 py-12 text-center">
              <div className="scale-[1.25] text-neutral-8 dark:text-neutral-3">
                <EmptyIcon />
              </div>
              <p className="text-sm text-neutral-6 dark:text-neutral-4">
                {t('category_empty')}
              </p>
            </div>
          )}
          <div className="mt-10 flex justify-center border-t border-black/[0.06] pt-6 dark:border-white/[0.06]">
            <MotionButtonBase
              className="inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-neutral-10/55 transition-colors duration-200 hover:bg-black/[0.02] hover:text-neutral-10/85 dark:hover:bg-white/4"
              onClick={springScrollToTop}
            >
              <i className="i-mingcute-arrow-up-circle-line text-base opacity-70" />
              <span>{tCommon('back_to_top')}</span>
            </MotionButtonBase>
          </div>
        </TimelineSpineLayout>
      </BottomToUpSoftScaleTransitionView>
    )
  },
})
