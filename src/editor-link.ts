import type { SourceType } from './types'

const DEFAULT_WEB_BASE = 'https://www.beauty-diagram.com'

export interface EditorLinkOptions {
  source: string
  theme: string
  sourceType: SourceType
  webBase?: string
}

export function editorLink(opts: EditorLinkOptions): string {
  const base = opts.webBase ?? DEFAULT_WEB_BASE
  const encoded = base64UrlEncode(opts.source)
  return `${base}/editor?source=${encoded}&format=${opts.sourceType}&theme=${encodeURIComponent(opts.theme)}`
}

function base64UrlEncode(s: string): string {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
