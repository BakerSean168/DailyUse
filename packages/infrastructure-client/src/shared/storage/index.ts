/**
 * Local Storage Adapter
 *
 * Browser localStorage implementation of IStorage.
 */

import type { IStorage, ICacheStorage } from '../storage';

interface CacheEntry<T> {
  value: T;
  expiresAt?: number;
}

/**
 * LocalStorage implementation
 */
export class LocalStorageAdapter implements IStorage {
  private readonly prefix: string;

  constructor(prefix = 'dailyuse:') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.getKey(key));
      return item ? (JSON.parse(item) as T) : null;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(value));
    } catch (error) {
      console.error('LocalStorage set error:', error);
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.getKey(key));
  }

  clear(): void {
    const keys = Object.keys(localStorage);
    keys
      .filter((key) => key.startsWith(this.prefix))
      .forEach((key) => localStorage.removeItem(key));
  }

  has(key: string): boolean {
    return localStorage.getItem(this.getKey(key)) !== null;
  }
}

/**
 * Memory Cache implementation with TTL support
 */
export class MemoryCacheAdapter implements ICacheStorage {
  private cache = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T): void {
    this.cache.set(key, { value });
  }

  setWithTTL<T>(key: string, value: T, ttlMs: number): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  remove(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  isExpired(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;
    if (!entry.expiresAt) return false;
    return Date.now() > entry.expiresAt;
  }

  getRemainingTTL(key: string): number | null {
    const entry = this.cache.get(key);
    if (!entry || !entry.expiresAt) return null;
    const remaining = entry.expiresAt - Date.now();
    return remaining > 0 ? remaining : 0;
  }
}
