/**
 * KeyResult 实体实现 (Client)
 */

import type { GoalContracts } from '@dailyuse/contracts';
import { Entity } from '@dailyuse/utils';
import { KeyResultProgressClient } from '../value-objects/KeyResultProgressClient';

type IKeyResultClient = GoalContracts.KeyResultClient;
type KeyResultClientDTO = GoalContracts.KeyResultClientDTO;
type KeyResultServerDTO = GoalContracts.KeyResultServerDTO;
type GoalRecordClientDTO = GoalContracts.GoalRecordClientDTO;

export class KeyResultClient extends Entity implements IKeyResultClient {
  private _goalUuid: string;
  private _title: string;
  private _description?: string | null;
  private _progress: KeyResultProgressClient;
  private _weight: number; // 权重 (0-100)
  private _order: number;
  private _createdAt: number;
  private _updatedAt: number;
  private _records?: GoalRecordClientDTO[] | null;

  private constructor(params: {
    uuid?: string;
    goalUuid: string;
    title: string;
    description?: string | null;
    progress: KeyResultProgressClient;
    weight?: number;
    order: number;
    createdAt: number;
    updatedAt: number;
    records?: GoalRecordClientDTO[] | null;
  }) {
    super(params.uuid || Entity.generateUUID());
    this._goalUuid = params.goalUuid;
    this._title = params.title;
    this._description = params.description;
    this._progress = params.progress;
    this._weight = params.weight ?? 0; // 默认权重为 0
    this._order = params.order;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._records = params.records;
  }

