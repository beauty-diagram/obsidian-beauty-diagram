// Stub of the `obsidian` runtime API for tests. The real package ships types
// only — the runtime is injected by the Obsidian app at load time. Tests
// inject their own transport, so this stub just needs to satisfy resolution
// + provide type exports.

export type RequestUrlParam = {
  url: string
  method?: string
  headers?: Record<string, string>
  body?: string | ArrayBuffer
  throw?: boolean
}

export type RequestUrlResponse = {
  status: number
  headers: Record<string, string>
  arrayBuffer: ArrayBuffer
  json: unknown
  text: string
}

export const requestUrl = async (_req: RequestUrlParam): Promise<RequestUrlResponse> => {
  throw new Error('obsidian.requestUrl is not available in test environment; inject requestFn')
}
