// Run with: claude plugin test <mod folder>
import { expect, test } from 'claude-code/testing'

const pane = (bodyColumns: number) =>
  ({
    title: 'copy',
    isFocused: false,
    bodyColumns,
    placement: 'dock',
    scroll: { top: 0, bodyRows: 30 },
    view: {},
  }) as never

test('the pane draws the banner when wide and a one-line title when narrow', async $ => {
  for (const surface of ['terminal', 'desktop'] as const) {
    const wide = await $.ui.mount({ plugin: 'copy-list', surface, component: 'Pane', requestId: 'copy-list', props: pane(50) })
    expect(await wide.find({ type: 'Text', text: /╔═╗/ })).toBeDefined()
    expect(await wide.find({ type: 'Text', text: /0\/10/ })).toBeDefined()
    await wide.unmount()

    const narrow = await $.ui.mount({ plugin: 'copy-list', surface, component: 'Pane', requestId: 'copy-list', props: pane(20) })
    expect(await narrow.find({ type: 'Text', text: /╔═╗/ })).toBeUndefined()
    expect(await narrow.find({ type: 'Text', text: /COPY LIST/ })).toBeDefined()
    await narrow.unmount()
  }
})
