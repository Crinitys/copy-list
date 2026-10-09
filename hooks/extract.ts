import type { Clip } from '../types'

export const MAX = 10

// The body of each fenced block that follows a //Next: label.
const NEXT = /\/\/Next:\s*\n\s*```[^\n]*\n([\s\S]*?)\n\s*```/g
// Absolute Windows paths, ~/ paths and /x/ Git Bash paths.
const BARE = /(?:[A-Za-z]:[\\/]|~[\\/]|\/[a-z]\/)[^\s`'"<>|*?()\[\]]+/g
// Inline code that looks like a relative path: has a slash and an extension or a trailing slash.
const CODE = /`([^`\s]+)`/g
const LOOKS_RELATIVE = /^\.{0,2}[\w.-]+(?:[\\/][\w.@-]+)+(?:\.\w+(?::\d+)?|[\\/])$/

const tidy = (s: string) => s.replace(/[.,;:)\]]+$/, '')

export function extract(answer: string): Clip[] {
  const found: Clip[] = []
  const rest = answer.replace(NEXT, (_, body: string) => {
    found.push({ kind: 'next', text: body.trim() })
    return ''
  })
  const paths = new Set<string>()
  for (const m of rest.matchAll(BARE)) paths.add(tidy(m[0]))
  for (const m of rest.matchAll(CODE)) {
    if (LOOKS_RELATIVE.test(m[1])) paths.add(tidy(m[1]))
  }
  // Paths first, so the //Next: line ends up newest.
  return [...[...paths].map(text => ({ kind: 'path' as const, text })), ...found]
}

/** Appends new clips, moves repeats to the end, keeps the newest MAX. */
export function merge(list: Clip[], added: Clip[]): Clip[] {
  const keys = new Set(added.map(c => c.text))
  return [...list.filter(c => !keys.has(c.text)), ...added].slice(-MAX)
}
