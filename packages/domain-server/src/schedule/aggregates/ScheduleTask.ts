/**
 * ScheduleTask 聚合根实现
 * 任务调度聚合根
 *
 * DDD 聚合根职责：
 * - 管理任务生命周期
 * - 管理执行记录子实体
 * - 执行业务逻辑
 * - 确保聚合内的一致性
 */

import { AggregateRoot } from '@dailyuse/utils';
import {
  ScheduleContracts,
  ScheduleTaskStatus,
  ExecutionStatus,
  SourceModule,
} from '@dailyuse/contracts';
import { ScheduleConfig } from '../value-objects/ScheduleConfig';
import { ExecutionInfo } from '../value-objects/ExecutionInfo';
import { RetryPolicy } from '../value-objects/RetryPolicy';
import { TaskMetadata } from '../value-objects/TaskMetadata';
import { ScheduleExecution } from '../entities/ScheduleExecution';

// 使用 Contracts 中的 DTO 类型
type IScheduleTaskServer = ScheduleContracts.ScheduleTaskServer;
type ScheduleTaskServerDTO = ScheduleContracts.ScheduleTaskServerDTO;
type ScheduleTaskPersistenceDTO = ScheduleContracts.ScheduleTaskPersistenceDTO;

interface ScheduleTaskDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  description: string | null;
  sourceModule: SourceModule;
  sourceEntityId: string;
  status: ScheduleTaskStatus;
  enabled: boolean;
  schedule: any;
  execution: any;
  retryPolicy: any;
  metadata: any;
  createdAt: number;
  updatedAt: number;
  executions?: any[];
}

/**
 * ScheduleTask 聚合根
 */
export class ScheduleTask extends AggregateRoot {
  // ===== 私有字段 =====
  private _accountUuid: string;
  private _name: string;
  private _description: string | null;
  private _sourceModule: SourceModule;
  private _sourceEntityId: string;
  private _status: ScheduleTaskStatus;
  private _enabled: boolean;
  private _schedule: ScheduleConfig;
  private _execution: ExecutionInfo;
  private _retryPolicy: RetryPolicy;
  private _metadata: TaskMetadata;
  private _createdAt: number;
  private _updatedAt: number;

