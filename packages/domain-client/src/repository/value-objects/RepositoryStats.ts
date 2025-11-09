/**
 * Repository Stats Value Object - Client Implementation
 * 仓储统计值对象 - 客户端实现
 */
import { RepositoryContracts } from '@dailyuse/contracts';

type RepositoryStatsClient = RepositoryContracts.RepositoryStatsClient;
type RepositoryStatsClientDTO = RepositoryContracts.RepositoryStatsClientDTO;
type RepositoryStatsServerDTO = RepositoryContracts.RepositoryStatsServerDTO;

export class RepositoryStats implements RepositoryStatsClient {
  // ===== 私有字段 =====
  private _resourceCount: number;
  private _folderCount: number;
  private _totalSize: number;
  private _extensible: Record<string, unknown>;

  // ===== 私有构造函数 =====
  private constructor(
    resourceCount: number,
    folderCount: number,
    totalSize: number,
    extensible?: Record<string, unknown>,
  ) {
    this._resourceCount = resourceCount;
    this._folderCount = folderCount;
    this._totalSize = totalSize;
    this._extensible = extensible || {};
  }

  // ===== Getters =====
  get resourceCount(): number {
    return this._resourceCount;
  }

  get folderCount(): number {
    return this._folderCount;
  }

  get totalSize(): number {
    return this._totalSize;
  }

  // ===== UI 计算属性 =====
  get formattedSize(): string {
    const bytes = this._totalSize;
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  get hasResources(): boolean {
    return this._resourceCount > 0;
  }

  get hasFolders(): boolean {
    return this._folderCount > 0;
  }

  // ===== 扩展属性访问 =====
  [key: string]: unknown;

  // ===== DTO 转换 =====
  toClientDTO(): RepositoryStatsClientDTO {
    return {
      resourceCount: this._resourceCount,
      folderCount: this._folderCount,
      totalSize: this._totalSize,
      ...this._extensible,
      formattedSize: this.formattedSize,
      hasResources: this.hasResources,
      hasFolders: this.hasFolders,
    };
  }

  toServerDTO(): RepositoryStatsServerDTO {
    return {
      resourceCount: this._resourceCount,
      folderCount: this._folderCount,
      totalSize: this._totalSize,
      ...this._extensible,
    };
  }

  // ===== 静态工厂方法 =====
  static fromServerDTO(dto: RepositoryStatsServerDTO): RepositoryStats {
    const { resourceCount, folderCount, totalSize, ...rest } = dto;
    return new RepositoryStats(resourceCount, folderCount, totalSize, rest);
  }

  static fromClientDTO(dto: RepositoryStatsClientDTO): RepositoryStats {
    const { resourceCount, folderCount, totalSize, formattedSize, hasResources, hasFolders, ...rest } = dto;
    return new RepositoryStats(resourceCount, folderCount, totalSize, rest);
  }

  static create(params?: Partial<RepositoryStatsServerDTO>): RepositoryStats {
    return new RepositoryStats(
      params?.resourceCount || 0,
      params?.folderCount || 0,
      params?.totalSize || 0,
      {},
    );
  }
}
