import { describe, it, expect, vi } from 'vitest'
import type { RequestUrlParam, RequestUrlResponse } from 'obsidian'
import { createApiClient, ApiError } from '../src/api-client'

function mockResponse(opts: {
  status?: number
  json?: unknown
  text?: string
  contentType?: string
}): RequestUrlResponse {
  const status = opts.status ?? 200
  const contentType =
    opts.contentType ?? (opts.json !== undefined ? 'application/json' : 'text/plain')
  return {
    status,
    headers: { 'content-type': contentType },
    arrayBuffer: new ArrayBuffer(0),
    json: opts.json,
    text: opts.text ?? (opts.json !== undefined ? JSON.stringify(opts.json) : ''),
  } as RequestUrlResponse
}

describe('api-client', () => {
  it('createShare posts with auth header and parses response', async () => {
    const requestFn = vi.fn<[RequestUrlParam], Promise<RequestUrlResponse>>(async () =>
      mockResponse({ json: { id: 'abc123', url: 'https://www.beauty-diagram.com/s/abc123' } })
    )

    const client = createApiClient({
      apiBase: 'https://api.beauty-diagram.com',
      apiKey: 'bd_live_xxx',
      version: '0.1.0',
      requestFn,
    })
    const r = await client.createShare({ source: 'A --> B', theme: 'modern', sourceFormat: 'mermaid' })

    expect(r).toEqual({ id: 'abc123', url: 'https://www.beauty-diagram.com/s/abc123' })
    expect(requestFn).toHaveBeenCalledOnce()
    const req = requestFn.mock.calls[0][0]
    expect(req.url).toBe('https://api.beauty-diagram.com/v1/share')
    expect(req.method).toBe('POST')
    expect(req.headers?.Authorization).toBe('Bearer bd_live_xxx')
    expect(req.headers?.['X-Bd-Client']).toBe('obsidian')
    // User-Agent must NOT be set — Electron renderer / requestUrl strips it,
    // and setting it from JS in some Chromium versions throws.
    expect(req.headers?.['User-Agent']).toBeUndefined()
    expect(req.throw).toBe(false)

    // Wire-level: body is passed through directly — field names must match server contract.
    const sentBody = JSON.parse(req.body as string)
    expect(sentBody).toEqual({
      source: 'A --> B',
      theme: 'modern',
      sourceFormat: 'mermaid',
    })
  })

  it('createShare omits auth header when no key', async () => {
    const requestFn = vi.fn<[RequestUrlParam], Promise<RequestUrlResponse>>(async () =>
      mockResponse({ json: { id: 'x', url: 'x' } })
    )

    const client = createApiClient({
      apiBase: 'https://api.beauty-diagram.com',
      apiKey: null,
      version: '0.1.0',
      requestFn,
    })
    await client.createShare({ source: 'A', theme: 'modern', sourceFormat: 'mermaid' })

    const req = requestFn.mock.calls[0][0]
    expect(req.headers?.Authorization).toBeUndefined()
  })

  it('throws ApiError on non-2xx with parsed error code', async () => {
    const requestFn = vi.fn<[RequestUrlParam], Promise<RequestUrlResponse>>(async () =>
      mockResponse({
        status: 429,
        json: { error: 'quota_exhausted', message: 'Monthly quota used.' },
      })
    )

    const client = createApiClient({
      apiBase: 'https://api.beauty-diagram.com',
      apiKey: 'k',
      version: '0.1.0',
      requestFn,
    })
    await expect(
      client.createShare({ source: 'A', theme: 'modern', sourceFormat: 'mermaid' })
    ).rejects.toMatchObject({ status: 429, code: 'quota_exhausted' })
  })

  it('wraps transport-level errors as ApiError network_error', async () => {
    const requestFn = vi.fn<[RequestUrlParam], Promise<RequestUrlResponse>>(async () => {
      throw new Error('connect ECONNREFUSED')
    })

    const client = createApiClient({
      apiBase: 'https://api.beauty-diagram.com',
      apiKey: 'k',
      version: '0.1.0',
      requestFn,
    })
    await expect(client.getUsage()).rejects.toMatchObject({
      status: 0,
      code: 'network_error',
    })
  })

  it('getThemes returns theme list', async () => {
    const requestFn = vi.fn<[RequestUrlParam], Promise<RequestUrlResponse>>(async () =>
      mockResponse({ json: { themes: [{ id: 'modern', name: 'Modern', tier: 'free' }] } })
    )

    const client = createApiClient({
      apiBase: 'https://api.beauty-diagram.com',
      apiKey: null,
      version: '0.1.0',
      requestFn,
    })
    const r = await client.getThemes()
    expect(r).toEqual([{ id: 'modern', name: 'Modern', tier: 'free' }])
  })

  it('getUsage returns the raw payload', async () => {
    const payload = { plan: 'pro', monthlyQuota: 1000, used: 12 }
    const requestFn = vi.fn<[RequestUrlParam], Promise<RequestUrlResponse>>(async () =>
      mockResponse({ json: payload })
    )

    const client = createApiClient({
      apiBase: 'https://api.beauty-diagram.com',
      apiKey: 'k',
      version: '0.1.0',
      requestFn,
    })
    expect(await client.getUsage()).toEqual(payload)
  })

  it('exports ApiError as a class with status + code', () => {
    const e = new ApiError(403, 'forbidden', 'Nope')
    expect(e).toBeInstanceOf(Error)
    expect(e.status).toBe(403)
    expect(e.code).toBe('forbidden')
    expect(e.message).toBe('Nope')
  })
})
