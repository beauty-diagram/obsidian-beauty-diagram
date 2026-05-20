import { shortHash } from './hash'
import type { SourceType } from './types'

interface CacheRow {
  key: string
  id: string
  createdAt: number
  expiresAt: number
}

interface ShareCacheOptions {
  dbName?: string
  maxEntries?: number
  ttlMs?: number
}

export class ShareCache {
  private dbName: string
  private maxEntries: number
  private ttlMs: number
  private dbPromise: Promise<IDBDatabase> | null = null

  constructor(opts: ShareCacheOptions = {}) {
    this.dbName = opts.dbName ?? 'beauty-diagram'
    this.maxEntries = opts.maxEntries ?? 1000
    this.ttlMs = opts.ttlMs ?? 7 * 24 * 60 * 60 * 1000
  }

  private db(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(this.dbName, 1)
        req.onupgradeneeded = () => {
          const db = req.result
          if (!db.objectStoreNames.contains('share-cache')) {
            const store = db.createObjectStore('share-cache', { keyPath: 'key' })
            store.createIndex('createdAt', 'createdAt')
          }
        }
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })
    }
    return this.dbPromise
  }

  private async makeKey(source: string, theme: string, type: SourceType): Promise<string> {
    // 16 hex chars (~64 bits) — collision space is plenty for plugin-local cache.
    return (
      (await shortHash(source + '\0' + theme + '\0' + type)) +
      (await shortHash('\x01' + source + theme + type))
    )
  }

  async get(source: string, theme: string, type: SourceType): Promise<string | null> {
    const db = await this.db()
    const key = await this.makeKey(source, theme, type)
    return new Promise((resolve, reject) => {
      const tx = db.transaction('share-cache', 'readonly')
      const req = tx.objectStore('share-cache').get(key)
      req.onsuccess = () => {
        const row = req.result as CacheRow | undefined
        if (!row) return resolve(null)
        if (row.expiresAt < Date.now()) return resolve(null)
        resolve(row.id)
      }
      req.onerror = () => reject(req.error)
    })
  }

  async set(source: string, theme: string, type: SourceType, id: string): Promise<void> {
    const db = await this.db()
    const key = await this.makeKey(source, theme, type)
    const now = Date.now()
    const row: CacheRow = { key, id, createdAt: now, expiresAt: now + this.ttlMs }
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('share-cache', 'readwrite')
      tx.objectStore('share-cache').put(row)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    await this.evictIfFull()
  }

  private async evictIfFull(): Promise<void> {
    const db = await this.db()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('share-cache', 'readwrite')
      const store = tx.objectStore('share-cache')
      const countReq = store.count()
      countReq.onsuccess = () => {
        const excess = countReq.result - this.maxEntries
        if (excess <= 0) return
        const idx = store.index('createdAt')
        const cursorReq = idx.openCursor()
        let removed = 0
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result
          if (!cursor || removed >= excess) return
          cursor.delete()
          removed++
          cursor.continue()
        }
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  async clear(): Promise<void> {
    const db = await this.db()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('share-cache', 'readwrite')
      tx.objectStore('share-cache').clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }
}
