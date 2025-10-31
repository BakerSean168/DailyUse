/**
 * Goal 聚合根实现
 * 实现 GoalServer 接口
 *
 * DDD 聚合根职责：
 * - 管理聚合内的所有实体（KeyResult、GoalReview）
 * - 执行目标相关的业务逻辑
 * - 确保聚合内的一致性
 * - 是事务边界
 */

import { AggregateRoot } from '@dailyuse/utils';
import { GoalContracts } from '@dailyuse/contracts';
import { KeyResult } from '../entities/KeyResult';
import { GoalReview } from '../entities/GoalReview';
import { GoalReminderConfig, KeyResultWeightSnapshot, KeyResultNotFoundInGoalError } from '../value-objects';

// 类型别名（从命名空间导入）
type IGoalServer = GoalContracts.GoalServer;
type GoalServerDTO = GoalContracts.GoalServerDTO;
type GoalPersistenceDTO = GoalContracts.GoalPersistenceDTO;
type GoalStatus = GoalContracts.GoalStatus;
type ReviewType = GoalContracts.ReviewType;
type KeyResultServerDTO = GoalContracts.KeyResultServerDTO;
type GoalReviewServerDTO = GoalContracts.GoalReviewServerDTO;
type GoalReminderConfigServerDTO = GoalContracts.GoalReminderConfigServerDTO;
type GoalReminderConfigPersistenceDTO = GoalContracts.GoalReminderConfigPersistenceDTO;
type KeyResultProgressServerDTO = GoalContracts.KeyResultProgressServerDTO;
type KeyResultSnapshotServerDTO = GoalContracts.KeyResultSnapshotServerDTO;
type GoalCreatedEvent = GoalContracts.GoalCreatedEvent;
type GoalUpdatedEvent = GoalContracts.GoalUpdatedEvent;
type GoalStatusChangedEvent = GoalContracts.GoalStatusChangedEvent;
type GoalCompletedEvent = GoalContracts.GoalCompletedEvent;
type GoalArchivedEvent = GoalContracts.GoalArchivedEvent;
type GoalDeletedEvent = GoalContracts.GoalDeletedEvent;
type KeyResultAddedEvent = GoalContracts.KeyResultAddedEvent;
type KeyResultUpdatedEvent = GoalContracts.KeyResultUpdatedEvent;
type GoalReviewAddedEvent = GoalContracts.GoalReviewAddedEvent;
type ImportanceLevel = GoalContracts.ImportanceLevel;
type UrgencyLevel = GoalContracts.UrgencyLevel;

// 枚举值别名
const GoalStatusEnum = GoalContracts.GoalStatus;
const ImportanceLevelEnum = GoalContracts.ImportanceLevel;
const UrgencyLevelEnum = GoalContracts.UrgencyLevel;
/**
 * Goal 聚合根
 */
export class Goal extends AggregateRoot implements IGoalServer {
  // ===== 私有字段 =====
  private _accountUuid: string;
  private _title: string;
  private _description: string | null;
  private _color: string | null; // 主题色
  private _feasibilityAnalysis: string | null; // 可行性分析
  private _motivation: string | null; // 实现动机
  private _status: GoalStatus;
  private _importance: ImportanceLevel;
  private _urgency: UrgencyLevel;
  private _category: string | null;
  private _tags: string[];
  private _startDate: number | null;
  private _targetDate: number | null;
  private _completedAt: number | null;
  private _archivedAt: number | null;
  private _folderUuid: string | null;
  private _parentGoalUuid: string | null;
  private _sortOrder: number;
  private _reminderConfig: GoalReminderConfig | null;
  private _createdAt: number;
  private _updatedAt: number;
  private _deletedAt: number | null;

