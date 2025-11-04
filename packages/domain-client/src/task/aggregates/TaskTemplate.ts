/**
 * TaskTemplate 聚合根实现 (Client)
 * 任务模板 - 生成任务实例的模板
 */

import type { TaskContracts } from '@dailyuse/contracts';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';
import { AggregateRoot } from '@dailyuse/utils';
import {
  TaskTimeConfig,
  RecurrenceRule,
  TaskReminderConfig,
  TaskGoalBinding,
} from '../value-objects';
import { TaskTemplateHistory } from '../entities';
import { TaskInstance } from './TaskInstance';

type ITaskTemplate = TaskContracts.TaskTemplateClient;
type TaskTemplateDTO = TaskContracts.TaskTemplateClientDTO;
type TaskTemplateServerDTO = TaskContracts.TaskTemplateServerDTO;
type TaskType = TaskContracts.TaskType;
type TaskTemplateStatus = TaskContracts.TaskTemplateStatus;
type TimeType = TaskContracts.TimeType;

export class TaskTemplate extends AggregateRoot implements ITaskTemplate {
  private _accountUuid: string;
  private _title: string;
  private _description?: string | null;
  private _taskType: TaskType;
  private _timeConfig: TaskTimeConfig;
  private _recurrenceRule?: RecurrenceRule | null;
  private _reminderConfig?: TaskReminderConfig | null;
  private _importance: ImportanceLevel;
  private _urgency: UrgencyLevel;
  private _goalBinding?: TaskGoalBinding | null;
  private _folderUuid?: string | null;
  private _tags: string[];
  private _color?: string | null;
  private _status: TaskTemplateStatus;
  private _lastGeneratedDate?: number | null;
  private _generateAheadDays: number;
  private _createdAt: number;
  private _updatedAt: number;
  private _deletedAt?: number | null;

