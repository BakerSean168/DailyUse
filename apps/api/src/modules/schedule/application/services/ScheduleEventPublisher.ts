import { eventBus, type DomainEvent } from '@dailyuse/utils';
import type { ScheduleTask } from '@dailyuse/domain-server';
import { ScheduleTaskFactory } from '@dailyuse/domain-server';
import { ScheduleApplicationService } from './ScheduleApplicationService';
import type { GoalContracts } from '@dailyuse/contracts';

/**
 * Schedule 领域事件发布器
 * 负责：
 * 1. 监听其他模块（Goal、Task、Reminder）的事件，创建对应的调度任务
 * 2. 发布 ScheduleTask 聚合根的领域事件到事件总线
 * 3. 将领域事件转换为统计事件并更新统计
 */
export class ScheduleEventPublisher {
  private static isInitialized = false;
  private static taskFactory: ScheduleTaskFactory;

  /**
   * 初始化事件监听器（在应用启动时调用一次）
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️  [ScheduleEventPublisher] Already initialized, skipping...');
      return;
    }

    console.log('🚀 [ScheduleEventPublisher] Initializing Schedule event listeners...');

    // 初始化工厂
    this.taskFactory = new ScheduleTaskFactory();

    // ============ 监听 Goal 模块事件 ============

    /**
     * 监听 Goal 创建事件，如果有重复模式则创建调度任务
     */
    eventBus.on('goal.created', async (event: DomainEvent) => {
      try {
        if (!event.accountUuid) {
          console.error('❌ [ScheduleEventPublisher] Missing accountUuid in goal.created event');
          return;
        }

        const { goal } = event.payload as {
          goal: GoalContracts.GoalServerDTO;
        };

        await this.handleGoalCreated(event.accountUuid, goal);
      } catch (error) {
        console.error('❌ [ScheduleEventPublisher] Error handling goal.created:', error);
      }
    });

    /**
     * 监听 Goal 删除事件，删除对应的调度任务
     */
    eventBus.on('goal.deleted', async (event: DomainEvent) => {
      try {
        if (!event.accountUuid) {
          console.error('❌ [ScheduleEventPublisher] Missing accountUuid in goal.deleted event');
          return;
        }

        await this.handleGoalDeleted(event.accountUuid, event.aggregateId);
      } catch (error) {
        console.error('❌ [ScheduleEventPublisher] Error handling goal.deleted:', error);
      }
    });

    // ============ 监听 Task 模块事件 ============

    /**
     * 监听 Task 创建事件
     */
    eventBus.on('task.created', async (event: DomainEvent) => {
      try {
        if (!event.accountUuid) {
          console.error('❌ [ScheduleEventPublisher] Missing accountUuid in task.created event');
          return;
        }

        const { task } = event.payload as {
          task: any; // TaskServerDTO
        };

        await this.handleTaskCreated(event.accountUuid, task);
      } catch (error) {
        console.error('❌ [ScheduleEventPublisher] Error handling task.created:', error);
      }
    });

    /**
     * 监听 Task 删除事件
     */
    eventBus.on('task.deleted', async (event: DomainEvent) => {
      try {
        if (!event.accountUuid) {
          console.error('❌ [ScheduleEventPublisher] Missing accountUuid in task.deleted event');
          return;
        }

        await this.handleTaskDeleted(event.accountUuid, event.aggregateId);
      } catch (error) {
        console.error('❌ [ScheduleEventPublisher] Error handling task.deleted:', error);
      }
    });

    // ============ 监听 Reminder 模块事件 ============

    /**
     * 监听 Reminder 创建事件
     */
    eventBus.on('reminder.created', async (event: DomainEvent) => {
      try {
        if (!event.accountUuid) {
          console.error(
            '❌ [ScheduleEventPublisher] Missing accountUuid in reminder.created event',
          );
          return;
        }

        const { reminder } = event.payload as {
          reminder: any; // ReminderServerDTO
        };

        await this.handleReminderCreated(event.accountUuid, reminder);
      } catch (error) {
        console.error('❌ [ScheduleEventPublisher] Error handling reminder.created:', error);
      }
    });

