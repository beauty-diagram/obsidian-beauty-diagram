export type SourceType = 'mermaid' | 'plantuml'
export type ThemeId = string // not literal-typed; backend can add themes

export interface ComposeOptions {
  source: string
  theme: ThemeId
  sourceType: SourceType
  apiBase?: string
  hasApiKey: boolean
}

export type ComposeResult =
  | { kind: 'anonymous'; url: string }
  | { kind: 'needs-share'; reason: 'has-api-key' | 'over-size-cap' }
