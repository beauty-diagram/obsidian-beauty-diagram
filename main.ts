import { Notice, Platform, Plugin, TFile } from 'obsidian'
import { BeautyDiagramSettings, DEFAULT_SETTINGS, loadSettings, saveSettings } from './src/settings'
import { BeautyDiagramSettingTab } from './src/settings-tab'
import { ShareCache } from './src/share-cache'
import { createApiClient, ApiClient } from './src/api-client'
import { makeHandler } from './src/codeblock-handler'
import { injectEmbeds, cleanEmbeds } from './src/injection'
import type { SourceFormat } from './src/types'

const PLUGIN_VERSION = '0.1.0'

export default class BeautyDiagramPlugin extends Plugin {
  settings!: BeautyDiagramSettings
  cache!: ShareCache
  api!: ApiClient

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