    /**
     * 监听 Reminder 删除事件
     */
    eventBus.on('reminder.deleted', async (event: DomainEvent) => {
      try {
        if (!event.accountUuid) {
          console.error(
            '❌ [ScheduleEventPublisher] Missing accountUuid in reminder.deleted event',
          );
          return;
        }

        await this.handleReminderDeleted(event.accountUuid, event.aggregateId);
      } catch (error) {
        console.error('❌ [ScheduleEventPublisher] Error handling reminder.deleted:', error);
      }
    });

    // ============ 监听 ScheduleTask 自身事件（用于统计） ============

    /**
     * 监听调度任务创建事件
     */
    eventBus.on('schedule.task.created', async (event: DomainEvent) => {
      try {
        if (!event.accountUuid) {
          console.error(
            '❌ [ScheduleEventPublisher] Missing accountUuid in schedule.task.created event',
          );
          return;
        }

        // TODO: 更新统计数据（待 ScheduleStatisticsApplicationService 实现事件驱动更新）
        console.log(
          `✅ [ScheduleEventPublisher] Handled schedule.task.created for ${event.aggregateId}`,
        );
      } catch (error) {
        console.error('❌ [ScheduleEventPublisher] Error handling schedule.task.created:', error);
      }
    });

    /**
     * 监听调度任务执行成功事件
     */
    eventBus.on('schedule.task.execution_succeeded', async (event: DomainEvent) => {
      try {
        if (!event.accountUuid) {
          console.error(
            '❌ [ScheduleEventPublisher] Missing accountUuid in schedule.task.execution_succeeded event',
          );
          return;
        }

        // TODO: 更新统计数据
        console.log(
          `✅ [ScheduleEventPublisher] Handled schedule.task.execution_succeeded for ${event.aggregateId}`,
        );
      } catch (error) {
        console.error(
          '❌ [ScheduleEventPublisher] Error handling schedule.task.execution_succeeded:',
          error,
        );
      }
    });

    /**
     * 监听调度任务执行失败事件
     */
    eventBus.on('schedule.task.execution_failed', async (event: DomainEvent) => {
      try {
        if (!event.accountUuid) {
          console.error(
            '❌ [ScheduleEventPublisher] Missing accountUuid in schedule.task.execution_failed event',
          );
          return;
        }

        // TODO: 更新统计数据
        console.log(
          `✅ [ScheduleEventPublisher] Handled schedule.task.execution_failed for ${event.aggregateId}`,
        );
      } catch (error) {
        console.error(
          '❌ [ScheduleEventPublisher] Error handling schedule.task.execution_failed:',
          error,
        );
      }
    });

    /**
     * 监听调度任务完成事件
     */
    eventBus.on('schedule.task.completed', async (event: DomainEvent) => {
      try {
        if (!event.accountUuid) {
          console.error(
            '❌ [ScheduleEventPublisher] Missing accountUuid in schedule.task.completed event',
          );
          return;
        }

        // TODO: 更新统计数据
        console.log(
          `✅ [ScheduleEventPublisher] Handled schedule.task.completed for ${event.aggregateId}`,
        );
      } catch (error) {
        console.error('❌ [ScheduleEventPublisher] Error handling schedule.task.completed:', error);
      }
    });

