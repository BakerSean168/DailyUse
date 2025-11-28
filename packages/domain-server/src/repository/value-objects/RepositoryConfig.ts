/**
 * Repository Config Value Object - Server Implementation
 * 仓储配置值对象 - 服务端实现
 */
import type { RepositoryConfigServer, RepositoryConfigServerDTO } from '@dailyuse/contracts/repository';

export class RepositoryConfig implements RepositoryConfigServer {
  // ===== 私有字段 =====
  private _searchEngine: 'postgres' | 'meilisearch' | 'elasticsearch';
  private _enableGit: boolean;
  private _autoSync?: boolean;
  private _syncInterval?: number;
  private _extensible: Record<string, unknown>;

  // ===== 私有构造函数 =====
  private constructor(
    searchEngine: 'postgres' | 'meilisearch' | 'elasticsearch',
    enableGit: boolean,
    autoSync?: boolean,
    syncInterval?: number,
    extensible?: Record<string, unknown>,
  ) {
    this._searchEngine = searchEngine;
    this._enableGit = enableGit;
    this._autoSync = autoSync;
    this._syncInterval = syncInterval;
    this._extensible = extensible || {};
  }

  // ===== Getters =====
  get searchEngine(): 'postgres' | 'meilisearch' | 'elasticsearch' {
    return this._searchEngine;
  }

  get enableGit(): boolean {
    return this._enableGit;
  }

  get autoSync(): boolean | undefined {
    return this._autoSync;
  }

  get syncInterval(): number | undefined {
    return this._syncInterval;
  }

  // ===== 扩展属性访问 =====
  [key: string]: unknown;

  // ===== DTO 转换 =====
  toServerDTO(): RepositoryConfigServerDTO {
    return {
      searchEngine: this._searchEngine,
      enableGit: this._enableGit,
      autoSync: this._autoSync,
      syncInterval: this._syncInterval,
      ...this._extensible,
    };
  }

  // ===== 静态工厂方法 =====
  static fromServerDTO(dto: RepositoryConfigServerDTO): RepositoryConfig {
    const { searchEngine, enableGit, autoSync, syncInterval, ...rest } = dto;
    return new RepositoryConfig(searchEngine, enableGit, autoSync, syncInterval, rest);
  }

  static create(params?: Partial<RepositoryConfigServerDTO>): RepositoryConfig {
    const defaults = {
      searchEngine: 'postgres' as const,
      enableGit: false,
      autoSync: false,
      syncInterval: 300,
    };
    return new RepositoryConfig(
      params?.searchEngine || defaults.searchEngine,
      params?.enableGit ?? defaults.enableGit,
      params?.autoSync ?? defaults.autoSync,
      params?.syncInterval || defaults.syncInterval,
      {},
    );
  }
}
