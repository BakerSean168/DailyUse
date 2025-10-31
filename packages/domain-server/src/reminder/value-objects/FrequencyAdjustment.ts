/**
 * FrequencyAdjustment 值对象
 * 频率调整记录 - 不可变值对象
 */

import type {
  FrequencyAdjustmentServerDTO,
  FrequencyAdjustmentClientDTO,
} from '@dailyuse/contracts/src/modules/reminder';
import { ValueObject } from '@dailyuse/utils';

/**
 * FrequencyAdjustment 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 封装业务逻辑（变化率计算、状态判断）
 */
export class FrequencyAdjustment extends ValueObject implements FrequencyAdjustmentServerDTO {
  public readonly originalInterval: number;
  public readonly adjustedInterval: number;
  public readonly adjustmentReason: string;
  public readonly adjustmentTime: number;
  public readonly isAutoAdjusted: boolean;
  public readonly userConfirmed: boolean;
  public readonly rejectionReason: string | null;

  constructor(params: {
    originalInterval: number;
    adjustedInterval: number;
    adjustmentReason: string;
    adjustmentTime: number;
    isAutoAdjusted: boolean;
    userConfirmed: boolean;
    rejectionReason?: string | null;
  }) {
    super();

    // 验证
    if (params.originalInterval <= 0) {
      throw new Error('originalInterval must be positive');
    }
    if (params.adjustedInterval <= 0) {
      throw new Error('adjustedInterval must be positive');
    }
    if (!params.adjustmentReason || params.adjustmentReason.trim() === '') {
      throw new Error('adjustmentReason is required');
    }

    this.originalInterval = params.originalInterval;
    this.adjustedInterval = params.adjustedInterval;
    this.adjustmentReason = params.adjustmentReason;
    this.adjustmentTime = params.adjustmentTime;
    this.isAutoAdjusted = params.isAutoAdjusted;
    this.userConfirmed = params.userConfirmed;
    this.rejectionReason = params.rejectionReason ?? null;

    // 确保不可变
    Object.freeze(this);
  }

  /**
   * 创建新的 FrequencyAdjustment（工厂方法）
   */
  public static create(params: {
    originalInterval: number;
    adjustedInterval: number;
    adjustmentReason: string;
    isAutoAdjusted?: boolean;
    userConfirmed?: boolean;
    rejectionReason?: string;
  }): FrequencyAdjustment {
    return new FrequencyAdjustment({
      originalInterval: params.originalInterval,
      adjustedInterval: params.adjustedInterval,
      adjustmentReason: params.adjustmentReason,
      adjustmentTime: Date.now(),
      isAutoAdjusted: params.isAutoAdjusted ?? false,
      userConfirmed: params.userConfirmed ?? false,
      rejectionReason: params.rejectionReason,
    });
  }

  /**
   * 创建修改后的新实例
   */
  public with(
    changes: Partial<{
      originalInterval: number;
      adjustedInterval: number;
      adjustmentReason: string;
      adjustmentTime: number;
      isAutoAdjusted: boolean;
      userConfirmed: boolean;
      rejectionReason: string | null;
    }>,
  ): FrequencyAdjustment {
    return new FrequencyAdjustment({
      originalInterval: changes.originalInterval ?? this.originalInterval,
      adjustedInterval: changes.adjustedInterval ?? this.adjustedInterval,
      adjustmentReason: changes.adjustmentReason ?? this.adjustmentReason,
      adjustmentTime: changes.adjustmentTime ?? this.adjustmentTime,
      isAutoAdjusted: changes.isAutoAdjusted ?? this.isAutoAdjusted,
      userConfirmed: changes.userConfirmed ?? this.userConfirmed,
      rejectionReason:
        changes.rejectionReason !== undefined ? changes.rejectionReason : this.rejectionReason,
    });
  }

  // ===== 业务方法 =====

  /**
   * 频率是否增加（间隔变小）
   */
  public isIncreased(): boolean {
    return this.adjustedInterval < this.originalInterval;
  }

