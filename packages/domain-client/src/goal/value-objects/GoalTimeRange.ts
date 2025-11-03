/**
 * GoalTimeRange 值对象实现 (Client)
 */

import type { GoalContracts } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type IGoalTimeRange = GoalContracts.GoalTimeRangeClient;
type GoalTimeRangeDTO = GoalContracts.GoalTimeRangeClientDTO;
type GoalTimeRangeServerDTO = GoalContracts.GoalTimeRangeServerDTO;

export class GoalTimeRange extends ValueObject implements IGoalTimeRange {
  private _startDate: number | null;
  private _targetDate: number | null;
  private _completedAt: number | null;
  private _archivedAt: number | null;

  private constructor(params: {
    startDate?: number | null;
    targetDate?: number | null;
    completedAt?: number | null;
    archivedAt?: number | null;
  }) {
    super();
    this._startDate = params.startDate ?? null;
    this._targetDate = params.targetDate ?? null;
    this._completedAt = params.completedAt ?? null;
    this._archivedAt = params.archivedAt ?? null;
  }

  // Getters
  public get startDate(): number | null {
    return this._startDate;
  }
  public get targetDate(): number | null {
    return this._targetDate;
  }
  public get completedAt(): number | null {
    return this._completedAt;
  }
  public get archivedAt(): number | null {
    return this._archivedAt;
  }

  // UI 辅助属性
  public get startDateFormatted(): string | null {
    return this._startDate ? this.formatDate(this._startDate) : null;
  }

  public get targetDateFormatted(): string | null {
    return this._targetDate ? this.formatDate(this._targetDate) : null;
  }

  public get completedAtFormatted(): string | null {
    return this._completedAt ? this.formatDate(this._completedAt) : null;
  }

  public get archivedAtFormatted(): string | null {
    return this._archivedAt ? this.formatDate(this._archivedAt) : null;
  }

  public get dateRangeText(): string {
    if (!this._startDate && !this._targetDate) {
      return '未设置时间';
    }
    if (this._startDate && this._targetDate) {
      return `${this.formatDate(this._startDate)} 至 ${this.formatDate(this._targetDate)}`;
    }
    if (this._startDate) {
      return `开始于 ${this.formatDate(this._startDate)}`;
    }
    if (this._targetDate) {
      return `目标 ${this.formatDate(this._targetDate)}`;
    }
    return '未设置时间';
  }

  public get durationText(): string | null {
    if (!this._startDate || !this._targetDate) return null;
    const days = this.getDurationDays();
    return days !== null ? `持续 ${days} 天` : null;
  }

  public get remainingText(): string | null {
    const remaining = this.getRemainingDays();
    if (remaining === null) return null;
    if (remaining < 0) {
      return `已逾期 ${Math.abs(remaining)} 天`;
    }
    return `剩余 ${remaining} 天`;
  }

  public get isOverdue(): boolean {
    if (!this._targetDate) return false;
    return Date.now() > this._targetDate;
  }

  public get progressPercentage(): number | null {
    if (!this._startDate || !this._targetDate) return null;
    const total = this._targetDate - this._startDate;
    const elapsed = Date.now() - this._startDate;
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  }

  // 值对象方法
  public equals(other: IGoalTimeRange): boolean {
    return (
      this._startDate === other.startDate &&
      this._targetDate === other.targetDate &&
      this._completedAt === other.completedAt &&
      this._archivedAt === other.archivedAt
    );
  }

  // 辅助方法
  private getDurationDays(): number | null {
    if (!this._startDate || !this._targetDate) return null;
    return Math.round((this._targetDate - this._startDate) / (1000 * 60 * 60 * 24));
  }

  private getRemainingDays(): number | null {
    if (!this._targetDate) return null;
    return Math.round((this._targetDate - Date.now()) / (1000 * 60 * 60 * 24));
  }

  private formatDate(timestamp: number): string {
    return new Date(timestamp).toISOString().split('T')[0];
  }

  // DTO 转换
  public toServerDTO(): GoalTimeRangeServerDTO {
    return {
      startDate: this._startDate,
      targetDate: this._targetDate,
      completedAt: this._completedAt,
      archivedAt: this._archivedAt,
    };
  }

  public toClientDTO(): GoalTimeRangeDTO {
    return {
      startDate: this._startDate,
      targetDate: this._targetDate,
      completedAt: this._completedAt,
      archivedAt: this._archivedAt,
      startDateFormatted: this.startDateFormatted,
      targetDateFormatted: this.targetDateFormatted,
      completedAtFormatted: this.completedAtFormatted,
      archivedAtFormatted: this.archivedAtFormatted,
      dateRangeText: this.dateRangeText,
      durationText: this.durationText,
      remainingText: this.remainingText,
      isOverdue: this.isOverdue,
      progressPercentage: this.progressPercentage,
    };
  }

  // 静态工厂方法
  public static fromClientDTO(dto: GoalTimeRangeDTO): GoalTimeRange {
    return new GoalTimeRange({
      startDate: dto.startDate,
      targetDate: dto.targetDate,
      completedAt: dto.completedAt,
      archivedAt: dto.archivedAt,
    });
  }

  public static fromServerDTO(dto: GoalTimeRangeServerDTO): GoalTimeRange {
    return new GoalTimeRange({
      startDate: dto.startDate,
      targetDate: dto.targetDate,
      completedAt: dto.completedAt,
      archivedAt: dto.archivedAt,
    });
  }
}
