/**
 * @fileoverview 同步适配器工厂
 * @module @dailyuse/application-client/sync/factory
 */

import type { ISyncAdapter, SyncAdapterConstructor } from '../interfaces/ISyncAdapter';
import type { AdapterCredentials } from '../types';

/**
 * 同步适配器工厂
 * 
 * 使用工厂模式创建适配器实例，支持运行时注册新的适配器
 * 
 * @example
 * ```typescript
 * // 注册适配器
 * SyncAdapterFactory.register('github', GitHubSyncAdapter);
 * SyncAdapterFactory.register('nutstore', NutstoreSyncAdapter);
 * 
 * // 创建适配器实例
 * const adapter = SyncAdapterFactory.create('github', {
 *   provider: 'github',
 *   token: process.env.GITHUB_TOKEN,
 *   repoPath: 'user/daily-use-sync',
 *   encryptionKey: userPassword,
 * });
 * 
 * // 查看可用提供商
 * const providers = SyncAdapterFactory.getAvailableProviders();
 * console.log('Available providers:', providers);
 * ```
 */
export class SyncAdapterFactory {
  private static adapters = new Map<string, SyncAdapterConstructor>();
  
  /**
   * 注册适配器类
   * 
   * @param provider - 提供商标识符 (e.g., 'github', 'nutstore', 'dropbox')
   * @param AdapterClass - 适配器构造函数
   * 
   * @example
   * ```typescript
   * import { GitHubSyncAdapter } from './adapters/GitHubSyncAdapter';
   * 
   * SyncAdapterFactory.register('github', GitHubSyncAdapter);
   * ```
   */
  static register(
    provider: string,
    AdapterClass: SyncAdapterConstructor
  ): void {
    if (this.adapters.has(provider)) {
      console.warn(`Adapter for provider "${provider}" already registered, overwriting`);
    }
    this.adapters.set(provider, AdapterClass);
  }
  
  /**
   * 创建适配器实例
   * 
   * @param provider - 提供商标识符
   * @param credentials - 认证凭据
   * 
   * @returns 适配器实例
   * 
   * @throws {Error} 如果提供商未注册
   * 
   * @example
   * ```typescript
   * const adapter = SyncAdapterFactory.create('github', {
   *   provider: 'github',
   *   token: process.env.GITHUB_TOKEN,
   *   repoPath: 'user/daily-use-sync',
   *   encryptionKey: userPassword,
   * });
   * 
   * await adapter.authenticate(credentials);
   * ```
   */
  static create(
    provider: string,
    credentials: AdapterCredentials
  ): ISyncAdapter {
    const AdapterClass = this.adapters.get(provider);
    
    if (!AdapterClass) {
      const available = Array.from(this.adapters.keys()).join(', ');
      throw new Error(
        `Unknown sync provider: "${provider}". ` +
        `Available providers: ${available || '(none registered)'}`
      );
    }
    
    return new AdapterClass(credentials);
  }
  
  /**
   * 获取可用提供商列表
   * 
   * @returns 已注册的提供商标识符数组
   * 
   * @example
   * ```typescript
   * const providers = SyncAdapterFactory.getAvailableProviders();
   * // ['github', 'nutstore', 'dropbox']
   * ```
   */
  static getAvailableProviders(): string[] {
    return Array.from(this.adapters.keys());
  }
  
  /**
   * 检查提供商是否已注册
   * 
   * @param provider - 提供商标识符
   * 
   * @returns 是否已注册
   * 
   * @example
   * ```typescript
   * if (SyncAdapterFactory.has('github')) {
   *   console.log('GitHub adapter is available');
   * }
   * ```
   */
  static has(provider: string): boolean {
    return this.adapters.has(provider);
  }
  
  /**
   * 注销适配器 (主要用于测试)
   * 
   * @param provider - 提供商标识符
   * 
   * @returns 是否成功注销
   * 
   * @example
   * ```typescript
   * SyncAdapterFactory.unregister('github');
   * ```
   */
  static unregister(provider: string): boolean {
    return this.adapters.delete(provider);
  }
  
  /**
   * 清除所有注册的适配器 (主要用于测试)
   * 
   * @example
   * ```typescript
   * SyncAdapterFactory.clear();
   * ```
   */
  static clear(): void {
    this.adapters.clear();
  }
}

// 注意: 适配器注册将在各自的实现文件中进行
// 例如: packages/infrastructure-client/src/adapters/GitHubSyncAdapter.ts
// 
// import { SyncAdapterFactory } from '@dailyuse/application-client/sync/factory';
// import { GitHubSyncAdapter } from './GitHubSyncAdapter';
// 
// SyncAdapterFactory.register('github', GitHubSyncAdapter);
