/**
 * IPC Cache
 *
 * IPC 响应缓存 - 使用 LRU 策略缓存高频查询
 * 减少重复查询的开销
 */

import { ipcMain } from 'electron';
import type { IpcMainInvokeEvent } from 'electron';

// ============ Types ============

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
}

interface CacheOptions {
  /** 最大缓存条目数 */
  maxSize?: number;
  /** 默认 TTL (ms) */
  defaultTTL?: number;
  /** 是否在开发模式输出日志 */
  debug?: boolean;
}

interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
}

// ============ LRU Cache Implementation ============

class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private readonly maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // 移到末尾 (最近使用)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    // 如果 key 已存在，删除旧条目
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // 如果达到最大容量，删除最旧的条目
    else if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  keys(): IterableIterator<K> {
    return this.cache.keys();
  }
}

// ============ IPC Cache Class ============

export class IpcCache {
  private cache: LRUCache<string, CacheEntry<unknown>>;
  private channelTTL: Map<string, number> = new Map();
  private stats = { hits: 0, misses: 0 };
  private readonly defaultTTL: number;
  private readonly debug: boolean;

  constructor(options: CacheOptions = {}) {
    const {
      maxSize = 100,
      defaultTTL = 5000,
      debug = process.env.NODE_ENV === 'development',
    } = options;

    this.cache = new LRUCache(maxSize);
    this.defaultTTL = defaultTTL;
    this.debug = debug;
  }

  /**
   * 设置特定通道的 TTL
   */
  setChannelTTL(channel: string, ttl: number): void {
    this.channelTTL.set(channel, ttl);
  }

  /**
   * 生成缓存 key
   */
  private generateKey(channel: string, args: unknown[]): string {
    const argsHash = JSON.stringify(args);
    return `${channel}:${argsHash}`;
  }

  /**
   * 获取缓存
   */
  get<T>(channel: string, args: unknown[]): T | undefined {
    const key = this.generateKey(channel, args);
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    const ttl = this.channelTTL.get(channel) ?? this.defaultTTL;
    const isExpired = Date.now() - entry.timestamp > ttl;

    if (isExpired) {
      this.cache.delete(key);
      this.stats.misses++;
      return undefined;
    }

    entry.accessCount++;
    this.stats.hits++;

    if (this.debug) {
      console.log(`[IpcCache] HIT: ${channel} (${entry.accessCount} times)`);
    }

    return entry.data;
  }

  /**
   * 设置缓存
   */
  set<T>(channel: string, args: unknown[], data: T): void {
    const key = this.generateKey(channel, args);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 1,
    });

    if (this.debug) {
      console.log(`[IpcCache] SET: ${channel}`);
    }
  }

  /**
   * 使某个通道的所有缓存失效
   */
  invalidateChannel(channel: string): number {
    let count = 0;
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.startsWith(`${channel}:`)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
      count++;
    }

    if (this.debug && count > 0) {
      console.log(`[IpcCache] Invalidated ${count} entries for channel: ${channel}`);
    }

    return count;
  }

  /**
   * 使匹配模式的缓存失效
   */
  invalidatePattern(pattern: RegExp): number {
    let count = 0;
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
      count++;
    }

    return count;
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };

    if (this.debug) {
      console.log('[IpcCache] Cleared all cache');
    }
  }

  /**
   * 获取缓存统计
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }
}

// ============ Singleton Instance ============

let ipcCacheInstance: IpcCache | null = null;

export function getIpcCache(): IpcCache {
  if (!ipcCacheInstance) {
    ipcCacheInstance = new IpcCache({
      maxSize: 100,
      defaultTTL: 5000, // 5 秒默认 TTL
    });

    // 配置特定通道的 TTL
    ipcCacheInstance.setChannelTTL('goal:list', 10000);     // 10 秒
    ipcCacheInstance.setChannelTTL('task-template:list', 10000);
    ipcCacheInstance.setChannelTTL('dashboard:get-all', 30000); // 30 秒
    ipcCacheInstance.setChannelTTL('reminder:list', 5000);   // 5 秒
  }
  return ipcCacheInstance;
}

// ============ Cache Wrapper for IPC Handlers ============

/**
 * 包装 IPC handler，添加缓存支持
 *
 * @example
 * ```typescript
 * ipcMain.handle('goal:list', withCache(
 *   async (event, params) => {
 *     return await goalService.list(params);
 *   },
 *   { ttl: 10000 }
 * ));
 * ```
 */
export function withCache<T>(
  handler: (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<T>,
  options?: { ttl?: number; channel?: string }
): (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<T> {
  return async (event: IpcMainInvokeEvent, ...args: unknown[]) => {
    const cache = getIpcCache();
    const channel = options?.channel ?? 'unknown';

    // 尝试从缓存获取
    const cached = cache.get<T>(channel, args);
    if (cached !== undefined) {
      return cached;
    }

    // 执行实际 handler
    const result = await handler(event, ...args);

    // 存入缓存
    cache.set(channel, args, result);

    return result;
  };
}

/**
 * 写操作后使相关缓存失效的装饰器
 *
 * @example
 * ```typescript
 * ipcMain.handle('goal:create', invalidatesCache(
 *   async (event, request) => {
 *     return await goalService.create(request);
 *   },
 *   ['goal:list', 'dashboard:get-all']
 * ));
 * ```
 */
export function invalidatesCache<T>(
  handler: (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<T>,
  channelsToInvalidate: string[]
): (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<T> {
  return async (event: IpcMainInvokeEvent, ...args: unknown[]) => {
    const result = await handler(event, ...args);

    // 写操作成功后，使相关缓存失效
    const cache = getIpcCache();
    for (const channel of channelsToInvalidate) {
      cache.invalidateChannel(channel);
    }

    return result;
  };
}

// ============ IPC Handlers for Cache Management ============

/**
 * 注册缓存管理 IPC handlers
 */
export function registerCacheIpcHandlers(): void {
  ipcMain.handle('cache:stats', async () => {
    return getIpcCache().getStats();
  });

  ipcMain.handle('cache:clear', async () => {
    getIpcCache().clear();
    return { success: true };
  });

  ipcMain.handle('cache:invalidate', async (_, channel: string) => {
    const count = getIpcCache().invalidateChannel(channel);
    return { invalidated: count };
  });

  console.log('[IpcCache] Management IPC handlers registered');
}
