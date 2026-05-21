import { requestUrl, type RequestUrlParam, type RequestUrlResponse } from 'obsidian'
import type { SourceFormat } from './types'

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
  sourceFormat: SourceFormat
}

/**
 * Server response from POST /v1/share. The embed URL is built from `shareToken`:
 *   `${apiBase}/v1/share/${shareToken}.svg`
 * `shareUrl` is the human-facing /s/<slug> page, not the SVG endpoint.
 */
export interface ShareResult {
  diagramId: string
  shareToken: string
  sharePath: string
  shareUrl: string
  title: string | null
  diagramType: string
}

export interface ThemeInfo {
  id: string
  name: string
  tier: string
}

/**
 * Server response from GET /v1/usage. Includes the user's plan tier and
 * monthly export / AI quota. Used by:
 *   - UsageCache (toggle command's plan gating)
 *   - Verify API key command (display plan + quota in success notice)
 *   - Settings tab quota hint
 *
 * The shape is intentionally loose on `plan` (string, not literal union)
 * so the plugin doesn't crash when the server introduces a new tier.
 * UsageCache narrows it to a known set; unknown plans degrade to
 * 'unknown' (which the toggle command treats like 'free').
 */
export interface UsageResponse {
  ok: boolean
  /** 'free' | 'pro' | 'premium' today; loose for forward compatibility. */
  plan: string
  actor?: string
  exports?: {
    plan?: string
    used: number
    /** null on Premium (unlimited). Free / Pro return a numeric cap. */
    limit: number | null
    resetsAt: string
  }
  ai?: {
    enabled?: boolean
    used: number
    /** null on Premium (unlimited). */
    limit: number | null
    resetsAt: string
  }
}

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message)
  }
}

export interface ApiClient {
  createShare(input: ShareInput): Promise<ShareResult>
  getThemes(): Promise<ThemeInfo[]>
  getUsage(): Promise<UsageResponse>
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
    getUsage: () => request<UsageResponse>('GET', '/v1/usage'),
  }
}
