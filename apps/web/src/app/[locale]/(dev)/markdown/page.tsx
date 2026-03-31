import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
// eslint-disable-next-line unicorn/import-style
import { resolve } from 'node:path'

import { MarkdownClient } from './client'

export default function Page() {
  const markdownPath = resolve(homedir(), 'test-text.md')
  const text = existsSync(markdownPath)
    ? readFileSync(markdownPath, 'utf8')
    : '# Markdown Preview\n\n`~/test-text.md` is not available in this environment.'
  return (
    <div className="prose mx-auto w-[65ch]">
      <MarkdownClient>{text}</MarkdownClient>
    </div>
  )
}
