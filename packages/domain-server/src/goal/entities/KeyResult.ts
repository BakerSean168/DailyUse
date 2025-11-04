/**
 * KeyResult 实体
 * 关键结果实体
 *
 * DDD 实体职责：
 * - 管理关键结果的进度追踪
 * - 管理进度记录（GoalRecord）
 * - 执行进度计算和更新逻辑
 */

import { GoalRecord } from './GoalRecord';
import { Entity } from '@dailyuse/utils';
import type { GoalContracts } from '@dailyuse/contracts';

type IKeyResultServer = GoalContracts.KeyResultServer;
type KeyResultServerDTO = GoalContracts.KeyResultServerDTO;
type KeyResultClientDTO = GoalContracts.KeyResultClientDTO;
type KeyResultPersistenceDTO = GoalContracts.KeyResultPersistenceDTO;
type KeyResultProgressServerDTO = GoalContracts.KeyResultProgressServerDTO;
type KeyResultProgressClientDTO = GoalContracts.KeyResultProgressClientDTO;
type GoalRecordServerDTO = GoalContracts.GoalRecordServerDTO;
type AggregationMethod = GoalContracts.AggregationMethod;

// 用于解析持久化 DTO 中的 progress
interface ProgressPersistence {
  current_value: number;
  target_value: number;
  valueType: string;
  aggregation_method: string;
}

/**
 * KeyResult 实体
 */
