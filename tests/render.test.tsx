// Run with: claude plugin test <mod folder>
import { expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

const band = {
  hasSurvey: false,
  isWorking: false,
  maxRows: 12,
  bodyColumns: 60,
  scroll: { offset: 0, bodyRows: 11 },
  view: {},
} as never

const reply = (answer: string) => ({ answer, reason: 'answer', durationMs: 1, isAborted: false, turnId: 't' }) as const

async function seed($: Engine, on: On, answers: string[]) {
  on('turn.complete', (_$, e) => ({ text: e.answer }))
  for (const answer of answers) await $.turn.complete(reply(answer))
}

test('the band draws nothing until a reply has something to copy', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'copy-list', surface, component: 'AbovePrompt', props: band })
    expect(await ui.find({ type: 'Text', text: /COPY LIST/ })).toBeUndefined()
    await ui.unmount()
  }
})

test('the band shows 5 rows at a time and ▼ pages to older ones', async ($, on) => {
  await seed($, on, ['`/c/a1` `/c/a2` `/c/a3` `/c/a4` `/c/a5` `/c/a6` `/c/a7`'])
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'copy-list', surface, component: 'AbovePrompt', props: band })
    expect(await ui.find({ type: 'Text', text: /1-5 of 7/ })).toBeDefined()
    expect(await ui.find({ key: 'copy:5' })).toBeUndefined()
    await ui.press({ key: 'down' })
    await ui.press({ key: 'down' })
    expect(await ui.find({ type: 'Text', text: /6-7 of 7/ })).toBeDefined()
    expect(await ui.find({ key: 'copy:6' })).toBeDefined()
    expect(await ui.find({ key: 'copy:4' })).toBeUndefined()
    await ui.press({ key: 'up' })
    expect(await ui.find({ type: 'Text', text: /1-5 of 7/ })).toBeDefined()
    await ui.unmount()
  }
})

test('▶ copies a Next line, clears the prompt and sends it; a slash command only fills', async ($, on) => {
  const filled: string[] = []
  const copied: string[] = []
  const sent: string[] = []
  on('prompt.fill', (_$, e) => {
    filled.push(`${e.mode}:${e.text}`)
    return { isFilled: true, text: e.text, cursor: e.text.length } as never
  })
  on('ui.copy', (_$, e) => {
    copied.push(e.text)
    return { value: { isCopied: true } } as never
  })
  on('prompt.submit', (_$, e) => {
    sent.push(e.text)
    return { text: e.text } as never
  })
  await seed($, on, [
    'See D:\\a.txt\n\n//Next:\n```\nrun the tests\n```',
    '//Next:\n```\n/reload-plugins\n```',
  ])
  const ui = await $.ui.mount({ plugin: 'copy-list', surface: 'terminal', component: 'AbovePrompt', props: band })
  // Newest first: row 0 is /reload-plugins, row 1 the path-free Next, row 2 the path.
  expect(await ui.find({ key: 'fill:2' })).toBeUndefined()
  await ui.press({ key: 'fill:1' })
  expect(filled).toEqual(['replace:'])
  expect(sent).toEqual(['run the tests'])
  expect(await ui.find({ type: 'Text', text: /✓ Sent/ })).toBeDefined()
  await ui.press({ key: 'fill:0' })
  expect(filled).toEqual(['replace:', 'replace:/reload-plugins'])
  expect(sent).toEqual(['run the tests'])
  expect(copied).toEqual(['run the tests', '/reload-plugins'])
  await ui.press({ key: 'copy:2' })
  expect(await ui.find({ type: 'Text', text: /✓ Copied/ })).toBeDefined()
  await ui.unmount()
})