  // 子实体集合
  private _history: TaskTemplateHistory[];
  private _instances: TaskInstance[];

  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    title: string;
    description?: string | null;
    taskType: TaskType;
    timeConfig: TaskTimeConfig;
    recurrenceRule?: RecurrenceRule | null;
    reminderConfig?: TaskReminderConfig | null;
    importance: ImportanceLevel;
    urgency: UrgencyLevel;
    goalBinding?: TaskGoalBinding | null;
    folderUuid?: string | null;
    tags?: string[];
    color?: string | null;
    status: TaskTemplateStatus;
    lastGeneratedDate?: number | null;
    generateAheadDays?: number;
    createdAt: number;
    updatedAt: number;
    deletedAt?: number | null;
    history?: TaskTemplateHistory[];
    instances?: TaskInstance[];
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
    this._title = params.title;
    this._description = params.description;
    this._taskType = params.taskType;
    this._timeConfig = params.timeConfig;
    this._recurrenceRule = params.recurrenceRule;
    this._reminderConfig = params.reminderConfig;
    this._importance = params.importance;
    this._urgency = params.urgency;
    this._goalBinding = params.goalBinding;
    this._folderUuid = params.folderUuid;
    this._tags = params.tags ?? [];
    this._color = params.color;
    this._status = params.status;
    this._lastGeneratedDate = params.lastGeneratedDate;
    this._generateAheadDays = params.generateAheadDays ?? 7;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt;
    this._history = params.history ?? [];
    this._instances = params.instances ?? [];
  }

  // Getters - 基础属性
  public override get uuid(): string {
    return this._uuid;
  }
  public get accountUuid(): string {
    return this._accountUuid;
  }
  public get title(): string {
    return this._title;
  }
  public get description(): string | null | undefined {
    return this._description;
  }
  public get taskType(): TaskType {
    return this._taskType;
  }
  public get timeConfig(): TaskTimeConfig {
    return this._timeConfig;
  }
  public get recurrenceRule(): RecurrenceRule | null | undefined {
    return this._recurrenceRule;
  }
  public get reminderConfig(): TaskReminderConfig | null | undefined {
    return this._reminderConfig;
  }
  public get importance(): ImportanceLevel {
    return this._importance;
  }
  public get urgency(): UrgencyLevel {
    return this._urgency;
  }
  public get goalBinding(): TaskGoalBinding | null | undefined {
    return this._goalBinding;
  }
  public get folderUuid(): string | null | undefined {
    return this._folderUuid;
  }
  public get tags(): string[] {
    return [...this._tags];
  }
  public get color(): string | null | undefined {
    return this._color;
  }
  public get status(): TaskTemplateStatus {
    return this._status;
  }
  public get lastGeneratedDate(): number | null | undefined {
    return this._lastGeneratedDate;
  }
  public get generateAheadDays(): number {
    return this._generateAheadDays;
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number {
    return this._updatedAt;
  }
  public get deletedAt(): number | null | undefined {
    return this._deletedAt;
  }
  public get history(): TaskTemplateHistory[] {
    return [...this._history];
  }
  public get instances(): TaskInstance[] {
    return [...this._instances];
  }

  // UI 辅助属性
  public get displayTitle(): string {
    return this._title;
  }

  public get taskTypeText(): string {
    const map: Record<TaskType, string> = {
      ONE_TIME: '单次任务',
      RECURRING: '重复任务',
    };
    return map[this._taskType];
  }

  public get timeDisplayText(): string {
    return this._timeConfig.displayText;
  }

  public get recurrenceText(): string | null {
    if (!this._recurrenceRule) return null;
    return this._recurrenceRule.recurrenceDisplayText;
  }

  public get importanceText(): string {
    const map: Record<ImportanceLevel, string> = {
      [ImportanceLevel.Vital]: '极其重要',
      [ImportanceLevel.Important]: '非常重要',
      [ImportanceLevel.Moderate]: '中等重要',
      [ImportanceLevel.Minor]: '不太重要',
      [ImportanceLevel.Trivial]: '无关紧要',
    };
    return map[this._importance];
  }

  public get urgencyText(): string {
    const map: Record<UrgencyLevel, string> = {
      [UrgencyLevel.Critical]: '非常紧急',
      [UrgencyLevel.High]: '高度紧急',
      [UrgencyLevel.Medium]: '中等紧急',
      [UrgencyLevel.Low]: '低度紧急',
      [UrgencyLevel.None]: '无期限',
    };
    return map[this._urgency];
  }

  public get statusText(): string {
    const map: Record<TaskTemplateStatus, string> = {
      ACTIVE: '活跃',
      PAUSED: '暂停',
      ARCHIVED: '归档',
      DELETED: '已删除',
    };
    return map[this._status];
  }

  public get hasReminder(): boolean {
    return this._reminderConfig?.enabled ?? false;
  }

  public get reminderText(): string | null {
    if (!this.hasReminder || !this._reminderConfig) return null;
    return this._reminderConfig.reminderSummary;
  }

  public get isLinkedToGoal(): boolean {
    return this._goalBinding !== null && this._goalBinding !== undefined;
  }

  public get goalLinkText(): string | null {
    if (!this._goalBinding) return null;
    return this._goalBinding.displayText;
  }

  public get instanceCount(): number {
    return this._instances.length;
  }

  public get completedInstanceCount(): number {
    return this._instances.filter((i) => i.isCompleted).length;
  }

  public get pendingInstanceCount(): number {
    return this._instances.filter((i) => i.isPending).length;
  }

  public get completionRate(): number {
    if (this.instanceCount === 0) return 0;
    return Math.round((this.completedInstanceCount / this.instanceCount) * 100);
  }

  public get formattedCreatedAt(): string {
    return new Date(this._createdAt).toLocaleString('zh-CN');
  }

  public get formattedUpdatedAt(): string {
    return new Date(this._updatedAt).toLocaleString('zh-CN');
  }

  // 状态查询
  public get isActive(): boolean {
    return this._status === 'ACTIVE';
  }

  public get isPaused(): boolean {
    return this._status === 'PAUSED';
  }

  public get isArchived(): boolean {
    return this._status === 'ARCHIVED';
  }

  public get isDeleted(): boolean {
    return this._status === 'DELETED';
  }

  public isRecurring(): boolean {
    return this._taskType === 'RECURRING' && this._recurrenceRule !== null;
  }

  public isOneTime(): boolean {
    return this._taskType === 'ONE_TIME';
  }

  // 接口方法
  public getDisplayTitle(): string {
    return this.displayTitle;
  }

  public getStatusBadge(): { text: string; color: string } {
    return {
      text: this.statusText,
      color: this._status === 'ACTIVE' ? 'green' : this._status === 'PAUSED' ? 'orange' : 'gray',
    };
  }

  public getImportanceBadge(): { text: string; color: string } {
    const colors: Record<ImportanceLevel, string> = {
      [ImportanceLevel.Vital]: 'red',
      [ImportanceLevel.Important]: 'orange',
      [ImportanceLevel.Moderate]: 'blue',
      [ImportanceLevel.Minor]: 'gray',
      [ImportanceLevel.Trivial]: 'lightgray',
    };
    return {
      text: this.importanceText,
      color: colors[this._importance],
    };
  }

  public getUrgencyBadge(): { text: string; color: string } {
    const colors: Record<UrgencyLevel, string> = {
      [UrgencyLevel.Critical]: 'red',
      [UrgencyLevel.High]: 'orange',
      [UrgencyLevel.Medium]: 'blue',
      [UrgencyLevel.Low]: 'gray',
      [UrgencyLevel.None]: 'lightgray',
    };
    return {
      text: this.urgencyText,
      color: colors[this._urgency],
    };
  }

  public getTimeDisplay(): string {
    return this.timeDisplayText;
  }

  public getRecurrenceDisplay(): string {
    return this.recurrenceText ?? '';
  }

  public canEdit(): boolean {
    return this._status !== 'DELETED' && this._status !== 'ARCHIVED';
  }

  public canDelete(): boolean {
    return this._status !== 'DELETED';
  }

  public canPause(): boolean {
    return this._status === 'ACTIVE';
  }

  public canActivate(): boolean {
    return this._status === 'PAUSED';
  }

  public canArchive(): boolean {
    return this._status !== 'ARCHIVED' && this._status !== 'DELETED';
  }

  public createInstance(params: any): string {
    // 简单实现：返回空字符串，实际实现应该由业务层处理
    // 或者可以抛出"未实现"的错误
    throw new Error('createInstance should be implemented in domain layer');
  }

  public addInstance(instance: any): void {
    this._instances.push(instance);
  }

  public removeInstance(instanceUuid: string): any | null {
    const index = this._instances.findIndex((i) => i.uuid === instanceUuid);
    if (index === -1) return null;
    const [removed] = this._instances.splice(index, 1);
    return removed;
  }

  public getInstance(instanceUuid: string): any | null {
    return this._instances.find((i) => i.uuid === instanceUuid) ?? null;
  }

  public getAllInstances(): any[] {
    return [...this._instances];
  }

  // 子实体操作
  public getHistoryList(): TaskTemplateHistory[] {
    return [...this._history];
  }

  public getInstanceList(): TaskInstance[] {
    return [...this._instances];
  }

  public getPendingInstances(): TaskInstance[] {
    return this._instances.filter((i) => i.isPending);
  }

  public getCompletedInstances(): TaskInstance[] {
    return this._instances.filter((i) => i.isCompleted);
  }

  // 实体更新方法
  public updateTimeConfig(newConfig: TaskTimeConfig): void {
    if (!this.canEdit()) {
      throw new Error('Cannot update archived or deleted template');
    }
    this._timeConfig = newConfig;
    this._updatedAt = Date.now();
  }

  public updateTitle(title: string): void {
    if (!this.canEdit()) {
      throw new Error('Cannot update archived or deleted template');
    }
    if (!title.trim()) {
      throw new Error('Title cannot be empty');
    }
    this._title = title;
    this._updatedAt = Date.now();
  }

  public updateDescription(description: string | null): void {
    if (!this.canEdit()) {
      throw new Error('Cannot update archived or deleted template');
    }
    this._description = description;
    this._updatedAt = Date.now();
  }

  public updateImportance(importance: ImportanceLevel): void {
    if (!this.canEdit()) {
      throw new Error('Cannot update archived or deleted template');
    }
    this._importance = importance;
    this._updatedAt = Date.now();
  }

  public updateUrgency(urgency: UrgencyLevel): void {
    if (!this.canEdit()) {
      throw new Error('Cannot update archived or deleted template');
    }
    this._urgency = urgency;
    this._updatedAt = Date.now();
  }

  public updateTags(tags: string[]): void {
    if (!this.canEdit()) {
      throw new Error('Cannot update archived or deleted template');
    }
    this._tags = [...tags];
    this._updatedAt = Date.now();
  }

  public updateColor(color: string | null): void {
    if (!this.canEdit()) {
      throw new Error('Cannot update archived or deleted template');
    }
    this._color = color;
    this._updatedAt = Date.now();
  }

  public updateFolderUuid(folderUuid: string | null): void {
    if (!this.canEdit()) {
      throw new Error('Cannot update archived or deleted template');
    }
    this._folderUuid = folderUuid;
    this._updatedAt = Date.now();
  }

  public updateRecurrenceRule(rule: RecurrenceRule | null): void {
    if (!this.canEdit()) {
      throw new Error('Cannot update archived or deleted template');
    }
    this._recurrenceRule = rule;
    this._updatedAt = Date.now();
  }

  public updateReminderConfig(config: TaskReminderConfig | null): void {
    if (!this.canEdit()) {
      throw new Error('Cannot update archived or deleted template');
    }
    this._reminderConfig = config;
    this._updatedAt = Date.now();
  }

  public updateGoalBinding(binding: TaskGoalBinding | null): void {
    if (!this.canEdit()) {
      throw new Error('Cannot update archived or deleted template');
    }
    this._goalBinding = binding;
    this._updatedAt = Date.now();
  }

  public updateGenerateAheadDays(days: number): void {
    if (!this.canEdit()) {
      throw new Error('Cannot update archived or deleted template');
    }
    if (days < 0) {
      throw new Error('Generate ahead days must be non-negative');
    }
    this._generateAheadDays = days;
    this._updatedAt = Date.now();
  }

  // DTO 转换
  public toClientDTO(): TaskTemplateDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      title: this._title,
      description: this._description,
      taskType: this._taskType,
      timeConfig: this._timeConfig.toClientDTO(),
      recurrenceRule: this._recurrenceRule?.toClientDTO() ?? null,
      reminderConfig: this._reminderConfig?.toClientDTO() ?? null,
      importance: this._importance,
      urgency: this._urgency,
      goalBinding: this._goalBinding?.toClientDTO() ?? null,
      folderUuid: this._folderUuid,
      tags: [...this._tags],
      color: this._color,
      status: this._status,
      lastGeneratedDate: this._lastGeneratedDate,
      generateAheadDays: this._generateAheadDays,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
      history: this._history.map((h) => h.toClientDTO()),
      instances: this._instances.map((i) => i.toClientDTO()),
      displayTitle: this.displayTitle,
      taskTypeText: this.taskTypeText,
      timeDisplayText: this.timeDisplayText,
      recurrenceText: this.recurrenceText,
      importanceText: this.importanceText,
      urgencyText: this.urgencyText,
      statusText: this.statusText,
      hasReminder: this.hasReminder,
      reminderText: this.reminderText,
      isLinkedToGoal: this.isLinkedToGoal,
      goalLinkText: this.goalLinkText,
      instanceCount: this.instanceCount,
      completedInstanceCount: this.completedInstanceCount,
      pendingInstanceCount: this.pendingInstanceCount,
      completionRate: this.completionRate,
      formattedCreatedAt: this.formattedCreatedAt,
      formattedUpdatedAt: this.formattedUpdatedAt,
    };
  }

  public toServerDTO(): TaskTemplateServerDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      title: this._title,
      description: this._description,
      taskType: this._taskType,
      timeConfig: this._timeConfig.toServerDTO(),
      recurrenceRule: this._recurrenceRule?.toServerDTO() ?? null,
      reminderConfig: this._reminderConfig?.toServerDTO() ?? null,
      importance: this._importance,
      urgency: this._urgency,
      goalBinding: this._goalBinding?.toServerDTO() ?? null,
      folderUuid: this._folderUuid,
      tags: [...this._tags],
      color: this._color,
      status: this._status,
      lastGeneratedDate: this._lastGeneratedDate,
      generateAheadDays: this._generateAheadDays,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
      history: this._history.map((h) => h.toServerDTO()),
      instances: this._instances.map((i) => i.toServerDTO()),
    };
  }

  // 静态工厂方法
  public static fromClientDTO(dto: TaskTemplateDTO): TaskTemplate {
    return new TaskTemplate({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      title: dto.title,
      description: dto.description,
      taskType: dto.taskType,
      timeConfig: TaskTimeConfig.fromClientDTO(dto.timeConfig),
      recurrenceRule: dto.recurrenceRule
        ? RecurrenceRule.fromClientDTO(dto.recurrenceRule)
        : null,
      reminderConfig: dto.reminderConfig
        ? TaskReminderConfig.fromClientDTO(dto.reminderConfig)
        : null,
      importance: dto.importance,
      urgency: dto.urgency,
      goalBinding: dto.goalBinding ? TaskGoalBinding.fromClientDTO(dto.goalBinding) : null,
      folderUuid: dto.folderUuid,
      tags: dto.tags,
      color: dto.color,
      status: dto.status,
      lastGeneratedDate: dto.lastGeneratedDate,
      generateAheadDays: dto.generateAheadDays ?? undefined,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
      history: dto.history?.map((h: any) => TaskTemplateHistory.fromClientDTO(h)) ?? [],
      instances: dto.instances?.map((i: any) => TaskInstance.fromClientDTO(i)) ?? [],
    });
  }

  public static fromServerDTO(dto: TaskTemplateServerDTO): TaskTemplate {
    // 对于 timeConfig，如果为 null/undefined，创建默认配置（全天无时间范围）
    const TaskContracts = require('@dailyuse/contracts').TaskContracts;
    const defaultTimeConfig: TaskTimeConfig = dto.timeConfig
      ? TaskTimeConfig.fromServerDTO(dto.timeConfig)
      : TaskTimeConfig.fromServerDTO({
          timeType: TaskContracts.TimeType.ALL_DAY,
          startDate: null,
          endDate: null,
          timePoint: null,
          timeRange: null,
        });

    return new TaskTemplate({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      title: dto.title,
      description: dto.description,
      taskType: dto.taskType,
      timeConfig: defaultTimeConfig,
      recurrenceRule: dto.recurrenceRule
        ? RecurrenceRule.fromServerDTO(dto.recurrenceRule)
        : null,
      reminderConfig: dto.reminderConfig
        ? TaskReminderConfig.fromServerDTO(dto.reminderConfig)
        : null,
      importance: dto.importance,
      urgency: dto.urgency,
      goalBinding: dto.goalBinding ? TaskGoalBinding.fromServerDTO(dto.goalBinding) : null,
      folderUuid: dto.folderUuid,
      tags: dto.tags,
      color: dto.color,
      status: dto.status,
      lastGeneratedDate: dto.lastGeneratedDate ?? undefined,
      generateAheadDays: dto.generateAheadDays ?? undefined,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt ?? undefined,
      history: dto.history?.map((h: any) => TaskTemplateHistory.fromServerDTO(h)) ?? [],
      instances: dto.instances?.map((i: any) => TaskInstance.fromServerDTO(i)) ?? [],
    });
  }

  public static forCreate(accountUuid: string): TaskTemplate {
    const now = Date.now();

    return new TaskTemplate({
      accountUuid,
      title: '',
      taskType: 'ONE_TIME' as TaskType,
      timeConfig: TaskTimeConfig.fromClientDTO({
        timeType: 'ALL_DAY' as TimeType,
        startDate: null,
        endDate: null,
        timePoint: null,
        timeRange: null,
        timeTypeText: '全天',
        formattedStartDate: '',
        formattedEndDate: '',
        formattedTimePoint: '',
        formattedTimeRange: '',
        displayText: '全天',
        hasDateRange: false,
      }),
      importance: ImportanceLevel.Moderate,
      urgency: UrgencyLevel.Medium,
      tags: [],
      status: 'ACTIVE' as TaskTemplateStatus,
      generateAheadDays: 7,
      createdAt: now,
      updatedAt: now,
      history: [],
      instances: [],
    });
  }

  public static create(params: any): TaskTemplate {
    const now = Date.now();

    const defaultTimeConfig = TaskTimeConfig.fromClientDTO({
      timeType: 'ALL_DAY' as TimeType,
      startDate: null,
      endDate: null,
      timePoint: null,
      timeRange: null,
      timeTypeText: '全天',
      formattedStartDate: '',
      formattedEndDate: '',
      formattedTimePoint: '',
      formattedTimeRange: '',
      displayText: '全天',
      hasDateRange: false,
    });

    return new TaskTemplate({
      accountUuid: params.accountUuid,
      title: params.title || '',
      description: params.description,
      taskType: params.taskType || ('ONE_TIME' as TaskType),
      timeConfig: params.timeConfig || defaultTimeConfig,
      recurrenceRule: params.recurrenceRule,
      reminderConfig: params.reminderConfig,
      importance: params.importance || ImportanceLevel.Moderate,
      urgency: params.urgency || UrgencyLevel.Medium,
      goalBinding: params.goalBinding,
      folderUuid: params.folderUuid,
      tags: params.tags || [],
      color: params.color,
      status: params.status || ('ACTIVE' as TaskTemplateStatus),
      lastGeneratedDate: params.lastGeneratedDate,
      generateAheadDays: params.generateAheadDays || 7,
      createdAt: params.createdAt || now,
      updatedAt: params.updatedAt || now,
      deletedAt: params.deletedAt,
      history: params.history || [],
      instances: params.instances || [],
    });
  }

  public clone(): TaskTemplate {
    return TaskTemplate.fromClientDTO(this.toClientDTO());
  }
}