export class KeyResult extends Entity implements IKeyResultServer {
  // ===== 私有字段 =====
  private _goalUuid: string;
  private _title: string;
  private _description: string | null;
  private _progress: KeyResultProgressServerDTO;
  private _weight: number; // 权重 (0-100)
  private _order: number;
  private _createdAt: number;
  private _updatedAt: number;
  private _records: GoalRecordServerDTO[];

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    goalUuid: string;
    title: string;
    description?: string | null;
    progress: KeyResultProgressServerDTO;
    weight?: number;
    order: number;
    createdAt: number;
    updatedAt: number;
    records?: GoalRecordServerDTO[];
  }) {
    super(params.uuid ?? Entity.generateUUID());
    this._goalUuid = params.goalUuid;
    this._title = params.title;
    this._description = params.description ?? null;
    this._progress = params.progress;
    this._weight = params.weight ?? 0; // 默认权重为 0
    this._order = params.order;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._records = params.records ?? [];
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get goalUuid(): string {
    return this._goalUuid;
  }
  public get title(): string {
    return this._title;
  }
  public get description(): string | null {
    return this._description;
  }
  public get progress(): KeyResultProgressServerDTO {
    return this._progress;
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
  public get records(): GoalRecordServerDTO[] | null {
    return this._records.length > 0 ? this._records : null;
  }

  // ===== 工厂方法 =====

  /**
   * 创建新的 KeyResult 实体
   */
  public static create(params: {
    goalUuid: string;
    title: string;
    description?: string;
    progress: KeyResultProgressServerDTO;
    weight?: number;
    order?: number;
  }): KeyResult {
    // 验证
    if (!params.goalUuid) {
      throw new Error('Goal UUID is required');
    }
    if (!params.title || params.title.trim().length === 0) {
      throw new Error('Title is required');
    }

    const now = Date.now();

    return new KeyResult({
      goalUuid: params.goalUuid,
      title: params.title.trim(),
      description: params.description?.trim() || null,
      progress: params.progress,
      weight: params.weight,
      order: params.order ?? 0,
      createdAt: now,
      updatedAt: now,
      records: [],
    });
  }

  /**
   * 从 Server DTO 重建实体
   */
  public static fromServerDTO(dto: KeyResultServerDTO): KeyResult {
    return new KeyResult({
      uuid: dto.uuid,
      goalUuid: dto.goalUuid,
      title: dto.title,
      description: dto.description ?? null,
      progress: dto.progress,
      weight: dto.weight,
      order: dto.order,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      records: dto.records ?? [],
    });
  }

  /**
   * 从持久化 DTO 重建实体
   */
  public static fromPersistenceDTO(dto: KeyResultPersistenceDTO): KeyResult {
    // 解析 JSON 字符串
    const progressData = JSON.parse(dto.progress) as ProgressPersistence;

    const progress: KeyResultProgressServerDTO = {
      currentValue: progressData.current_value,
      targetValue: progressData.target_value,
      valueType: progressData.valueType as any,
      aggregationMethod: progressData.aggregation_method as any,
    };

    return new KeyResult({
      uuid: dto.uuid,
      goalUuid: dto.goalUuid,
      title: dto.title,
      description: dto.description ?? null,
      progress,
      weight: dto.weight,
      order: dto.order,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      records: [],
    });
  }

  // ===== 业务方法 =====

  /**
   * 更新标题
   */
  public updateTitle(title: string): void {
    const trimmed = title.trim();
    if (trimmed.length === 0) {
      throw new Error('Title cannot be empty');
    }
    this._title = trimmed;
    this._updatedAt = Date.now();
  }

  /**
   * 更新描述
   */
  public updateDescription(description: string): void {
    this._description = description.trim() || null;
    this._updatedAt = Date.now();
  }

  /**
   * 更新权重
   */
  public updateWeight(weight: number): void {
    if (weight < 0 || weight > 100) {
      throw new Error('Weight must be between 0 and 100');
    }
    this._weight = weight;
    this._updatedAt = Date.now();
  }

  /**
   * 更新进度并创建记录
   */
  public updateProgress(newValue: number, note?: string): GoalRecordServerDTO {
    const previousValue = this._progress.currentValue;
    const changeAmount = newValue - previousValue;

    // 创建记录
    const record: GoalRecordServerDTO = {
      uuid: Entity.generateUUID(),
      keyResultUuid: this.uuid,
      goalUuid: this._goalUuid,
      previousValue,
      newValue,
      changeAmount,
      note: note?.trim() || null,
      recordedAt: Date.now(),
      createdAt: Date.now(),
    };

    // 更新进度
    this._progress = {
      ...this._progress,
      currentValue: newValue,
    };
    this._updatedAt = Date.now();

    // 添加到记录列表
    this._records.push(record);

    return record;
  }

  /**
   * 计算完成百分比
   */
  public calculatePercentage(): number {
    if (this._progress.targetValue === 0) {
      return 0;
    }
    const percentage = (this._progress.currentValue / this._progress.targetValue) * 100;
    return Math.min(Math.max(percentage, 0), 100);
  }

  /**
   * 是否已完成
   */
  public isCompleted(): boolean {
    return this._progress.currentValue >= this._progress.targetValue;
  }

  /**
   * 更新排序
   */
  public updateOrder(order: number): void {
    this._order = order;
    this._updatedAt = Date.now();
  }

  /**
   * 添加记录
   */
  public addRecord(record: GoalRecordServerDTO): void {
    this._records.push(record);
  }

  /**
   * 删除记录
   */
  public removeRecord(recordUuid: string): void {
    const index = this._records.findIndex(r => r.uuid === recordUuid);
    if (index === -1) {
      throw new Error(`Record with uuid ${recordUuid} not found`);
    }
    this._records.splice(index, 1);
    this._updatedAt = Date.now();
    // 删除后重新计算进度
    this.recalculateProgress();
  }

  /**
   * 根据聚合方式重新计算进度
   */
  public recalculateProgress(): void {
    if (this._records.length === 0) return;

    const values = this.getRecordValues();
    let newValue = this._progress.currentValue;

    switch (this._progress.aggregationMethod) {
      case 'SUM':
        newValue = values.reduce((sum, val) => sum + val, 0);
        break;
      case 'AVERAGE':
        newValue = values.reduce((sum, val) => sum + val, 0) / values.length;
        break;
      case 'MAX':
        newValue = Math.max(...values);
        break;
      case 'MIN':
        newValue = Math.min(...values);
        break;
      case 'LAST':
        newValue = values[values.length - 1];
        break;
    }

    this._progress = {
      ...this._progress,
      currentValue: newValue,
    };
    this._updatedAt = Date.now();
  }

  /**
   * 获取所有记录的值
   */
  public getRecordValues(): number[] {
    return this._records.map((record) => record.newValue);
  }

  // ===== DTO 转换 =====

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): KeyResultServerDTO {
    return {
      uuid: this.uuid,
      goalUuid: this._goalUuid,
      title: this._title,
      description: this._description,
      progress: this._progress,
      weight: this._weight,
      order: this._order,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      records: this._records.length > 0 ? this._records : null,
    };
  }

  public toClientDTO(): KeyResultClientDTO {
    const progressPercentage = this.calculatePercentage();
    const isCompleted = this.isCompleted();
    const unit = this._progress.unit ? ` ${this._progress.unit}` : '';
    const progressText = `${this._progress.currentValue}${unit} / ${this._progress.targetValue}${unit}`;

    let progressColor = 'gray';
    if (isCompleted) {
      progressColor = 'green';
    } else if (progressPercentage > 70) {
      progressColor = 'blue';
    } else if (progressPercentage > 30) {
      progressColor = 'yellow';
    }

    const valueTypeTextMap: Record<GoalContracts.KeyResultValueType, string> = {
      INCREMENTAL: '累计值',
      ABSOLUTE: '绝对值',
      PERCENTAGE: '百分比',
      BINARY: '二元',
    };

    const aggregationMethodTextMap: Record<GoalContracts.AggregationMethod, string> = {
      SUM: '求和',
      AVERAGE: '求平均',
      MAX: '求最大值',
      MIN: '求最小值',
      LAST: '取最后一次',
    };

    const progressClientDTO: KeyResultProgressClientDTO = {
      ...this._progress,
      progressPercentage,
      isCompleted,
      progressText,
      progressBarColor: progressColor,
      valueTypeText: valueTypeTextMap[this._progress.valueType],
      aggregationMethodText: aggregationMethodTextMap[this._progress.aggregationMethod],
    };

    const recordsClientDTO = this._records.map((recordDTO) => {
      return GoalRecord.fromServerDTO(recordDTO).toClientDTO();
    });

    const aggregationMethodText = aggregationMethodTextMap[this._progress.aggregationMethod];
    const calculationExplanation = `当前进度由 ${this._records.length} 条记录${aggregationMethodText}计算得出`;

    return {
      uuid: this.uuid,
      goalUuid: this._goalUuid,
      title: this._title,
      description: this._description,
      progress: progressClientDTO,
      weight: this._weight,
      order: this._order,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      records: recordsClientDTO.length > 0 ? recordsClientDTO : null,

      // UI calculated fields
      progressPercentage,
      progressText,
      progressColor,
      isCompleted,
      formattedCreatedAt: new Date(this._createdAt).toLocaleString(),
      formattedUpdatedAt: new Date(this._updatedAt).toLocaleString(),
      displayTitle: this._title.length > 50 ? this._title.substring(0, 47) + '...' : this._title,
      aggregationMethodText,
      calculationExplanation,
    };
  }

  /**
   * 转换为持久化 DTO
   */
  public toPersistenceDTO(): KeyResultPersistenceDTO {
    const progressPersistence: ProgressPersistence = {
      current_value: this._progress.currentValue,
      target_value: this._progress.targetValue,
      valueType: this._progress.valueType,
      aggregation_method: this._progress.aggregationMethod,
    };

    return {
      uuid: this.uuid,
      goalUuid: this._goalUuid,
      title: this._title,
      description: this._description,
      progress: JSON.stringify(progressPersistence),
      weight: this._weight,
      order: this._order,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
