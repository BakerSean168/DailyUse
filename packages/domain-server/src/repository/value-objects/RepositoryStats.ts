/**
 * RepositoryStats 值对象
 * 仓库统计信息 - 不可变值对象
 */

import type { RepositoryContracts } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type IRepositoryStats = RepositoryContracts.RepositoryStatsServerDTO;
type RepositoryStatsClientDTO = RepositoryContracts.RepositoryStatsClientDTO;
type RepositoryStatsPersistenceDTO = RepositoryContracts.RepositoryStatsPersistenceDTO;
type ResourceType = RepositoryContracts.ResourceType;
type ResourceStatus = RepositoryContracts.ResourceStatus;

/**
 * RepositoryStats 值对象
 */
export class RepositoryStats extends ValueObject implements IRepositoryStats {
  public readonly totalResources: number;
  public readonly resourcesByType: Record<ResourceType, number>;
  public readonly resourcesByStatus: Record<ResourceStatus, number>;
  public readonly totalSize: number;
  public readonly recentActiveResources: number;
  public readonly favoriteResources: number;
  public readonly lastUpdated: number;

  constructor(params: {
    totalResources: number;
    resourcesByType: Record<ResourceType, number>;
    resourcesByStatus: Record<ResourceStatus, number>;
    totalSize: number;
    recentActiveResources: number;
    favoriteResources: number;
    lastUpdated: number;
  }) {
    super(); // 调用基类构造函数

    this.totalResources = params.totalResources;
    this.resourcesByType = { ...params.resourcesByType };
    this.resourcesByStatus = { ...params.resourcesByStatus };
    this.totalSize = params.totalSize;
    this.recentActiveResources = params.recentActiveResources;
    this.favoriteResources = params.favoriteResources;
    this.lastUpdated = params.lastUpdated;

    Object.freeze(this);
    Object.freeze(this.resourcesByType);
    Object.freeze(this.resourcesByStatus);
  }

  /**
   * 值相等性比较（实现抽象方法）
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof RepositoryStats)) {
      return false;
    }

    return (
      this.totalResources === other.totalResources &&
      this.totalSize === other.totalSize &&
      this.recentActiveResources === other.recentActiveResources &&
      this.favoriteResources === other.favoriteResources &&
      this.lastUpdated === other.lastUpdated &&
      JSON.stringify(this.resourcesByType) === JSON.stringify(other.resourcesByType) &&
      JSON.stringify(this.resourcesByStatus) === JSON.stringify(other.resourcesByStatus)
    );
  }

  /**
   * 创建修改后的新实例
   */
  public with(
    changes: Partial<{
      totalResources: number;
      resourcesByType: Record<ResourceType, number>;
      resourcesByStatus: Record<ResourceStatus, number>;
      totalSize: number;
      recentActiveResources: number;
      favoriteResources: number;
      lastUpdated: number;
    }>,
  ): RepositoryStats {
    return new RepositoryStats({
      totalResources: changes.totalResources ?? this.totalResources,
      resourcesByType: changes.resourcesByType ?? this.resourcesByType,
      resourcesByStatus: changes.resourcesByStatus ?? this.resourcesByStatus,
      totalSize: changes.totalSize ?? this.totalSize,
      recentActiveResources: changes.recentActiveResources ?? this.recentActiveResources,
      favoriteResources: changes.favoriteResources ?? this.favoriteResources,
      lastUpdated: changes.lastUpdated ?? this.lastUpdated,
    });
  }

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): IRepositoryStats {
    return {
      totalResources: this.totalResources,
      resourcesByType: { ...this.resourcesByType },
      resourcesByStatus: { ...this.resourcesByStatus },
      totalSize: this.totalSize,
      recentActiveResources: this.recentActiveResources,
      favoriteResources: this.favoriteResources,
      lastUpdated: this.lastUpdated,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): RepositoryStatsClientDTO {
    const formatBytes = (bytes: number): string => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${Math.round(bytes / Math.pow(k, i) * 100) / 100} ${sizes[i]}`;
    };

    return {
      totalResources: this.totalResources,
      totalSize: this.totalSize,
      totalSizeFormatted: formatBytes(this.totalSize),
      favoriteCount: this.favoriteResources,
      recentCount: this.recentActiveResources,
      resourcesByType: { ...this.resourcesByType },
    };
  }

  /**
   * 转换为 Persistence DTO
   */
  public toPersistenceDTO(): RepositoryStatsPersistenceDTO {
    return {
      total_resources: this.totalResources,
      resources_by_type: JSON.stringify(this.resourcesByType),
      resources_by_status: JSON.stringify(this.resourcesByStatus),
      total_size: this.totalSize,
      recent_active_resources: this.recentActiveResources,
      favorite_resources: this.favoriteResources,
      last_updated: this.lastUpdated,
    };
  }

  /**
   * 从 Server DTO 创建值对象
   */
  public static fromServerDTO(stats: IRepositoryStats): RepositoryStats {
    return new RepositoryStats(stats);
  }

  /**
   * 转换为 Contract 接口 (兼容旧代码)
   */
  public toContract(): IRepositoryStats {
    return this.toServerDTO();
  }

  /**
   * 从 Contract 接口创建值对象 (兼容旧代码)
   */
  public static fromContract(stats: IRepositoryStats): RepositoryStats {
    return RepositoryStats.fromServerDTO(stats);
  }

  /**
   * 创建空统计
   */
  public static createEmpty(): RepositoryStats {
    return new RepositoryStats({
      totalResources: 0,
      resourcesByType: {} as Record<ResourceType, number>,
      resourcesByStatus: {} as Record<ResourceStatus, number>,
      totalSize: 0,
      recentActiveResources: 0,
      favoriteResources: 0,
      lastUpdated: Date.now(),
    });
  }
}
