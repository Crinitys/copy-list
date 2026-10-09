import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import { MAX, extract, merge } from './extract.ts'

// Rows of clips the band shows at once; ▲ and ▼ scroll the rest.
const ROWS = 3
const clips = atom({ plugin: 'copy-list', key: 'clips' } as const, [])
const offset = atom({ plugin: 'copy-list', key: 'offset' } as const, 0)

export const register: Register = on => {
  on('turn.complete', async ($, e, next) => {
    // Main loop only: subagent reports are not what the person reads.
    if (!e.agentId && e.answer) {
      const added = extract(e.answer)
      if (added.length > 0) {
        await update($, clips, list => merge(list, added))
        await update($, offset, () => 0)
      }
    }

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const list = await read($, clips)
    if (e.props.hasSurvey || list.length === 0) {
      return next(e)
    }

    const { Box, Button, Text } = $.ui.resolve(e)
    const newest = [...list].reverse()
    const last = Math.max(0, newest.length - ROWS)
    const top = Math.min(await read($, offset), last)
    const scroll = (by: number) => update($, offset, n => Math.max(0, Math.min(last, n + by)))

    // A blank row and a rule set the band apart from the transcript above it.
    return (
      <Box flexDirection="column" marginTop={1}>
        <Text dimColor>{'─'.repeat(Math.max(1, e.props.bodyColumns))}</Text>
        <Box justifyContent="space-between">
          <Text>
            <Text color="claude" bold>
              ⧉ COPY LIST
            </Text>
            <Text dimColor>
              {' '}
              {top + 1}-{Math.min(top + ROWS, newest.length)} of {newest.length}/{MAX}
            </Text>
          </Text>
          {newest.length > ROWS && (
            <Box>
              <Button key="up" label="▲" onPress={() => scroll(-1)} />
              <Button key="down" label="▼" onPress={() => scroll(1)} />
            </Box>
          )}
        </Box>
        {newest.slice(top, top + ROWS).map((clip, n) => {
          const i = top + n
          return (
            <Box key={`row:${i}`}>
              <Button
                key={`copy:${i}`}
                label={clip.kind === 'next' ? 'Next' : 'Path'}
                variant={clip.kind === 'next' ? 'primary' : undefined}
                onPress={async press => {
                  const done = await $.ui.copy({ text: clip.text, surface: press.surface })
                  $.ui.toast(done.isCopied ? 'Copied.' : `Copy failed: ${done.reason}`)
                }}
              />
              {clip.kind === 'next' ? (
                <Button
                  key={`fill:${i}`}
                  label="▶"
                  onPress={async press => {
                    await $.ui.copy({ text: clip.text, surface: press.surface })
                    // A plugin's submit does not run slash commands, so those only fill the prompt.
                    if (clip.text.startsWith('/')) {
                      const done = await $.prompt.fill({ text: clip.text, mode: 'replace' })
                      $.ui.toast(done.isFilled ? 'Slash command put in the prompt; press Enter.' : `Prompt fill failed: ${done.refusal ?? 'refused'}`)
                      return
                    }
                    await $.prompt.fill({ text: '', mode: 'replace' })
                    void $.prompt.submit({ text: clip.text, asUser: true })
                    $.ui.toast('Copied and sent.')
                  }}
                />
              ) : (
                <Text>{'     '}</Text>
              )}
              <Text wrap="truncate-end"> {clip.text.replace(/\s*\n\s*/g, ' ⏎ ')}</Text>
            </Box>
          )
        })}
      </Box>
    )
  })
}
