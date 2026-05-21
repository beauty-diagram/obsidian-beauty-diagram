import { MarkdownView, Notice, Platform, Plugin, TFile } from 'obsidian'
import { BeautyDiagramSettings, DEFAULT_SETTINGS, loadSettings, saveSettings } from './src/settings'
import { BeautyDiagramSettingTab } from './src/settings-tab'
import { ShareCache } from './src/share-cache'
import { createApiClient, ApiClient } from './src/api-client'
import { makeHandler } from './src/codeblock-handler'
import { injectEmbeds, cleanEmbeds } from './src/injection'
import { parsePageMode, setPageShareMode } from './src/share-mode'
import { UsageCache } from './src/usage-cache'
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

    const handlerDeps = { settings: this.settings, cache: this.cache, api: this.api, disableForFormat }

    if (this.settings.replaceMermaid) {
      const mermaidHandler = makeHandler('mermaid', handlerDeps)

      this.registerMarkdownPostProcessor(async (el, ctx) => {
        // Path A: catch raw pre>code BEFORE built-in renders
        const codes = Array.from(el.querySelectorAll<HTMLElement>('pre > code.language-mermaid'))
        for (const code of codes) {
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
      name: 'Inject embed URLs in current note',
      callback: () => this.runInjectionCurrent(),
    })
    this.addCommand({
      id: 'inject-vault',
      name: 'Inject embed URLs in entire vault',
      callback: () => this.runInjectionVault(),
    })
    this.addCommand({
      id: 'clean-vault',
      name: 'Clean orphan embed URLs in vault',
      callback: () => this.runCleanVault(),
    })
    this.addCommand({
      id: 'toggle-share-mode',
      name: 'Toggle share mode for this page',
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
          "Share mode requires an authenticated key to call /v1/share.",
        8000,
      )
      return
    }

    const plan = await this.usage.getPlan()
    if (plan === 'free') {
      new Notice(
        "Share mode requires a Pro plan. " +
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
        ? 'Beauty Diagram: share mode enabled for this page. ' +
            'First preview consumes 1 share quota per unique diagram source.'
        : 'Beauty Diagram: share mode disabled. This page renders anonymously (watermark).',
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
    if (!confirm(`Inject embed URLs in ${files.length} Markdown files?`)) return
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
    const updated = await injectEmbeds(original, {
      theme: this.settings.defaultTheme,
      hasApiKey: !!this.settings.apiKey,
      apiBase: this.settings.apiBase,
      shareIdForSource: async (src, theme, sourceFormat: SourceFormat) => {
        const cached = await this.cache.get(src, theme, sourceFormat)
        if (cached) return cached
        if (!this.settings.apiKey) return null
        try {
          const share = await this.api.createShare({ source: src, theme, sourceFormat })
          await this.cache.set(src, theme, sourceFormat, share.shareToken)
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
}
