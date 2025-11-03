/**
 * ONE_TIME Task Lifecycle Service
 * 一次性任务生命周期管理服务
 * 
 * 职责：
 * - 任务创建（包括子任务）
 * - 任务状态转换（开始、完成、阻塞、取消）
 */

import { TaskTemplate, TaskInstance } from '@dailyuse/domain-client';
import type { TaskContracts } from '@dailyuse/contracts';
import { useTaskStore } from '../../presentation/stores/taskStore';
import { oneTimeTaskApiClient } from '../../infrastructure/api/taskApiClient';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('OneTimeTaskLifecycleService');

export class OneTimeTaskLifecycleService {
  private static instance: OneTimeTaskLifecycleService;

  private constructor() {}

  static getInstance(): OneTimeTaskLifecycleService {
    if (!OneTimeTaskLifecycleService.instance) {
      OneTimeTaskLifecycleService.instance = new OneTimeTaskLifecycleService();
    }
    return OneTimeTaskLifecycleService.instance;
  }

  // ===== 任务创建 =====

  /**
   * 创建一次性任务
   */
  async createOneTimeTask(
    request: TaskContracts.CreateOneTimeTaskRequest,
  ): Promise<TaskTemplate> {
    try {
      logger.info('Creating one-time task', { title: request.title });
      const dto = await oneTimeTaskApiClient.createOneTimeTask(request);
      const task = TaskTemplateClient.fromServerDTO(dto);
      
      const taskStore = useTaskStore();
      taskStore.addTaskTemplate(task);
      
      logger.info('One-time task created successfully', { uuid: task.uuid });
      return task;
    } catch (error) {
      logger.error('Failed to create one-time task', { error, request });
      throw error;
    }
  }

  /**
   * 创建子任务
   */
  async createSubtask(
    parentUuid: string,
    request: TaskContracts.CreateOneTimeTaskRequest,
  ): Promise<TaskTemplate> {
    try {
      logger.info('Creating subtask', { parentUuid, title: request.title });
      const dto = await oneTimeTaskApiClient.createSubtask(parentUuid, request);
      const task = TaskTemplateClient.fromServerDTO(dto);
      
      const taskStore = useTaskStore();
      taskStore.addTaskTemplate(task);
      
      logger.info('Subtask created successfully', { uuid: task.uuid, parentUuid });
      return task;
    } catch (error) {
      logger.error('Failed to create subtask', { error, parentUuid, request });
      throw error;
    }
  }

  // ===== 状态转换 =====

  /**
   * 开始任务
   */
  async startTask(uuid: string): Promise<TaskTemplate> {
    try {
      logger.info('Starting task', { uuid });
      const dto = await oneTimeTaskApiClient.startTask(uuid);
      const task = TaskTemplateClient.fromServerDTO(dto);
      
      const taskStore = useTaskStore();
      taskStore.updateTaskTemplate(task.uuid, task);
      
      logger.info('Task started successfully', { uuid });
      return task;
    } catch (error) {
      logger.error('Failed to start task', { error, uuid });
      throw error;
    }
  }

  /**
   * 完成任务
   */
  async completeTask(uuid: string): Promise<TaskTemplate> {
    try {
      logger.info('Completing task', { uuid });
      const dto = await oneTimeTaskApiClient.completeTask(uuid);
      const task = TaskTemplateClient.fromServerDTO(dto);
      
      const taskStore = useTaskStore();
      taskStore.updateTaskTemplate(task.uuid, task);
      
      logger.info('Task completed successfully', { uuid });
      return task;
    } catch (error) {
      logger.error('Failed to complete task', { error, uuid });
      throw error;
    }
  }

  /**
   * 阻塞任务
   */
  async blockTask(uuid: string, reason?: string): Promise<TaskTemplate> {
    try {
      logger.info('Blocking task', { uuid, reason });
      const dto = await oneTimeTaskApiClient.blockTask(uuid, reason);
      const task = TaskTemplateClient.fromServerDTO(dto);
      
      const taskStore = useTaskStore();
      taskStore.updateTaskTemplate(task.uuid, task);
      
      logger.info('Task blocked successfully', { uuid });
      return task;
    } catch (error) {
      logger.error('Failed to block task', { error, uuid, reason });
      throw error;
    }
  }

  /**
   * 解除阻塞
   */
  async unblockTask(uuid: string): Promise<TaskTemplate> {
    try {
      logger.info('Unblocking task', { uuid });
      const dto = await oneTimeTaskApiClient.unblockTask(uuid);
      const task = TaskTemplateClient.fromServerDTO(dto);
      
      const taskStore = useTaskStore();
      taskStore.updateTaskTemplate(task.uuid, task);
      
      logger.info('Task unblocked successfully', { uuid });
      return task;
    } catch (error) {
      logger.error('Failed to unblock task', { error, uuid });
      throw error;
    }
  }

  /**
   * 取消任务
   */
  async cancelTask(uuid: string, reason?: string): Promise<TaskTemplate> {
    try {
      logger.info('Canceling task', { uuid, reason });
      const dto = await oneTimeTaskApiClient.cancelTask(uuid, reason);
      const task = TaskTemplateClient.fromServerDTO(dto);
      
      const taskStore = useTaskStore();
      taskStore.updateTaskTemplate(task.uuid, task);
      
      logger.info('Task canceled successfully', { uuid });
      return task;
    } catch (error) {
      logger.error('Failed to cancel task', { error, uuid, reason });
      throw error;
    }
  }
}

// 导出单例实例
export const oneTimeTaskLifecycleService = OneTimeTaskLifecycleService.getInstance();
