import {
  App,
  MarkdownPostProcessorContext,
  MarkdownRenderChild,
  MarkdownRenderer,
  requestUrl,
} from 'obsidian'
import { composeUrl } from './url-composer'
import { isExcluded, parseDirective } from './directives'
import { ShareCache } from './share-cache'
import { ApiClient, ApiError } from './api-client'
import { shortHash } from './hash'
import { resolveEffectiveWidth, widthToInlineStyle } from './image-width'
import type { BeautyDiagramSettings } from './settings'
import type { PageMode, SourceFormat } from './types'
import { editorLink } from './editor-link'

export interface HandlerDeps {
  app: App
  settings: BeautyDiagramSettings
  cache: ShareCache
  /**
   * Lazy accessor for the current ApiClient. Must NOT be a captured
   * snapshot — saveSettings rebuilds the underlying client when the
   * user changes API key / base URL, and the handler needs to see
   * those updates on the next render. A function call here means
   * every createShare uses the freshest credentials.
   */
  getApi: () => ApiClient
  /** Called when user clicks "Use built-in renderer" in the error UI.
   *  Should toggle off the relevant render-replacement setting and
   *  show a Notice prompting the user to reload Obsidian. */
  disableForFormat: (sourceFormat: SourceFormat) => Promise<void>
}

