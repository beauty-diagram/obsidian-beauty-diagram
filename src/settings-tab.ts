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
    containerEl.createEl('h2', { text: 'Authentication' })

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
            await this.plugin.api.getUsage()
            new Notice('Beauty Diagram: API key verified.')
          } catch (err) {
            new Notice(`Beauty Diagram: Key verification failed (${(err as Error).message})`)
          }
        })
      )

    // —— Rendering ——
    containerEl.createEl('h2', { text: 'Rendering' })

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

    // —— Source Injection ——
    containerEl.createEl('h2', { text: 'Source Injection' })

    new Setting(containerEl)
      .setName('Inject embed URLs in current note')
      .addButton((btn) =>
        btn.setButtonText('Run').onClick(() => this.plugin.runInjectionCurrent())
      )

    new Setting(containerEl)
      .setName('Inject embed URLs in entire vault')
      .setDesc('Walks every Markdown file in the vault. Idempotent.')
      .addButton((btn) =>
        btn.setButtonText('Run').onClick(() => this.plugin.runInjectionVault())
      )

    new Setting(containerEl)
      .setName('Clean orphan embed URLs')
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
    containerEl.createEl('h2', { text: 'Advanced' })

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
