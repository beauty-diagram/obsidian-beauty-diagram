import { describe, it, expect, beforeEach } from 'vitest'
import { ShareCache } from '../src/share-cache'

describe('ShareCache', () => {
  let cache: ShareCache

  beforeEach(async () => {
    // fake-indexeddb is loaded via tests/setup.ts; delete db between tests
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase('beauty-diagram-test')
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
      req.onblocked = () => resolve()
    })
    cache = new ShareCache({ dbName: 'beauty-diagram-test', maxEntries: 3, ttlMs: 1000 })
  })

  it('returns null on miss', async () => {
    expect(await cache.get('flow', 'modern', 'mermaid')).toBeNull()
  })

  it('round-trips a value', async () => {
    await cache.set('flow', 'modern', 'mermaid', 'abc123')
    expect(await cache.get('flow', 'modern', 'mermaid')).toBe('abc123')
  })

  it('differentiates by theme', async () => {
    await cache.set('flow', 'modern', 'mermaid', 'aaa')
    await cache.set('flow', 'classic', 'mermaid', 'bbb')
    expect(await cache.get('flow', 'modern', 'mermaid')).toBe('aaa')
    expect(await cache.get('flow', 'classic', 'mermaid')).toBe('bbb')
  })

  it('expires entries past TTL', async () => {
    await cache.set('flow', 'modern', 'mermaid', 'abc')
    await new Promise((r) => setTimeout(r, 1100))
    expect(await cache.get('flow', 'modern', 'mermaid')).toBeNull()
  })

  it('evicts oldest entry when exceeding maxEntries', async () => {
    await cache.set('s1', 'modern', 'mermaid', 'id1')
    await new Promise((r) => setTimeout(r, 10))
    await cache.set('s2', 'modern', 'mermaid', 'id2')
    await new Promise((r) => setTimeout(r, 10))
    await cache.set('s3', 'modern', 'mermaid', 'id3')
    await new Promise((r) => setTimeout(r, 10))
    await cache.set('s4', 'modern', 'mermaid', 'id4') // triggers eviction

    expect(await cache.get('s1', 'modern', 'mermaid')).toBeNull()
    expect(await cache.get('s4', 'modern', 'mermaid')).toBe('id4')
  })

  it('clear() empties everything', async () => {
    await cache.set('flow', 'modern', 'mermaid', 'abc')
    await cache.clear()
    expect(await cache.get('flow', 'modern', 'mermaid')).toBeNull()
  })
})
