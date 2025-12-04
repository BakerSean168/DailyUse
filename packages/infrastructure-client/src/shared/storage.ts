/**
 * Storage Port Interfaces
 *
 * Interfaces for local storage operations.
 */

/**
 * Generic Storage Interface
 */
export interface IStorage {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
  has(key: string): boolean;
}

/**
 * Cache Storage Interface with TTL support
 */
export interface ICacheStorage {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  setWithTTL<T>(key: string, value: T, ttlMs: number): void;
  remove(key: string): void;
  clear(): void;
  has(key: string): boolean;
  isExpired(key: string): boolean;
  getRemainingTTL(key: string): number | null;
}
