import type { SourceFormat } from './types'

interface DirectiveResult {
  themeOverride: string | null
  source: string
}

const PATTERNS: Record<SourceFormat, RegExp> = {
  mermaid: /^%%\s*bd:theme=([\w-]+)\s*$/,
  plantuml: /^'\s*bd:theme=([\w-]+)\s*$/,
}

export function parseDirective(sourceFormat: SourceFormat, source: string): DirectiveResult {
  const newlineIdx = source.indexOf('\n')
  const firstLine = newlineIdx === -1 ? source : source.slice(0, newlineIdx)
  const rest = newlineIdx === -1 ? '' : source.slice(newlineIdx + 1)

  const match = firstLine.match(PATTERNS[sourceFormat])
  if (!match) {
    return { themeOverride: null, source }
  }
  return { themeOverride: match[1], source: rest }
}