  // Getters
  public override get uuid(): string {
    return this._uuid;
  }
  public get goalUuid(): string {
    return this._goalUuid;
  }
  public get title(): string {
    return this._title;
  }
  public get description(): string | null | undefined {
    return this._description;
  }
  public get progress(): GoalContracts.KeyResultProgressClientDTO {
    return this._progress.toClientDTO();
  }
  public get weight(): number {
    return this._weight;
  }
  public get order(): number {
    return this._order;
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number {
    return this._updatedAt;
  }
  public get records(): GoalRecordClientDTO[] | null | undefined {
    return this._records;
  }

  // UI 辅助属性
  public get progressPercentage(): number {
    return this._progress.progressPercentage;
  }

  public get progressText(): string {
    return this._progress.progressText;
  }

  public get progressColor(): string {
    return this._progress.progressBarColor;
  }

  public get isCompleted(): boolean {
    return this._progress.isCompleted;
  }

  public get formattedCreatedAt(): string {
    return new Date(this.createdAt).toLocaleDateString('zh-CN');
  }

  public get formattedUpdatedAt(): string {
    return new Date(this.updatedAt).toLocaleDateString('zh-CN');
  }

  public get displayTitle(): string {
    return this.getDisplayTitle();
  }

  public get aggregationMethodText(): string {
    return this._progress.aggregationMethodText;
  }

  public get calculationExplanation(): string {
    const count = this.getRecordCount();
    if (count === 0) return '暂无数据记录';
    const method = this._progress.aggregationMethodText;
    return `当前进度由 ${count} 条记录${method}计算得出`;
  }

  // 实体方法
  public getDisplayTitle(): string {
    const maxLength = 50;
    if (this._title.length <= maxLength) return this._title;
    return `${this._title.substring(0, maxLength)}...`;
  }

  public getProgressBadge(): string {
    const percentage = this.progressPercentage;
    if (percentage >= 100) return '✓ 已完成';
    if (percentage >= 70) return '→ 进行中';
    if (percentage >= 40) return '⚡ 需努力';
    return '! 待启动';
  }

  public getProgressIcon(): string {
    if (this.isCompleted) return '✓';
    const percentage = this.progressPercentage;
    if (percentage >= 70) return '→';
    if (percentage >= 40) return '⚡';
    return '!';
  }

  public getAggregationMethodBadge(): string {
    const method = this._progress.aggregationMethod;
    switch (method) {
      case 'SUM':
        return 'SUM';
      case 'AVERAGE':
        return 'AVG';
      case 'MAX':
        return 'MAX';
      case 'MIN':
        return 'MIN';
      case 'LAST':
        return 'LAST';
      default:
        return 'SUM';
    }
  }

  public hasDescription(): boolean {
    return !!this._description && this._description.trim().length > 0;
  }

  public getRecordCount(): number {
    return this._records?.length ?? 0;
  }

  public hasRecords(): boolean {
    return this.getRecordCount() > 0;
  }

  public canUpdateProgress(): boolean {
    return true;
  }

  public canDelete(): boolean {
    return true;
  }

  // DTO 转换
  public toClientDTO(): KeyResultClientDTO {
    return {
      uuid: this.uuid,
      goalUuid: this._goalUuid,
      title: this._title,
      description: this._description,
      progress: this._progress.toClientDTO(),
      weight: this._weight,
      order: this._order,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      progressPercentage: this.progressPercentage,
      progressText: this.progressText,
      progressColor: this.progressColor,
      isCompleted: this.isCompleted,
      formattedCreatedAt: this.formattedCreatedAt,
      formattedUpdatedAt: this.formattedUpdatedAt,
      displayTitle: this.displayTitle,
      aggregationMethodText: this.aggregationMethodText,
      calculationExplanation: this.calculationExplanation,
      records: this._records,
    };
  }

  public toServerDTO(): KeyResultServerDTO {
    return {
      uuid: this.uuid,
      goalUuid: this._goalUuid,
      title: this._title,
      description: this._description,
      progress: this._progress.toServerDTO(),
      weight: this._weight,
      order: this._order,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // 静态工厂方法
  public static fromClientDTO(dto: KeyResultClientDTO): KeyResultClient {
    return new KeyResultClient({
      uuid: dto.uuid,
      goalUuid: dto.goalUuid,
      title: dto.title,
      description: dto.description,
      progress: KeyResultProgressClient.fromClientDTO(dto.progress),
      weight: dto.weight,
      order: dto.order,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      records: dto.records,
    });
  }

  public static fromServerDTO(dto: KeyResultServerDTO): KeyResultClient {
    return new KeyResultClient({
      uuid: dto.uuid,
      goalUuid: dto.goalUuid,
      title: dto.title,
      description: dto.description,
      progress: KeyResultProgressClient.fromServerDTO(dto.progress),
      weight: dto.weight,
      order: dto.order,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  public static forCreate(goalUuid: string): KeyResultClient {
    const now = Date.now();
    return new KeyResultClient({
      uuid: crypto.randomUUID(),
      goalUuid,
      title: '',
      description: null,
      progress: KeyResultProgressClient.createDefault(),
      order: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  public clone(): KeyResultClient {
    return KeyResultClient.fromClientDTO(this.toClientDTO());
  }

  // ===== 修改方法 (Modification Methods) =====
  // 遵循 DDD 最佳实践：聚合根应该提供修改属性的方法

  /**
   * 更新标题
   */
  public updateTitle(title: string): void {
    this._title = title;
    this._updatedAt = Date.now();
  }

  /**
   * 更新描述
   */
  public updateDescription(description: string | null): void {
    this._description = description;
    this._updatedAt = Date.now();
  }

  /**
   * 更新权重
   */
  public updateWeight(weight: number): void {
    if (weight < 0 || weight > 100) {
      throw new Error('权重必须在 0-100 之间');
    }
    this._weight = weight;
    this._updatedAt = Date.now();
  }

  /**
   * 更新排序
   */
  public updateOrder(order: number): void {
    this._order = order;
    this._updatedAt = Date.now();
  }

  /**
   * 更新进度 - 更新当前值
   */
  public updateCurrentValue(currentValue: number): void {
    this._progress.updateCurrentValue(currentValue);
    this._updatedAt = Date.now();
  }

  /**
   * 更新目标值
   */
  public updateTargetValue(targetValue: number): void {
    this._progress.updateTargetValue(targetValue);
    this._updatedAt = Date.now();
  }

  /**
   * 更新初始值
   */
  public updateInitialValue(initialValue: number): void {
    this._progress.updateInitialValue(initialValue);
    this._updatedAt = Date.now();
  }

  /**
   * 更新单位
   */
  public updateUnit(unit: string): void {
    this._progress.updateUnit(unit);
    this._updatedAt = Date.now();
  }

  /**
   * 更新值类型
   */
  public updateValueType(valueType: GoalContracts.KeyResultValueType): void {
    this._progress.updateValueType(valueType);
    this._updatedAt = Date.now();
  }

  /**
   * 更新聚合方法
   */
  public updateAggregationMethod(method: GoalContracts.AggregationMethod): void {
    this._progress.updateAggregationMethod(method);
    this._updatedAt = Date.now();
  }

  /**
   * 批量更新基本信息
   */
  public updateBasicInfo(params: {
    title?: string;
    description?: string | null;
    weight?: number;
    order?: number;
  }): void {
    if (params.title !== undefined) {
      this._title = params.title;
    }
    if (params.description !== undefined) {
      this._description = params.description;
    }
    if (params.weight !== undefined) {
      if (params.weight < 0 || params.weight > 100) {
        throw new Error('权重必须在 0-100 之间');
      }
      this._weight = params.weight;
    }
    if (params.order !== undefined) {
      this._order = params.order;
    }
    this._updatedAt = Date.now();
  }

  /**
   * 批量更新进度配置
   */
  public updateProgressConfig(params: {
    initialValue?: number;
    currentValue?: number;
    targetValue?: number;
    unit?: string;
    valueType?: GoalContracts.KeyResultValueType;
    aggregationMethod?: GoalContracts.AggregationMethod;
  }): void {
    if (params.initialValue !== undefined) {
      this._progress.updateInitialValue(params.initialValue);
    }
    if (params.currentValue !== undefined) {
      this._progress.updateCurrentValue(params.currentValue);
    }
    if (params.targetValue !== undefined) {
      this._progress.updateTargetValue(params.targetValue);
    }
    if (params.unit !== undefined) {
      this._progress.updateUnit(params.unit);
    }
    if (params.valueType !== undefined) {
      this._progress.updateValueType(params.valueType);
    }
    if (params.aggregationMethod !== undefined) {
      this._progress.updateAggregationMethod(params.aggregationMethod);
    }
    this._updatedAt = Date.now();
  }
}
