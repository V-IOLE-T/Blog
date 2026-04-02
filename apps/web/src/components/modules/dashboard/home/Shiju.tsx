import { useQuery } from '@tanstack/react-query'

import { FloatPopover } from '~/components/ui/float-popover'

import { getDashboardPoem } from './Shiju.data'

export const ShiJu = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['shiju'],
    queryFn: () => getDashboardPoem(),
    staleTime: Infinity,
  })

  if (isLoading) return <div className="loading loading-dots" />
  if (!data) {
    return <span className="text-sm text-neutral-6">今日诗句暂时不可用</span>
  }

  if (data.type === 'jinrishici') {
    const { origin } = data

    return (
      <FloatPopover mobileAsSheet triggerElement={<span>{data.content}</span>}>
        <div className="max-w-[800px] text-center">
          <h3 className="sticky top-0 py-2 text-2xl font-medium">
            {origin.title}
          </h3>
          <h4 className="my-4">
            【{origin.dynasty.replace(/代$/, '')}】{origin.author}
          </h4>
          <div className="px-6">
            {origin.content.map((line) => (
              <p className="flex" key={line}>
                {line}
              </p>
            ))}
          </div>
        </div>
      </FloatPopover>
    )
  }

  return (
    <FloatPopover mobileAsSheet triggerElement={<span>{data.content}</span>}>
      <div className="max-w-[480px] text-center">
        <h3 className="py-2 text-xl font-medium">{data.from}</h3>
        <p className="text-sm text-neutral-6">
          {data.fromWho ? `作者：${data.fromWho}` : '作者信息暂缺'}
        </p>
      </div>
    </FloatPopover>
  )
}
