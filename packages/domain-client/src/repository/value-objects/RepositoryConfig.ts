/**
 * Repository Config Value Object - Client Implementation
 * 仓储配置值对象 - 客户端实现
 */
import { RepositoryContracts } from '@dailyuse/contracts';

type RepositoryConfigClient = RepositoryContracts.RepositoryConfigClient;
type RepositoryConfigClientDTO = RepositoryContracts.RepositoryConfigClientDTO;
type RepositoryConfigServerDTO = RepositoryContracts.RepositoryConfigServerDTO;

export class RepositoryConfig implements RepositoryConfigClient {
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

  // ===== UI 计算属性 =====
  get searchEngineText(): string {
    const map = {
      postgres: 'PostgreSQL',
      meilisearch: 'MeiliSearch',
      elasticsearch: 'Elasticsearch',
    };
    return map[this._searchEngine];
  }

  get gitStatusText(): string {
    return this._enableGit ? 'Enabled' : 'Disabled';
  }

  get syncStatusText(): string {
    if (!this._autoSync) return 'Manual';
    return `Auto (${this._syncInterval || 300}s)`;
  }

  // ===== 扩展属性访问 =====
  [key: string]: unknown;

  // ===== DTO 转换 =====
  toClientDTO(): RepositoryConfigClientDTO {
    return {
      searchEngine: this._searchEngine,
      enableGit: this._enableGit,
      autoSync: this._autoSync,
      syncInterval: this._syncInterval,
      ...this._extensible,
      searchEngineText: this.searchEngineText,
      gitStatusText: this.gitStatusText,
      syncStatusText: this.syncStatusText,
    };
  }

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

  static fromClientDTO(dto: RepositoryConfigClientDTO): RepositoryConfig {
    const { searchEngine, enableGit, autoSync, syncInterval, searchEngineText, gitStatusText, syncStatusText, ...rest } = dto;
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
