/**
 * Cancel Schedule Task
 *
 * 取消调度任务用例
 */

import type { IScheduleTaskApiClient } from '@dailyuse/infrastructure-client';
import { eventBus } from '@dailyuse/utils';
import { ScheduleContainer } from '../ScheduleContainer';
import { ScheduleTaskEvents, type ScheduleTaskRefreshEvent } from './schedule-events';

/**
 * Cancel Schedule Task Input
 */
export interface CancelScheduleTaskInput {
  taskUuid: string;
  reason?: string;
}

/**
 * Cancel Schedule Task
 */
export class CancelScheduleTask {
  private static instance: CancelScheduleTask;

  private constructor(private readonly apiClient: IScheduleTaskApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IScheduleTaskApiClient): CancelScheduleTask {
    const container = ScheduleContainer.getInstance();
    const client = apiClient || container.getScheduleTaskApiClient();
    CancelScheduleTask.instance = new CancelScheduleTask(client);
    return CancelScheduleTask.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CancelScheduleTask {
    if (!CancelScheduleTask.instance) {
      CancelScheduleTask.instance = CancelScheduleTask.createInstance();
    }
    return CancelScheduleTask.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CancelScheduleTask.instance = undefined as unknown as CancelScheduleTask;
  }

  /**
   * 执行用例
   */
  async execute(input: CancelScheduleTaskInput): Promise<void> {
    await this.apiClient.cancelTask(input.taskUuid, input.reason);

    this.publishEvent(input.taskUuid, ScheduleTaskEvents.TASK_CANCELLED, { reason: input.reason });
  }

  /**
   * 发布事件
   */
  private publishEvent(taskUuid: string, eventName: string, metadata?: Record<string, unknown>): void {
    const event: ScheduleTaskRefreshEvent = {
      taskUuid,
      reason: eventName,
      timestamp: Date.now(),
      metadata,
    };
    eventBus.emit(eventName, event);
  }
}

/**
 * 便捷函数
 */
export const cancelScheduleTask = (input: CancelScheduleTaskInput): Promise<void> =>
  CancelScheduleTask.getInstance().execute(input);
