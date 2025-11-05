/**
 * ScheduleDomainService - Domain Service
 * 调度领域服务
 *
 * DDD Domain Service:
 * - 处理跨聚合根的业务逻辑
 * - 协调多个聚合根的操作
 * - 不持有状态，只提供行为
 *
 * 职责:
 * - 任务调度逻辑
 * - 任务执行协调
 * - 任务生命周期管理
 * - 与其他模块的集成（Reminder, Task, Goal, Notification）
 *
 * @domain-server/schedule
 */

import { ScheduleTask } from '../aggregates/ScheduleTask';
import type { ScheduleStatistics } from '../aggregates/ScheduleStatistics';
import type { IScheduleTaskRepository } from '../repositories/IScheduleTaskRepository';
import type { IScheduleStatisticsRepository } from '../repositories/IScheduleStatisticsRepository';
import {
  ScheduleContracts,
  ScheduleTaskStatus,
  ExecutionStatus,
  SourceModule,
} from '@dailyuse/contracts';
import { ScheduleConfig } from '../value-objects/ScheduleConfig';
import { RetryPolicy } from '../value-objects/RetryPolicy';
import { TaskMetadata } from '../value-objects/TaskMetadata';

type ScheduleConfigServerDTO = ScheduleContracts.ScheduleConfigServerDTO;
type RetryPolicyServerDTO = ScheduleContracts.RetryPolicyServerDTO;
type TaskMetadataServerDTO = ScheduleContracts.TaskMetadataServerDTO;

/**
 * 创建任务参数
 */
export interface ICreateScheduleTaskParams {
  name: string;
  description?: string;
  accountUuid: string;
  sourceModule: SourceModule;
  sourceEntityId: string;
  schedule: ScheduleConfigServerDTO;
  retryConfig?: RetryPolicyServerDTO;
  payload?: Record<string, unknown>;
  tags?: string[];
}

/**
 * 执行任务参数
 */
export interface IExecuteScheduleTaskParams {
  taskUuid: string;
  actualStartedAt?: Date;
}

/**
 * 执行任务结果
 */
export interface IExecuteScheduleTaskResult {
  executionUuid: string;
  status: ExecutionStatus;
  duration: number;
  errorMessage?: string;
}

/**
 * 调度领域服务
 */
export class ScheduleDomainService {
  constructor(
    private readonly scheduleTaskRepository: IScheduleTaskRepository,
    private readonly scheduleStatisticsRepository: IScheduleStatisticsRepository,
  ) {}

  // ============ 任务创建 ============

  /**
   * 创建新的调度任务
   */
  async createScheduleTask(params: ICreateScheduleTaskParams): Promise<ScheduleTask> {
    // 将 DTO 转换为值对象
    const schedule = ScheduleConfig.fromDTO({
      ...params.schedule,
      startDate: params.schedule.startDate ? new Date(params.schedule.startDate).getTime() : null,
      endDate: params.schedule.endDate ? new Date(params.schedule.endDate).getTime() : null,
    });
    const retryPolicy = params.retryConfig ? RetryPolicy.fromDTO(params.retryConfig) : undefined;
    const metadata = params.payload
      ? new TaskMetadata({
          payload: params.payload,
          tags: params.tags || [],
        })
      : undefined;

    // 创建任务聚合根
    const task = ScheduleTask.create({
      name: params.name,
      description: params.description,
      accountUuid: params.accountUuid,
      sourceModule: params.sourceModule,
      sourceEntityId: params.sourceEntityId,
      schedule,
      metadata,
      retryPolicy,
    });

    // 保存任务
    await this.scheduleTaskRepository.save(task);

    // 更新统计
    const statistics = await this.scheduleStatisticsRepository.getOrCreate(params.accountUuid);
    statistics.incrementTaskCount(task.status);
    await this.scheduleStatisticsRepository.save(statistics);

    return task;
  }

