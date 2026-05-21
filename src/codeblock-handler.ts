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
  fallback: (source: string, sourceFormat: SourceFormat, el: HTMLElement) => Promise<void>
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
      renderError(el, err, () => deps.fallback(cleanSource, sourceFormat, el))
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
      renderError(el, err, () => deps.fallback(cleanSource, sourceFormat, el))
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
  const hasApiKey = !!deps.settings.apiKey
  const result = composeUrl({
    source, theme, sourceFormat, hasApiKey,
    apiBase: deps.settings.apiBase,
    bg,
  })

  if (result.kind === 'anonymous') return result.url

  // needs-share
  if (result.reason === 'over-size-cap' && !hasApiKey) {
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

function renderError(el: HTMLElement, err: unknown, onFallback: () => Promise<void>) {
  const box = el.createDiv({ cls: 'bd-error' })
  box.createEl('div', { cls: 'bd-error-title', text: "Couldn't render this diagram" })
  const msg = err instanceof ApiError ? err.message : (err as Error).message ?? 'Unknown error'
  box.createEl('div', { cls: 'bd-error-message', text: msg })
  const actions = box.createDiv({ cls: 'bd-error-actions' })
  const fallbackBtn = actions.createEl('button', { text: 'Use built-in renderer' })
  fallbackBtn.onclick = () => {
    box.detach()
    onFallback()
  }
}

function firstNonEmptyLine(s: string): string {
  for (const line of s.split('\n')) {
    if (line.trim()) return line.trim().slice(0, 80)
  }
  return 'Diagram'
}
