/**
 * TaskInstance 聚合根实现 (Client)
 * 任务实例 - 从模板生成的具体任务
 */

import type { TaskContracts } from '@dailyuse/contracts';
import { AggregateRoot } from '@dailyuse/utils';
import { TaskTimeConfigClient } from '../value-objects/TaskTimeConfigClient';
import { CompletionRecordClient } from '../value-objects/CompletionRecordClient';
import { SkipRecordClient } from '../value-objects/SkipRecordClient';

type ITaskInstance = TaskContracts.TaskInstance;
type TaskInstanceDTO = TaskContracts.TaskInstanceDTO;
type TaskInstanceServerDTO = TaskContracts.TaskInstanceServerDTO;
type TaskInstanceStatus = TaskContracts.TaskInstanceStatus;

export class TaskInstance extends AggregateRoot implements ITaskInstance {
  private _templateUuid: string;
  private _accountUuid: string;
  private _instanceDate: number;
  private _timeConfig: TaskTimeConfigClient;
  private _status: TaskInstanceStatus;
  private _completionRecord?: CompletionRecordClient | null;
  private _skipRecord?: SkipRecordClient | null;
  private _actualStartTime?: number | null;
  private _actualEndTime?: number | null;
  private _note?: string | null;
  private _createdAt: number;
  private _updatedAt: number;

  private constructor(params: {
    uuid?: string;
    templateUuid: string;
    accountUuid: string;
    instanceDate: number;
    timeConfig: TaskTimeConfigClient;
    status: TaskInstanceStatus;
    completionRecord?: CompletionRecordClient | null;
    skipRecord?: SkipRecordClient | null;
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
    this._completionRecord = params.completionRecord;
    this._skipRecord = params.skipRecord;
    this._actualStartTime = params.actualStartTime;
    this._actualEndTime = params.actualEndTime;
    this._note = params.note;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // Getters
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
  public get timeConfig(): TaskTimeConfigClient {
    return this._timeConfig;
  }
  public get status(): TaskInstanceStatus {
    return this._status;
  }
  public get completionRecord(): CompletionRecordClient | null | undefined {
    return this._completionRecord;
  }
  public get skipRecord(): SkipRecordClient | null | undefined {
    return this._skipRecord;
  }
  public get actualStartTime(): number | null | undefined {
    return this._actualStartTime;
  }
  public get actualEndTime(): number | null | undefined {
    return this._actualEndTime;
  }
  public get note(): string | null | undefined {
    return this._note;
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number {
    return this._updatedAt;
  }

  // UI 辅助属性
  public get instanceDateFormatted(): string {
    return new Date(this._instanceDate).toLocaleDateString('zh-CN');
  }

  public get statusText(): string {
    const map: Record<TaskInstanceStatus, string> = {
      PENDING: '待处理',
      IN_PROGRESS: '进行中',
      COMPLETED: '已完成',
      SKIPPED: '已跳过',
      EXPIRED: '已过期',
    };
    return map[this._status];
  }

  public get statusColor(): string {
    const map: Record<TaskInstanceStatus, string> = {
      PENDING: '#3b82f6',
      IN_PROGRESS: '#f59e0b',
      COMPLETED: '#10b981',
      SKIPPED: '#6b7280',
      EXPIRED: '#ef4444',
    };
    return map[this._status];
  }

  public get isCompleted(): boolean {
    return this._status === 'COMPLETED';
  }

  public get isSkipped(): boolean {
    return this._status === 'SKIPPED';
  }

  public get isPending(): boolean {
    return this._status === 'PENDING';
  }

  public get isExpired(): boolean {
    return this._status === 'EXPIRED';
  }

  public get hasNote(): boolean {
    return !!this._note && this._note.trim().length > 0;
  }

  public get actualDuration(): number | null {
    if (!this._actualStartTime || !this._actualEndTime) return null;
    return this._actualEndTime - this._actualStartTime;
  }

  public get durationText(): string | null {
    const duration = this.actualDuration;
    if (!duration) return null;

    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor((duration % 3600000) / 60000);
    if (hours > 0) {
      return `${hours}小时${minutes > 0 ? `${minutes}分钟` : ''}`;
    }
    return `${minutes}分钟`;
  }

  public get formattedCreatedAt(): string {
    return new Date(this._createdAt).toLocaleString('zh-CN');
  }

  public get formattedUpdatedAt(): string {
    return new Date(this._updatedAt).toLocaleString('zh-CN');
  }

  // 业务方法
  public getStatusBadge(): { text: string; color: string } {
    return {
      text: this.statusText,
      color: this.statusColor,
    };
  }

  public getStatusIcon(): string {
    const iconMap: Record<TaskInstanceStatus, string> = {
      PENDING: '⏳',
      IN_PROGRESS: '▶️',
      COMPLETED: '✅',
      SKIPPED: '⏭️',
      EXPIRED: '❌',
    };
    return iconMap[this._status];
  }

  public canStart(): boolean {
    return this._status === 'PENDING';
  }

  public canComplete(): boolean {
    return this._status === 'IN_PROGRESS' || this._status === 'PENDING';
  }

  public canSkip(): boolean {
    return this._status === 'PENDING' || this._status === 'IN_PROGRESS';
  }

  // DTO 转换
  public toClientDTO(): TaskInstanceDTO {
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
      instanceDateFormatted: this.instanceDateFormatted,
      statusText: this.statusText,
      statusColor: this.statusColor,
      isCompleted: this.isCompleted,
      isSkipped: this.isSkipped,
      isPending: this.isPending,
      isExpired: this.isExpired,
      hasNote: this.hasNote,
      actualDuration: this.actualDuration,
      durationText: this.durationText,
      formattedCreatedAt: this.formattedCreatedAt,
      formattedUpdatedAt: this.formattedUpdatedAt,
    };
  }

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

  // 静态工厂方法
  public static fromClientDTO(dto: TaskInstanceDTO): TaskInstance {
    return new TaskInstance({
      uuid: dto.uuid,
      templateUuid: dto.templateUuid,
      accountUuid: dto.accountUuid,
      instanceDate: dto.instanceDate,
      timeConfig: TaskTimeConfigClient.fromClientDTO(dto.timeConfig),
      status: dto.status,
      completionRecord: dto.completionRecord
        ? CompletionRecordClient.fromClientDTO(dto.completionRecord)
        : null,
      skipRecord: dto.skipRecord ? SkipRecordClient.fromClientDTO(dto.skipRecord) : null,
      actualStartTime: dto.actualStartTime,
      actualEndTime: dto.actualEndTime,
      note: dto.note,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  public static fromServerDTO(dto: TaskInstanceServerDTO): TaskInstance {
    return new TaskInstance({
      uuid: dto.uuid,
      templateUuid: dto.templateUuid,
      accountUuid: dto.accountUuid,
      instanceDate: dto.instanceDate,
      timeConfig: TaskTimeConfigClient.fromServerDTO(dto.timeConfig),
      status: dto.status,
      completionRecord: dto.completionRecord
        ? CompletionRecordClient.fromServerDTO(dto.completionRecord)
        : null,
      skipRecord: dto.skipRecord ? SkipRecordClient.fromServerDTO(dto.skipRecord) : null,
      actualStartTime: dto.actualStartTime,
      actualEndTime: dto.actualEndTime,
      note: dto.note,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  public clone(): TaskInstance {
    return TaskInstance.fromClientDTO(this.toClientDTO());
  }
}
