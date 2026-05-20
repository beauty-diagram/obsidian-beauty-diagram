import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createApiClient } from '../src/api-client'

describe('api-client', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = originalFetch
  })

  it('createShare posts with auth header and parses response', async () => {
    const mockFetch = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(async () => new Response(
      JSON.stringify({ id: 'abc123', url: 'https://www.beauty-diagram.com/s/abc123' }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    ))
    global.fetch = mockFetch as any

    const client = createApiClient({ apiBase: 'https://api.beauty-diagram.com', apiKey: 'bd_live_xxx', version: '0.1.0' })
    const r = await client.createShare({ source: 'A --> B', theme: 'modern', sourceType: 'mermaid' })

    expect(r).toEqual({ id: 'abc123', url: 'https://www.beauty-diagram.com/s/abc123' })
    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, init] = mockFetch.mock.calls[0]
    expect(url).toBe('https://api.beauty-diagram.com/v1/share')
    expect(init?.method).toBe('POST')
    expect((init?.headers as any).Authorization).toBe('Bearer bd_live_xxx')
    expect((init?.headers as any)['X-Bd-Client']).toBe('obsidian')
    expect((init?.headers as any)['User-Agent']).toMatch(/Beauty-Diagram-Obsidian\/0\.1\.0/)
  })

  it('createShare omits auth header when no key', async () => {
    const mockFetch = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(async () => new Response(JSON.stringify({ id: 'x', url: 'x' })))
    global.fetch = mockFetch as any

    const client = createApiClient({ apiBase: 'https://api.beauty-diagram.com', apiKey: null, version: '0.1.0' })
    await client.createShare({ source: 'A', theme: 'modern', sourceType: 'mermaid' })

    const init = mockFetch.mock.calls[0][1]
    expect((init?.headers as any).Authorization).toBeUndefined()
  })

  it('throws ApiError on non-2xx with parsed error code', async () => {
    global.fetch = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(async () => new Response(
      JSON.stringify({ error: 'quota_exhausted', message: 'Monthly quota used.' }),
      { status: 429, headers: { 'content-type': 'application/json' } }
    )) as any

    const client = createApiClient({ apiBase: 'https://api.beauty-diagram.com', apiKey: 'k', version: '0.1.0' })
    await expect(
      client.createShare({ source: 'A', theme: 'modern', sourceType: 'mermaid' })
    ).rejects.toMatchObject({ status: 429, code: 'quota_exhausted' })
  })

  it('getThemes returns theme list', async () => {
    global.fetch = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(async () => new Response(
      JSON.stringify({ themes: [{ id: 'modern', name: 'Modern', tier: 'free' }] }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    )) as any

    const client = createApiClient({ apiBase: 'https://api.beauty-diagram.com', apiKey: null, version: '0.1.0' })
    const r = await client.getThemes()
    expect(r).toEqual([{ id: 'modern', name: 'Modern', tier: 'free' }])
  })

  it('getUsage returns the raw payload', async () => {
    const payload = { plan: 'pro', monthlyQuota: 1000, used: 12 }
    global.fetch = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(async () => new Response(JSON.stringify(payload), { status: 200, headers: { 'content-type': 'application/json' } })) as any

    const client = createApiClient({ apiBase: 'https://api.beauty-diagram.com', apiKey: 'k', version: '0.1.0' })
    expect(await client.getUsage()).toEqual(payload)
  })
})
