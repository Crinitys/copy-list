# copy-list

A Claude Code mod. It opens a pane that lists the paths and the `//Next:` lines from Claude's replies. Each row has a button that copies the row to the clipboard.

- The mod reads the final answer of each main-loop turn. It skips subagent reports.
- It collects absolute paths (`C:\…`, `~/…`, `/c/…`), relative paths in inline code (`hooks/register.tsx:12`), and the body of the fenced block after `//Next:`.
- The pane shows the newest 10 items, newest first. The mod drops the oldest item first. A repeat moves to the top.
- `/copy-list` opens the pane and gives it the keyboard.

The pane shares the dock with other panes as a tab. An unasked pane shows only at 144 columns or wider; use `/copy-list` on a narrower terminal.

## Install

```
/plugin install copy-list --marketplace Crinitys/copy-list
```

Answer `y` to add the marketplace, then pick the user scope.

## Test

```
claude plugin test .
```
