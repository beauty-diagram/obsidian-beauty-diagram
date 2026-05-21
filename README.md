# Beauty Diagram for Obsidian

> **Make your Mermaid and PlantUML diagrams look like deck slides — without leaving your vault.**

Beautify every ` ```mermaid ` and ` ```plantuml ` block in your Obsidian notes with 9 polished themes, in Reading View, with zero setup.

## See it in action

The same `flowchart LR` source, three different themes — rendered live by [Beauty Diagram](https://www.beauty-diagram.com):

| Modern | Obsidian | Memphis (Premium) |
|---|---|---|
| <img src="https://api.beauty-diagram.com/v1/beautify.svg?source=Zmxvd2NoYXJ0IExSCiAgU3RhcnQgLS0-IENoZWNre09LP30KICBDaGVjayAtLT58WWVzfCBEb25lCiAgQ2hlY2sgLS0-fE5vfCBSZXRyeSAtLT4gQ2hlY2s&theme=modern" width="280"> | <img src="https://api.beauty-diagram.com/v1/beautify.svg?source=Zmxvd2NoYXJ0IExSCiAgU3RhcnQgLS0-IENoZWNre09LP30KICBDaGVjayAtLT58WWVzfCBEb25lCiAgQ2hlY2sgLS0-fE5vfCBSZXRyeSAtLT4gQ2hlY2s&theme=obsidian" width="280"> | <img src="https://api.beauty-diagram.com/v1/beautify.svg?source=Zmxvd2NoYXJ0IExSCiAgU3RhcnQgLS0-IENoZWNre09LP30KICBDaGVjayAtLT58WWVzfCBEb25lCiAgQ2hlY2sgLS0-fE5vfCBSZXRyeSAtLT4gQ2hlY2s&theme=memphis" width="280"> |

## Why

- **9 polished themes** out of the box: Classic, Modern, Slate, Atlas, Obsidian, Brutalist, Atelier, Blueprint, Memphis.
- **Dark-mode friendly** — diagrams keep contrast on dark vault backgrounds.
- **Zero setup** — install, enable, every mermaid block is rendered through Beauty Diagram. No API key needed for the free tier (anonymous renders are watermarked).
- **Per-block theme override** with a one-line directive. Mix themes in the same note.
- **Idempotent source injection** for portable notes — published notes carry plain `<img>` references that render anywhere (GitHub, Notion paste, blog static sites).
- **PlantUML supported** too, with the same theming pipeline. No local Java required.
- **Offline-tolerant** — Mermaid blocks fall back to a local renderer if the Beauty Diagram service is unreachable.

## Theme gallery

| Classic | Modern | Slate |
|---|---|---|
| <img src="https://api.beauty-diagram.com/v1/beautify.svg?source=Zmxvd2NoYXJ0IExSCiAgU3RhcnQgLS0-IENoZWNre09LP30KICBDaGVjayAtLT58WWVzfCBEb25lCiAgQ2hlY2sgLS0-fE5vfCBSZXRyeSAtLT4gQ2hlY2s&theme=classic" width="220"> | <img src="https://api.beauty-diagram.com/v1/beautify.svg?source=Zmxvd2NoYXJ0IExSCiAgU3RhcnQgLS0-IENoZWNre09LP30KICBDaGVjayAtLT58WWVzfCBEb25lCiAgQ2hlY2sgLS0-fE5vfCBSZXRyeSAtLT4gQ2hlY2s&theme=modern" width="220"> | <img src="https://api.beauty-diagram.com/v1/beautify.svg?source=Zmxvd2NoYXJ0IExSCiAgU3RhcnQgLS0-IENoZWNre09LP30KICBDaGVjayAtLT58WWVzfCBEb25lCiAgQ2hlY2sgLS0-fE5vfCBSZXRyeSAtLT4gQ2hlY2s&theme=slate" width="220"> |

| Atlas (Pro) | Obsidian (Pro) | Brutalist (Pro) |
|---|---|---|
| <img src="https://api.beauty-diagram.com/v1/beautify.svg?source=Zmxvd2NoYXJ0IExSCiAgU3RhcnQgLS0-IENoZWNre09LP30KICBDaGVjayAtLT58WWVzfCBEb25lCiAgQ2hlY2sgLS0-fE5vfCBSZXRyeSAtLT4gQ2hlY2s&theme=atlas" width="220"> | <img src="https://api.beauty-diagram.com/v1/beautify.svg?source=Zmxvd2NoYXJ0IExSCiAgU3RhcnQgLS0-IENoZWNre09LP30KICBDaGVjayAtLT58WWVzfCBEb25lCiAgQ2hlY2sgLS0-fE5vfCBSZXRyeSAtLT4gQ2hlY2s&theme=obsidian" width="220"> | <img src="https://api.beauty-diagram.com/v1/beautify.svg?source=Zmxvd2NoYXJ0IExSCiAgU3RhcnQgLS0-IENoZWNre09LP30KICBDaGVjayAtLT58WWVzfCBEb25lCiAgQ2hlY2sgLS0-fE5vfCBSZXRyeSAtLT4gQ2hlY2s&theme=brutalist" width="220"> |

| Atelier (Pro) | Blueprint (Premium) | Memphis (Premium) |
|---|---|---|
| <img src="https://api.beauty-diagram.com/v1/beautify.svg?source=Zmxvd2NoYXJ0IExSCiAgU3RhcnQgLS0-IENoZWNre09LP30KICBDaGVjayAtLT58WWVzfCBEb25lCiAgQ2hlY2sgLS0-fE5vfCBSZXRyeSAtLT4gQ2hlY2s&theme=atelier" width="220"> | <img src="https://api.beauty-diagram.com/v1/beautify.svg?source=Zmxvd2NoYXJ0IExSCiAgU3RhcnQgLS0-IENoZWNre09LP30KICBDaGVjayAtLT58WWVzfCBEb25lCiAgQ2hlY2sgLS0-fE5vfCBSZXRyeSAtLT4gQ2hlY2s&theme=blueprint" width="220"> | <img src="https://api.beauty-diagram.com/v1/beautify.svg?source=Zmxvd2NoYXJ0IExSCiAgU3RhcnQgLS0-IENoZWNre09LP30KICBDaGVjayAtLT58WWVzfCBEb25lCiAgQ2hlY2sgLS0-fE5vfCBSZXRyeSAtLT4gQ2hlY2s&theme=memphis" width="220"> |

Sequence diagrams get the same treatment:

<img src="https://api.beauty-diagram.com/v1/beautify.svg?source=c2VxdWVuY2VEaWFncmFtCiAgcGFydGljaXBhbnQgVXNlcgogIHBhcnRpY2lwYW50IEFQSQogIFVzZXItPj5BUEk6IFBPU1QgL3YxL3NoYXJlCiAgQVBJLS0-PlVzZXI6IHNoYXJlVG9rZW4&theme=modern" width="520">

And PlantUML:

<img src="https://api.beauty-diagram.com/v1/beautify.svg?source=QHN0YXJ0dW1sCmFjdG9yIFVzZXIKcGFydGljaXBhbnQgU3lzdGVtClVzZXIgLT4gU3lzdGVtOiBsb2dpbgpTeXN0ZW0gLT4gVXNlcjogdG9rZW4KQGVuZHVtbA&theme=modern" width="520">

## Installation

### Beta (via BRAT) — recommended while in alpha

1. Install the [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin from Obsidian Community Plugins.
2. BRAT settings → **Add Beta plugin**.
3. Paste `beauty-diagram/obsidian-beauty-diagram`.
4. Obsidian → Settings → Community plugins → enable **Beauty Diagram**.
5. Open any note with a ` ```mermaid ` or ` ```plantuml ` block in **Reading View**.

### Community Plugins (after stabilization)

Coming soon — search for **Beauty Diagram** in Obsidian's Browse community plugins panel.

## Usage

### Default render

Every ` ```mermaid ` and ` ```plantuml ` block in **Reading View** is rendered through Beauty Diagram automatically. Live Preview shows Obsidian's built-in renderer; switch to Reading View to see the beautified version.

### Per-block theme override

Want Memphis on one block and Modern on the rest? Put a directive on the first line:

```
\`\`\`mermaid
%% bd:theme=memphis
flowchart LR
  A --> B
\`\`\`
```

For PlantUML use `' bd:theme=memphis` instead.

The directive is consumed by the plugin and stripped before rendering — it never appears in the output.

### Source injection (portable notes)

If you publish your vault (Obsidian Publish, paste to Notion, blog export, etc.), run `Cmd+P` → **Beauty Diagram: Inject embed URLs in current note**. The plugin walks every mermaid/plantuml fence and injects an idempotent `<img>` reference below it that renders anywhere markdown is read.

Cleanup: **Beauty Diagram: Clean orphan embed URLs in vault** removes injected references whose source fence has been deleted.

## Configuration

| Setting | Default | Notes |
|---|---|---|
| API key | empty | Optional. Anonymous renders are watermarked and capped at 5 KB per source. Pro/Premium key removes both. Get one at [beauty-diagram.com/account/api-keys](https://www.beauty-diagram.com/account/api-keys). |
| Default theme | Modern | One of 9. Per-block directive overrides. |
| Replace built-in mermaid render | on | Off lets Obsidian render mermaid blocks itself. |
| Handle plantuml fences | on | Obsidian has no built-in plantuml renderer. |
| Auto-inject on save | off | When on, every Markdown save runs source injection. |

## How it compares

| | Beauty Diagram | Obsidian built-in mermaid | obsidian-plantuml |
|---|---|---|---|
| Mermaid support | ✓ | ✓ | — |
| PlantUML support | ✓ (no local setup) | — | ✓ (needs local Java or PUML server) |
| Themes | 9 | 1 | 1 |
| Dark-mode contrast | ✓ | depends on vault theme | depends |
| Source-injection (portable) | ✓ | — | — |
| Mobile-friendly | ✓ | ✓ | depends |

## FAQ

**Q: Does the plugin work in Live Preview?**
A: Not yet — render runs in Reading View only. Live Preview falls back to Obsidian's built-in. Roadmap.

**Q: Where do my diagrams go?**
A: Anonymous renders are stateless — the source is encoded directly into the embed URL and rendered on demand. With an API key, source is also saved to your Beauty Diagram account for share-link access and unwatermarked output.

**Q: Mobile support?**
A: Yes. The plugin uses Obsidian's `requestUrl` API which works on iOS / Android. Image cache size is smaller on mobile (200 entries vs 1000 desktop).

**Q: I want to edit the diagram in a richer editor.**
A: Hover any rendered diagram — a small **↗ Open in editor** badge appears in the bottom-right corner. Click it to open the [Beauty Diagram editor](https://www.beauty-diagram.com/editor) with the source prefilled. Edits there don't sync back to your Obsidian note — use Obsidian's source mode for that.

**Q: I see "Couldn't render this diagram".**
A: Common causes: source > 5 KB without an API key, or your network is blocking `api.beauty-diagram.com`. Click "Use built-in renderer" in the error UI to fall back to Obsidian's built-in for mermaid blocks.

## Privacy

- Anonymous render path: your source is base64url-encoded into the URL query string. The Beauty Diagram API receives the source to render but does not persist it.
- With API key: source is saved to your account (see [privacy policy](https://www.beauty-diagram.com/privacy)).
- The plugin sends `X-Bd-Client: obsidian` to help us see which clients are healthy in aggregate. No personal data, no telemetry beyond standard request logs.

## License

MIT. See [LICENSE](LICENSE).
