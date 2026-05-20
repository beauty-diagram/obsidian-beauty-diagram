import { describe, it, expect } from 'vitest'
import { composeUrl } from '../src/url-composer'

describe('composeUrl', () => {
  it('returns anonymous URL for small source without API key', () => {
    const r = composeUrl({
      source: 'flowchart LR\n  A --> B',
      theme: 'modern',
      sourceType: 'mermaid',
      hasApiKey: false,
    })
    expect(r.kind).toBe('anonymous')
    if (r.kind === 'anonymous') {
      expect(r.url).toMatch(/^https:\/\/api\.beauty-diagram\.com\/v1\/beautify\.svg\?/)
      expect(r.url).toContain('theme=modern')
      expect(r.url).toContain('sourceType=mermaid')
      expect(r.url).toMatch(/source=[A-Za-z0-9_-]+/)
      // base64url-encoded source must have no padding '=' in its value
      const sourceMatch = r.url.match(/source=([^&]*)/)!
      expect(sourceMatch[1]).not.toContain('=')
    }
  })

  it('encodes UTF-8 source correctly (base64url, no padding)', () => {
    const r = composeUrl({
      source: '中文 → flow',
      theme: 'modern',
      sourceType: 'mermaid',
      hasApiKey: false,
    })
    expect(r.kind).toBe('anonymous')
    if (r.kind === 'anonymous') {
      const m = r.url.match(/source=([^&]+)/)!
      const decoded = Buffer.from(
        m[1].replace(/-/g, '+').replace(/_/g, '/'),
        'base64'
      ).toString('utf-8')
      expect(decoded).toBe('中文 → flow')
    }
  })

  it('flags needs-share when API key configured (Pro path)', () => {
    const r = composeUrl({
      source: 'flowchart LR\n  A --> B',
      theme: 'modern',
      sourceType: 'mermaid',
      hasApiKey: true,
    })
    expect(r).toEqual({ kind: 'needs-share', reason: 'has-api-key' })
  })

  it('flags needs-share when source exceeds 5KB even without API key', () => {
    const big = 'A --> B\n'.repeat(700) // ~5.6 KB
    const r = composeUrl({
      source: big,
      theme: 'modern',
      sourceType: 'mermaid',
      hasApiKey: false,
    })
    expect(r).toEqual({ kind: 'needs-share', reason: 'over-size-cap' })
  })

  it('uses UTF-8 byte length, not char length, for size check', () => {
    // 1800 CJK chars = 5400 UTF-8 bytes (3 bytes each), > 5 * 1024 = 5120 byte cap
    const cjk = '中'.repeat(1800)
    const r = composeUrl({
      source: cjk,
      theme: 'modern',
      sourceType: 'mermaid',
      hasApiKey: false,
    })
    expect(r).toEqual({ kind: 'needs-share', reason: 'over-size-cap' })
  })

  it('honors custom apiBase', () => {
    const r = composeUrl({
      source: 'A --> B',
      theme: 'modern',
      sourceType: 'mermaid',
      hasApiKey: false,
      apiBase: 'http://localhost:8787',
    })
    expect(r.kind).toBe('anonymous')
    if (r.kind === 'anonymous') {
      expect(r.url).toMatch(/^http:\/\/localhost:8787\/v1\/beautify\.svg\?/)
    }
  })
})
