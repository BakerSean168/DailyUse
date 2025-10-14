/**
 * TaskInstance 聚合根实现 (Server)
 * 任务实例 - 聚合根
 */

import type { TaskContracts } from '@dailyuse/contracts';
import { AggregateRoot } from '@dailyuse/utils';
import { TaskTimeConfig, CompletionRecord, SkipRecord } from '../value-objects';

type ITaskInstance = TaskContracts.TaskInstanceServer;
type TaskInstanceServerDTO = TaskContracts.TaskInstanceServerDTO;
type TaskInstanceClientDTO = TaskContracts.TaskInstanceClientDTO;
type TaskInstancePersistenceDTO = TaskContracts.TaskInstancePersistenceDTO;
type TaskInstanceStatus = TaskContracts.TaskInstanceStatus;

/**
 * TaskInstance 聚合根
 *
 * DDD 聚合根职责：
 * - 管理任务实例的生命周期
 * - 执行状态转换业务逻辑
 * - 确保业务规则一致性
 * - 是事务边界
 */
export class TaskInstance extends AggregateRoot implements ITaskInstance {
  // ===== 私有字段 =====
  private _templateUuid: string;
  private _accountUuid: string;
  private _instanceDate: number;
  private _timeConfig: TaskTimeConfig;
  private _status: TaskInstanceStatus;
  private _completionRecord: CompletionRecord | null;
  private _skipRecord: SkipRecord | null;
  private _actualStartTime: number | null;
  private _actualEndTime: number | null;
  private _note: string | null;
  private _createdAt: number;
  private _updatedAt: number;

