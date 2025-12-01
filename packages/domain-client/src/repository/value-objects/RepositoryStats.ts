/**
 * Repository Stats Value Object - Client Implementation
 * 仓储统计值对象 - 客户端实现
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 */
import type { RepositoryStatsClientDTO, RepositoryStatsServerDTO } from '@dailyuse/contracts/repository';
import { ValueObject } from '@dailyuse/utils';

export class RepositoryStats extends ValueObject {
  // ===== 公开只读字段 =====
  public readonly resourceCount: number;
  public readonly folderCount: number;
  public readonly totalSize: number;
  private readonly _extensible: Record<string, unknown>;

  // ===== 动态属性索引签名（兼容 RepositoryStatsClient 接口）=====
  [key: string]: unknown;

  // ===== 私有构造函数 =====
  private constructor(params: {
    resourceCount: number;
    folderCount: number;
    totalSize: number;
    extensible?: Record<string, unknown>;
  }) {
    super();
    this.resourceCount = params.resourceCount;
    this.folderCount = params.folderCount;
    this.totalSize = params.totalSize;
    this._extensible = params.extensible || {};

    // 确保不可变
    Object.freeze(this);
    Object.freeze(this._extensible);
  }

  // ===== UI 计算属性 =====
  public get formattedSize(): string {
    const bytes = this.totalSize;
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  public get hasResources(): boolean {
    return this.resourceCount > 0;
  }

  public get hasFolders(): boolean {
    return this.folderCount > 0;
  }

  // ===== 值相等性比较 =====
  public equals(other: ValueObject): boolean {
    if (!(other instanceof RepositoryStats)) {
      return false;
    }

    return (
      this.resourceCount === other.resourceCount &&
      this.folderCount === other.folderCount &&
      this.totalSize === other.totalSize
    );
  }

  // ===== 创建修改后的新实例 =====
  public with(
    changes: Partial<{
      resourceCount: number;
      folderCount: number;
      totalSize: number;
    }>,
  ): RepositoryStats {
    return new RepositoryStats({
      resourceCount: changes.resourceCount ?? this.resourceCount,
      folderCount: changes.folderCount ?? this.folderCount,
      totalSize: changes.totalSize ?? this.totalSize,
      extensible: this._extensible,
    });
  }

  // ===== DTO 转换 =====
  public toClientDTO(): RepositoryStatsClientDTO {
    return {
      resourceCount: this.resourceCount,
      folderCount: this.folderCount,
      totalSize: this.totalSize,
      ...this._extensible,
      formattedSize: this.formattedSize,
      hasResources: this.hasResources,
      hasFolders: this.hasFolders,
    };
  }

  public toServerDTO(): RepositoryStatsServerDTO {
    return {
      resourceCount: this.resourceCount,
      folderCount: this.folderCount,
      totalSize: this.totalSize,
      ...this._extensible,
    };
  }

  // ===== 静态工厂方法 =====
  public static fromServerDTO(dto: RepositoryStatsServerDTO | undefined | null): RepositoryStats {
    // 处理空数据情况，返回默认统计
    if (!dto) {
      return RepositoryStats.create();
    }
    const { resourceCount, folderCount, totalSize, ...rest } = dto;
    return new RepositoryStats({
      resourceCount: resourceCount ?? 0,
      folderCount: folderCount ?? 0,
      totalSize: totalSize ?? 0,
      extensible: rest,
    });
  }

  public static fromClientDTO(dto: RepositoryStatsClientDTO | undefined | null): RepositoryStats {
    // 处理空数据情况，返回默认统计
    if (!dto) {
      return RepositoryStats.create();
    }
    const { resourceCount, folderCount, totalSize, formattedSize, hasResources, hasFolders, ...rest } = dto;
    return new RepositoryStats({
      resourceCount: resourceCount ?? 0,
      folderCount: folderCount ?? 0,
      totalSize: totalSize ?? 0,
      extensible: rest,
    });
  }

  public static create(params?: Partial<RepositoryStatsServerDTO>): RepositoryStats {
    return new RepositoryStats({
      resourceCount: params?.resourceCount || 0,
      folderCount: params?.folderCount || 0,
      totalSize: params?.totalSize || 0,
    });
  }
}
