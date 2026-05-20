# Beauty Diagram for Obsidian

Render Mermaid and PlantUML blocks as deck-quality images via the [Beauty Diagram](https://www.beauty-diagram.com) API — no engine, no extra dependencies in your vault.

## Features

- Automatic rendering of every ` ```mermaid ` and ` ```plantuml ` block as a polished SVG
- 9 themes (Modern / Slate / Atlas / Obsidian / Brutalist / Atelier / Blueprint / Memphis / Classic)
- Per-block theme override via `%% bd:theme=neon` (mermaid) or `' bd:theme=neon` (plantuml)
- Idempotent source injection for portable notes (publishable to GitHub, Notion paste, etc.)
- Offline fallback to built-in mermaid when the API is unreachable
- Optional API key for unwatermarked output and diagrams over 5 KB

## Installation

### Community Plugins (after approval)
1. Settings → Community plugins → Browse
2. Search "Beauty Diagram"
3. Install + Enable

### Manual / Beta (via BRAT)
1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat)
2. Add `beauty-diagram/obsidian-beauty-diagram` as a beta plugin

## Configuration

| Setting | Default | Notes |
| --- | --- | --- |
| API key | empty | Optional. Anonymous renders are watermarked. |
| Default theme | Modern | One of 9 |
| Replace built-in mermaid | on | Off lets Obsidian render mermaid as before |
| Handle plantuml fences | on | Obsidian has no built-in plantuml |
| Auto-inject on save | off | When on, every md save re-runs injection |

## Per-block theme override

In a mermaid block, prepend `%% bd:theme=<theme-name>` as the first line — that line is consumed by the plugin and not sent to the renderer. For plantuml, use `' bd:theme=<theme-name>`.

Example (mermaid):

    ```mermaid
    %% bd:theme=neon
    flowchart LR
      A --> B
    ```

## Source injection

Two commands inject `<img>` markdown next to your fenced blocks so the rendered image is portable:

- **Inject embed URLs in current note** — touches the active note
- **Inject embed URLs in entire vault** — walks every Markdown file
- **Clean orphan embed URLs in vault** — removes embed blocks whose source fence is gone

Injection is idempotent and uses the same `<!-- bd:inline-img hash=... -->` marker format as the [`bd` CLI](https://www.npmjs.com/package/@beauty-diagram/cli), so you can mix Obsidian and CLI workflows freely.

## License

MIT