  // ===== 子实体集合 =====
  private _executions: ScheduleExecution[];

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    name: string;
    description?: string | null;
    sourceModule: SourceModule;
    sourceEntityId: string;
    status: ScheduleTaskStatus;
    enabled: boolean;
    schedule: ScheduleConfig;
    execution: ExecutionInfo;
    retryPolicy: RetryPolicy;
    metadata: TaskMetadata;
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
    this._name = params.name;
    this._description = params.description ?? null;
    this._sourceModule = params.sourceModule;
    this._sourceEntityId = params.sourceEntityId;
    this._status = params.status;
    this._enabled = params.enabled;
    this._schedule = params.schedule;
    this._execution = params.execution;
    this._retryPolicy = params.retryPolicy;
    this._metadata = params.metadata;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._executions = [];
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get accountUuid(): string {
    return this._accountUuid;
  }
  public get name(): string {
    return this._name;
  }
  public get description(): string | null {
    return this._description;
  }
  public get sourceModule(): SourceModule {
    return this._sourceModule;
  }
  public get sourceEntityId(): string {
    return this._sourceEntityId;
  }
  public get status(): ScheduleTaskStatus {
    return this._status;
  }
  public get enabled(): boolean {
    return this._enabled;
  }
  public get schedule(): any {
    return this._schedule.toDTO();
  }
  public get execution(): any {
    return this._execution.toDTO();
  }
  public get retryPolicy(): any {
    return this._retryPolicy.toDTO();
  }
  public get metadata(): any {
    return this._metadata.toDTO();
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number {
    return this._updatedAt;
  }
  public get executions(): ScheduleExecution[] | null {
    return this._executions.length > 0 ? [...this._executions] : null;
  }

  // ===== 工厂方法（创建子实体） =====

  /**
   * 创建执行记录
   */
  public createExecution(params: {
    executionTime: number;
    status?: ExecutionStatus;
  }): ScheduleExecution {
    const execution = ScheduleExecution.create({
      taskUuid: this._uuid,
      executionTime: params.executionTime,
      status: params.status,
    });
    return execution;
  }

  // ===== 子实体管理方法 =====

  /**
   * 添加执行记录
   */
  public addExecution(execution: ScheduleExecution): void {
    this._executions.push(execution);
  }

  /**
   * 获取执行记录
   */
  public getExecution(uuid: string): ScheduleExecution | null {
    return this._executions.find((e) => e.uuid === uuid) ?? null;
  }

  /**
   * 获取所有执行记录
   */
  public getAllExecutions(): ScheduleExecution[] {
    return [...this._executions];
  }

  /**
   * 获取最近的执行记录
   */
  public getRecentExecutions(limit: number): ScheduleExecution[] {
    return this._executions.sort((a, b) => b.executionTime - a.executionTime).slice(0, limit);
  }

  /**
   * 获取失败的执行记录
   */
  public getFailedExecutions(): ScheduleExecution[] {
    return this._executions.filter((e) => e.isFailed() || e.isTimeout());
  }

  // ===== 生命周期管理 =====

  /**
   * 暂停任务
   */
  public pause(reason?: string): void {
    if (
      this._status === ScheduleTaskStatus.COMPLETED ||
      this._status === ScheduleTaskStatus.CANCELLED
    ) {
      throw new Error('Cannot pause a completed or cancelled task');
    }
    this._status = ScheduleTaskStatus.PAUSED;
    this._updatedAt = Date.now();

    // 发布事件
    this.addDomainEvent({
      eventType: 'ScheduleTaskPaused',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        taskUuid: this._uuid,
        sourceModule: this._sourceModule,
        sourceEntityId: this._sourceEntityId,
        reason,
      },
    });
  }

