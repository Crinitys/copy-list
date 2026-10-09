# copy-list

A Claude Code mod. It draws a band above the prompt that lists the paths and the `//Next:` lines from Claude's replies. Each row has a button that copies the row to the clipboard.

- The mod reads the final answer of each main-loop turn. It skips subagent reports.
- It collects absolute paths (`C:\…`, `~/…`, `/c/…`), relative paths in inline code (`hooks/register.tsx:12`), and the body of the fenced block after `//Next:`.
- A `//Next:` row also has a `▶` button. It copies the line, clears the prompt, and sends the line as your prompt. A line that starts with `/` is a slash command: `▶` only puts it in the prompt, and you press Enter.
- The mod keeps the newest 10 items. It drops the oldest item first. A repeat moves to the top.
- The band shows 5 rows at a time, newest first. `▲` and `▼` scroll through the rest. A new reply scrolls back to the top.
- The band stays hidden until a reply has a path or a `//Next:` line. The engine's `[-]` mark collapses it.

## Install

```
/plugin install copy-list --marketplace Crinitys/copy-list
```

Answer `y` to add the marketplace, then pick the user scope.

## Test

```
claude plugin test .
```
