import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import { extract, merge } from './extract.ts'

const PANE = 'copy-list'
const clips = atom({ plugin: 'copy-list', key: 'clips' } as const, [])

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'copy-list',
      description: 'Show the paths and //Next: lines of recent replies with copy buttons',
    })
    void $.ui.open({ id: PANE, title: 'copy' })

    return next(e)
  })

  on('command.run', { command: 'copy-list' }, async $ => {
    await $.ui.open({ id: PANE, title: 'copy', focus: true })

    return { text: 'copy pane opened.' }
  })

  on('turn.complete', async ($, e, next) => {
    // Main loop only: subagent reports are not what the person reads.
    if (!e.agentId && e.answer) {
      const added = extract(e.answer)
      if (added.length > 0) await update($, clips, list => merge(list, added))
    }

    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    const list = await read($, clips)

    return (
      <Box flexDirection="column">
        {list.length === 0 && <Text dimColor>No paths or //Next: lines yet.</Text>}
        {[...list].reverse().map((clip, i) => (
          <Box key={`row:${i}`}>
            <Button
              key={`copy:${i}`}
              label={clip.kind === 'next' ? 'Next' : 'Path'}
              onPress={async press => {
                const done = await $.ui.copy({ text: clip.text, surface: press.surface })
                $.ui.toast(done.isCopied ? 'Copied.' : `Copy failed: ${done.reason}`)
              }}
            />
            <Text wrap="truncate-end"> {clip.text.replace(/\s*\n\s*/g, ' ⏎ ')}</Text>
          </Box>
        ))}
      </Box>
    )
  })
}
