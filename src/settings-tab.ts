import { App, Notice, PluginSettingTab, Setting } from 'obsidian'
import type BeautyDiagramPlugin from '../main'
import { DEFAULT_SETTINGS } from './settings'
import { FALLBACK_THEMES } from './constants'

export class BeautyDiagramSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: BeautyDiagramPlugin) {
    super(app, plugin)
  }

  display(): void {
    const { containerEl } = this
    containerEl.empty()

    // —— Authentication ——
    new Setting(containerEl).setName('Authentication').setHeading()

    new Setting(containerEl)
      .setName('API key')
      .setDesc('Optional. Without a key, diagrams are rendered anonymously with a watermark. Get a key at beauty-diagram.com/account/api-keys.')
      .addText((text) => {
        text.inputEl.type = 'password'
        text.setValue(this.plugin.settings.apiKey)
          .setPlaceholder('bd_live_…')
          .onChange(async (v) => {
            this.plugin.settings.apiKey = v.trim()
            await this.plugin.saveSettings()
          })
      })
      .addButton((btn) =>
        btn.setButtonText('Verify').onClick(async () => {
          try {
            const usage = await this.plugin.api.getUsage()
            // Successful auth confirms the cache too — invalidate so a freshly
            // upgraded user doesn't hit a 5-min stale 'free' reading on toggle.
            this.plugin.usage.invalidate()
            const plan = usage.plan
            const q = usage.exports
            // Premium plans return limit: null (no cap). Show "unlimited"
            // rather than the literal null, otherwise the notice reads
            // "54/null share quota used this month".
            const quotaText = q
              ? q.limit == null
                ? ` · ${q.used} share renders this month (unlimited)`
                : ` · ${q.used}/${q.limit} share quota used this month`
              : ''
            new Notice(`Beauty Diagram: verified. Plan: ${plan}${quotaText}`, 8000)
          } catch (err) {
            new Notice(`Beauty Diagram: Key verification failed (${(err as Error).message})`, 8000)
          }
        })
      )

    // —— Rendering ——
    new Setting(containerEl).setName('Rendering').setHeading()

    new Setting(containerEl)
      .setName('Default theme')
      .setDesc("Applied to all diagrams that don't specify their own theme.")
      .addDropdown((dd) => {
        for (const t of FALLBACK_THEMES) dd.addOption(t, capitalize(t))
        dd.setValue(this.plugin.settings.defaultTheme).onChange(async (v) => {
          this.plugin.settings.defaultTheme = v
          await this.plugin.saveSettings()
        })
      })

    new Setting(containerEl)
      .setName('Default image width')
      .setDesc(
        'Max-width applied to every rendered diagram. ' +
          'Override per page by adding `bd-width: 800px` to the note front-matter ' +
          '(or run the "Set image width for this page" command). ' +
          'Accepts the 4 presets or any CSS length (e.g. `720px`, `75%`, `40em`).',
      )
      .addDropdown((dd) => {
        dd.addOption('full', 'Full (default)')
        dd.addOption('800px', 'Wide — 800px')
        dd.addOption('640px', 'Medium — 640px')
        dd.addOption('480px', 'Narrow — 480px')
        // If the user has set a custom value via data.json or front-matter,
        // surface it so the dropdown doesn't silently reset to "Full".
        const current = this.plugin.settings.defaultImageWidth
        const isPreset = ['full', '800px', '640px', '480px'].includes(current)
        if (!isPreset) dd.addOption(current, `Custom — ${current}`)
        dd.setValue(current).onChange(async (v) => {
          this.plugin.settings.defaultImageWidth = v
          await this.plugin.saveSettings()
        })
      })

    new Setting(containerEl)
      .setName('Replace built-in mermaid render')
      .setDesc('When off, Obsidian renders mermaid blocks itself.')
      .addToggle((tg) =>
        tg.setValue(this.plugin.settings.replaceMermaid).onChange(async (v) => {
          this.plugin.settings.replaceMermaid = v
          await this.plugin.saveSettings()
          new Notice('Beauty Diagram: Restart Obsidian for this to take effect.')
        })
      )

    new Setting(containerEl)
      .setName('Fall back to built-in renderer on failure')
      .setDesc(
        'When Beauty Diagram cannot render a mermaid block (unsupported syntax, service unreachable), render that block with Obsidian\'s built-in renderer instead of showing an error box. A badge on the block explains why.',
      )
      .addToggle((tg) =>
        tg.setValue(this.plugin.settings.fallbackToNativeRenderer).onChange(async (v) => {
          this.plugin.settings.fallbackToNativeRenderer = v
          await this.plugin.saveSettings()
        })
      )

    new Setting(containerEl)
      .setName('Handle plantuml fences')
      .setDesc('Obsidian has no built-in PlantUML rendering. Off leaves fences as plain text.')
      .addToggle((tg) =>
        tg.setValue(this.plugin.settings.handlePlantuml).onChange(async (v) => {
          this.plugin.settings.handlePlantuml = v
          await this.plugin.saveSettings()
          new Notice('Beauty Diagram: Restart Obsidian for this to take effect.')
        })
      )

    new Setting(containerEl)
      .setName('Lazy load images')
      .setDesc('Defer loading diagrams scrolled off-screen.')
      .addToggle((tg) =>
        tg.setValue(this.plugin.settings.lazyLoadImages).onChange(async (v) => {
          this.plugin.settings.lazyLoadImages = v
          await this.plugin.saveSettings()
        })
      )

    // —— Watermark-free preview ——
    new Setting(containerEl).setName('Watermark-free preview (Pro+)').setHeading()

    const shareDesc = containerEl.createDiv({ cls: 'setting-item-description bd-setting-note' })
    shareDesc.createSpan({
      text:
        'For your own viewing only. By default every diagram renders via the anonymous endpoint with a watermark. ' +
        "Pro and Premium users can opt in per page to render without watermark — open the page, " +
        'then run ',
    })
    shareDesc.createEl('code', { text: 'Beauty Diagram: Toggle watermark-free preview for this page' })
    shareDesc.createSpan({
      text: ' from the Command Palette. The plugin writes ',
    })
    shareDesc.createEl('code', { text: 'bd-share: true' })
    shareDesc.createSpan({
      text:
        " into the page's YAML front-matter. First preview of each unique diagram " +
        'consumes 1 share quota from your plan; subsequent previews hit the local cache for free. ' +
        'This only affects what YOU see in your own Obsidian — collaborators reading the markdown elsewhere still see the watermarked anonymous render. To share watermark-free with others, use the embed command below.',
    })

    const quotaHint = containerEl.createDiv({ cls: 'setting-item-description bd-setting-note-lg' })
    quotaHint.createSpan({ text: 'Check current quota usage at ' })
    quotaHint.createEl('a', {
      text: 'beauty-diagram.com/account/usage',
      attr: { href: 'https://www.beauty-diagram.com/account/usage', target: '_blank' },
    })
    quotaHint.createSpan({ text: ' (or click ' })
    quotaHint.createEl('strong', { text: 'Verify' })
    quotaHint.createSpan({ text: ' above to see your plan and current month usage).' })

    // —— Embed share URLs (for external readers) ——
    new Setting(containerEl).setName('Embed share URLs (for external readers)').setHeading()

    const embedDesc = containerEl.createDiv({ cls: 'setting-item-description bd-setting-note' })
    embedDesc.createSpan({
      text:
        'Bakes a Beauty Diagram share URL into the markdown next to every fence, so anyone who reads the note ' +
        '(GitHub, Notion paste, Hugo, Obsidian Publish, a colleague without the plugin…) sees the polished diagram — no plugin required on their side. ' +
        'Modifies your notes. With a Pro+ API key the URL is watermark-free; without an API key it falls back to the anonymous watermarked URL.',
    })

    new Setting(containerEl)
      .setName('Embed share URLs into this note')
      .addButton((btn) =>
        btn.setButtonText('Run').onClick(() => this.plugin.runInjectionCurrent())
      )

    new Setting(containerEl)
      .setName('Embed share URLs into this vault')
      .setDesc('Walks every Markdown file in the vault. Idempotent — re-runs leave existing embeds untouched.')
      .addButton((btn) =>
        btn.setButtonText('Run').onClick(() => this.plugin.runInjectionVault())
      )

    new Setting(containerEl)
      .setName('Clean orphan embeds in vault')
      .setDesc('Removes embed blocks whose source fence has been deleted.')
      .addButton((btn) =>
        btn.setButtonText('Run').onClick(() => this.plugin.runCleanVault())
      )

    new Setting(containerEl)
      .setName('Auto-inject on save')
      .setDesc('Re-run injection on every Markdown save. Off by default.')
      .addToggle((tg) =>
        tg.setValue(this.plugin.settings.autoInjectOnSave).onChange(async (v) => {
          this.plugin.settings.autoInjectOnSave = v
          await this.plugin.saveSettings()
        })
      )

    // —— Advanced ——
    new Setting(containerEl).setName('Advanced').setHeading()

    new Setting(containerEl)
      .setName('API base URL')
      .setDesc('Override for development. Leave at default in production.')
      .addText((text) =>
        text.setValue(this.plugin.settings.apiBase).onChange(async (v) => {
          this.plugin.settings.apiBase = v.trim() || DEFAULT_SETTINGS.apiBase
          await this.plugin.saveSettings()
        })
      )

    new Setting(containerEl)
      .setName('Clear share-id cache')
      .addButton((btn) =>
        btn.setButtonText('Clear').onClick(async () => {
          await this.plugin.cache.clear()
          new Notice('Beauty Diagram: cache cleared.')
        })
      )
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
