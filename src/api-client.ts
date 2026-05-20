import type { SourceType } from './types'

export interface ApiClientOptions {
  apiBase: string
  apiKey: string | null
  version: string
}

export interface ShareInput {
  source: string
  theme: string
  sourceType: SourceType
}

export interface ShareResult {
  id: string
  url: string
}

export interface ThemeInfo {
  id: string
  name: string
  tier: string
}

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message)
  }
}

export interface ApiClient {
  createShare(input: ShareInput): Promise<ShareResult>
  getThemes(): Promise<ThemeInfo[]>
  getUsage(): Promise<unknown>
}

export function createApiClient(opts: ApiClientOptions): ApiClient {
  const buildHeaders = (): Record<string, string> => {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': `Beauty-Diagram-Obsidian/${opts.version}`,
      'X-Bd-Client': 'obsidian',
    }
    if (opts.apiKey) h.Authorization = `Bearer ${opts.apiKey}`
    return h
  }

  const request = async <T>(method: string, path: string, body?: unknown): Promise<T> => {
    const res = await fetch(`${opts.apiBase}${path}`, {
      method,
      headers: buildHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    })
    const ct = res.headers.get('content-type') ?? ''
    const data = ct.includes('json') ? await res.json() : await res.text()
    if (!res.ok) {
      const code =
        data && typeof data === 'object' && 'error' in data ? (data as any).error : 'unknown'
      const message =
        data && typeof data === 'object' && 'message' in data
          ? (data as any).message
          : res.statusText
      throw new ApiError(res.status, code, message)
    }
    return data as T
  }

  return {
    createShare: (input) => request<ShareResult>('POST', '/v1/share', input),
    getThemes: async () => {
      const r = await request<{ themes: ThemeInfo[] }>('GET', '/v1/themes')
      return r.themes
    },
    getUsage: () => request<unknown>('GET', '/v1/usage'),
  }
}
