/**
 * GroupStats 值对象
 * 分组统计信息 - 不可变值对象
 */

import type {
  GroupStatsServerDTO,
  GroupStatsClientDTO,
  GroupStatsPersistenceDTO,
} from '@dailyuse/contracts/reminder';
import { ValueObject } from '@dailyuse/utils';

/**
 * GroupStats 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 */
export class GroupStats extends ValueObject implements GroupStatsServerDTO {
  public readonly totalTemplates: number;
  public readonly activeTemplates: number;
  public readonly pausedTemplates: number;
  public readonly selfEnabledTemplates: number;
  public readonly selfPausedTemplates: number;

  constructor(params: {
    totalTemplates: number;
    activeTemplates: number;
    pausedTemplates: number;
    selfEnabledTemplates: number;
    selfPausedTemplates: number;
  }) {
    super();

    this.totalTemplates = params.totalTemplates;
    this.activeTemplates = params.activeTemplates;
    this.pausedTemplates = params.pausedTemplates;
    this.selfEnabledTemplates = params.selfEnabledTemplates;
    this.selfPausedTemplates = params.selfPausedTemplates;

    // 确保不可变
    Object.freeze(this);
  }

  /**
   * 创建修改后的新实例
   */
  public with(
    changes: Partial<{
      totalTemplates: number;
      activeTemplates: number;
      pausedTemplates: number;
      selfEnabledTemplates: number;
      selfPausedTemplates: number;
    }>,
  ): GroupStats {
    return new GroupStats({
      totalTemplates: changes.totalTemplates ?? this.totalTemplates,
      activeTemplates: changes.activeTemplates ?? this.activeTemplates,
      pausedTemplates: changes.pausedTemplates ?? this.pausedTemplates,
      selfEnabledTemplates: changes.selfEnabledTemplates ?? this.selfEnabledTemplates,
      selfPausedTemplates: changes.selfPausedTemplates ?? this.selfPausedTemplates,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof GroupStats)) {
      return false;
    }

    return (
      this.totalTemplates === other.totalTemplates &&
      this.activeTemplates === other.activeTemplates &&
      this.pausedTemplates === other.pausedTemplates &&
      this.selfEnabledTemplates === other.selfEnabledTemplates &&
      this.selfPausedTemplates === other.selfPausedTemplates
    );
  }

  /**
   * 转换为 DTO
   */
  public toServerDTO(): GroupStatsServerDTO {
    return {
      totalTemplates: this.totalTemplates,
      activeTemplates: this.activeTemplates,
      pausedTemplates: this.pausedTemplates,
      selfEnabledTemplates: this.selfEnabledTemplates,
      selfPausedTemplates: this.selfPausedTemplates,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): GroupStatsClientDTO {
    return {
      totalTemplates: this.totalTemplates,
      activeTemplates: this.activeTemplates,
      pausedTemplates: this.pausedTemplates,
      selfEnabledTemplates: this.selfEnabledTemplates,
      selfPausedTemplates: this.selfPausedTemplates,
      templateCountText: `${this.totalTemplates} 个提醒`,
      activeStatusText: `${this.activeTemplates} 个活跃`,
    };
  }

  /**
   * 转换为 Persistence DTO（数据库存储格式）
   */
  public toPersistenceDTO(): GroupStatsPersistenceDTO {
    return {
      total_templates: this.totalTemplates,
      active_templates: this.activeTemplates,
      paused_templates: this.pausedTemplates,
      self_enabled_templates: this.selfEnabledTemplates,
      self_paused_templates: this.selfPausedTemplates,
    };
  }

  /**
   * 从 DTO 创建值对象
   */
  public static fromServerDTO(dto: GroupStatsServerDTO): GroupStats {
    return new GroupStats(dto);
  }
}
