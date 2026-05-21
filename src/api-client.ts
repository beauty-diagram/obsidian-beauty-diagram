import { requestUrl, type RequestUrlParam, type RequestUrlResponse } from 'obsidian'
import type { SourceType } from './types'

export interface ApiClientOptions {
  apiBase: string
  apiKey: string | null
  version: string
  /**
   * Transport function. Default is obsidian's `requestUrl` which goes through
   * the Electron main process and bypasses renderer-side CORS. Tests inject
   * a stub since 'obsidian' has no real implementation outside the app.
   */
  requestFn?: (req: RequestUrlParam) => Promise<RequestUrlResponse>
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
  const transport = opts.requestFn ?? requestUrl

  const buildHeaders = (): Record<string, string> => {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      // NOTE: do NOT set User-Agent here. It is a forbidden header for
      // renderer-side fetch and requestUrl's documented signature also
      // omits it. X-Bd-Client is the load-bearing analytics signal.
      'X-Bd-Client': 'obsidian',
    }
    if (opts.apiKey) h.Authorization = `Bearer ${opts.apiKey}`
    return h
  }

  const request = async <T>(method: string, path: string, body?: unknown): Promise<T> => {
    let res: RequestUrlResponse
    try {
      res = await transport({
        url: `${opts.apiBase}${path}`,
        method,
        headers: buildHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        // requestUrl throws by default on non-2xx; we want to inspect the
        // response body for error codes, so suppress that throw.
        throw: false,
      })
    } catch (err) {
      // Network-level failure (DNS, offline, etc) — surface as ApiError 0
      throw new ApiError(0, 'network_error', (err as Error).message ?? 'Network request failed')
    }

    const ct = res.headers['content-type'] ?? res.headers['Content-Type'] ?? ''
    let data: unknown
    if (ct.includes('json')) {
      try {
        data = res.json
      } catch {
        data = res.text
      }
    } else {
      data = res.text
    }

    if (res.status < 200 || res.status >= 300) {
      const code =
        data && typeof data === 'object' && 'error' in data ? (data as any).error : 'unknown'
      const message =
        data && typeof data === 'object' && 'message' in data
          ? (data as any).message
          : `HTTP ${res.status}`
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
