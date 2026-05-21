import { MarkdownPostProcessorContext } from 'obsidian'
import { composeUrl } from './url-composer'
import { parseDirective } from './directives'
import { ShareCache } from './share-cache'
import { ApiClient, ApiError } from './api-client'
import type { BeautyDiagramSettings } from './settings'
import type { SourceFormat } from './types'
import { editorLink } from './editor-link'

export interface HandlerDeps {
  settings: BeautyDiagramSettings
  cache: ShareCache
  api: ApiClient
  /** Called when user clicks "Use built-in renderer" in the error UI.
   *  Should toggle off the relevant render-replacement setting and
   *  show a Notice prompting the user to reload Obsidian. */
  disableForFormat: (sourceFormat: SourceFormat) => Promise<void>
}

export function makeHandler(sourceFormat: SourceFormat, deps: HandlerDeps) {
  return async (source: string, el: HTMLElement, _ctx: MarkdownPostProcessorContext) => {
    const { overrides, source: cleanSource } = parseDirective(sourceFormat, source)
    const theme = overrides.theme ?? deps.settings.defaultTheme
    const bg = overrides.bg === 'transparent' ? 'transparent' as const : undefined

    el.empty()
    el.addClass('bd-block')

    if (!cleanSource.trim()) {
      el.createDiv({ cls: 'bd-error', text: 'Empty diagram' })
      return
    }

    let url: string
    try {
      url = await resolveUrl(cleanSource, theme, sourceFormat, deps, bg)
    } catch (err) {
      renderError(el, err, deps, sourceFormat)
      return
    }

    const img = el.createEl('img', {
      attr: {
        src: url,
        alt: firstNonEmptyLine(cleanSource),
        loading: deps.settings.lazyLoadImages ? 'lazy' : 'eager',
        'data-bd-source-format': sourceFormat,
      },
    })
    img.addClass('bd-img')

    img.addEventListener('error', () => {
      const err = new ApiError(0, 'image_load_failed', 'Image failed to load')
      el.empty()
      renderError(el, err, deps, sourceFormat)
    })

    // Sibling overlay badge — sits absolutely over the bottom-right of the
    // image. Image itself is NOT wrapped in an anchor so it stays a pure
    // image (no misleading "click to edit and sync" affordance).
    const badge = el.createEl('a', {
      attr: {
        href: editorLink({ source: cleanSource, theme, sourceFormat }),
        target: '_blank',
        rel: 'noopener noreferrer',
        'aria-label':
          "Open this diagram's source in the Beauty Diagram editor (edits don't sync back to this note)",
      },
      text: '↗ Open in editor',
    })
    badge.addClass('bd-edit-badge')
  }
}

async function resolveUrl(
  source: string,
  theme: string,
  sourceFormat: SourceFormat,
  deps: HandlerDeps,
  bg?: 'transparent'
): Promise<string> {
  // Phase 1 of share-mode spec: keep existing behavior — preview goes through
  // share path when an API key is configured. Phase 2 will read the page's
  // frontmatter `bd-share` marker instead, and dropping the implicit
  // "API key → share" rule is the documented break-change in alpha.4.
  const mode = deps.settings.apiKey ? 'share' : 'anonymous'
  const result = composeUrl({
    source, theme, sourceFormat, mode,
    apiBase: deps.settings.apiBase,
    bg,
  })

  if (result.kind === 'anonymous') return result.url

  // needs-share
  if (result.reason === 'over-size-cap' && mode === 'anonymous') {
    throw new ApiError(413, 'source_too_large', 'Diagram exceeds 5 KB. Add an API key in plugin settings.')
  }

  const cached = await deps.cache.get(source, theme, sourceFormat)
  if (cached) {
    const base = `${deps.settings.apiBase}/v1/share/${cached}.svg`
    return bg === 'transparent' ? `${base}?bg=transparent` : base
  }

  const share = await deps.api.createShare({ source, theme, sourceFormat })
  await deps.cache.set(source, theme, sourceFormat, share.shareToken)
  const base = `${deps.settings.apiBase}/v1/share/${share.shareToken}.svg`
  return bg === 'transparent' ? `${base}?bg=transparent` : base
}

function renderError(el: HTMLElement, err: unknown, deps: HandlerDeps, sourceFormat: SourceFormat) {
  const box = el.createDiv({ cls: 'bd-error' })
  box.createEl('div', { cls: 'bd-error-title', text: "Couldn't render this diagram" })
  const msg = err instanceof ApiError ? err.message : (err as Error).message ?? 'Unknown error'
  box.createEl('div', { cls: 'bd-error-message', text: msg })
  box.createEl('div', {
    cls: 'bd-error-hint',
    text: sourceFormat === 'plantuml'
      ? 'PlantUML rendering requires the Beauty Diagram service. Try again when network is restored.'
      : 'Click below to disable Beauty Diagram for mermaid blocks and let Obsidian render them itself. Re-enable any time in plugin settings.',
  })
  const actions = box.createDiv({ cls: 'bd-error-actions' })
  if (sourceFormat === 'mermaid') {
    const btn = actions.createEl('button', { text: "Use Obsidian's built-in renderer" })
    btn.onclick = () => { deps.disableForFormat('mermaid') }
  }
}

function firstNonEmptyLine(s: string): string {
  for (const line of s.split('\n')) {
    if (line.trim()) return line.trim().slice(0, 80)
  }
  return 'Diagram'
}
