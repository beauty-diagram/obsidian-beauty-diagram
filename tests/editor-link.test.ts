import { describe, it, expect } from 'vitest'
import { editorLink } from '../src/editor-link'

describe('editorLink', () => {
  it('produces URL with all three required params', () => {
    const url = editorLink({
      source: 'flowchart LR\n  A --> B',
      theme: 'modern',
      sourceType: 'mermaid',
    })
    expect(url).toMatch(/^https:\/\/www\.beauty-diagram\.com\/editor\?/)
    expect(url).toContain('format=mermaid')
    expect(url).toContain('theme=modern')
    expect(url).toMatch(/source=[A-Za-z0-9_-]+/)
    expect(url).not.toContain('=&') // no empty params
  })

  it('encodes plantuml format correctly', () => {
    const url = editorLink({
      source: '@startuml\nA --> B\n@enduml',
      theme: 'neon',
      sourceType: 'plantuml',
    })
    expect(url).toContain('format=plantuml')
    expect(url).toContain('theme=neon')
  })

  it('round-trips UTF-8 source', () => {
    const url = editorLink({
      source: '中文 diagram',
      theme: 'modern',
      sourceType: 'mermaid',
    })
    const m = url.match(/source=([^&]+)/)!
    const b64 = m[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
    const decoded = new TextDecoder().decode(
      Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
    )
    expect(decoded).toBe('中文 diagram')
  })

  it('honors custom webBase', () => {
    const url = editorLink({
      source: 'A --> B',
      theme: 'modern',
      sourceType: 'mermaid',
      webBase: 'http://localhost:3000',
    })
    expect(url).toMatch(/^http:\/\/localhost:3000\/editor\?/)
  })
})
