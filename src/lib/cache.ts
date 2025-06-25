// 缓存管理模块
import { TRAFFIC_CONTROL } from './config'

// IndexedDB 配置
const DB_NAME = 'coshub-cache'
const DB_VERSION = 1
const STORE_NAME = 'images'

// 缓存键前缀
const CACHE_PREFIX = 'coshub:'

// 初始化 IndexedDB
let db: IDBDatabase | null = null

export async function initDB(): Promise<IDBDatabase> {
  if (db) return db
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      
      // 创建图片缓存存储
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'url' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('size', 'size', { unique: false })
      }
    }
  })
}

// 缓存项接口
interface CacheItem {
  url: string
  blob: Blob
  timestamp: number
  size: number
  mimeType: string
}

// 获取缓存的图片
export async function getCachedImage(url: string): Promise<Blob | null> {
  try {
    const db = await initDB()
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    
    return new Promise((resolve) => {
      const request = store.get(url)
      request.onsuccess = () => {
        const item = request.result as CacheItem | undefined
        if (item) {
          // 检查缓存是否过期（24小时）
          const isExpired = Date.now() - item.timestamp > TRAFFIC_CONTROL.cache.maxAge * 1000
          if (!isExpired) {
            resolve(item.blob)
            return
          }
        }
        resolve(null)
      }
      request.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

// 缓存图片
export async function cacheImage(url: string, blob: Blob, mimeType: string): Promise<void> {
  try {
    const db = await initDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    
    const cacheItem: CacheItem = {
      url,
      blob,
      timestamp: Date.now(),
      size: blob.size,
      mimeType
    }
    
    store.put(cacheItem)
    
    // 清理过期缓存
    await cleanupExpiredCache()
  } catch (error) {
    console.error('Failed to cache image:', error)
  }
}

// 清理过期缓存
async function cleanupExpiredCache(): Promise<void> {
  try {
    const db = await initDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('timestamp')
    
    const expiredTime = Date.now() - TRAFFIC_CONTROL.cache.maxAge * 1000
    const range = IDBKeyRange.upperBound(expiredTime)
    
    const request = index.openCursor(range)
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result
      if (cursor) {
        cursor.delete()
        cursor.continue()
      }
    }
  } catch (error) {
    console.error('Failed to cleanup cache:', error)
  }
}

// 获取缓存大小
export async function getCacheSize(): Promise<number> {
  try {
    const db = await initDB()
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    
    return new Promise((resolve) => {
      let totalSize = 0
      const request = store.openCursor()
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          totalSize += (cursor.value as CacheItem).size
          cursor.continue()
        } else {
          resolve(totalSize)
        }
      }
      
      request.onerror = () => resolve(0)
    })
  } catch {
    return 0
  }
}

// 清空所有缓存
export async function clearAllCache(): Promise<void> {
  try {
    const db = await initDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    store.clear()
  } catch (error) {
    console.error('Failed to clear cache:', error)
  }
}

// 预加载图片并缓存
export async function preloadAndCacheImage(url: string): Promise<void> {
  try {
    // 检查是否已缓存
    const cached = await getCachedImage(url)
    if (cached) return
    
    // 下载图片
    const response = await fetch(url)
    if (!response.ok) return
    
    const blob = await response.blob()
    const mimeType = response.headers.get('content-type') || 'image/jpeg'
    
    // 缓存图片
    await cacheImage(url, blob, mimeType)
  } catch (error) {
    console.error('Failed to preload image:', error)
  }
}

// 创建带缓存的图片 URL
export function createCachedImageUrl(blob: Blob): string {
  return URL.createObjectURL(blob)
}

// 设置响应缓存头（服务端使用）
export function setCacheHeaders(headers: Headers, maxAge: number = TRAFFIC_CONTROL.cache.maxAge) {
  headers.set('Cache-Control', `public, max-age=${maxAge}, immutable`)
  headers.set('Expires', new Date(Date.now() + maxAge * 1000).toUTCString())
  headers.set('Vary', 'Accept-Encoding')
}

// localStorage 缓存管理（用于小数据）
export const localCache = {
  set(key: string, value: any, ttl?: number): void {
    const item = {
      value,
      timestamp: Date.now(),
      ttl: ttl || TRAFFIC_CONTROL.cache.maxAge * 1000
    }
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item))
  },
  
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(CACHE_PREFIX + key)
      if (!item) return null
      
      const data = JSON.parse(item)
      const isExpired = Date.now() - data.timestamp > data.ttl
      
      if (isExpired) {
        localStorage.removeItem(CACHE_PREFIX + key)
        return null
      }
      
      return data.value
    } catch {
      return null
    }
  },
  
  remove(key: string): void {
    localStorage.removeItem(CACHE_PREFIX + key)
  },
  
  clear(): void {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  }
} 