  /**
   * 恢复任务
   */
  public resume(): void {
    if (this._status !== ScheduleTaskStatus.PAUSED) {
      throw new Error('Can only resume a paused task');
    }
    this._status = ScheduleTaskStatus.ACTIVE;
    this._updatedAt = Date.now();

    // 重新计算下次执行时间
    const nextRunAt = this._schedule.calculateNextRun();
    this._execution = this._execution.with({ nextRunAt });

    // 发布事件
    this.addDomainEvent({
      eventType: 'ScheduleTaskResumed',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        taskUuid: this._uuid,
        sourceModule: this._sourceModule,
        sourceEntityId: this._sourceEntityId,
        nextRunAt: nextRunAt ?? 0,
      },
    });
  }

  /**
   * 完成任务
   */
  public complete(): void {
    this._status = ScheduleTaskStatus.COMPLETED;
    this._updatedAt = Date.now();

    // 发布事件
    this.addDomainEvent({
      eventType: 'ScheduleTaskCompleted',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        taskUuid: this._uuid,
        sourceModule: this._sourceModule,
        sourceEntityId: this._sourceEntityId,
        totalExecutions: this._execution.toDTO().executionCount,
      },
    });
  }

  /**
   * 取消任务
   */
  public cancel(reason: string): void {
    if (this._status === ScheduleTaskStatus.COMPLETED) {
      throw new Error('Cannot cancel a completed task');
    }
    this._status = ScheduleTaskStatus.CANCELLED;
    this._updatedAt = Date.now();

    // 发布事件
    this.addDomainEvent({
      eventType: 'ScheduleTaskCancelled',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        taskUuid: this._uuid,
        sourceModule: this._sourceModule,
        sourceEntityId: this._sourceEntityId,
        reason,
      },
    });
  }

  /**
   * 标记失败
   */
  public fail(error: string): void {
    this._status = ScheduleTaskStatus.FAILED;
    this._updatedAt = Date.now();

    // 发布事件
    this.addDomainEvent({
      eventType: 'ScheduleTaskFailed',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        taskUuid: this._uuid,
        sourceModule: this._sourceModule,
        sourceEntityId: this._sourceEntityId,
        error,
        consecutiveFailures: this._execution.toDTO().consecutiveFailures,
      },
    });
  }

  // ===== 调度配置管理 =====

  /**
   * 更新调度配置
   */
  public updateSchedule(schedule: Partial<any>): void {
    const oldCron = this._schedule.toDTO().cronExpression;
    this._schedule = this._schedule.with(schedule);
    this._updatedAt = Date.now();

    // 重新计算下次执行时间
    const nextRunAt = this._schedule.calculateNextRun();
    this._execution = this._execution.with({ nextRunAt });

    // 发布事件
    this.addDomainEvent({
      eventType: 'ScheduleTaskScheduleUpdated',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        taskUuid: this._uuid,
        previousCronExpression: oldCron,
        newCronExpression: this._schedule.toDTO().cronExpression,
        nextRunAt: nextRunAt ?? 0,
      },
    });
  }

  /**
   * 更新 Cron 表达式
   */
  public updateCronExpression(cronExpression: string): void {
    this.updateSchedule({ cronExpression });
  }

  /**
   * 计算下次执行时间
   */
  public calculateNextRun(): number | null {
    return this._schedule.calculateNextRun();
  }

  // ===== 执行信息管理 =====

  /**
   * 记录执行
   */
  public recordExecution(
    status: ExecutionStatus,
    duration: number,
    result?: Record<string, any>,
    error?: string,
  ): ScheduleExecution {
    const execution = this.createExecution({
      executionTime: Date.now(),
      status,
    });

    if (status === ExecutionStatus.SUCCESS) {
      execution.markSuccess(duration, result);
    } else if (status === ExecutionStatus.FAILED) {
      execution.markFailed(error || 'Unknown error', duration);
    } else if (status === ExecutionStatus.TIMEOUT) {
      execution.markTimeout(duration);
    } else if (status === ExecutionStatus.SKIPPED) {
      execution.markSkipped(error || 'Skipped');
    }

    this.addExecution(execution);

    // 更新执行信息
    const nextRunAt = this._schedule.calculateNextRun();
    this._execution = this._execution.updateAfterExecution({
      executedAt: Date.now(),
      status,
      duration,
      nextRunAt,
    });

    this._updatedAt = Date.now();

    // 发布事件
    this.addDomainEvent({
      eventType: 'ScheduleTaskExecuted',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        taskUuid: this._uuid,
        executionUuid: execution.uuid,
        sourceModule: this._sourceModule,
        sourceEntityId: this._sourceEntityId,
        status,
        duration,
        payload: this._metadata.toDTO().payload,
      },
    });

    return execution;
  }

  /**
   * 更新执行信息
   */
  public updateExecutionInfo(updates: Partial<any>): void {
    this._execution = this._execution.with(updates);
    this._updatedAt = Date.now();
  }

  /**
   * 重置失败计数
   */
  public resetFailures(): void {
    this._execution = this._execution.resetFailures();
    this._updatedAt = Date.now();
  }

  // ===== 重试策略管理 =====

  /**
   * 更新重试策略
   */
  public updateRetryPolicy(policy: Partial<any>): void {
    this._retryPolicy = this._retryPolicy.with(policy);
    this._updatedAt = Date.now();
  }

  /**
   * 判断是否应该重试
   */
  public shouldRetry(): boolean {
    const execInfo = this._execution.toDTO();
    return this._retryPolicy.shouldRetry(execInfo.consecutiveFailures);
  }

  /**
   * 计算下次重试延迟
   */
  public calculateNextRetryDelay(): number {
    const execInfo = this._execution.toDTO();
    return this._retryPolicy.calculateNextRetryDelay(execInfo.consecutiveFailures);
  }

  // ===== 元数据管理 =====

  /**
   * 更新元数据
   */
  public updateMetadata(metadata: Partial<any>): void {
    this._metadata = this._metadata.with(metadata);
    this._updatedAt = Date.now();
  }

  /**
   * 更新 Payload
   */
  public updatePayload(payload: Record<string, any>): void {
    this._metadata = this._metadata.updatePayload(payload);
    this._updatedAt = Date.now();
  }

  /**
   * 添加标签
   */
  public addTag(tag: string): void {
    this._metadata = this._metadata.addTag(tag);
    this._updatedAt = Date.now();
  }

  /**
   * 移除标签
   */
  public removeTag(tag: string): void {
    this._metadata = this._metadata.removeTag(tag);
    this._updatedAt = Date.now();
  }

  // ===== 启用/禁用 =====

  /**
   * 启用任务
   */
  public enable(): void {
    this._enabled = true;
    this._updatedAt = Date.now();
  }

  /**
   * 禁用任务
   */
  public disable(): void {
    this._enabled = false;
    this._updatedAt = Date.now();
  }

  // ===== 状态检查 =====

  public isActive(): boolean {
    return this._status === ScheduleTaskStatus.ACTIVE;
  }

  public isPaused(): boolean {
    return this._status === ScheduleTaskStatus.PAUSED;
  }

  public isCompleted(): boolean {
    return this._status === ScheduleTaskStatus.COMPLETED;
  }

  public isCancelled(): boolean {
    return this._status === ScheduleTaskStatus.CANCELLED;
  }

  public isFailed(): boolean {
    return this._status === ScheduleTaskStatus.FAILED;
  }

  public isExpired(): boolean {
    return this._schedule.isExpired();
  }

  // ===== 转换方法 =====

  /**
   * 转换为 DTO
   */
  public toDTO(includeChildren: boolean = false): ScheduleTaskDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      name: this._name,
      description: this._description,
      sourceModule: this._sourceModule,
      sourceEntityId: this._sourceEntityId,
      status: this._status,
      enabled: this._enabled,
      schedule: this._schedule.toDTO(),
      execution: this._execution.toDTO(),
      retryPolicy: this._retryPolicy.toDTO(),
      metadata: this._metadata.toDTO(),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      executions: includeChildren ? this._executions.map((e) => e.toDTO()) : undefined,
    };
  }

  /**
   * 转换为 Server DTO (用于 API 响应)
   */
  public toServerDTO(includeChildren: boolean = false): ScheduleTaskServerDTO {
    // ServerDTO 和 DTO 结构相同
    return this.toDTO(includeChildren) as unknown as ScheduleTaskServerDTO;
  }

  /**
   * 转换为持久化 DTO
   */
  public toPersistenceDTO(): any {
    return {
      uuid: this._uuid,
      account_uuid: this._accountUuid,
      name: this._name,
      description: this._description,
      source_module: this._sourceModule,
      source_entity_id: this._sourceEntityId,
      status: this._status,
      enabled: this._enabled,
      // ScheduleConfig (flattened)
      cron_expression: this._schedule.cronExpression ?? null,
      timezone: this._schedule.timezone,
      start_date: this._schedule.startDate ?? null,
      end_date: this._schedule.endDate ?? null,
      max_executions: this._schedule.maxExecutions ?? null,
      // ExecutionInfo (flattened)
      next_run_at: this._execution.nextRunAt ?? null,
      last_run_at: this._execution.lastRunAt ?? null,
      execution_count: this._execution.executionCount,
      last_execution_status: this._execution.lastExecutionStatus ?? null,
      last_execution_duration: this._execution.lastExecutionDuration ?? null,
      consecutive_failures: this._execution.consecutiveFailures,
      // RetryPolicy (flattened)
      max_retries: this._retryPolicy.maxRetries,
      retry_delay: this._retryPolicy.retryDelay,
      backoff_multiplier: this._retryPolicy.backoffMultiplier,
      max_retry_delay: this._retryPolicy.maxRetryDelay,
      // TaskMetadata (flattened)
      payload: this._metadata.payload ?? null,
      tags: JSON.stringify(this._metadata.tags),
      priority: this._metadata.priority,
      timeout: this._metadata.timeout,
      // Timestamps
      created_at: this._createdAt,
      updated_at: this._updatedAt,
    };
  }

  // ===== 静态工厂方法 =====

  /**
   * 创建新任务
   */
  public static create(params: {
    accountUuid: string;
    name: string;
    sourceModule: SourceModule;
    sourceEntityId: string;
    schedule: ScheduleConfig;
    description?: string;
    metadata?: TaskMetadata;
    retryPolicy?: RetryPolicy;
  }): ScheduleTask {
    const now = Date.now();
    const nextRunAt = params.schedule.calculateNextRun();

    const task = new ScheduleTask({
      accountUuid: params.accountUuid,
      name: params.name,
      description: params.description,
      sourceModule: params.sourceModule,
      sourceEntityId: params.sourceEntityId,
      status: ScheduleTaskStatus.ACTIVE,
      enabled: true,
      schedule: params.schedule,
      execution: ExecutionInfo.createDefault(nextRunAt),
      retryPolicy: params.retryPolicy || RetryPolicy.createDefault(),
      metadata: params.metadata || TaskMetadata.createDefault(),
      createdAt: now,
      updatedAt: now,
    });

    // 发布创建事件
    task.addDomainEvent({
      eventType: 'ScheduleTaskCreated',
      aggregateId: task.uuid,
      occurredOn: new Date(),
      accountUuid: params.accountUuid,
      payload: {
        taskUuid: task.uuid,
        name: params.name,
        sourceModule: params.sourceModule,
        sourceEntityId: params.sourceEntityId,
        cronExpression: params.schedule.toDTO().cronExpression,
        nextRunAt: nextRunAt ?? 0,
      },
    });

    return task;
  }

  /**
   * 从 DTO 创建
   */
  public static fromDTO(dto: ScheduleTaskDTO): ScheduleTask {
    const task = new ScheduleTask({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      description: dto.description,
      sourceModule: dto.sourceModule,
      sourceEntityId: dto.sourceEntityId,
      status: dto.status,
      enabled: dto.enabled,
      schedule: ScheduleConfig.fromDTO(dto.schedule),
      execution: ExecutionInfo.fromDTO(dto.execution),
      retryPolicy: RetryPolicy.fromDTO(dto.retryPolicy),
      metadata: TaskMetadata.fromDTO(dto.metadata),
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });

    if (dto.executions) {
      dto.executions.forEach((execDTO) => {
        task.addExecution(ScheduleExecution.fromDTO(execDTO));
      });
    }

    return task;
  }

  /**
   * 从持久化 DTO 创建
   */
  public static fromPersistenceDTO(dto: any): ScheduleTask {
    return new ScheduleTask({
      uuid: dto.uuid,
      accountUuid: dto.account_uuid,
      name: dto.name,
      description: dto.description,
      sourceModule: dto.source_module,
      sourceEntityId: dto.source_entity_id,
      status: dto.status,
      enabled: dto.enabled,
      schedule: new ScheduleConfig({
        cronExpression: dto.cron_expression ?? null,
        timezone: dto.timezone,
        startDate: dto.start_date ?? null,
        endDate: dto.end_date ?? null,
        maxExecutions: dto.max_executions ?? null,
      }),
      execution: new ExecutionInfo({
        nextRunAt: dto.next_run_at ?? null,
        lastRunAt: dto.last_run_at ?? null,
        executionCount: dto.execution_count,
        lastExecutionStatus: dto.last_execution_status ?? null,
        lastExecutionDuration: dto.last_execution_duration ?? null,
        consecutiveFailures: dto.consecutive_failures,
      }),
      retryPolicy: new RetryPolicy({
        enabled: dto.enabled,
        maxRetries: dto.max_retries,
        retryDelay: dto.retry_delay,
        backoffMultiplier: dto.backoff_multiplier,
        maxRetryDelay: dto.max_retry_delay,
      }),
      metadata: new TaskMetadata({
        payload: dto.payload ?? null,
        tags: dto.tags ? JSON.parse(dto.tags) : [],
        priority: dto.priority,
        timeout: dto.timeout,
      }),
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
    });
  }
}