export function makeHandler(sourceFormat: SourceFormat, deps: HandlerDeps) {
  return async (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
    const { overrides, source: cleanSource } = parseDirective(sourceFormat, source)
    const theme = overrides.theme ?? deps.settings.defaultTheme
    const bg = overrides.bg === 'transparent' ? 'transparent' as const : undefined

    // Phase 2 of share-mode spec: per-page mode is driven by the document's
    // YAML front-matter `bd-share: true` marker. Obsidian parses front-matter
    // for us and exposes it on the post-processor context. Strict equality
    // mirrors the share-mode pure module's behavior (string "true" / array
    // [true] / capitalized True all fall back to anonymous).
    const frontmatter = ctx.frontmatter as Record<string, unknown> | null | undefined
    const mode: PageMode = frontmatter?.['bd-share'] === true ? 'share' : 'anonymous'

    // Per-page image width override. YAML auto-coerces `800` to number,
    // so only string values are honored; anything else falls through to
    // the vault default. resolveEffectiveWidth() re-validates against
    // the whitelist so invalid front-matter never reaches the DOM.
    const fmWidthRaw = frontmatter?.['bd-width']
    const pageWidth = typeof fmWidthRaw === 'string' ? fmWidthRaw : null
    const effectiveWidth = resolveEffectiveWidth(
      pageWidth,
      deps.settings.defaultImageWidth,
    )
    const widthStyle = widthToInlineStyle(effectiveWidth)

    el.empty()
    el.addClass('bd-block')

    if (!cleanSource.trim()) {
      el.createDiv({ cls: 'bd-error', text: 'Empty diagram' })
      return
    }

    // `%% bd:exclude` — the user opted this block out of Beauty Diagram.
    // Render via Obsidian's native pipeline, no badge (this is a deliberate
    // choice, not a failure). The bd-block class on `el` keeps main.ts's
    // re-entry guards from re-capturing the nested fence.
    if (isExcluded(overrides)) {
      await renderHostNative(el, cleanSource, sourceFormat, ctx, deps)
      return
    }

    const canFallbackNative =
      sourceFormat === 'mermaid' && deps.settings.fallbackToNativeRenderer

    let url: string
    try {
      url = await resolveUrl(cleanSource, theme, sourceFormat, mode, deps, bg)
    } catch (err) {
      // Pre-image failures (createShare network error, over-size-cap, …):
      // same per-block degradation as a failed <img> load.
      if (canFallbackNative) {
        const msg = err instanceof ApiError ? err.message : (err as Error).message ?? 'Unknown error'
        const ok = await renderNativeFallback(el, cleanSource, theme, ctx, deps, { reason: msg })
        if (ok) return
        el.empty()
      }
      renderError(el, err, deps, sourceFormat)
      return
    }

    // Preview-only opt-in: ask the server to answer render failures with a
    // non-2xx status instead of its HTTP-200 placeholder SVG, so unsupported
    // syntax (e.g. C4) fires <img onerror> exactly like a transport failure.
    // Never baked into note source — injection.ts composes its own URLs.
    const previewUrl = withFailStatus(url)

    const imgAttrs: Record<string, string> = {
      src: previewUrl,
      alt: firstNonEmptyLine(cleanSource),
      loading: deps.settings.lazyLoadImages ? 'lazy' : 'eager',
      'data-bd-source-format': sourceFormat,
    }
    if (widthStyle) imgAttrs.style = widthStyle
    const img = el.createEl('img', { attr: imgAttrs })
    img.addClass('bd-img')

    img.addEventListener('error', () => {
      void (async () => {
        el.empty()
        if (canFallbackNative) {
          const ok = await renderNativeFallback(el, cleanSource, theme, ctx, deps, {
            probeUrl: previewUrl,
          })
          if (ok) return
          el.empty()
        }
        const err = new ApiError(0, 'image_load_failed', 'Image failed to load')
        renderError(el, err, deps, sourceFormat)
      })()
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
  mode: PageMode,
  deps: HandlerDeps,
  bg?: 'transparent'
): Promise<string> {
  // Watermark-free preview (bd-share: true) without API key → degrade to
  // anonymous instead of throwing. Common after API key removal or
  // first-open of a file with bd-share already in front-matter (e.g.
  // cloned from a collaborator's repo). Matches VS Code's
  // share-mode-cache-miss fallback — a watermarked render is strictly
  // better UX than a broken image.
  const effectiveMode: PageMode =
    mode === 'share' && !deps.settings.apiKey ? 'anonymous' : mode

  const result = composeUrl({
    source, theme, sourceFormat, mode: effectiveMode,
    apiBase: deps.settings.apiBase,
    bg,
  })

  if (result.kind === 'anonymous') return result.url

  // needs-share — either explicit share mode (always tries share path)
  // or over-size-cap (anonymous render impossible regardless of mode).
  if (result.reason === 'over-size-cap' && effectiveMode === 'anonymous') {
    const hint = deps.settings.apiKey
      ? 'Enable watermark-free preview ("Beauty Diagram: Toggle watermark-free preview for this page") or run "Embed share URLs into this note" to bake a saved share URL.'
      : 'Add your Beauty Diagram API key in plugin settings, then enable watermark-free preview for this page.'
    throw new ApiError(
      413,
      'source_too_large',
      `Diagram exceeds 5 KB. ${hint}`,
    )
  }

  // Tag cache entries with a fingerprint of the active API key so two
  // accounts on the same machine don't share each other's tokens. The
  // server's share token is bound to the owner of the key that minted
  // it; serving Account A's token from Account B's cache would render
  // a foreign artifact and silently bypass B's quota accounting.
  const ownerTag = await shortHash('owner:' + deps.settings.apiKey)
  const cached = await deps.cache.get(source, theme, sourceFormat, ownerTag)
  if (cached) {
    const base = `${deps.settings.apiBase}/v1/share/${cached}.svg`
    return bg === 'transparent' ? `${base}?bg=transparent` : base
  }

  const share = await deps.getApi().createShare({ source, theme, sourceFormat })
  await deps.cache.set(source, theme, sourceFormat, share.shareToken, ownerTag)
  const base = `${deps.settings.apiBase}/v1/share/${share.shareToken}.svg`
  return bg === 'transparent' ? `${base}?bg=transparent` : base
}

function withFailStatus(url: string): string {
  return url + (url.includes('?') ? '&' : '?') + 'onfail=status'
}

/** Render a fence through Obsidian's own markdown pipeline (built-in mermaid
 *  for mermaid blocks, plain code block for formats Obsidian can't render).
 *  Lifecycle is tied to the post-processor context via MarkdownRenderChild. */
async function renderHostNative(
  el: HTMLElement,
  source: string,
  sourceFormat: SourceFormat,
  ctx: MarkdownPostProcessorContext,
  deps: HandlerDeps,
): Promise<HTMLElement> {
  const host = el.createDiv({ cls: 'bd-native-fallback' })
  const child = new MarkdownRenderChild(host)
  ctx.addChild(child)
  await MarkdownRenderer.render(
    deps.app,
    '```' + sourceFormat + '\n' + source + '\n```',
    host,
    ctx.sourcePath,
    child,
  )
  return host
}

/**
 * Per-block fallback to Obsidian's built-in mermaid renderer, with a status
 * badge explaining why Beauty Diagram didn't render this block. Returns false
 * when the native render itself throws (caller falls through to the error box).
 *
 * Reason resolution is lazy: `opts.reason` is shown directly when the failure
 * happened before the <img> existed (createShare error — message already known);
 * otherwise `opts.probeUrl` is fetched on first badge expand to read the
 * server's X-Beauty-Render-Reason header. Zero extra requests unless the user
 * actually asks why.
 */
async function renderNativeFallback(
  el: HTMLElement,
  source: string,
  theme: string,
  ctx: MarkdownPostProcessorContext,
  deps: HandlerDeps,
  opts: { reason?: string; probeUrl?: string },
): Promise<boolean> {
  try {
    await renderHostNative(el, source, 'mermaid', ctx, deps)

    const badge = el.createDiv({ cls: 'bd-fallback-badge' })
    const toggle = badge.createEl('button', {
      cls: 'bd-fallback-toggle',
      text: "⚠ Rendered by Obsidian's built-in renderer",
      attr: { 'aria-expanded': 'false' },
    })
    const info = badge.createDiv({ cls: 'bd-fallback-info' })
    info.style.display = 'none'
    const reasonEl = info.createDiv({
      cls: 'bd-fallback-reason',
      text: opts.reason ?? 'Checking why Beauty Diagram could not render this block…',
    })
    info.createEl('a', {
      attr: {
        href: editorLink({ source, theme, sourceFormat: 'mermaid' }),
        target: '_blank',
        rel: 'noopener noreferrer',
      },
      text: '↗ Open in editor',
    })

    let probed = false
    toggle.onclick = () => {
      const opening = info.style.display === 'none'
      info.style.display = opening ? '' : 'none'
      toggle.setAttribute('aria-expanded', String(opening))
      if (opening && !probed && !opts.reason && opts.probeUrl) {
        probed = true
        void fetchFailureReason(opts.probeUrl).then((reason) => reasonEl.setText(reason))
      }
    }
    return true
  } catch {
    return false
  }
}

async function fetchFailureReason(url: string): Promise<string> {
  try {
    const resp = await requestUrl({ url, throw: false })
    if (resp.status >= 400) {
      const reason =
        resp.headers['x-beauty-render-reason'] ?? resp.headers['X-Beauty-Render-Reason']
      return reason
        ? `Beauty Diagram could not render this source: ${reason}`
        : `Beauty Diagram could not render this source (HTTP ${resp.status}).`
    }
    return 'Beauty Diagram is reachable again — this was likely a temporary network issue. Reopen the note to retry.'
  } catch {
    return 'Beauty Diagram service is unreachable — the diagram will render once your connection is restored.'
  }
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
