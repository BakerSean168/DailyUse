/**
 * KeyResultProgress 值对象实现 (Client)
 */

import type { GoalContracts } from '@dailyuse/contracts';
import { GoalContracts as GC } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type IKeyResultProgress = GoalContracts.IKeyResultProgressClient;
type KeyResultProgressDTO = GoalContracts.KeyResultProgressClientDTO;
type KeyResultProgressServerDTO = GoalContracts.KeyResultProgressServerDTO;
type KeyResultValueType = GoalContracts.KeyResultValueType;
type AggregationMethod = GoalContracts.AggregationMethod;

export class KeyResultProgress extends ValueObject implements IKeyResultProgress {
  private _valueType: KeyResultValueType;
  private _aggregationMethod: AggregationMethod;
  private _targetValue: number;
  private _currentValue: number;
  private _initialValue?: number;
  private _unit: string | null;

  private constructor(params: {
    valueType: KeyResultValueType;
    aggregationMethod: AggregationMethod;
    targetValue: number;
    currentValue: number;
    initialValue?: number;
    unit?: string | null;
  }) {
    super();
    this._valueType = params.valueType;
    this._aggregationMethod = params.aggregationMethod;
    this._targetValue = params.targetValue;
    this._currentValue = params.currentValue;
    this._unit = params.unit ?? null;
  this._initialValue = params.initialValue;
  }

  // Getters
  public get valueType(): KeyResultValueType {
    return this._valueType;
  }
  public get aggregationMethod(): AggregationMethod {
    return this._aggregationMethod;
  }
  public get targetValue(): number {
    return this._targetValue;
  }
  public get currentValue(): number {
    return this._currentValue;
  }
  public get unit(): string | null {
    return this._unit;
  }

  public get initialValue(): number | undefined {
    return this._initialValue;
  }

  // UI 辅助属性
  public get progressPercentage(): number {
  // If an initial value exists, compute progress relative to the range [initialValue, targetValue]
  const start = this._initialValue ?? 0;
  const range = this._targetValue - start;
  if (range === 0) return 0;
  const percentage = ((this._currentValue - start) / range) * 100;
  return Math.min(100, Math.max(0, Math.round(percentage)));
  }

  public get progressText(): string {
    if (this._valueType === 'PERCENTAGE') {
      return `${this._currentValue.toFixed(1)}%`;
    }
    if (this._valueType === 'BINARY') {
      return this._currentValue >= this._targetValue ? '已完成' : '未完成';
    }
    const unit = this._unit ? ` ${this._unit}` : '';
    return `${this._currentValue}/${this._targetValue}${unit}`;
  }

  public get progressBarColor(): string {
    const percentage = this.progressPercentage;
    if (percentage >= 100) return '#10b981'; // green
    if (percentage >= 70) return '#3b82f6'; // blue
    if (percentage >= 40) return '#f59e0b'; // amber
    return '#ef4444'; // red
  }

  public get isCompleted(): boolean {
    return this._currentValue >= this._targetValue;
  }

  public get valueTypeText(): string {
    const map: Record<KeyResultValueType, string> = {
      INCREMENTAL: '累计值',
      ABSOLUTE: '绝对值',
      PERCENTAGE: '百分比',
      BINARY: '二元',
    };
    return map[this._valueType];
  }

  public get aggregationMethodText(): string {
    const map: Record<AggregationMethod, string> = {
      SUM: '求和',
      AVERAGE: '求平均',
      MAX: '求最大值',
      MIN: '求最小值',
      LAST: '取最后一次',
    };
    return map[this._aggregationMethod];
  }

  // 值对象方法
  public equals(other: IKeyResultProgress): boolean {
    return (
      this._valueType === other.valueType &&
      this._aggregationMethod === other.aggregationMethod &&
      this._targetValue === other.targetValue &&
      this._currentValue === other.currentValue &&
      this._unit === other.unit
    );
  }

  // DTO 转换
  public toServerDTO(): KeyResultProgressServerDTO {
    return {
      valueType: this._valueType,
      aggregationMethod: this._aggregationMethod,
      initialValue: this._initialValue,
      targetValue: this._targetValue,
      currentValue: this._currentValue,
      unit: this._unit,
    };
  }

  public toClientDTO(): KeyResultProgressDTO {
    return {
      valueType: this._valueType,
      aggregationMethod: this._aggregationMethod,
      initialValue: this._initialValue,
      targetValue: this._targetValue,
      currentValue: this._currentValue,
      unit: this._unit,
      progressPercentage: this.progressPercentage,
      progressText: this.progressText,
      progressBarColor: this.progressBarColor,
      isCompleted: this.isCompleted,
      valueTypeText: this.valueTypeText,
      aggregationMethodText: this.aggregationMethodText,
    };
  }

  // 静态工厂方法
  public static fromClientDTO(dto: KeyResultProgressDTO): KeyResultProgress {
    return new KeyResultProgress({
      valueType: dto.valueType,
      aggregationMethod: dto.aggregationMethod,
      initialValue: (dto as any).initialValue,
      targetValue: dto.targetValue,
      currentValue: dto.currentValue,
      unit: dto.unit,
    });
  }

  public static fromServerDTO(dto: KeyResultProgressServerDTO): KeyResultProgress {
    return new KeyResultProgress({
      valueType: dto.valueType,
      aggregationMethod: dto.aggregationMethod,
      initialValue: (dto as any).initialValue,
      targetValue: dto.targetValue,
      currentValue: dto.currentValue,
      unit: dto.unit,
    });
  }

  public static createDefault(): KeyResultProgress {
    return new KeyResultProgress({
      valueType: GC.KeyResultValueType.INCREMENTAL,
      aggregationMethod: GC.AggregationMethod.SUM,
      targetValue: 100,
      currentValue: 0,
      unit: '',
    });
  }

  // ===== 修改方法 (Modification Methods) =====
  // 虽然值对象通常不可变，但在客户端实体中需要修改能力

  /**
   * 更新当前值
   */
  public updateCurrentValue(currentValue: number): void {
    this._currentValue = currentValue;
  }

  /**
   * 更新目标值
   */
  public updateTargetValue(targetValue: number): void {
    this._targetValue = targetValue;
  }

  /**
   * 更新初始值（对于累计类型可能需要）
   * 注：当前实现中没有 initialValue 字段，此方法保留用于未来扩展
   */
  public updateInitialValue(_initialValue: number): void {
    // 支持 initialValue
    this._initialValue = _initialValue;
  }

  /**
   * 更新单位
   */
  public updateUnit(unit: string): void {
    this._unit = unit || null;
  }

  /**
   * 更新值类型
   */
  public updateValueType(valueType: KeyResultValueType): void {
    this._valueType = valueType;
  }

  /**
   * 更新聚合方法
   */
  public updateAggregationMethod(method: AggregationMethod): void {
    this._aggregationMethod = method;
  }
}
