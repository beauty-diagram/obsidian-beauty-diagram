import { MarkdownView, Notice, Platform, Plugin, SuggestModal, TFile } from 'obsidian'
import { BeautyDiagramSettings, DEFAULT_SETTINGS, loadSettings, saveSettings } from './src/settings'
import { BeautyDiagramSettingTab } from './src/settings-tab'
import { ShareCache } from './src/share-cache'
import { createApiClient, ApiClient } from './src/api-client'
import { makeHandler } from './src/codeblock-handler'
import { injectEmbeds, cleanEmbeds } from './src/injection'
import { parsePageMode, setPageShareMode } from './src/share-mode'
import {
  IMAGE_WIDTH_PRESETS,
  parsePageWidth,
  resolveEffectiveWidth,
  setPageWidth,
  widthToInlineStyle,
  type ImageWidthValue,
} from './src/image-width'
import { UsageCache } from './src/usage-cache'
import { shortHash } from './src/hash'
import type { SourceFormat } from './src/types'

const PLUGIN_VERSION = '0.1.0'

export default class BeautyDiagramPlugin extends Plugin {
  settings!: BeautyDiagramSettings
  cache!: ShareCache
  api!: ApiClient
  usage!: UsageCache

  async onload() {
    this.settings = await loadSettings(this)
    this.cache = new ShareCache({
      maxEntries: Platform.isMobile ? 200 : 1000,
    })
    this.api = createApiClient({
      apiBase: this.settings.apiBase,
      apiKey: this.settings.apiKey || null,
      version: PLUGIN_VERSION,
    })
    this.usage = new UsageCache(this.api)

    const disableForFormat = async (sourceFormat: SourceFormat) => {
      if (sourceFormat === 'mermaid') {
        this.settings.replaceMermaid = false
      } else {
        this.settings.handlePlantuml = false
      }
      await this.saveSettings()
      new Notice(
        'Beauty Diagram disabled for ' + sourceFormat +
        " blocks. Reload Obsidian (Cmd+P → 'Reload app without saving') to switch to the built-in renderer.",
        8000,
      )
    }

    // getApi is a lazy accessor — NOT a captured snapshot. saveSettings
    // rebuilds this.api when the user changes their key / base URL, and
    // the handler closure needs to pick up the new client on next render
    // instead of latching to the onload-time instance (which would silently
    // call /v1/share with stale credentials and produce the wrong plan tier).
    const handlerDeps = {
      app: this.app,
      settings: this.settings,
      cache: this.cache,
      getApi: () => this.api,
      disableForFormat,
    }

    if (this.settings.replaceMermaid) {
      const mermaidHandler = makeHandler('mermaid', handlerDeps)

      this.registerMarkdownPostProcessor(async (el, ctx) => {
        // Path A: catch raw pre>code BEFORE built-in renders
        const codes = Array.from(el.querySelectorAll<HTMLElement>('pre > code.language-mermaid'))
        for (const code of codes) {
          // Never re-capture fences rendered by our own per-block native
          // fallback (codeblock-handler renders them inside .bd-block) —
          // doing so would loop: handler → native fallback → handler → …
          if (code.closest('.bd-block')) continue
          const source = code.textContent ?? ''
          const pre = code.parentElement
          if (!pre) continue
          const container = document.createElement('div')
          pre.replaceWith(container)
          await mermaidHandler(source, container, ctx)
        }

        // Path B: catch .mermaid divs AFTER built-in renders. Source is on data-source if
        // built-in stores it; otherwise we read the original code text from a sibling attribute.
        // Obsidian's built-in mermaid keeps the original source on the .mermaid div in some versions.
        const divs = Array.from(el.querySelectorAll<HTMLElement>('.mermaid'))
        for (const div of divs) {
          // Skip if already our handler's output
          if (div.querySelector('.bd-img') || div.closest('.bd-block')) continue

          // Try multiple ways to recover the source
          let source =
            div.getAttribute('data-source') ??
            (div as any).dataset?.source ??
            ''

          // Fall back to the textContent of the div if it still contains raw text
          // (some Obsidian versions leave the source as a child text node)
          if (!source) {
            const raw = div.textContent ?? ''
            // Heuristic: if it starts with a mermaid keyword, treat as source
            if (/^\s*(flowchart|sequenceDiagram|classDiagram|erDiagram|stateDiagram|gantt|pie|gitGraph|mindmap|xychart|journey|timeline)/i.test(raw)) {
              source = raw
            }
          }

          // Path C: recover from the markdown section info. Once Obsidian's
          // built-in mermaid has rendered the fence to <svg>, the original
          // source is no longer in the DOM at all — neither attribute nor
          // textContent has it. ctx.getSectionInfo() returns the surrounding
          // markdown text + line range, from which we can extract the fence
          // body. This is the most robust recovery and covers the modern
          // Obsidian builds where mermaid pre-renders before our processor.
          if (!source) {
            source = recoverFenceSourceFromSection(div, ctx) ?? ''
          }

          if (!source) continue

          const container = document.createElement('div')
          div.replaceWith(container)
          await mermaidHandler(source, container, ctx)
        }
      }, -10000)
    }
    if (this.settings.handlePlantuml) {
      this.registerMarkdownCodeBlockProcessor('plantuml', makeHandler('plantuml', handlerDeps))
    }

    this.addSettingTab(new BeautyDiagramSettingTab(this.app, this))

    this.addCommand({
      id: 'inject-current',
      name: 'Embed share URLs into this note',
      callback: () => this.runInjectionCurrent(),
    })
    this.addCommand({
      id: 'inject-vault',
      name: 'Embed share URLs into this vault',
      callback: () => this.runInjectionVault(),
    })
    this.addCommand({
      id: 'clean-vault',
      name: 'Clean orphan embeds in vault',
      callback: () => this.runCleanVault(),
    })
    this.addCommand({
      id: 'toggle-share-mode',
      name: 'Toggle watermark-free preview for this page',
      // checkCallback so the command shows up in Reading View (where
      // most users sit to look at rendered diagrams), not just in
      // editor / Live Preview. We resolve the target via the active
      // file rather than the active editor.
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile()
        if (!file || file.extension !== 'md') return false
        if (!checking) {
          this.toggleShareMode(file)
        }
        return true
      },
    })
    this.addCommand({
      id: 'set-image-width',
      name: 'Set image width for this page',
      // Two-step picker: parent command opens a SuggestModal with the
      // 4 width presets + a "Remove override" option. Same UX pattern
      // as Obsidian's "Switch theme" command — keeps the command palette
      // uncluttered while making every preset reachable in two keystrokes.
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile()
        if (!file || file.extension !== 'md') return false
        if (!checking) {
          new ImageWidthPickerModal(this, file).open()
        }
        return true
      },
    })

    if (this.settings.autoInjectOnSave) {
      this.registerEvent(
        this.app.vault.on('modify', async (file) => {
          if (file instanceof TFile && file.extension === 'md') {
            await this.injectFile(file)
          }
        })
      )
    }

    this.detectConflicts()
  }

  onunload() {
    // Obsidian unregisters processors automatically on unload.
  }

  async saveSettings() {
    await saveSettings(this, this.settings)
    // Recreate API client so apiKey/apiBase changes take effect immediately
    this.api = createApiClient({
      apiBase: this.settings.apiBase,
      apiKey: this.settings.apiKey || null,
      version: PLUGIN_VERSION,
    })
    // Rebuild UsageCache with the new client so the next plan check
    // sees the updated key; also invalidates any stale plan reading.
    this.usage = new UsageCache(this.api)
  }

  async toggleShareMode(file: TFile) {
    // Share mode = Pro+ opt-in to render this page without watermark by
    // routing through /v1/share, which consumes 1 export quota per unique
    // diagram source on first preview. Free users can't go without
    // watermark even via share path, so we surface an upgrade prompt
    // instead of silently consuming their share quota for no benefit.
    // See spec §5 for the gating flow.
    if (!this.settings.apiKey) {
      new Notice(
        "Set your Beauty Diagram API key in plugin settings first, then run this command. " +
          "Watermark-free preview requires an API key to mint share tokens.",
        8000,
      )
      return
    }

    const plan = await this.usage.getPlan()
    if (plan === 'free') {
      new Notice(
        "Watermark-free preview requires a Pro plan. " +
          "Free users still get unlimited anonymous preview with watermark. " +
          "Upgrade at https://www.beauty-diagram.com/pricing",
        10000,
      )
      return
    }
    if (plan === 'unknown') {
      new Notice(
        "Couldn't verify your plan. Check your network and API key, " +
          "then run \"Beauty Diagram: Verify API key\" first.",
        8000,
      )
      return
    }

    const doc = await this.app.vault.read(file)
    const current = parsePageMode(doc)
    const next = current === 'share' ? 'anonymous' : 'share'
    const updated = setPageShareMode(doc, next)
    if (updated !== doc) {
      await this.app.vault.modify(file, updated)
      // vault.modify alone won't re-run the markdown post-processor on an
      // already-open Reading View when only the frontmatter changed —
      // Obsidian's diff layer sees the fence bodies as unchanged and
      // skips reprocessing. Force a full rerender on every leaf showing
      // this file so the new mode takes effect immediately, without the
      // user having to close + reopen the note.
      this.rerenderPreviewsFor(file)
    }

    new Notice(
      next === 'share'
        ? 'Beauty Diagram: watermark-free preview enabled for this page. ' +
            'First preview consumes 1 share quota per unique diagram source.'
        : 'Beauty Diagram: watermark-free preview disabled. This page renders anonymously (watermark).',
      6000,
    )
  }

  /**
   * Force-rerender every open MarkdownView showing the given file.
   * Uses Obsidian's undocumented-but-stable `previewMode.rerender(true)`
   * (used by Templater, Dataview, etc). Silently degrades if the API
   * isn't present so a future Obsidian breakage doesn't crash the
   * plugin — at worst the user falls back to manual reopen.
   */
  private rerenderPreviewsFor(file: TFile) {
    try {
      const leaves = this.app.workspace.getLeavesOfType('markdown')
      for (const leaf of leaves) {
        const view = leaf.view
        if (!(view instanceof MarkdownView)) continue
        if (view.file?.path !== file.path) continue
        const preview = (view as unknown as { previewMode?: { rerender?: (full?: boolean) => void } }).previewMode
        preview?.rerender?.(true)
      }
    } catch {
      // ignore — fallback is the existing "user reopens note" UX
    }
  }

  async runInjectionCurrent() {
    const file = this.app.workspace.getActiveFile()
    if (!file || file.extension !== 'md') {
      new Notice('Beauty Diagram: no Markdown file open.')
      return
    }
    await this.injectFile(file)
    new Notice('Beauty Diagram: injection done.')
  }

  async runInjectionVault() {
    const files = this.app.vault.getMarkdownFiles()
    if (!confirm(`Embed share URLs into ${files.length} Markdown files?`)) return
    let touched = 0
    for (const f of files) {
      if (await this.injectFile(f)) touched++
    }
    new Notice(`Beauty Diagram: injected in ${touched} / ${files.length} files.`)
  }

  async runCleanVault() {
    const files = this.app.vault.getMarkdownFiles()
    if (!confirm(`Clean orphan embed URLs in ${files.length} Markdown files?`)) return
    let touched = 0
    for (const f of files) {
      const original = await this.app.vault.read(f)
      const cleaned = await cleanEmbeds(original)
      if (cleaned !== original) {
        await this.app.vault.modify(f, cleaned)
        touched++
      }
    }
    new Notice(`Beauty Diagram: cleaned ${touched} files.`)
  }

  private async injectFile(file: TFile): Promise<boolean> {
    const original = await this.app.vault.read(file)
    // Namespace the share cache per API key — see share-cache.ts comments
    // and the handler equivalent. Without this two accounts on the same
    // machine would alias each other's share tokens.
    const ownerTag = await shortHash('owner:' + this.settings.apiKey)

    // Resolve bd-width for this file the same way the preview renderer does
    // (front-matter override → vault default → 'full'), then convert to an
    // inline style. The injector switches to `<img>` form when a non-empty
    // style is returned so the bd-width override survives outside Obsidian
    // (GitHub render, Notion paste, etc.). When `widthStyle` is empty the
    // injector keeps the markdown-image `![]()` form for parity with CLI.
    const pageWidth = parsePageWidth(original)
    const effectiveWidth = resolveEffectiveWidth(pageWidth, this.settings.defaultImageWidth)
    const widthStyle = widthToInlineStyle(effectiveWidth)

    const updated = await injectEmbeds(original, {
      theme: this.settings.defaultTheme,
      hasApiKey: !!this.settings.apiKey,
      apiBase: this.settings.apiBase,
      widthStyle: widthStyle || null,
      shareIdForSource: async (src, theme, sourceFormat: SourceFormat) => {
        const cached = await this.cache.get(src, theme, sourceFormat, ownerTag)
        if (cached) return cached
        if (!this.settings.apiKey) return null
        try {
          const share = await this.api.createShare({ source: src, theme, sourceFormat })
          await this.cache.set(src, theme, sourceFormat, share.shareToken, ownerTag)
          return share.shareToken
        } catch {
          return null
        }
      },
    })
    if (updated !== original) {
      await this.app.vault.modify(file, updated)
      return true
    }
    return false
  }

  private detectConflicts() {
    // Spec §10 #5: warn once when known conflicting plugins are enabled.
    const conflicts = ['obsidian-plantuml', 'mermaid-plus']
    const enabled = (this.app as any).plugins?.enabledPlugins as Set<string> | undefined
    if (!enabled) return
    for (const id of conflicts) {
      if (enabled.has(id)) {
        new Notice(
          `Beauty Diagram: detected "${id}". You may want to disable one of them to avoid double rendering.`,
          8000
        )
      }
    }
  }

  /**
   * Apply (or remove) the per-page `bd-width` front-matter override on
   * the given file. Pass `null` to clear and fall back to the vault
   * default (`settings.defaultImageWidth`). Triggers a re-render by
   * touching the file via `vault.modify`.
   */
  async setPageImageWidth(file: TFile, value: ImageWidthValue | null): Promise<void> {
    const original = await this.app.vault.read(file)
    const withFm = setPageWidth(original, value)
    if (withFm === original) {
      new Notice('Beauty Diagram: image width unchanged.', 3000)
      return
    }

    // Also refresh the inline style on existing embed `<img>` tags so any
    // previously-published embeds visually match the new bd-width without
    // the user having to manually re-run "Embed share URLs". refreshOnly
    // reuses each embed's existing URL verbatim — no fresh share tokens
    // are minted, no share quota is consumed.
    const pageWidth = parsePageWidth(withFm)
    const effectiveWidth = resolveEffectiveWidth(pageWidth, this.settings.defaultImageWidth)
    const widthStyle = widthToInlineStyle(effectiveWidth)
    const ownerTag = await shortHash('owner:' + this.settings.apiKey)
    const updated = await injectEmbeds(withFm, {
      theme: this.settings.defaultTheme,
      hasApiKey: !!this.settings.apiKey,
      apiBase: this.settings.apiBase,
      widthStyle: widthStyle || null,
      refreshOnly: true,
      // refreshOnly never calls shareIdForSource (URL is preserved), so
      // this resolver is unused — but the interface requires one.
      shareIdForSource: async (src, theme, sourceFormat: SourceFormat) =>
        this.cache.get(src, theme, sourceFormat, ownerTag),
    })

    await this.app.vault.modify(file, updated)
    // Force preview re-render — same reason as toggleShareMode (see comment
    // on rerenderPreviewsFor). vault.modify of front-matter alone doesn't
    // re-run the markdown post-processor on an already-open Reading View
    // because Obsidian's diff layer sees the fence bodies as unchanged.
    this.rerenderPreviewsFor(file)
    new Notice(
      value === null
        ? 'Beauty Diagram: removed bd-width override.'
        : `Beauty Diagram: set image width to ${value}.`,
      3000,
    )
  }
}

