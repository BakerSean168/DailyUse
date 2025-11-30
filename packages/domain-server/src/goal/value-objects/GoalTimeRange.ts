/**
 * GoalTimeRange 值对象
 * 目标时间范围 - 不可变值对象
 */

import type { GoalTimeRangePersistenceDTO, GoalTimeRangeServerDTO } from '@dailyuse/contracts/goal';
import { ValueObject } from '@dailyuse/utils';

// 类型别名

/**
 * GoalTimeRange 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 可以自由复制和替换
 */
export class GoalTimeRange extends ValueObject {
  public readonly startDate: number | null;
  public readonly targetDate: number | null;
  public readonly completedAt: number | null;
  public readonly archivedAt: number | null;

  constructor(params: {
    startDate?: number | null;
    targetDate?: number | null;
    completedAt?: number | null;
    archivedAt?: number | null;
  }) {
    super();

    this.startDate = params.startDate ?? null;
    this.targetDate = params.targetDate ?? null;
    this.completedAt = params.completedAt ?? null;
    this.archivedAt = params.archivedAt ?? null;

    // 验证：开始时间不能晚于目标时间
    if (this.startDate !== null && this.targetDate !== null && this.startDate > this.targetDate) {
      throw new Error('Start date cannot be later than target date');
    }

    // 确保不可变
    Object.freeze(this);
  }

  /**
   * 创建修改后的新实例（值对象不可变，修改时创建新实例）
   */
  public with(
    changes: Partial<{
      startDate: number | null;
      targetDate: number | null;
      completedAt: number | null;
      archivedAt: number | null;
    }>,
  ): GoalTimeRange {
    return new GoalTimeRange({
      startDate: changes.startDate ?? this.startDate,
      targetDate: changes.targetDate ?? this.targetDate,
      completedAt: changes.completedAt ?? this.completedAt,
      archivedAt: changes.archivedAt ?? this.archivedAt,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof GoalTimeRange)) {
      return false;
    }

    return (
      this.startDate === other.startDate &&
      this.targetDate === other.targetDate &&
      this.completedAt === other.completedAt &&
      this.archivedAt === other.archivedAt
    );
  }

  /**
   * 检查目标是否已过期
   */
  public isOverdue(): boolean {
    if (this.targetDate === null || this.completedAt !== null) {
      return false;
    }
    return Date.now() > this.targetDate;
  }

  /**
   * 检查目标是否已完成
   */
  public isCompleted(): boolean {
    return this.completedAt !== null;
  }

  /**
   * 检查目标是否已归档
   */
  public isArchived(): boolean {
    return this.archivedAt !== null;
  }

  /**
   * 获取剩余天数
   */
  public getRemainingDays(): number | null {
    if (this.targetDate === null || this.completedAt !== null) {
      return null;
    }
    const now = Date.now();
    const diff = this.targetDate - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * 获取总时长（天数）
   */
  public getTotalDays(): number | null {
    if (this.startDate === null || this.targetDate === null) {
      return null;
    }
    const diff = this.targetDate - this.startDate;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): GoalTimeRangeServerDTO {
    return {
      startDate: this.startDate,
      targetDate: this.targetDate,
      completedAt: this.completedAt,
      archivedAt: this.archivedAt,
    };
  }

  /**
   * 从 Server DTO 创建值对象
   */
  public static fromServerDTO(dto: GoalTimeRangeServerDTO): GoalTimeRange {
    return new GoalTimeRange(dto);
  }

  /**
   * 转换为 Persistence DTO
   */
  public toPersistenceDTO(): GoalTimeRangePersistenceDTO {
    return {
      startDate: this.startDate,
      targetDate: this.targetDate,
      completedAt: this.completedAt,
      archivedAt: this.archivedAt,
    };
  }

  /**
   * 从 Persistence DTO 创建值对象
   */
  public static fromPersistenceDTO(dto: GoalTimeRangePersistenceDTO): GoalTimeRange {
    return new GoalTimeRange(dto);
  }

  /**
   * 创建默认时间范围
   */
  public static createDefault(): GoalTimeRange {
    return new GoalTimeRange({
      startDate: null,
      targetDate: null,
      completedAt: null,
      archivedAt: null,
    });
  }
}
