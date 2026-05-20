import type { SourceType } from './types'

let mermaidPromise: Promise<any> | null = null

// Use Function constructor to hide the dynamic URL import from esbuild's static analysis.
// esbuild cannot resolve "https://..." specifiers and would emit an error if it sees them.
// This indirection defers resolution entirely to Electron's runtime ESM loader.
const importFromUrl = new Function('url', 'return import(url)') as (url: string) => Promise<any>

async function loadMermaid(): Promise<any> {
  if (!mermaidPromise) {
    // Dynamic CDN load to avoid bundle bloat. Obsidian Electron supports ESM dynamic import.
    mermaidPromise = importFromUrl(
      'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs'
    ).then((m: any) => {
      const mermaid = m.default ?? m
      mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' })
      return mermaid
    })
  }
  return mermaidPromise
}

export async function fallbackRender(
  source: string,
  type: SourceType,
  el: HTMLElement
): Promise<void> {
  el.empty()
  const banner = el.createDiv({ cls: 'bd-fallback-banner', text: 'Using built-in renderer (Beauty Diagram service unreachable)' })
  banner.style.fontSize = '0.85em'
  banner.style.opacity = '0.7'
  banner.style.marginBottom = '6px'

  if (type === 'plantuml') {
    el.createDiv({ cls: 'bd-error', text: 'PlantUML requires the Beauty Diagram service. No local fallback available.' })
    return
  }

  try {
    const mermaid = await loadMermaid()
    const id = `bd-fallback-${Math.random().toString(36).slice(2)}`
    const { svg } = await mermaid.render(id, source)
    const container = el.createDiv()
    container.innerHTML = svg
  } catch (err) {
    el.createDiv({ cls: 'bd-error', text: `Fallback render failed: ${(err as Error).message}` })
  }
}