// ---------------------------------------------------------------------------
// ImageWidthPickerModal — 2-step picker triggered by the
// "Set image width for this page" command. Lists the 4 presets exposed
// by image-width.ts plus a Remove option so users can reset the page
// to follow the vault default again. Same modal class Obsidian uses for
// its own "Switch theme" / "Switch language" commands; users get a
// familiar look + arrow-key navigation + fuzzy search.
// ---------------------------------------------------------------------------

/**
 * Recover a fenced code block's source by asking the post-processor context
 * for the markdown section that produced this DOM element. Walks up the
 * parent chain (the `.mermaid` div itself may not be a recognized section
 * boundary in Obsidian's index, but its `.el-pre` parent usually is) and
 * returns the inner content of the surrounding fence (or null if no fenced
 * section can be located).
 *
 * Needed because Obsidian's built-in mermaid renderer fully replaces the
 * `<pre><code class="language-mermaid">` markup with `<div class="mermaid">
 * <svg>...</svg></div>` BEFORE our post-processor runs, even at sortOrder
 * -10000. The original source text is no longer in the DOM at all.
 */
function recoverFenceSourceFromSection(
  el: HTMLElement,
  ctx: import('obsidian').MarkdownPostProcessorContext,
): string | null {
  let candidate: HTMLElement | null = el
  // Cap at 5 to avoid runaway traversal in unusual nestings.
  for (let depth = 0; candidate && depth < 5; depth++) {
    const info = ctx.getSectionInfo(candidate)
    if (info) {
      const lines = info.text.split('\n').slice(info.lineStart, info.lineEnd + 1)
      if (lines.length < 2) return null
      const first = lines[0].trim()
      const last = lines[lines.length - 1].trim()
      const isFence =
        (first.startsWith('```') || first.startsWith('~~~')) &&
        (last === '```' || last === '~~~')
      if (!isFence) return null
      return lines.slice(1, -1).join('\n')
    }
    candidate = candidate.parentElement
  }
  return null
}

type WidthChoice =
  | { kind: 'preset'; label: string; value: ImageWidthValue }
  | { kind: 'remove'; label: string }

class ImageWidthPickerModal extends SuggestModal<WidthChoice> {
  constructor(
    private readonly plugin: BeautyDiagramPlugin,
    private readonly file: TFile,
  ) {
    super(plugin.app)
    this.setPlaceholder('Pick a max-width for diagrams on this page…')
  }

  getSuggestions(query: string): WidthChoice[] {
    const choices: WidthChoice[] = [
      ...IMAGE_WIDTH_PRESETS.map((p) => ({
        kind: 'preset' as const,
        label: p.label,
        value: p.value,
      })),
      {
        kind: 'remove',
        label: 'Remove override (use vault default)',
      },
    ]
    if (!query) return choices
    const q = query.toLowerCase()
    return choices.filter((c) => c.label.toLowerCase().includes(q))
  }

  renderSuggestion(choice: WidthChoice, el: HTMLElement): void {
    el.createEl('div', { text: choice.label })
  }

  async onChooseSuggestion(choice: WidthChoice): Promise<void> {
    const value = choice.kind === 'preset' ? choice.value : null
    await this.plugin.setPageImageWidth(this.file, value)
  }
}
