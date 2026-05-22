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
- **Honest error handling** — if the Beauty Diagram service is unreachable, the error UI lets you one-click disable the plugin for mermaid blocks and revert to Obsidian's built-in renderer.

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

Want Classic on one block and the default on the rest? Put a directive on the first line:

````md
```mermaid
%% bd:theme=classic
flowchart LR
  A --> B
```
````

For PlantUML use `' bd:theme=classic` instead.

You can stack directives — one per line. `bg=transparent` keeps the diagram's canvas transparent for overlay on colored backgrounds:

````md
```mermaid
%% bd:theme=classic
%% bd:bg=transparent
flowchart LR
  A --> B
```
````

Supported keys: `theme` (any of the 9 themes), `bg` (`transparent` only). Directive lines are consumed by the plugin and stripped before rendering.

### Share mode (Pro+, per-page opt-in)

By default every diagram renders via the anonymous endpoint `/v1/beautify.svg` — fast, no quota, **always watermarked**. This applies to everyone including Pro users.

If you have a Pro or Premium plan, you can opt in **per page** to render diagrams without watermark:

1. Open the page in any view.
2. Command Palette → **Beauty Diagram: Toggle share mode for this page**.
3. The plugin adds a marker to the page's YAML front-matter:

   ```yaml
   ---
   # Beauty Diagram: share-mode (watermark-free preview, consumes share quota per unique diagram).
   bd-share: true
   ---
   ```

4. Switch to Reading View — diagrams now render via `/v1/share/<id>.svg`. Pro/Premium owners get no watermark; the source is saved as a share on your account so it can also be referenced from a public URL.

**Quota model**: each unique diagram source consumes 1 share quota (Pro: 100/month) on its first preview. Subsequent previews of the same source hit the local cache for free. Editing a diagram counts as a new unique source.

Run the toggle command again to disable share mode — the marker is removed and the page reverts to anonymous render.

**Free users** see an upgrade prompt and no marker is written, so no quota is consumed by mistake.

### Source injection (portable notes)

If you publish your vault (Obsidian Publish, paste to Notion, blog export, etc.), run `Cmd+P` → **Beauty Diagram: Inject embed URLs in current note**. The plugin walks every mermaid/plantuml fence and injects an idempotent `<img>` reference below it that renders anywhere markdown is read.

Cleanup: **Beauty Diagram: Clean orphan embed URLs in vault** removes injected references whose source fence has been deleted.

## Configuration

| Setting | Default | Notes |
|---|---|---|
| API key | empty | Optional. Required for share mode and source injection. Without one, preview renders anonymously (watermark, 5 KB source cap). Get one at [beauty-diagram.com/account/api-keys](https://www.beauty-diagram.com/account/api-keys). |
| Default theme | Classic | One of 9. Per-block directive overrides. |
| Replace built-in mermaid render | on | Off lets Obsidian render mermaid blocks itself. |
| Handle plantuml fences | on | Obsidian has no built-in plantuml renderer. |
| Auto-inject on save | off | When on, every Markdown save runs source injection. |

The **Verify** button next to the API key field surfaces your current plan and this month's share quota usage — use it before / after enabling share mode to confirm the gating.

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
A: Anonymous renders (default) are stateless — the source is encoded directly into the embed URL and rendered on demand. The server doesn't persist anything. Share mode (Pro+ opt-in) saves the source to your Beauty Diagram account so it can be served watermark-free and shared via public URL — that's why it consumes share quota.

**Q: My Pro key isn't removing the watermark.**
A: API key alone doesn't auto-enable watermark-free preview — that would silently consume your monthly share quota. Watermark-free is an explicit per-page opt-in: run **Beauty Diagram: Toggle share mode for this page** from the Command Palette. The plugin adds `bd-share: true` to the front-matter and renders that page via the share endpoint. See the [Share mode](#share-mode-pro-per-page-opt-in) section above.

**Q: Mobile support?**
A: Yes. The plugin uses Obsidian's `requestUrl` API which works on iOS / Android. Image cache size is smaller on mobile (200 entries vs 1000 desktop).

**Q: I want to edit the diagram in a richer editor.**
A: Hover any rendered diagram — a small **↗ Open in editor** badge appears in the bottom-right corner. Click it to open the [Beauty Diagram editor](https://www.beauty-diagram.com/editor) with the source prefilled. Edits there don't sync back to your Obsidian note — use Obsidian's source mode for that.

**Q: I see "Couldn't render this diagram".**
A: Common causes: source > 5 KB without an API key, or your network is blocking `api.beauty-diagram.com`. For mermaid blocks, click "Use Obsidian's built-in renderer" in the error UI to disable Beauty Diagram for mermaid and let Obsidian render them itself. PlantUML has no built-in fallback — re-enable network access or restore connectivity.

## Privacy

**This plugin makes HTTP requests to `api.beauty-diagram.com` by default** to render diagrams. Disclosure:

- **Anonymous render**: every ` ```mermaid ` / ` ```plantuml ` block in Reading View triggers a GET to `/v1/beautify.svg` with the block's source base64url-encoded into the URL query string. The server uses the source to render the SVG and does **not** persist it.
- **Share mode (per-page opt-in)**: pages with `bd-share: true` in front-matter send their diagrams via POST to `/v1/share` using your API key. The server saves these to your Beauty Diagram account so they can be served as embed URLs (see [privacy policy](https://www.beauty-diagram.com/privacy)). Without the front-matter marker the share endpoint is not called.
- **Source injection command**: explicit user action via Command Palette. Same `/v1/share` path as share mode but writes the resulting URLs into the markdown file so the diagrams render anywhere markdown is read.
- **Analytics**: the plugin sends an `X-Bd-Client: obsidian` request header so we can see in aggregate which clients are healthy. No personal data, no telemetry endpoints beyond standard request logs.

### Opt-out

Two levels of opt-out:

1. **Disable the plugin entirely** — Settings → Community plugins → toggle Beauty Diagram off. Obsidian's built-in mermaid renders blocks; plantuml fences stay as plain text. Zero network requests.
2. **Disable per source format** — Settings → Beauty Diagram → toggle "Replace built-in mermaid render" or "Handle plantuml fences" off. Affected blocks fall back to Obsidian default (mermaid) or plain text (plantuml). No network requests for the disabled format.

### Self-host

If you run your own Beauty Diagram server (the project is self-hostable), set Settings → Beauty Diagram → Advanced → API base URL to your instance. The plugin will hit only that origin, never the hosted SaaS.

## License

MIT. See [LICENSE](LICENSE).
