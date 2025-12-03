/**
 * Storage Port Interfaces
 *
 * Interfaces for local storage operations.
 */

/**
 * Generic Storage Interface
 */
export interface IStorage<T> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Cache Storage Interface
 */
export interface ICacheStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlMs?: number): Promise<void>;
  invalidate(key: string): Promise<void>;
  invalidatePattern(pattern: string): Promise<void>;
}
