// Run with: claude plugin test <mod folder>
import { describe, expect, test } from 'claude-code/testing'

import { MAX, extract, merge } from '../hooks/extract.ts'

const reply = [
  '`C:\\Users\\Thurion\\.claude\\skills\\agent-flow`의 내용은 같아요.',
  '원본은 D:\\Store\\Git\\repo\\a.txt, 그리고 `hooks/register.tsx:12`예요.',
  '`claude plugin test`와 `e.answer`는 경로가 아니에요.',
  '',
  '//Next:',
  '```',
  '저장소의 .claude/skills/agent-flow 폴더를 지워 줘',
  '```',
].join('\n')

describe('extract', () => {
  test('finds paths and the //Next: body, //Next: last', () => {
    expect(extract(reply)).toEqual([
      { kind: 'path', text: 'C:\\Users\\Thurion\\.claude\\skills\\agent-flow' },
      { kind: 'path', text: 'D:\\Store\\Git\\repo\\a.txt' },
      { kind: 'path', text: 'hooks/register.tsx:12' },
      { kind: 'next', text: '저장소의 .claude/skills/agent-flow 폴더를 지워 줘' },
    ])
  })

  test('a reply with nothing to copy gives nothing', () => {
    expect(extract('Done. `npm test` passed.')).toEqual([])
  })
})

describe('merge', () => {
  test('keeps the newest MAX and moves repeats to the end', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ kind: 'path' as const, text: `/c/f${i}` }))
    const kept = merge([], many)
    expect(kept.length).toBe(MAX)
    expect(kept[0]?.text).toBe('/c/f2')
    const again = merge(kept, [{ kind: 'path', text: '/c/f2' }])
    expect(again.length).toBe(MAX)
    expect(again.at(-1)?.text).toBe('/c/f2')
    expect(again[0]?.text).toBe('/c/f3')
  })
})
