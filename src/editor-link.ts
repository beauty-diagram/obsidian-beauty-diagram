import type { SourceType } from './types'

const DEFAULT_WEB_BASE = 'https://www.beauty-diagram.com'

export interface EditorLinkOptions {
  source: string
  theme: string
  sourceType: SourceType
  webBase?: string
}

/**
 * Build a deep-link to the Beauty Diagram editor with source prefilled.
 *
 * The editor page reads `source` as **plain text** (Next.js auto-decodes
 * URI components), so we MUST send URI-encoded plaintext — not base64.
 * /v1/beautify.svg uses base64url for a different reason (image GET cache
 * key + binary-safe). The two URLs are intentionally different shapes.
 */
export function editorLink(opts: EditorLinkOptions): string {
  const base = opts.webBase ?? DEFAULT_WEB_BASE
  const source = encodeURIComponent(opts.source)
  const format = encodeURIComponent(opts.sourceType)
  const theme = encodeURIComponent(opts.theme)
  return `${base}/editor?source=${source}&format=${format}&theme=${theme}`
}
