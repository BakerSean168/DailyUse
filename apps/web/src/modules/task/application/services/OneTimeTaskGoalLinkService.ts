/**
 * ONE_TIME Task Goal Link Service
 * 一次性任务目标关联服务
 * 
 * 职责：
 * - 任务与目标的关联/解除关联
 * - 任务与关键结果的关联
 */

import { TaskDomain } from '@dailyuse/domain-client';
import type { TaskContracts } from '@dailyuse/contracts';
import { useTaskStore } from '../../presentation/stores/taskStore';
import { oneTimeTaskApiClient } from '../../infrastructure/api/taskApiClient';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('OneTimeTaskGoalLinkService');
const TaskTemplateClient = TaskDomain.TaskTemplateClient;
type TaskTemplate = TaskDomain.TaskTemplate;

export class OneTimeTaskGoalLinkService {
  private static instance: OneTimeTaskGoalLinkService;

  private constructor() {}

  static getInstance(): OneTimeTaskGoalLinkService {
    if (!OneTimeTaskGoalLinkService.instance) {
      OneTimeTaskGoalLinkService.instance = new OneTimeTaskGoalLinkService();
    }
    return OneTimeTaskGoalLinkService.instance;
  }

  /**
   * 关联任务到目标
   */
  async linkToGoal(
    uuid: string,
    goalUuid: string,
    keyResultUuid?: string,
  ): Promise<TaskTemplate> {
    try {
      logger.info('Linking task to goal', { uuid, goalUuid, keyResultUuid });
      
      const request: TaskContracts.LinkTaskToGoalRequest = {
        goalUuid,
        keyResultUuid,
      };
      
      const dto = await oneTimeTaskApiClient.linkToGoal(uuid, request);
      const task = TaskTemplateClient.fromServerDTO(dto);
      
      const taskStore = useTaskStore();
      taskStore.updateTaskTemplate(task.uuid, task);
      
      logger.info('Task linked to goal successfully', { uuid, goalUuid });
      return task;
    } catch (error) {
      logger.error('Failed to link task to goal', { error, uuid, goalUuid, keyResultUuid });
      throw error;
    }
  }

  /**
   * 解除任务与目标的关联
   */
  async unlinkFromGoal(uuid: string): Promise<TaskTemplate> {
    try {
      logger.info('Unlinking task from goal', { uuid });
      const dto = await oneTimeTaskApiClient.unlinkFromGoal(uuid);
      const task = TaskTemplateClient.fromServerDTO(dto);
      
      const taskStore = useTaskStore();
      taskStore.updateTaskTemplate(task.uuid, task);
      
      logger.info('Task unlinked from goal successfully', { uuid });
      return task;
    } catch (error) {
      logger.error('Failed to unlink task from goal', { error, uuid });
      throw error;
    }
  }
}

// 导出单例实例
export const oneTimeTaskGoalLinkService = OneTimeTaskGoalLinkService.getInstance();
