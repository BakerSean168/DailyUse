/**
 * ONE_TIME Task Batch Operation Service
 * 一次性任务批量操作服务
 * 
 * 职责：
 * - 批量更新优先级
 * - 批量取消任务
 * - 其他批量操作（未来扩展）
 */

import { TaskTemplate } from '@dailyuse/domain-client';
import type { TaskContracts } from '@dailyuse/contracts';
import { useTaskStore } from '../../presentation/stores/taskStore';
import { oneTimeTaskApiClient } from '../../infrastructure/api/taskApiClient';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('OneTimeTaskBatchOperationService');

export class OneTimeTaskBatchOperationService {
  private static instance: OneTimeTaskBatchOperationService;

  private constructor() {}

  static getInstance(): OneTimeTaskBatchOperationService {
    if (!OneTimeTaskBatchOperationService.instance) {
      OneTimeTaskBatchOperationService.instance = new OneTimeTaskBatchOperationService();
    }
    return OneTimeTaskBatchOperationService.instance;
  }

  /**
   * 批量更新任务优先级
   */
  async batchUpdatePriority(
    taskUuids: string[],
    importance?: number,
    urgency?: number,
  ): Promise<TaskTemplate[]> {
    try {
      logger.info('Batch updating task priority', { 
        count: taskUuids.length, 
        importance, 
        urgency 
      });
      
      const request: TaskContracts.BatchUpdatePriorityRequest = {
        taskUuids,
        importance,
        urgency,
      };
      
      const dtos = await oneTimeTaskApiClient.batchUpdatePriority(request);
      const tasks = dtos.map(dto => TaskTemplate.fromServerDTO(dto));
      
      // 批量更新 store
      const taskStore = useTaskStore();
      tasks.forEach(task => taskStore.updateTaskTemplate(task.uuid, task));
      
      logger.info('Batch priority update completed', { 
        updatedCount: tasks.length 
      });
      return tasks;
    } catch (error) {
      logger.error('Failed to batch update priority', { 
        error, 
        taskUuids, 
        importance, 
        urgency 
      });
      throw error;
    }
  }

  /**
   * 批量取消任务
   */
  async batchCancelTasks(
    taskUuids: string[],
    reason?: string,
  ): Promise<TaskTemplate[]> {
    try {
      logger.info('Batch canceling tasks', { 
        count: taskUuids.length, 
        reason 
      });
      
      const request: TaskContracts.BatchCancelTasksRequest = {
        taskUuids,
        reason,
      };
      
      const dtos = await oneTimeTaskApiClient.batchCancelTasks(request);
      const tasks = dtos.map(dto => TaskTemplate.fromServerDTO(dto));
      
      // 批量更新 store
      const taskStore = useTaskStore();
      tasks.forEach(task => taskStore.updateTaskTemplate(task.uuid, task));
      
      logger.info('Batch cancel completed', { 
        canceledCount: tasks.length 
      });
      return tasks;
    } catch (error) {
      logger.error('Failed to batch cancel tasks', { 
        error, 
        taskUuids, 
        reason 
      });
      throw error;
    }
  }
}

// 导出单例实例
export const oneTimeTaskBatchOperationService = OneTimeTaskBatchOperationService.getInstance();