  /**
   * 批量创建调度任务
   */
  async createScheduleTasksBatch(params: ICreateScheduleTaskParams[]): Promise<ScheduleTask[]> {
    const tasks: ScheduleTask[] = [];

    // 创建所有任务
    for (const param of params) {
      // 转换 DTO 为值对象
      const schedule = ScheduleConfig.fromDTO({
        ...param.schedule,
        startDate: param.schedule.startDate ? new Date(param.schedule.startDate).getTime() : null,
        endDate: param.schedule.endDate ? new Date(param.schedule.endDate).getTime() : null,
      });
      const retryPolicy = param.retryConfig
        ? RetryPolicy.fromDTO(param.retryConfig)
        : RetryPolicy.createDefault();
      const metadata = param.payload
        ? new TaskMetadata({
            payload: param.payload,
            tags: param.tags || [],
          })
        : TaskMetadata.createDefault();

      const task = ScheduleTask.create({
        name: param.name,
        description: param.description,
        accountUuid: param.accountUuid,
        sourceModule: param.sourceModule,
        sourceEntityId: param.sourceEntityId,
        schedule,
        metadata,
        retryPolicy,
      });
      tasks.push(task);
    }

    // 批量保存
    await this.scheduleTaskRepository.saveBatch(tasks);

    // 更新统计（按账户分组）
    const accountStatistics = new Map<string, ScheduleStatistics>();
    for (const task of tasks) {
      let statistics = accountStatistics.get(task.accountUuid);
      if (!statistics) {
        statistics = await this.scheduleStatisticsRepository.getOrCreate(task.accountUuid);
        accountStatistics.set(task.accountUuid, statistics);
      }
      statistics.incrementTaskCount(task.status);
    }

    // 保存所有统计
    await this.scheduleStatisticsRepository.saveBatch(Array.from(accountStatistics.values()));

    return tasks;
  }

  // ============ 任务执行 ============

  /**
   * 执行调度任务
   *
   * 注意: 这个方法只负责记录执行，实际的业务逻辑由调用方执行
   */
  async executeScheduleTask(
    params: IExecuteScheduleTaskParams,
    executeFn: (task: ScheduleTask) => Promise<IExecuteScheduleTaskResult>,
  ): Promise<IExecuteScheduleTaskResult> {
    // 查找任务
    const task = await this.scheduleTaskRepository.findByUuid(params.taskUuid);
    if (!task) {
      throw new Error(`ScheduleTask not found: ${params.taskUuid}`);
    }

    // 检查任务是否可以执行
    if (!task.enabled) {
      throw new Error(`ScheduleTask is disabled: ${params.taskUuid}`);
    }

    if (task.status !== ScheduleTaskStatus.ACTIVE) {
      throw new Error(`ScheduleTask is not active: ${params.taskUuid} (status: ${task.status})`);
    }

    // 执行任务（委托给调用方）
    const startedAt = params.actualStartedAt ?? new Date();
    let result: IExecuteScheduleTaskResult;

    try {
      result = await executeFn(task);
    } catch (error) {
      // 执行失败
      const errorMessage = error instanceof Error ? error.message : String(error);
      result = {
        executionUuid: crypto.randomUUID(),
        status: ExecutionStatus.FAILED,
        duration: Date.now() - startedAt.getTime(),
        errorMessage,
      };
    }

    // 记录执行结果
    const execution = task.recordExecution(
      result.status,
      result.duration,
      undefined,
      result.errorMessage,
    );

    // 保存任务
    await this.scheduleTaskRepository.save(task);

    // 更新统计
    const statistics = await this.scheduleStatisticsRepository.getOrCreate(task.accountUuid);
    statistics.recordExecution(result.status, result.duration, task.sourceModule);
    await this.scheduleStatisticsRepository.save(statistics);

    return {
      ...result,
      executionUuid: execution.uuid,
    };
  }

  /**
   * 查找需要执行的任务
   */
  async findDueTasksForExecution(beforeTime: Date, limit?: number): Promise<ScheduleTask[]> {
    return this.scheduleTaskRepository.findDueTasksForExecution(beforeTime, limit);
  }