  // ===== 构造函数（私有，通过工厂方法创建） =====
  private constructor(params: {
    uuid?: string;
    templateUuid: string;
    accountUuid: string;
    instanceDate: number;
    timeConfig: TaskTimeConfig;
    status: TaskInstanceStatus;
    completionRecord?: CompletionRecord | null;
    skipRecord?: SkipRecord | null;
    actualStartTime?: number | null;
    actualEndTime?: number | null;
    note?: string | null;
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    this._templateUuid = params.templateUuid;
    this._accountUuid = params.accountUuid;
    this._instanceDate = params.instanceDate;
    this._timeConfig = params.timeConfig;
    this._status = params.status;
    this._completionRecord = params.completionRecord ?? null;
    this._skipRecord = params.skipRecord ?? null;
    this._actualStartTime = params.actualStartTime ?? null;
    this._actualEndTime = params.actualEndTime ?? null;
    this._note = params.note ?? null;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }

  public get templateUuid(): string {
    return this._templateUuid;
  }

  public get accountUuid(): string {
    return this._accountUuid;
  }

  public get instanceDate(): number {
    return this._instanceDate;
  }

  public get timeConfig(): TaskTimeConfig {
    return this._timeConfig;
  }

  public get status(): TaskInstanceStatus {
    return this._status;
  }

  public get completionRecord(): CompletionRecord | null {
    return this._completionRecord;
  }

  public get skipRecord(): SkipRecord | null {
    return this._skipRecord;
  }

  public get actualStartTime(): number | null {
    return this._actualStartTime;
  }

  public get actualEndTime(): number | null {
    return this._actualEndTime;
  }

  public get note(): string | null {
    return this._note;
  }

  public get createdAt(): number {
    return this._createdAt;
  }

  public get updatedAt(): number {
    return this._updatedAt;
  }

  // ===== 业务方法 =====

  /**
   * 开始任务
   */
  public start(): void {
    if (!this.canStart()) {
      throw new Error('Cannot start task in current state');
    }

    this._status = 'IN_PROGRESS' as TaskInstanceStatus;
    this._actualStartTime = Date.now();
    this._updatedAt = Date.now();
  }

  /**
   * 完成任务
   */
  public complete(actualDuration?: number, note?: string, rating?: number): void {
    if (!this.canComplete()) {
      throw new Error('Cannot complete task in current state');
    }

    const now = Date.now();
    this._status = 'COMPLETED' as TaskInstanceStatus;
    this._actualEndTime = now;

    // 创建完成记录
    this._completionRecord = new CompletionRecord({
      completedAt: now,
      actualDuration:
        actualDuration ?? (this._actualStartTime ? now - this._actualStartTime : null),
      note: note ?? null,
      rating: rating ?? null,
    });

    if (note) {
      this._note = note;
    }

    this._updatedAt = now;
  }

  /**
   * 跳过任务
   */
  public skip(reason?: string): void {
    if (!this.canSkip()) {
      throw new Error('Cannot skip task in current state');
    }

    const now = Date.now();
    this._status = 'SKIPPED' as TaskInstanceStatus;

    // 创建跳过记录
    this._skipRecord = new SkipRecord({
      skippedAt: now,
      reason: reason ?? null,
    });

    if (reason) {
      this._note = reason;
    }

    this._updatedAt = now;
  }

  /**
   * 标记为过期
   */
  public markExpired(): void {
    if (this._status === 'PENDING' || this._status === 'IN_PROGRESS') {
      this._status = 'EXPIRED' as TaskInstanceStatus;
      this._updatedAt = Date.now();
    }
  }

  /**
   * 业务判断方法
   */
  public canStart(): boolean {
    return this._status === 'PENDING';
  }

  public canComplete(): boolean {
    return this._status === 'PENDING' || this._status === 'IN_PROGRESS';
  }

  public canSkip(): boolean {
    return this._status === 'PENDING' || this._status === 'IN_PROGRESS';
  }

  public isOverdue(): boolean {
    if (this._status !== 'PENDING' && this._status !== 'IN_PROGRESS') {
      return false;
    }

    const now = Date.now();
    // 检查是否超过实例日期
    return now > this._instanceDate + 86400000; // 超过1天视为过期
  }

  // ===== DTO 转换 =====

  public toServerDTO(): TaskInstanceServerDTO {
    return {
      uuid: this.uuid,
      templateUuid: this._templateUuid,
      accountUuid: this._accountUuid,
      instanceDate: this._instanceDate,
      timeConfig: this._timeConfig.toServerDTO(),
      status: this._status,
      completionRecord: this._completionRecord?.toServerDTO() ?? null,
      skipRecord: this._skipRecord?.toServerDTO() ?? null,
      actualStartTime: this._actualStartTime,
      actualEndTime: this._actualEndTime,
      note: this._note,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  public toClientDTO(): TaskInstanceClientDTO {
    const instanceDateFormatted = new Date(this._instanceDate).toLocaleDateString('zh-CN');
    const statusText = this.getStatusText();
    const statusColor = this.getStatusColor();
    const actualDuration =
      this._actualStartTime && this._actualEndTime
        ? this._actualEndTime - this._actualStartTime
        : null;
    const durationText = actualDuration ? this.formatDuration(actualDuration) : null;

    return {
      uuid: this.uuid,
      templateUuid: this._templateUuid,
      accountUuid: this._accountUuid,
      instanceDate: this._instanceDate,
      timeConfig: this._timeConfig.toClientDTO(),
      status: this._status,
      completionRecord: this._completionRecord?.toClientDTO() ?? null,
      skipRecord: this._skipRecord?.toClientDTO() ?? null,
      actualStartTime: this._actualStartTime,
      actualEndTime: this._actualEndTime,
      note: this._note,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      instanceDateFormatted,
      statusText,
      statusColor,
      isCompleted: this._status === 'COMPLETED',
      isSkipped: this._status === 'SKIPPED',
      isPending: this._status === 'PENDING',
      isExpired: this._status === 'EXPIRED',
      hasNote: this._note !== null,
      actualDuration,
      durationText,
      formattedCreatedAt: new Date(this._createdAt).toLocaleString('zh-CN'),
      formattedUpdatedAt: new Date(this._updatedAt).toLocaleString('zh-CN'),
    };
  }

  public toPersistenceDTO(): TaskInstancePersistenceDTO {
    return {
      uuid: this.uuid,
      template_uuid: this._templateUuid,
      account_uuid: this._accountUuid,
      instance_date: this._instanceDate,
      time_config: JSON.stringify(this._timeConfig.toPersistenceDTO()),
      status: this._status,
      completion_record: this._completionRecord
        ? JSON.stringify(this._completionRecord.toPersistenceDTO())
        : null,
      skip_record: this._skipRecord ? JSON.stringify(this._skipRecord.toPersistenceDTO()) : null,
      actual_start_time: this._actualStartTime,
      actual_end_time: this._actualEndTime,
      note: this._note,
      created_at: this._createdAt,
      updated_at: this._updatedAt,
    };
  }

  // ===== 工厂方法 =====

  /**
   * 创建新的任务实例
   */
  public static create(params: {
    templateUuid: string;
    accountUuid: string;
    instanceDate: number;
    timeConfig: TaskTimeConfig;
  }): TaskInstance {
    const now = Date.now();
    return new TaskInstance({
      templateUuid: params.templateUuid,
      accountUuid: params.accountUuid,
      instanceDate: params.instanceDate,
      timeConfig: params.timeConfig,
      status: 'PENDING' as TaskInstanceStatus,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 从 ServerDTO 恢复
   */
  public static fromServerDTO(dto: TaskInstanceServerDTO): TaskInstance {
    return new TaskInstance({
      uuid: dto.uuid,
      templateUuid: dto.templateUuid,
      accountUuid: dto.accountUuid,
      instanceDate: dto.instanceDate,
      timeConfig: TaskTimeConfig.fromServerDTO(dto.timeConfig),
      status: dto.status,
      completionRecord: dto.completionRecord
        ? CompletionRecord.fromServerDTO(dto.completionRecord)
        : null,
      skipRecord: dto.skipRecord ? SkipRecord.fromServerDTO(dto.skipRecord) : null,
      actualStartTime: dto.actualStartTime,
      actualEndTime: dto.actualEndTime,
      note: dto.note,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  /**
   * 从 PersistenceDTO 恢复
   */
  public static fromPersistenceDTO(dto: TaskInstancePersistenceDTO): TaskInstance {
    return new TaskInstance({
      uuid: dto.uuid,
      templateUuid: dto.template_uuid,
      accountUuid: dto.account_uuid,
      instanceDate: dto.instance_date,
      timeConfig: TaskTimeConfig.fromPersistenceDTO(JSON.parse(dto.time_config)),
      status: dto.status as TaskInstanceStatus,
      completionRecord: dto.completion_record
        ? CompletionRecord.fromPersistenceDTO(JSON.parse(dto.completion_record))
        : null,
      skipRecord: dto.skip_record
        ? SkipRecord.fromPersistenceDTO(JSON.parse(dto.skip_record))
        : null,
      actualStartTime: dto.actual_start_time,
      actualEndTime: dto.actual_end_time,
      note: dto.note,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
    });
  }

  // ===== 辅助方法 =====

  private getStatusText(): string {
    const statusMap: Record<TaskInstanceStatus, string> = {
      PENDING: '待完成',
      IN_PROGRESS: '进行中',
      COMPLETED: '已完成',
      SKIPPED: '已跳过',
      EXPIRED: '已过期',
    };
    return statusMap[this._status];
  }

  private getStatusColor(): string {
    const colorMap: Record<TaskInstanceStatus, string> = {
      PENDING: 'blue',
      IN_PROGRESS: 'orange',
      COMPLETED: 'green',
      SKIPPED: 'gray',
      EXPIRED: 'red',
    };
    return colorMap[this._status];
  }

  private formatDuration(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);

    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  }
}