  // ===== 子实体集合 =====
  private _keyResults: KeyResult[];
  private _reviews: GoalReview[];
  private _weightSnapshots: KeyResultWeightSnapshot[];

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    title: string;
    description?: string | null;
    color?: string | null;
    feasibilityAnalysis?: string | null;
    motivation?: string | null;
    status: GoalStatus;
    importance: ImportanceLevel;
    urgency: UrgencyLevel;
    category?: string | null;
    tags: string[];
    startDate?: number | null;
    targetDate?: number | null;
    completedAt?: number | null;
    archivedAt?: number | null;
    folderUuid?: string | null;
    parentGoalUuid?: string | null;
    sortOrder: number;
    reminderConfig?: GoalReminderConfig | null;
    createdAt: number;
    updatedAt: number;
    deletedAt?: number | null;
  }) {
    super(params.uuid ?? AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
    this._title = params.title;
    this._description = params.description ?? null;
    this._color = params.color ?? null;
    this._feasibilityAnalysis = params.feasibilityAnalysis ?? null;
    this._motivation = params.motivation ?? null;
    this._status = params.status;
    this._importance = params.importance;
    this._urgency = params.urgency;
    this._category = params.category ?? null;
    this._tags = params.tags;
    this._startDate = params.startDate ?? null;
    this._targetDate = params.targetDate ?? null;
    this._completedAt = params.completedAt ?? null;
    this._archivedAt = params.archivedAt ?? null;
    this._folderUuid = params.folderUuid ?? null;
    this._parentGoalUuid = params.parentGoalUuid ?? null;
    this._sortOrder = params.sortOrder;
    this._reminderConfig = params.reminderConfig ?? null;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt ?? null;
    this._keyResults = [];
    this._reviews = [];
    this._weightSnapshots = [];
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get accountUuid(): string {
    return this._accountUuid;
  }
  public get title(): string {
    return this._title;
  }
  public get description(): string | null {
    return this._description;
  }
  public get color(): string | null {
    return this._color;
  }
  public get feasibilityAnalysis(): string | null {
    return this._feasibilityAnalysis;
  }
  public get motivation(): string | null {
    return this._motivation;
  }
  public get status(): GoalStatus {
    return this._status;
  }
  public get importance(): ImportanceLevel {
    return this._importance;
  }
  public get urgency(): UrgencyLevel {
    return this._urgency;
  }
  public get category(): string | null {
    return this._category;
  }
  public get tags(): string[] {
    return [...this._tags];
  }
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
  public get folderUuid(): string | null {
    return this._folderUuid;
  }
  public get parentGoalUuid(): string | null {
    return this._parentGoalUuid;
  }
  public get sortOrder(): number {
    return this._sortOrder;
  }
  public get reminderConfig(): GoalReminderConfig | null {
    return this._reminderConfig;
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number {
    return this._updatedAt;
  }
  public get deletedAt(): number | null {
    return this._deletedAt;
  }
  public get keyResults(): KeyResult[] {
    return [...this._keyResults];
  }
  public get reviews(): GoalReview[] {
    return [...this._reviews];
  }
  public get weightSnapshots(): ReadonlyArray<KeyResultWeightSnapshot> {
    return this._weightSnapshots;
  }

  // ===== 工厂方法 =====

  /**
   * 创建新的 Goal 聚合根
   */
  public static create(params: {
    accountUuid: string;
    title: string;
    description?: string;
    color?: string;
    feasibilityAnalysis?: string;
    motivation?: string;
    importance?: ImportanceLevel;
    urgency?: UrgencyLevel;
    category?: string;
    tags?: string[];
    startDate?: number;
    targetDate?: number;
    folderUuid?: string;
    parentGoalUuid?: string;
    reminderConfig?: GoalReminderConfig;
  }): Goal {
    // 验证
    if (!params.accountUuid) {
      throw new Error('Account UUID is required');
    }
    if (!params.title || params.title.trim().length === 0) {
      throw new Error('Title is required');
    }

    const now = Date.now();
    const goal = new Goal({
      accountUuid: params.accountUuid,
      title: params.title.trim(),
      description: params.description?.trim() || null,
      color: params.color?.trim() || null,
      feasibilityAnalysis: params.feasibilityAnalysis?.trim() || null,
      motivation: params.motivation?.trim() || null,
      status: 'ACTIVE' as GoalStatus,
      importance: params.importance ?? ('MEDIUM' as ImportanceLevel),
      urgency: params.urgency ?? ('MEDIUM' as UrgencyLevel),
      category: params.category?.trim() || null,
      tags: params.tags ?? [],
      startDate: params.startDate ?? null,
      targetDate: params.targetDate ?? null,
      folderUuid: params.folderUuid ?? null,
      parentGoalUuid: params.parentGoalUuid ?? null,
      sortOrder: 0,
      reminderConfig: params.reminderConfig ?? null,
      createdAt: now,
      updatedAt: now,
    });

    // 触发领域事件
    goal.addDomainEvent({
      eventType: 'goal.created',
      aggregateId: goal.uuid,
      occurredOn: new Date(now),
      accountUuid: params.accountUuid,
      payload: {
        goal: goal.toServerDTO(),
        accountUuid: params.accountUuid,
        folderUuid: params.folderUuid ?? null,
      },
    });

    return goal;
  }

  /**
   * 从 Server DTO 重建聚合根
   */
  public static fromServerDTO(dto: GoalServerDTO): Goal {
    const goal = new Goal({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      title: dto.title,
      description: dto.description ?? null,
      status: dto.status,
      importance: dto.importance,
      urgency: dto.urgency,
      category: dto.category ?? null,
      tags: dto.tags,
      startDate: dto.startDate ?? null,
      targetDate: dto.targetDate ?? null,
      completedAt: dto.completedAt ?? null,
      archivedAt: dto.archivedAt ?? null,
      folderUuid: dto.folderUuid ?? null,
      parentGoalUuid: dto.parentGoalUuid ?? null,
      sortOrder: dto.sortOrder,
      reminderConfig: dto.reminderConfig ? GoalReminderConfig.fromServerDTO(dto.reminderConfig) : null,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt ?? null,
    });

    // 重建子实体
    if (dto.keyResults) {
      goal._keyResults = dto.keyResults.map((kr: KeyResultServerDTO) =>
        KeyResult.fromServerDTO(kr),
      );
    }
    if (dto.reviews) {
      goal._reviews = dto.reviews.map((r: GoalReviewServerDTO) => GoalReview.fromServerDTO(r));
    }

    return goal;
  }

  /**
   * 从持久化 DTO 重建聚合根
   */
  public static fromPersistenceDTO(dto: GoalPersistenceDTO): Goal {
    const tags = JSON.parse(dto.tags) as string[];
    const reminderConfig = dto.reminderConfig
      ? GoalReminderConfig.fromPersistenceDTO(JSON.parse(dto.reminderConfig) as GoalReminderConfigPersistenceDTO)
      : null;

    return new Goal({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      title: dto.title,
      description: dto.description ?? null,
      color: dto.color ?? null,
      feasibilityAnalysis: dto.feasibilityAnalysis ?? null,
      motivation: dto.motivation ?? null,
      status: dto.status,
      importance: dto.importance,
      urgency: dto.urgency,
      category: dto.category ?? null,
      tags,
      startDate: dto.startDate ?? null,
      targetDate: dto.targetDate ?? null,
      completedAt: dto.completedAt ?? null,
      archivedAt: dto.archivedAt ?? null,
      folderUuid: dto.folderUuid ?? null,
      parentGoalUuid: dto.parentGoalUuid ?? null,
      sortOrder: dto.sortOrder,
      reminderConfig,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt ?? null,
    });
  }

  // ===== 业务方法 =====

  /**
   * 更新基本信息
   */
  public updateBasicInfo(params: {
    title?: string;
    description?: string;
    importance?: ImportanceLevel;
    urgency?: UrgencyLevel;
    category?: string;
    color?: string;
    feasibilityAnalysis?: string;
    motivation?: string;
  }): void {
    const previousData: Partial<GoalServerDTO> = {};
    const changes: string[] = [];

    if (params.title !== undefined && params.title !== this._title) {
      const trimmed = params.title.trim();
      if (trimmed.length === 0) {
        throw new Error('Title cannot be empty');
      }
      previousData.title = this._title;
      this._title = trimmed;
      changes.push('title');
    }

    if (params.description !== undefined && params.description !== this._description) {
      previousData.description = this._description;
      this._description = params.description.trim() || null;
      changes.push('description');
    }

    if (params.importance !== undefined && params.importance !== this._importance) {
      previousData.importance = this._importance;
      this._importance = params.importance;
      changes.push('importance');
    }

    if (params.urgency !== undefined && params.urgency !== this._urgency) {
      previousData.urgency = this._urgency;
      this._urgency = params.urgency;
      changes.push('urgency');
    }

    if (params.category !== undefined && params.category !== this._category) {
      previousData.category = this._category;
      this._category = params.category.trim() || null;
      changes.push('category');
    }

    if (params.color !== undefined && params.color !== this._color) {
      previousData.color = this._color;
      this._color = params.color.trim() || null;
      changes.push('color');
    }

    if (
      params.feasibilityAnalysis !== undefined &&
      params.feasibilityAnalysis !== this._feasibilityAnalysis
    ) {
      previousData.feasibilityAnalysis = this._feasibilityAnalysis;
      this._feasibilityAnalysis = params.feasibilityAnalysis.trim() || null;
      changes.push('feasibilityAnalysis');
    }

    if (params.motivation !== undefined && params.motivation !== this._motivation) {
      previousData.motivation = this._motivation;
      this._motivation = params.motivation.trim() || null;
      changes.push('motivation');
    }

    if (changes.length > 0) {
      this._updatedAt = Date.now();
      this.addDomainEvent({
        eventType: 'goal.updated',
        aggregateId: this.uuid,
        occurredOn: new Date(this._updatedAt),
        accountUuid: this._accountUuid,
        payload: {
          goal: this.toServerDTO(),
          previousData,
          changes,
        },
      });
    }
  }

  /**
   * 更新时间范围
   */
  public updateTimeRange(params: { startDate?: number | null; targetDate?: number | null }): void {
    if (params.startDate !== undefined) {
      this._startDate = params.startDate;
    }
    if (params.targetDate !== undefined) {
      this._targetDate = params.targetDate;
    }
    this._updatedAt = Date.now();
  }

  /**
   * 更新标签
   */
  public updateTags(tags: string[]): void {
    this._tags = tags;
    this._updatedAt = Date.now();
  }

  /**
   * 添加标签
   */
  public addTag(tag: string): void {
    const trimmed = tag.trim();
    if (trimmed && !this._tags.includes(trimmed)) {
      this._tags.push(trimmed);
      this._updatedAt = Date.now();
    }
  }

  /**
   * 删除标签
   */
  public removeTag(tag: string): void {
    const index = this._tags.indexOf(tag);
    if (index !== -1) {
      this._tags.splice(index, 1);
      this._updatedAt = Date.now();
    }
  }

  /**
   * 更新状态
   */
  public updateStatus(newStatus: GoalStatus): void {
    if (newStatus === this._status) return;

    const previousStatus = this._status;
    this._status = newStatus;
    this._updatedAt = Date.now();

    // 如果标记为完成，记录完成时间
    if (newStatus === 'COMPLETED' && !this._completedAt) {
      this._completedAt = this._updatedAt;
    }

    // 触发状态变更事件
    this.addDomainEvent({
      eventType: 'goal.status_changed',
      aggregateId: this.uuid,
      occurredOn: new Date(this._updatedAt),
      accountUuid: this._accountUuid,
      payload: {
        goalUuid: this.uuid,
        previousStatus,
        newStatus,
        changedAt: this._updatedAt,
      },
    });
  }

  /**
   * 激活目标
   */
  public activate(): void {
    this._status = GoalStatusEnum.ACTIVE;
    this._updatedAt = Date.now();
  }

  /**
   * 完成目标
   */
  public complete(): void {
    this.markAsCompleted();
  }

  /**
   * 标记为完成
   */
  public markAsCompleted(): void {
    if (this._status === GoalStatusEnum.COMPLETED) return;

    this._status = GoalStatusEnum.COMPLETED;
    this._completedAt = Date.now();
    this._updatedAt = this._completedAt;

    this.addDomainEvent({
      eventType: 'goal.completed',
      aggregateId: this.uuid,
      occurredOn: new Date(this._completedAt),
      accountUuid: this._accountUuid,
      payload: {
        goalUuid: this.uuid,
        completedAt: this._completedAt,
        finalProgress: this.calculateProgress(),
      },
    });
  }

  /**
   * 归档目标
   */
  public archive(): void {
    if (this._archivedAt) return;

    this._status = GoalStatusEnum.ARCHIVED; // 更新状态
    this._archivedAt = Date.now();
    this._updatedAt = this._archivedAt;

    this.addDomainEvent({
      eventType: 'goal.archived',
      aggregateId: this.uuid,
      occurredOn: new Date(this._archivedAt),
      accountUuid: this._accountUuid,
      payload: {
        goalUuid: this.uuid,
        archivedAt: this._archivedAt,
      },
    });
  }

  /**
   * 软删除
   */
  public softDelete(): void {
    if (this._deletedAt) return;

    this._deletedAt = Date.now();
    this._updatedAt = this._deletedAt;

    this.addDomainEvent({
      eventType: 'goal.deleted',
      aggregateId: this.uuid,
      occurredOn: new Date(this._deletedAt),
      accountUuid: this._accountUuid,
      payload: {
        goalUuid: this.uuid,
        deletedAt: this._deletedAt,
        softDelete: true,
      },
    });
  }

  /**
   * 恢复目标
   */
  public restore(): void {
    this._deletedAt = null;
    this._updatedAt = Date.now();
  }

  /**
   * 移动到文件夹
   */
  public moveToFolder(folderUuid: string | null): void {
    this._folderUuid = folderUuid;
    this._updatedAt = Date.now();
  }

  /**
   * 更新排序
   */
  public updateSortOrder(sortOrder: number): void {
    this._sortOrder = sortOrder;
    this._updatedAt = Date.now();
  }

  /**
   * 更新提醒配置
   */
  public updateReminderConfig(config: GoalReminderConfig): void {
    this._reminderConfig = config;
    this._updatedAt = Date.now();
  }

  /**
   * 启用提醒
   */
  public enableReminder(): void {
    if (this._reminderConfig) {
      this._reminderConfig = this._reminderConfig.enable();
      this._updatedAt = Date.now();
    }
  }

  /**
   * 禁用提醒
   */
  public disableReminder(): void {
    if (this._reminderConfig) {
      this._reminderConfig = this._reminderConfig.disable();
      this._updatedAt = Date.now();
    }
  }

  /**
   * 添加提醒触发器
   */
  public addReminderTrigger(trigger: GoalContracts.ReminderTrigger): void {
    if (!this._reminderConfig) {
      throw new Error('Reminder config not initialized');
    }
    this._reminderConfig = this._reminderConfig.addTrigger(trigger);
    this._updatedAt = Date.now();
  }

  /**
   * 移除提醒触发器
   */
  public removeReminderTrigger(type: GoalContracts.ReminderTriggerType, value: number): void {
    if (!this._reminderConfig) {
      throw new Error('Reminder config not initialized');
    }
    this._reminderConfig = this._reminderConfig.removeTrigger(type, value);
    this._updatedAt = Date.now();
  }

  // ===== 关键结果管理 =====

  /**
   * 创建关键结果（工厂方法）
   */
  public createKeyResult(params: {
    title: string;
    description?: string;
    valueType: string;
    targetValue: number;
    currentValue?: number;
    unit?: string;
    weight: number;
  }): KeyResult {
    const keyResult = KeyResult.create({
      goalUuid: this.uuid,
      title: params.title,
      description: params.description,
      progress: {
        currentValue: params.currentValue ?? 0,
        targetValue: params.targetValue,
        valueType: params.valueType as any,
        aggregationMethod: 'LAST' as any,
        unit: params.unit,
      },
      order: this._keyResults.length,
    });
    return keyResult;
  }

  /**
   * 添加关键结果
   */
  public addKeyResult(keyResult: KeyResult): void {
    this._keyResults.push(keyResult);
    this._updatedAt = Date.now();

    // 自动重新计算进度
    const newProgress = this.calculateProgress();

    this.addDomainEvent({
      eventType: 'goal.key_result_added',
      aggregateId: this.uuid,
      occurredOn: new Date(this._updatedAt),
      accountUuid: this._accountUuid,
      payload: {
        goalUuid: this.uuid,
        keyResult: keyResult.toServerDTO(),
        newGoalProgress: newProgress,
      },
    });
  }

  /**
   * 更新关键结果
   */
  public updateKeyResult(keyResultUuid: string, updates: Partial<KeyResult>): void {
    const keyResult = this._keyResults.find((kr) => kr.uuid === keyResultUuid);
    if (!keyResult) {
      throw new Error(`KeyResult ${keyResultUuid} not found`);
    }

    if (updates.title) keyResult.updateTitle(updates.title);
    if (updates.description !== undefined) {
      keyResult.updateDescription(updates.description || '');
    }

    this._updatedAt = Date.now();

    // 自动重新计算进度
    const newProgress = this.calculateProgress();

    this.addDomainEvent({
      eventType: 'goal.key_result_updated',
      aggregateId: this.uuid,
      occurredOn: new Date(this._updatedAt),
      accountUuid: this._accountUuid,
      payload: {
        goalUuid: this.uuid,
        keyResult: keyResult.toServerDTO(),
        changes: Object.keys(updates),
        newGoalProgress: newProgress,
      },
    });
  }

  /**
   * 重新排序关键结果
   */
  public reorderKeyResults(keyResultUuids: string[]): void {
    const newOrder: KeyResult[] = [];
    for (let i = 0; i < keyResultUuids.length; i++) {
      const kr = this._keyResults.find((k) => k.uuid === keyResultUuids[i]);
      if (kr) {
        kr.updateOrder(i);
        newOrder.push(kr);
      }
    }
    // 添加未在列表中的关键结果
    for (const kr of this._keyResults) {
      if (!newOrder.includes(kr)) {
        newOrder.push(kr);
      }
    }
    this._keyResults = newOrder;
    this._updatedAt = Date.now();
  }

  /**
   * 通过 UUID 获取关键结果
   */
  public getKeyResult(uuid: string): KeyResult | null {
    return this._keyResults.find((kr) => kr.uuid === uuid) || null;
  }

  /**
   * 获取所有关键结果
   */
  public getAllKeyResults(): KeyResult[] {
    return [...this._keyResults];
  }

  /**
   * 更新关键结果进度
   */
  public updateKeyResultProgress(
    keyResultUuid: string,
    newValue: number,
    note?: string,
  ): KeyResultServerDTO {
    const keyResult = this._keyResults.find((kr) => kr.uuid === keyResultUuid);
    if (!keyResult) {
      throw new Error(`KeyResult ${keyResultUuid} not found`);
    }

    const oldProgress = this.calculateProgress();
    keyResult.updateProgress(newValue, note);
    this._updatedAt = Date.now();

    // 自动重新计算进度
    const newProgress = this.calculateProgress();

    // 如果进度发生变化，触发进度更新事件
    if (oldProgress !== newProgress) {
      this.addDomainEvent({
        eventType: 'goal.progress_updated',
        aggregateId: this.uuid,
        occurredOn: new Date(this._updatedAt),
        accountUuid: this._accountUuid,
        payload: {
          goalUuid: this.uuid,
          oldProgress,
          newProgress,
          trigger: 'kr_progress_update',
          keyResultUuid,
        },
      });
    }

    return keyResult.toServerDTO();
  }

  /**
   * 删除关键结果
   */
  public removeKeyResult(keyResultUuid: string): KeyResult | null {
    const index = this._keyResults.findIndex((kr) => kr.uuid === keyResultUuid);
    if (index !== -1) {
      const removed = this._keyResults.splice(index, 1)[0];
      this._updatedAt = Date.now();
      
      // 自动重新计算进度
      const newProgress = this.calculateProgress();
      
      this.addDomainEvent({
        eventType: 'goal.key_result_removed',
        aggregateId: this.uuid,
        occurredOn: new Date(this._updatedAt),
        accountUuid: this._accountUuid,
        payload: {
          goalUuid: this.uuid,
          keyResultUuid,
          newGoalProgress: newProgress,
        },
      });
      
      return removed;
    }
    return null;
  }

  /**
   * 计算总进度（基于所有关键结果的加权平均）
   * 
   * 公式：Progress = Σ(KR.progress × KR.weight) / Σ(KR.weight)
   * 
   * @returns 目标进度百分比（0-100）
   */
  public calculateProgress(): number {
    if (this._keyResults.length === 0) return 0;

    // 计算总权重
    const totalWeight = this._keyResults.reduce((sum, kr) => sum + kr.weight, 0);
    
    // 如果总权重为 0，使用简单平均
    if (totalWeight === 0) {
      const totalPercentage = this._keyResults.reduce((sum, kr) => sum + kr.calculatePercentage(), 0);
      return Math.round((totalPercentage / this._keyResults.length) * 100) / 100;
    }

    // 加权平均计算
    const weightedSum = this._keyResults.reduce(
      (sum, kr) => sum + (kr.calculatePercentage() * kr.weight),
      0
    );

    const progress = (weightedSum / totalWeight);
    
    // 四舍五入到小数点后 2 位
    return Math.round(progress * 100) / 100;
  }

  /**
   * 获取进度分解详情
   * 
   * 返回目标进度的详细计算信息，包括每个关键结果的贡献度
   * 
   * @returns 进度分解详情对象
   */
  public getProgressBreakdown(): GoalContracts.ProgressBreakdown {
    const totalWeight = this._keyResults.reduce((sum, kr) => sum + kr.weight, 0);
    const totalProgress = this.calculateProgress();
    
    return {
      totalProgress,
      calculationMode: 'weighted_average' as const,
      krContributions: this._keyResults.map(kr => {
        const krProgress = kr.calculatePercentage();
        const contribution = totalWeight > 0 
          ? Math.round((krProgress * kr.weight / totalWeight) * 100) / 100
          : Math.round((krProgress / this._keyResults.length) * 100) / 100;
        
        return {
          keyResultUuid: kr.uuid,
          keyResultName: kr.title,
          progress: krProgress,
          weight: kr.weight,
          contribution,
        };
      }),
      lastUpdateTime: this._updatedAt,
      updateTrigger: '自动计算',
    };
  }

  /**
   * 检查是否所有关键结果都已完成
   */
  public areAllKeyResultsCompleted(): boolean {
    if (this._keyResults.length === 0) return false;
    return this._keyResults.every((kr) => kr.isCompleted());
  }

  // ===== 权重快照管理 =====

  /**
   * 记录 KR 权重变更快照
   *
   * @param krUuid - KeyResult UUID
   * @param oldWeight - 调整前权重
   * @param newWeight - 调整后权重
   * @param trigger - 触发方式
   * @param operatorUuid - 操作人 UUID
   * @param reason - 调整原因（可选）
   * @throws {KeyResultNotFoundInGoalError} 如果 KR 不存在于该 Goal 中
   */
  public recordWeightSnapshot(
    krUuid: string,
    oldWeight: number,
    newWeight: number,
    trigger: GoalContracts.SnapshotTrigger,
    operatorUuid: string,
    reason?: string,
  ): void {
    // 验证 KR 存在
    const kr = this._keyResults.find((k) => k.uuid === krUuid);
    if (!kr) {
      throw new KeyResultNotFoundInGoalError(krUuid, this.uuid);
    }

    // 创建快照
    const snapshot = new KeyResultWeightSnapshot(
      AggregateRoot.generateUUID(),
      this.uuid,
      krUuid,
      oldWeight,
      newWeight,
      Date.now(),
      trigger,
      operatorUuid,
      reason,
    );

    // 添加到快照数组
    this._weightSnapshots.push(snapshot);
    this._updatedAt = Date.now();
  }

  /**
   * 获取所有权重快照
   */
  public getAllWeightSnapshots(): ReadonlyArray<KeyResultWeightSnapshot> {
    return this._weightSnapshots;
  }

  /**
   * 获取特定 KR 的权重快照
   */
  public getWeightSnapshotsByKeyResult(krUuid: string): ReadonlyArray<KeyResultWeightSnapshot> {
    return this._weightSnapshots.filter((snapshot) => snapshot.keyResultUuid === krUuid);
  }

  // ===== 回顾管理 =====

  /**
   * 创建回顾（工厂方法）
   */
  public createReview(params: {
    title: string;
    content: string;
    reviewType: string;
    rating?: number;
    achievements?: string;
    challenges?: string;
    nextActions?: string;
  }): GoalReview {
    // 创建关键结果快照
    const keyResultSnapshots: KeyResultSnapshotServerDTO[] = this._keyResults.map((kr) => ({
      keyResultUuid: kr.uuid,
      title: kr.title,
      targetValue: kr.progress.targetValue,
      currentValue: kr.progress.currentValue,
      progressPercentage: kr.calculatePercentage(),
    }));

    const review = GoalReview.create({
      goalUuid: this.uuid,
      type: params.reviewType as any,
      rating: params.rating || 3,
      summary: params.content,
      achievements: params.achievements,
      challenges: params.challenges,
      improvements: params.nextActions,
      keyResultSnapshots,
    });

    return review;
  }

  /**
   * 添加回顾
   */
  public addReview(review: GoalReview): void {
    this._reviews.push(review);
    this._updatedAt = Date.now();

    this.addDomainEvent({
      eventType: 'goal.review_added',
      aggregateId: this.uuid,
      occurredOn: new Date(this._updatedAt),
      accountUuid: this._accountUuid,
      payload: {
        goalUuid: this.uuid,
        review: review.toServerDTO(),
      },
    });
  }

  /**
   * 获取所有回顾记录
   */
  public getReviews(): GoalReview[] {
    return [...this._reviews];
  }

  /**
   * 获取最新的回顾记录
   */
  public getLatestReview(): GoalReview | null {
    if (this._reviews.length === 0) return null;
    return this._reviews[this._reviews.length - 1];
  }

  /**
   * 更新回顾
   */
  public updateReview(
    reviewUuid: string,
    params: {
      rating?: number;
      summary?: string;
      achievements?: string;
      challenges?: string;
      improvements?: string;
    },
  ): void {
    const review = this._reviews.find((r) => r.uuid === reviewUuid);
    if (!review) {
      throw new Error(`Review ${reviewUuid} not found`);
    }

    if (params.rating !== undefined) review.updateRating(params.rating);
    if (params.summary) review.updateSummary(params.summary);
    if (params.achievements) review.addAchievement(params.achievements);
    if (params.challenges) review.addChallenge(params.challenges);
    if (params.improvements) review.addImprovement(params.improvements);

    this._updatedAt = Date.now();
  }

  /**
   * 删除回顾
   */
  public removeReview(reviewUuid: string): GoalReview | null {
    const index = this._reviews.findIndex((r) => r.uuid === reviewUuid);
    if (index !== -1) {
      const removed = this._reviews.splice(index, 1)[0];
      this._updatedAt = Date.now();
      return removed;
    }
    return null;
  }

  // ===== 业务规则检查 =====

  /**
   * 是否已过期
   */
  public isOverdue(): boolean {
    if (!this._targetDate || this._status === 'COMPLETED') return false;
    return Date.now() > this._targetDate;
  }

  /**
   * 是否为高优先级（高重要性 + 高紧急性）
   */
  public isHighPriority(): boolean {
    return this._importance === ImportanceLevelEnum.Important && this._urgency === UrgencyLevelEnum.High;
  }

  /**
   * 获取剩余天数
   */
  public getRemainingDays(): number | null {
    if (!this._targetDate) return null;
    const diff = this._targetDate - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * 获取剩余天数（接口要求的方法名）
   */
  public getDaysRemaining(): number | null {
    return this.getRemainingDays();
  }

  /**
   * 获取优先级得分
   */
  public getPriorityScore(): number {
    // 根据重要性和紧急性计算优先级得分
    const importanceScores = {
      [ImportanceLevelEnum.Vital]: 5,
      [ImportanceLevelEnum.Important]: 4,
      [ImportanceLevelEnum.Moderate]: 3,
      [ImportanceLevelEnum.Minor]: 2,
      [ImportanceLevelEnum.Trivial]: 1,
    };

    const urgencyScores = {
      [UrgencyLevelEnum.Critical]: 5,
      [UrgencyLevelEnum.High]: 4,
      [UrgencyLevelEnum.Medium]: 3,
      [UrgencyLevelEnum.Low]: 2,
      [UrgencyLevelEnum.None]: 1,
    };

    const importanceScore = importanceScores[this._importance] || 0;
    const urgencyScore = urgencyScores[this._urgency] || 0;

    // 优先级得分 = 重要性得分 * 2 + 紧急性得分
    return importanceScore * 2 + urgencyScore;
  }

  // ===== DTO 转换 =====

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(includeChildren: boolean = false): GoalContracts.GoalClientDTO {
    const progress = this.calculateProgress();
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      title: this._title,
      description: this._description,
      status: this._status,
      importance: this._importance,
      urgency: this._urgency,
      category: this._category,
      tags: [...this._tags],
      startDate: this._startDate,
      targetDate: this._targetDate,
      completedAt: this._completedAt,
      archivedAt: this._archivedAt,
      folderUuid: this._folderUuid,
      parentGoalUuid: this._parentGoalUuid,
      sortOrder: this._sortOrder,
      reminderConfig: this._reminderConfig?.toClientDTO() ?? null,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
      keyResults:
        includeChildren && this._keyResults.length > 0
          ? this._keyResults.map((kr) => kr.toClientDTO())
          : [],
      reviews:
        includeChildren && this._reviews.length > 0
          ? this._reviews.map((r) => r.toClientDTO())
          : [],
      overallProgress: progress,
      isCompleted: this._status === GoalStatusEnum.COMPLETED,
      isArchived: !!this._archivedAt,
      isDeleted: !!this._deletedAt,
      isOverdue: this.isOverdue(),
      daysRemaining: this.getDaysRemaining(),
      priorityScore: this.getPriorityScore(),
      keyResultCount: this._keyResults.length,
      completedKeyResultCount: this._keyResults.filter((kr) => kr.isCompleted()).length,
      reviewCount: this._reviews.length,
      // Add missing properties
      statusText: this._status, // Placeholder
      importanceText: this._importance, // Placeholder
      urgencyText: this._urgency, // Placeholder
      hasActiveReminders: !!this._reminderConfig?.enabled,
      reminderSummary: null, // Placeholder
    };
  }

  /**
   * 转换为 Server DTO
   * @param includeChildren 是否包含子实体（默认 false）
   */
  public toServerDTO(includeChildren: boolean = false): GoalServerDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      title: this._title,
      description: this._description,
      color: this._color,
      feasibilityAnalysis: this._feasibilityAnalysis,
      motivation: this._motivation,
      status: this._status,
      importance: this._importance,
      urgency: this._urgency,
      category: this._category,
      tags: [...this._tags],
      startDate: this._startDate,
      targetDate: this._targetDate,
      completedAt: this._completedAt,
      archivedAt: this._archivedAt,
      folderUuid: this._folderUuid,
      parentGoalUuid: this._parentGoalUuid,
      sortOrder: this._sortOrder,
      reminderConfig: this._reminderConfig?.toServerDTO() ?? null,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
      keyResults:
        includeChildren && this._keyResults.length > 0
          ? this._keyResults.map((kr) => kr.toServerDTO())
          : [],
      reviews:
        includeChildren && this._reviews.length > 0
          ? this._reviews.map((r) => r.toServerDTO())
          : [],
    };
  }

  /**
   * 转换为持久化 DTO
   */
  public toPersistenceDTO(): GoalPersistenceDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      title: this._title,
      description: this._description,
      color: this._color,
      feasibilityAnalysis: this._feasibilityAnalysis,
      motivation: this._motivation,
      status: this._status,
      importance: this._importance,
      urgency: this._urgency,
      category: this._category,
      tags: JSON.stringify(this._tags),
      startDate: this._startDate,
      targetDate: this._targetDate,
      completedAt: this._completedAt,
      archivedAt: this._archivedAt,
      folderUuid: this._folderUuid,
      parentGoalUuid: this._parentGoalUuid,
      sortOrder: this._sortOrder,
      reminderConfig: this._reminderConfig ? JSON.stringify(this._reminderConfig.toPersistenceDTO()) : null,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }
}