  // ============ 任务生命周期管理 ============

  /**
   * 暂停任务
   */
  async pauseScheduleTask(taskUuid: string): Promise<void> {
    const task = await this.scheduleTaskRepository.findByUuid(taskUuid);
    if (!task) {
      throw new Error(`ScheduleTask not found: ${taskUuid}`);
    }

    const wasActive = task.status === 'active';
    task.pause();

    await this.scheduleTaskRepository.save(task);

    if (wasActive) {
      const statistics = await this.scheduleStatisticsRepository.getOrCreate(task.accountUuid);
      statistics.incrementPausedTasks(task.sourceModule);
      await this.scheduleStatisticsRepository.save(statistics);
    }
  }

  /**
   * 恢复任务
   */
  async resumeScheduleTask(taskUuid: string): Promise<void> {
    const task = await this.scheduleTaskRepository.findByUuid(taskUuid);
    if (!task) {
      throw new Error(`ScheduleTask not found: ${taskUuid}`);
    }

    const wasPaused = task.status === 'paused';
    task.resume();

    await this.scheduleTaskRepository.save(task);

    if (wasPaused) {
      const statistics = await this.scheduleStatisticsRepository.getOrCreate(task.accountUuid);
      statistics.decrementPausedTasks(task.sourceModule);
      await this.scheduleStatisticsRepository.save(statistics);
    }
  }

  /**
   * 完成任务
   */
  async completeScheduleTask(taskUuid: string, reason?: string): Promise<void> {
    const task = await this.scheduleTaskRepository.findByUuid(taskUuid);
    if (!task) {
      throw new Error(`ScheduleTask not found: ${taskUuid}`);
    }

    const wasActive = task.status === ScheduleTaskStatus.ACTIVE;
    task.complete();

    await this.scheduleTaskRepository.save(task);

    const statistics = await this.scheduleStatisticsRepository.getOrCreate(task.accountUuid);
    statistics.incrementCompletedTasks(task.sourceModule, wasActive);
    await this.scheduleStatisticsRepository.save(statistics);
  }

  /**
   * 取消任务
   */
  async cancelScheduleTask(taskUuid: string, reason?: string): Promise<void> {
    const task = await this.scheduleTaskRepository.findByUuid(taskUuid);
    if (!task) {
      throw new Error(`ScheduleTask not found: ${taskUuid}`);
    }

    task.cancel(reason || 'Task cancelled');
    await this.scheduleTaskRepository.save(task);
  }

  /**
   * 任务失败
   */
  async failScheduleTask(taskUuid: string, reason: string): Promise<void> {
    const task = await this.scheduleTaskRepository.findByUuid(taskUuid);
    if (!task) {
      throw new Error(`ScheduleTask not found: ${taskUuid}`);
    }

    const wasActive = task.status === 'active';
    task.fail(reason);

    await this.scheduleTaskRepository.save(task);

    const statistics = await this.scheduleStatisticsRepository.getOrCreate(task.accountUuid);
    statistics.incrementFailedTasks(task.sourceModule, wasActive);
    await this.scheduleStatisticsRepository.save(statistics);
  }

  /**
   * 删除任务
   */
  async deleteScheduleTask(taskUuid: string): Promise<void> {
    const task = await this.scheduleTaskRepository.findByUuid(taskUuid);
    if (!task) {
      throw new Error(`ScheduleTask not found: ${taskUuid}`);
    }

    await this.scheduleTaskRepository.deleteByUuid(taskUuid);

    const statistics = await this.scheduleStatisticsRepository.getOrCreate(task.accountUuid);
    statistics.decrementTaskCount(task.status);
    await this.scheduleStatisticsRepository.save(statistics);
  }

  // ============ 任务配置更新 ============

  /**
   * 更新任务调度配置
   */
  async updateScheduleConfig(taskUuid: string, newSchedule: ScheduleConfig): Promise<void> {
    const task = await this.scheduleTaskRepository.findByUuid(taskUuid);
    if (!task) {
      throw new Error(`ScheduleTask not found: ${taskUuid}`);
    }

    task.updateSchedule(newSchedule);
    await this.scheduleTaskRepository.save(task);
  }

