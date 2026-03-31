'use client'

import type { CodeBlockRenderer } from '@haklex/rich-kit-shiro'
import type { ComponentProps } from 'react'

import { CodeBlockRender } from '~/components/modules/shared/CodeBlock'

export type LexicalCodeBlockOverrideProps = ComponentProps<
  typeof CodeBlockRenderer
>

export function LexicalCodeBlockOverride(props: LexicalCodeBlockOverrideProps) {
  return (
    <CodeBlockRender content={props.code} lang={props.language || undefined} />
  )
}
