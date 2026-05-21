# 0.1.0 — first stable release

> Draft. Move to GitHub Release description on tag day.

Beauty Diagram for Obsidian replaces your ` ```mermaid ` and ` ```plantuml ` code blocks in **Reading View** with deck-quality SVG renders served by the Beauty Diagram engine. 9 themes, per-block override, idempotent source injection for portable notes — without you bundling 400 KB of mermaid + renderer assets in your vault.

## Highlights

- **9 polished themes** — Classic, Modern, Slate (Free); Atlas, Obsidian, Brutalist, Atelier (Pro); Blueprint, Memphis (Premium)
- **Per-block override** via `%% bd:theme=modern` (mermaid) or `' bd:theme=modern` (plantuml) directives, plus `bd:bg=transparent` for transparent canvas
- **Source-level directives** are honored by the entire Beauty Diagram CLI + plugin ecosystem (the same ` ```mermaid ` block renders consistently from terminal, vault, or direct API)
- **Source injection** command rewrites notes with idempotent `<img>` references so beautified diagrams survive Obsidian Publish, Notion paste, blog export, etc.
- **Mobile-friendly** — uses `obsidian.requestUrl` so CORS-restricted environments and mobile both work
- **Self-hostable** — point apiBase at your own Beauty Diagram instance and avoid hitting the SaaS

## Compatibility

- Minimum Obsidian: 1.4.0
- Desktop + mobile (iOS / Android)
- Reading View renders are replaced; Live Preview keeps Obsidian's built-in mermaid (see Roadmap)

## Privacy

This plugin sends diagram source to `api.beauty-diagram.com` to render. See README → Privacy for the full disclosure, opt-out, and self-host paths.

## Known limitations

- **Live Preview**: not yet replaced — Reading View only for v0.1.0
- **PlantUML offline**: no local fallback; mermaid offline degrades to "disable for mermaid blocks" hint
- **Source > 5 KB anonymous**: requires API key (Pro / Premium); blocks fall back to error UI without one

## Roadmap

- Live Preview support (CodeMirror extension)
- Sketch-to-diagram (photo → mermaid via AI)
- Sync with Beauty Diagram editor (currently click-through is one-way)
