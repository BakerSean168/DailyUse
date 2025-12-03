/**
 * Storage Adapters
 *
 * Local storage implementations for client applications.
 */

import type { IStorage, ICacheStorage } from '../../ports/storage';

/**
 * LocalStorage Adapter
 *
 * Uses browser's localStorage for persistence.
 */
export class LocalStorageAdapter<T> implements IStorage<T> {
  constructor(private readonly prefix: string = 'dailyuse') {}

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  async get(key: string): Promise<T | null> {
    try {
      const item = localStorage.getItem(this.getKey(key));
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: T): Promise<void> {
    localStorage.setItem(this.getKey(key), JSON.stringify(value));
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(this.getKey(key));
  }

  async clear(): Promise<void> {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
    keys.forEach(k => localStorage.removeItem(k));
  }
}

/**
 * Memory Cache Adapter
 *
 * In-memory cache with TTL support.
 */
export class MemoryCacheAdapter implements ICacheStorage {
  private cache = new Map<string, { value: unknown; expiresAt?: number }>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    this.cache.set(key, {
      value,
      expiresAt: ttlMs ? Date.now() + ttlMs : undefined,
    });
  }

  async invalidate(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

// Named exports for factory pattern
export function createLocalStorageAdapter<T>(prefix?: string): IStorage<T> {
  return new LocalStorageAdapter<T>(prefix);
}

export function createMemoryCacheAdapter(): ICacheStorage {
  return new MemoryCacheAdapter();
}
