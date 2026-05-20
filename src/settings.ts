import { Plugin } from 'obsidian'

export interface BeautyDiagramSettings {
  apiKey: string
  apiBase: string
  defaultTheme: string
  replaceMermaid: boolean
  handlePlantuml: boolean
  lazyLoadImages: boolean
  autoInjectOnSave: boolean
}

export const DEFAULT_SETTINGS: BeautyDiagramSettings = {
  apiKey: '',
  apiBase: 'https://api.beauty-diagram.com',
  defaultTheme: 'modern',
  replaceMermaid: true,
  handlePlantuml: true,
  lazyLoadImages: true,
  autoInjectOnSave: false,
}

export async function loadSettings(plugin: Plugin): Promise<BeautyDiagramSettings> {
  const stored = (await plugin.loadData()) as Partial<BeautyDiagramSettings> | null
  return { ...DEFAULT_SETTINGS, ...(stored ?? {}) }
}

export async function saveSettings(plugin: Plugin, settings: BeautyDiagramSettings): Promise<void> {
  await plugin.saveData(settings)
}
