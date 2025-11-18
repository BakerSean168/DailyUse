/**
 * KeyResultProgress 值对象
 * 关键成果进度 - 不可变值对象
 */

import { GoalContracts } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

// 类型别名
type KeyResultValueType = GoalContracts.KeyResultValueType;
type AggregationMethod = GoalContracts.AggregationMethod;
type KeyResultProgressServerDTO = GoalContracts.KeyResultProgressServerDTO;
type KeyResultProgressPersistenceDTO = GoalContracts.KeyResultProgressPersistenceDTO;

// 枚举别名
const KeyResultValueTypeEnum = GoalContracts.KeyResultValueType;
const AggregationMethodEnum = GoalContracts.AggregationMethod;

/**
 * KeyResultProgress 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 可以自由复制和替换
 */
export class KeyResultProgress extends ValueObject {
  public readonly valueType: KeyResultValueType;
  public readonly aggregationMethod: AggregationMethod;
  public readonly targetValue: number;
  public readonly currentValue: number;
  public readonly initialValue?: number;
  public readonly unit: string | null;

  private constructor(params: {
    valueType: KeyResultValueType;
    aggregationMethod: AggregationMethod;
    targetValue: number;
    currentValue: number;
    initialValue?: number;
    unit?: string | null;
  }) {
    super();

    this.valueType = params.valueType;
    this.aggregationMethod = params.aggregationMethod;
    this.targetValue = params.targetValue;
    this.currentValue = params.currentValue;
    this.initialValue = params.initialValue;
    this.unit = params.unit ?? null;

    // 验证
    if (this.targetValue < 0) {
      throw new Error('Target value cannot be negative');
    }

    // 确保不可变
    Object.freeze(this);
  }

  /**
   * 创建修改后的新实例（值对象不可变，修改时创建新实例）
   */
  public with(
    changes: Partial<{
      valueType: KeyResultValueType;
      aggregationMethod: AggregationMethod;
      targetValue: number;
      currentValue: number;
      unit: string | null;
    }>,
  ): KeyResultProgress {
    return new KeyResultProgress({
      valueType: changes.valueType ?? this.valueType,
      aggregationMethod: changes.aggregationMethod ?? this.aggregationMethod,
      targetValue: changes.targetValue ?? this.targetValue,
      currentValue: changes.currentValue ?? this.currentValue,
      unit: changes.unit ?? this.unit,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof KeyResultProgress)) {
      return false;
    }

    return (
      this.valueType === other.valueType &&
      this.aggregationMethod === other.aggregationMethod &&
      this.targetValue === other.targetValue &&
      this.currentValue === other.currentValue &&
      this.unit === other.unit
    );
  }

  /**
   * 计算完成百分比
   */
  public calculatePercentage(): number {
    const start = this.initialValue ?? 0;
    const range = this.targetValue - start;
    
    // 如果目标值无效或范围无效，返回 0
    if (this.targetValue <= 0 || range <= 0) {
      return 0;
    }

    const percentage = ((this.currentValue - start) / range) * 100;
    return Math.min(Math.max(percentage, 0), 100); // 限制在 0-100 之间
  }

  /**
   * 是否已完成
   */
  public isCompleted(): boolean {
    if (this.valueType === 'BINARY') {
      return this.currentValue >= 1;
    }
    return this.currentValue >= this.targetValue;
  }

  /**
   * 更新进度（返回新实例）
   */
  public updateProgress(newValue: number): KeyResultProgress {
    return this.with({ currentValue: newValue });
  }

  /**
   * 根据记录重新计算当前值
   */
  public recalculateFromRecords(recordValues: number[]): number {
    if (recordValues.length === 0) {
      return 0;
    }

    switch (this.aggregationMethod) {
      case 'SUM':
        return recordValues.reduce((sum, val) => sum + val, 0);

      case 'AVERAGE':
        return recordValues.reduce((sum, val) => sum + val, 0) / recordValues.length;

      case 'MAX':
        return Math.max(...recordValues);

      case 'MIN':
        return Math.min(...recordValues);

      case 'LAST':
        return recordValues[recordValues.length - 1];

      default:
        return recordValues[recordValues.length - 1];
    }
  }

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): KeyResultProgressServerDTO {
    return {
      valueType: this.valueType,
      aggregationMethod: this.aggregationMethod,
      initialValue: this.initialValue,
      targetValue: this.targetValue,
      currentValue: this.currentValue,
      unit: this.unit,
    };
  }

  /**
   * 从 Server DTO 创建值对象
   */
  public static fromServerDTO(dto: KeyResultProgressServerDTO): KeyResultProgress {
    return new KeyResultProgress(dto);
  }

  /**
   * 转换为 Persistence DTO
   */
  public toPersistenceDTO(): KeyResultProgressPersistenceDTO {
    return {
      valueType: this.valueType,
      aggregationMethod: this.aggregationMethod,
      initialValue: this.initialValue,
      targetValue: this.targetValue,
      currentValue: this.currentValue,
      unit: this.unit,
    };
  }

  /**
   * 从 Persistence DTO 创建值对象
   */
  public static fromPersistenceDTO(dto: KeyResultProgressPersistenceDTO): KeyResultProgress {
    return new KeyResultProgress({
      valueType: dto.valueType,
      aggregationMethod: dto.aggregationMethod,
      initialValue: dto.initialValue,
      targetValue: dto.targetValue,
      currentValue: dto.currentValue,
      unit: dto.unit ?? null,
    });
  }

  /**
   * 创建默认进度
   */
  public static createDefault(
    targetValue: number = 100,
    unit: string | null = null,
  ): KeyResultProgress {
    return new KeyResultProgress({
      valueType: KeyResultValueTypeEnum.INCREMENTAL,
      aggregationMethod: AggregationMethodEnum.SUM,
      targetValue,
      currentValue: 0,
      unit,
    });
  }
}
