import { describe, it, expect } from 'vitest'
import { parseDirective } from '../src/directives'

describe('parseDirective', () => {
  it('extracts mermaid theme directive', () => {
    const r = parseDirective('mermaid', '%% bd:theme=neon\nflowchart LR\n  A --> B')
    expect(r).toEqual({
      themeOverride: 'neon',
      source: 'flowchart LR\n  A --> B',
    })
  })

  it('extracts plantuml theme directive', () => {
    const r = parseDirective('plantuml', "' bd:theme=neon\n@startuml\nA --> B\n@enduml")
    expect(r).toEqual({
      themeOverride: 'neon',
      source: '@startuml\nA --> B\n@enduml',
    })
  })

  it('returns null override when no directive', () => {
    const r = parseDirective('mermaid', 'flowchart LR\n  A --> B')
    expect(r).toEqual({
      themeOverride: null,
      source: 'flowchart LR\n  A --> B',
    })
  })

  it('ignores wrong comment style', () => {
    const r = parseDirective('mermaid', "' bd:theme=neon\nflowchart LR")
    expect(r.themeOverride).toBeNull()
    expect(r.source).toBe("' bd:theme=neon\nflowchart LR")
  })

  it('ignores directive not on first line', () => {
    const r = parseDirective('mermaid', 'flowchart LR\n%% bd:theme=neon')
    expect(r.themeOverride).toBeNull()
  })

  it('tolerates whitespace around directive', () => {
    const r = parseDirective('mermaid', '%%   bd:theme=neon   \nflowchart LR')
    expect(r.themeOverride).toBe('neon')
    expect(r.source).toBe('flowchart LR')
  })

  it('rejects invalid theme names (lets backend decide)', () => {
    // Theme value is passed through; backend validates. We only enforce regex shape.
    const r = parseDirective('mermaid', '%% bd:theme=foo-bar\nflowchart LR')
    expect(r.themeOverride).toBe('foo-bar')
  })
})
