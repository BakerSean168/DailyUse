/**
 * Repository Config Value Object - Client Implementation
 * 仓储配置值对象 - 客户端实现
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 */
import { RepositoryConfigClientDTO, RepositoryConfigServerDTO } from '@dailyuse/contracts/repository';
import { ValueObject } from '@dailyuse/utils';

export class RepositoryConfig extends ValueObject {
  // ===== 公开只读字段 =====
  public readonly searchEngine: 'postgres' | 'meilisearch' | 'elasticsearch';
  public readonly enableGit: boolean;
  public readonly autoSync?: boolean;
  public readonly syncInterval?: number;
  private readonly _extensible: Record<string, unknown>;

  // ===== 动态属性索引签名（兼容 RepositoryConfigClient 接口）=====
  [key: string]: unknown;

  // ===== 私有构造函数 =====
  private constructor(params: {
    searchEngine: 'postgres' | 'meilisearch' | 'elasticsearch';
    enableGit: boolean;
    autoSync?: boolean;
    syncInterval?: number;
    extensible?: Record<string, unknown>;
  }) {
    super();
    this.searchEngine = params.searchEngine;
    this.enableGit = params.enableGit;
    this.autoSync = params.autoSync;
    this.syncInterval = params.syncInterval;
    this._extensible = params.extensible || {};

    // 确保不可变
    Object.freeze(this);
    Object.freeze(this._extensible);
  }

  // ===== UI 计算属性 =====
  public get searchEngineText(): string {
    const map = {
      postgres: 'PostgreSQL',
      meilisearch: 'MeiliSearch',
      elasticsearch: 'Elasticsearch',
    };
    return map[this.searchEngine];
  }

  public get gitStatusText(): string {
    return this.enableGit ? 'Enabled' : 'Disabled';
  }

  public get syncStatusText(): string {
    if (!this.autoSync) return 'Manual';
    return `Auto (${this.syncInterval || 300}s)`;
  }

  // ===== 值相等性比较 =====
  public equals(other: ValueObject): boolean {
    if (!(other instanceof RepositoryConfig)) {
      return false;
    }

    return (
      this.searchEngine === other.searchEngine &&
      this.enableGit === other.enableGit &&
      this.autoSync === other.autoSync &&
      this.syncInterval === other.syncInterval
    );
  }

  // ===== 创建修改后的新实例 =====
  public with(
    changes: Partial<{
      searchEngine: 'postgres' | 'meilisearch' | 'elasticsearch';
      enableGit: boolean;
      autoSync: boolean;
      syncInterval: number;
    }>,
  ): RepositoryConfig {
    return new RepositoryConfig({
      searchEngine: changes.searchEngine ?? this.searchEngine,
      enableGit: changes.enableGit ?? this.enableGit,
      autoSync: changes.autoSync ?? this.autoSync,
      syncInterval: changes.syncInterval ?? this.syncInterval,
      extensible: this._extensible,
    });
  }

  // ===== DTO 转换 =====
  public toClientDTO(): RepositoryConfigClientDTO {
    return {
      searchEngine: this.searchEngine,
      enableGit: this.enableGit,
      autoSync: this.autoSync,
      syncInterval: this.syncInterval,
      ...this._extensible,
      searchEngineText: this.searchEngineText,
      gitStatusText: this.gitStatusText,
      syncStatusText: this.syncStatusText,
    };
  }

  public toServerDTO(): RepositoryConfigServerDTO {
    return {
      searchEngine: this.searchEngine,
      enableGit: this.enableGit,
      autoSync: this.autoSync,
      syncInterval: this.syncInterval,
      ...this._extensible,
    };
  }

  // ===== 静态工厂方法 =====
  public static fromServerDTO(dto: RepositoryConfigServerDTO): RepositoryConfig {
    const { searchEngine, enableGit, autoSync, syncInterval, ...rest } = dto;
    return new RepositoryConfig({
      searchEngine,
      enableGit,
      autoSync,
      syncInterval,
      extensible: rest,
    });
  }

  public static fromClientDTO(dto: RepositoryConfigClientDTO): RepositoryConfig {
    const { searchEngine, enableGit, autoSync, syncInterval, searchEngineText, gitStatusText, syncStatusText, ...rest } = dto;
    return new RepositoryConfig({
      searchEngine,
      enableGit,
      autoSync,
      syncInterval,
      extensible: rest,
    });
  }

  public static create(params?: Partial<RepositoryConfigServerDTO>): RepositoryConfig {
    const defaults = {
      searchEngine: 'postgres' as const,
      enableGit: false,
      autoSync: false,
      syncInterval: 300,
    };
    return new RepositoryConfig({
      searchEngine: params?.searchEngine || defaults.searchEngine,
      enableGit: params?.enableGit ?? defaults.enableGit,
      autoSync: params?.autoSync ?? defaults.autoSync,
      syncInterval: params?.syncInterval || defaults.syncInterval,
    });
  }
}
