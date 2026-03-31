import { EmptyIcon } from '~/components/icons/empty'
import { clsxm } from '~/lib/helper'

export const CommentEmpty: Component = ({ className }) => (
  <div
    className={clsxm(
      'center flex min-h-[18rem] min-w-0 flex-col gap-3 px-6 text-center',
      className,
    )}
  >
    <div className="pointer-events-none text-neutral-8 dark:text-neutral-3">
      <div className="scale-[1.4]">
        <EmptyIcon />
      </div>
    </div>
    <div className="pointer-events-auto space-y-1">
      <p className="text-sm font-medium text-neutral-7 dark:text-neutral-3">
        这里暂时还没有评论
      </p>
      <p className="text-xs text-neutral-5 dark:text-neutral-5">
        等新的留言落在这里。
      </p>
    </div>
  </div>
)