  /**
   * 频率是否减少（间隔变大）
   */
  public isDecreased(): boolean {
    return this.adjustedInterval > this.originalInterval;
  }

  /**
   * 获取变化率（百分比）
   * 正数表示增加，负数表示减少
   */
  public getChangeRate(): number {
    const change = ((this.adjustedInterval - this.originalInterval) / this.originalInterval) * 100;
    return Math.round(change * 10) / 10; // 保留1位小数
  }

  /**
   * 是否待确认
   */
  public isPending(): boolean {
    return this.isAutoAdjusted && !this.userConfirmed && !this.rejectionReason;
  }

  /**
   * 是否被拒绝
   */
  public isRejected(): boolean {
    return !!this.rejectionReason;
  }

  /**
   * 将秒数转换为可读的间隔文本
   */
  public getDisplayInterval(seconds: number): string {
    const minute = 60;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;

    if (seconds < hour) {
      const minutes = Math.round(seconds / minute);
      return `每${minutes}分钟1次`;
    } else if (seconds < day) {
      const hours = Math.round(seconds / hour);
      return `每${hours}小时1次`;
    } else if (seconds < week) {
      const days = Math.round(seconds / day);
      return `每${days}天1次`;
    } else {
      const weeks = Math.round(seconds / week);
      return `每${weeks}周1次`;
    }
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof FrequencyAdjustment)) {
      return false;
    }

    return (
      this.originalInterval === other.originalInterval &&
      this.adjustedInterval === other.adjustedInterval &&
      this.adjustmentReason === other.adjustmentReason &&
      this.adjustmentTime === other.adjustmentTime &&
      this.isAutoAdjusted === other.isAutoAdjusted &&
      this.userConfirmed === other.userConfirmed &&
      this.rejectionReason === other.rejectionReason
    );
  }

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): FrequencyAdjustmentServerDTO {
    return {
      originalInterval: this.originalInterval,
      adjustedInterval: this.adjustedInterval,
      adjustmentReason: this.adjustmentReason,
      adjustmentTime: this.adjustmentTime,
      isAutoAdjusted: this.isAutoAdjusted,
      userConfirmed: this.userConfirmed,
      rejectionReason: this.rejectionReason,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): FrequencyAdjustmentClientDTO {
    const originalText = this.getDisplayInterval(this.originalInterval);
    const adjustedText = this.getDisplayInterval(this.adjustedInterval);
    const displayText = `从${originalText}调整为${adjustedText}`;

    const changeRate = this.getChangeRate();
    const changeRateText = this.isIncreased()
      ? `频率提升${Math.abs(changeRate).toFixed(1)}%`
      : `频率降低${Math.abs(changeRate).toFixed(1)}%`;

    let statusText: string;
    if (this.isRejected()) {
      statusText = '已拒绝';
    } else if (this.userConfirmed) {
      statusText = '已确认';
    } else {
      statusText = '待确认';
    }

    return {
      originalInterval: this.originalInterval,
      adjustedInterval: this.adjustedInterval,
      adjustmentReason: this.adjustmentReason,
      adjustmentTime: this.adjustmentTime,
      isAutoAdjusted: this.isAutoAdjusted,
      userConfirmed: this.userConfirmed,
      rejectionReason: this.rejectionReason,
      displayText,
      changeRateText,
      statusText,
    };
  }

  /**
   * 从 Server DTO 创建值对象
   */
  public static fromServerDTO(dto: FrequencyAdjustmentServerDTO): FrequencyAdjustment {
    return new FrequencyAdjustment(dto);
  }

  /**
   * 从 Client DTO 创建值对象
   */
  public static fromClientDTO(dto: FrequencyAdjustmentClientDTO): FrequencyAdjustment {
    return new FrequencyAdjustment({
      originalInterval: dto.originalInterval,
      adjustedInterval: dto.adjustedInterval,
      adjustmentReason: dto.adjustmentReason,
      adjustmentTime: dto.adjustmentTime,
      isAutoAdjusted: dto.isAutoAdjusted,
      userConfirmed: dto.userConfirmed,
      rejectionReason: dto.rejectionReason,
    });
  }
}