    this.isInitialized = true;
    console.log('✅ [ScheduleEventPublisher] All event listeners registered successfully!');
  }

  /**
   * 处理 Goal 创建事件
   */
  private static async handleGoalCreated(
    accountUuid: string,
    goal: GoalContracts.GoalServerDTO,
  ): Promise<void> {
    try {
      // 使用工厂创建调度任务
      const scheduleTask = this.taskFactory.createFromSourceEntity({
        accountUuid,
        sourceModule: 'GOAL' as any,
        sourceEntityId: goal.uuid,
        sourceEntity: goal,
      });

      // 保存调度任务
      const scheduleService = await ScheduleApplicationService.getInstance();
      const metadataDTO = scheduleTask.metadata.toDTO();
      
      await scheduleService.createScheduleTask({
        accountUuid,
        name: scheduleTask.name,
        description: scheduleTask.description ?? undefined,
        sourceModule: scheduleTask.sourceModule,
        sourceEntityId: scheduleTask.sourceEntityId,
        schedule: scheduleTask.schedule,
        retryConfig: scheduleTask.retryPolicy,
        payload: metadataDTO.payload,
        tags: metadataDTO.tags,
      });

      console.log(
        `✅ [ScheduleEventPublisher] Created schedule task for Goal ${goal.uuid}`,
      );
    } catch (error: any) {
      // 如果 Goal 不需要调度（没有启用 reminderConfig），这是正常情况
      if (error.message?.includes('does not require')) {
        console.log(`ℹ️  [ScheduleEventPublisher] Goal ${goal.uuid} does not require scheduling`);
      } else {
        console.error(`❌ [ScheduleEventPublisher] Failed to create schedule for Goal ${goal.uuid}:`, error);
      }
    }
  }

  /**
   * 处理 Goal 删除事件
   */
  private static async handleGoalDeleted(
    accountUuid: string,
    goalUuid: string,
  ): Promise<void> {
    try {
      const scheduleService = await ScheduleApplicationService.getInstance();
      await scheduleService.deleteScheduleTasksBySource('GOAL' as any, goalUuid, accountUuid);
      
      console.log(
        `✅ [ScheduleEventPublisher] Deleted schedule tasks for Goal ${goalUuid}`,
      );
    } catch (error) {
      console.error(`❌ [ScheduleEventPublisher] Failed to delete schedules for Goal ${goalUuid}:`, error);
    }
  }

  /**
   * 处理 Task 创建事件
   */
  private static async handleTaskCreated(
    accountUuid: string,
    task: any, // TaskServerDTO
  ): Promise<void> {
    try {
      // 使用工厂创建调度任务
      const scheduleTask = this.taskFactory.createFromSourceEntity({
        accountUuid,
        sourceModule: 'TASK' as any,
        sourceEntityId: task.uuid,
        sourceEntity: task,
      });

      // 保存调度任务
      const scheduleService = await ScheduleApplicationService.getInstance();
      const metadataDTO = scheduleTask.metadata.toDTO();
      
      await scheduleService.createScheduleTask({
        accountUuid,
        name: scheduleTask.name,
        description: scheduleTask.description ?? undefined,
        sourceModule: scheduleTask.sourceModule,
        sourceEntityId: scheduleTask.sourceEntityId,
        schedule: scheduleTask.schedule,
        retryConfig: scheduleTask.retryPolicy,
        payload: metadataDTO.payload,
        tags: metadataDTO.tags,
      });

      console.log(
        `✅ [ScheduleEventPublisher] Created schedule task for Task ${task.uuid}`,
      );
    } catch (error: any) {
      // 如果 Task 不需要调度（不是循环任务或没有提醒配置），这是正常情况
      if (error.message?.includes('does not have valid')) {
        console.log(`ℹ️  [ScheduleEventPublisher] Task ${task.uuid} does not require scheduling`);
      } else {
        console.error(`❌ [ScheduleEventPublisher] Failed to create schedule for Task ${task.uuid}:`, error);
      }
    }
  }

  /**
   * 处理 Task 删除事件
   */
  private static async handleTaskDeleted(
    accountUuid: string,
    taskUuid: string,
  ): Promise<void> {
    try {
      const scheduleService = await ScheduleApplicationService.getInstance();
      await scheduleService.deleteScheduleTasksBySource('TASK' as any, taskUuid, accountUuid);
      
      console.log(
        `✅ [ScheduleEventPublisher] Deleted schedule tasks for Task ${taskUuid}`,
      );
    } catch (error) {
      console.error(`❌ [ScheduleEventPublisher] Failed to delete schedules for Task ${taskUuid}:`, error);
    }
  }

  /**
   * 处理 Reminder 删除事件
   */
  private static async handleReminderDeleted(
    accountUuid: string,
    reminderUuid: string,
  ): Promise<void> {
    try {
      const scheduleService = await ScheduleApplicationService.getInstance();
      await scheduleService.deleteScheduleTasksBySource('REMINDER' as any, reminderUuid, accountUuid);
      
      console.log(
        `✅ [ScheduleEventPublisher] Deleted schedule tasks for Reminder ${reminderUuid}`,
      );
    } catch (error) {
      console.error(`❌ [ScheduleEventPublisher] Failed to delete schedules for Reminder ${reminderUuid}:`, error);
    }
  }

  /**
   * 处理 Reminder 创建事件
   */
  private static async handleReminderCreated(
    accountUuid: string,
    reminder: any, // ReminderServerDTO
  ): Promise<void> {
    try {
      // 使用工厂创建调度任务
      const scheduleTask = this.taskFactory.createFromSourceEntity({
        accountUuid,
        sourceModule: 'REMINDER' as any,
        sourceEntityId: reminder.uuid,
        sourceEntity: reminder,
      });

      // 保存调度任务
      const scheduleService = await ScheduleApplicationService.getInstance();
      const metadataDTO = scheduleTask.metadata.toDTO();
      
      await scheduleService.createScheduleTask({
        accountUuid,
        name: scheduleTask.name,
        description: scheduleTask.description ?? undefined,
        sourceModule: scheduleTask.sourceModule,
        sourceEntityId: scheduleTask.sourceEntityId,
        schedule: scheduleTask.schedule,
        retryConfig: scheduleTask.retryPolicy,
        payload: metadataDTO.payload,
        tags: metadataDTO.tags,
      });

      console.log(
        `✅ [ScheduleEventPublisher] Created schedule task for Reminder ${reminder.uuid}`,
      );
    } catch (error: any) {
      // 如果 Reminder 不需要调度（未启用或配置无效），这是正常情况
      if (error.message?.includes('does not have valid')) {
        console.log(`ℹ️  [ScheduleEventPublisher] Reminder ${reminder.uuid} does not require scheduling`);
      } else {
        console.error(`❌ [ScheduleEventPublisher] Failed to create schedule for Reminder ${reminder.uuid}:`, error);
      }
    }
  }

  /**
   * 发布 ScheduleTask 聚合根的领域事件
   * @param task ScheduleTask 聚合根实例
   */
  static async publishScheduleTaskEvents(task: ScheduleTask): Promise<void> {
    const events = task.getDomainEvents();
    if (events.length === 0) {
      return;
    }

    console.log(
      `📤 [ScheduleEventPublisher] Publishing ${events.length} events for schedule task ${task.uuid}`,
    );

    for (const event of events) {
      await eventBus.publish(event);
    }

    // 清除已发布的事件
    task.clearDomainEvents();
  }

  /**
   * 重置事件监听器（主要用于测试）
   */
  static reset(): void {
    console.log('🔄 [ScheduleEventPublisher] Resetting event listeners...');

    // 移除所有 Schedule 相关的事件监听器
    const eventTypes = [
      // Goal 模块事件
      'goal.created',
      'goal.deleted',
      // Task 模块事件
      'task.created',
      'task.deleted',
      // Reminder 模块事件
      'reminder.created',
      'reminder.deleted',
      // ScheduleTask 自身事件
      'schedule.task.created',
      'schedule.task.execution_succeeded',
      'schedule.task.execution_failed',
      'schedule.task.completed',
    ];

    for (const eventType of eventTypes) {
      eventBus.off(eventType);
    }

    this.isInitialized = false;
  }
}
