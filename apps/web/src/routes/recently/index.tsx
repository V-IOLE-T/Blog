import { defineRouteConfig } from '~/components/modules/dashboard/utils/helper'

import { RecentlySection } from '../site/recently-section'

export const Component = () => {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4">
      <div>
        <h1 className="text-3xl font-light">速记</h1>
        <p className="mt-2 text-sm text-neutral-6">
          复用现有后台里的速记模块，在这里快速查看、跳转和管理。
        </p>
      </div>

      <RecentlySection />
    </div>
  )
}

export const config = defineRouteConfig({
  title: '速记',
  icon: <i className="i-mingcute-pencil-line" />,
  priority: 6,
})
