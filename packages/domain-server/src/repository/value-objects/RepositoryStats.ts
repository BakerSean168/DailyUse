/**
 * Repository Stats Value Object - Server Implementation
 * 仓储统计值对象 - 服务端实现
 */
import { RepositoryContracts } from '@dailyuse/contracts';

type RepositoryStatsServer = RepositoryContracts.RepositoryStatsServer;
type RepositoryStatsServerDTO = RepositoryContracts.RepositoryStatsServerDTO;

export class RepositoryStats implements RepositoryStatsServer {
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

  // ===== 扩展属性访问 =====
  [key: string]: unknown;

  // ===== DTO 转换 =====
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

  static create(params?: Partial<RepositoryStatsServerDTO>): RepositoryStats {
    return new RepositoryStats(
      params?.resourceCount || 0,
      params?.folderCount || 0,
      params?.totalSize || 0,
      {},
    );
  }
}