  /**
   * 更新任务元数据
   */
  async updateTaskMetadata(
    taskUuid: string,
    payload?: Record<string, unknown>,
    tagsToAdd?: string[],
    tagsToRemove?: string[],
  ): Promise<void> {
    const task = await this.scheduleTaskRepository.findByUuid(taskUuid);
    if (!task) {
      throw new Error(`ScheduleTask not found: ${taskUuid}`);
    }

    if (payload !== undefined) {
      task.updatePayload(payload);
    }

    if (tagsToAdd) {
      for (const tag of tagsToAdd) {
        task.addTag(tag);
      }
    }

    if (tagsToRemove) {
      for (const tag of tagsToRemove) {
        task.removeTag(tag);
      }
    }

    await this.scheduleTaskRepository.save(task);
  }

  // ============ 批量操作 ============

  /**
   * 批量删除任务
   */
  async deleteScheduleTasksBatch(taskUuids: string[]): Promise<void> {
    // 查找所有任务
    const tasks: ScheduleTask[] = [];
    for (const uuid of taskUuids) {
      const task = await this.scheduleTaskRepository.findByUuid(uuid);
      if (task) {
        tasks.push(task);
      }
    }

    // 批量删除
    await this.scheduleTaskRepository.deleteBatch(taskUuids);

    // 更新统计
    const accountStatistics = new Map<string, ScheduleStatistics>();
    for (const task of tasks) {
      let statistics = accountStatistics.get(task.accountUuid);
      if (!statistics) {
        statistics = await this.scheduleStatisticsRepository.getOrCreate(task.accountUuid);
        accountStatistics.set(task.accountUuid, statistics);
      }
      statistics.decrementTaskCount(task.status);
    }

    // 保存所有统计
    await this.scheduleStatisticsRepository.saveBatch(Array.from(accountStatistics.values()));
  }

  /**
   * 批量暂停任务
   */
  async pauseScheduleTasksBatch(taskUuids: string[]): Promise<void> {
    const tasks: ScheduleTask[] = [];

    for (const uuid of taskUuids) {
      const task = await this.scheduleTaskRepository.findByUuid(uuid);
      if (task && task.status === 'active') {
        task.pause();
        tasks.push(task);
      }
    }

    await this.scheduleTaskRepository.saveBatch(tasks);

    // 更新统计
    const accountStatistics = new Map<string, ScheduleStatistics>();
    for (const task of tasks) {
      let statistics = accountStatistics.get(task.accountUuid);
      if (!statistics) {
        statistics = await this.scheduleStatisticsRepository.getOrCreate(task.accountUuid);
        accountStatistics.set(task.accountUuid, statistics);
      }
      statistics.incrementPausedTasks(task.sourceModule);
    }

    await this.scheduleStatisticsRepository.saveBatch(Array.from(accountStatistics.values()));
  }

  /**
   * 批量恢复任务
   */
  async resumeScheduleTasksBatch(taskUuids: string[]): Promise<void> {
    const tasks: ScheduleTask[] = [];

    for (const uuid of taskUuids) {
      const task = await this.scheduleTaskRepository.findByUuid(uuid);
      if (task && task.status === 'paused') {
        task.resume();
        tasks.push(task);
      }
    }

    await this.scheduleTaskRepository.saveBatch(tasks);

    // 更新统计
    const accountStatistics = new Map<string, ScheduleStatistics>();
    for (const task of tasks) {
      let statistics = accountStatistics.get(task.accountUuid);
      if (!statistics) {
        statistics = await this.scheduleStatisticsRepository.getOrCreate(task.accountUuid);
        accountStatistics.set(task.accountUuid, statistics);
      }
      statistics.decrementPausedTasks(task.sourceModule);
    }

    await this.scheduleStatisticsRepository.saveBatch(Array.from(accountStatistics.values()));
  }
}
