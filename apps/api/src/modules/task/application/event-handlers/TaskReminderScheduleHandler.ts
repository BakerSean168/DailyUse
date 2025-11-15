/**
 * Task提醒调度处理器
 * 
 * 职责：
 * - 监听 ScheduleTaskTriggered 事件
 * - 检查当天的 TaskInstance
 * - 发送提醒通知
 * 
 * 设计策略（方案 C）：
 * - 不创建 ReminderTemplate（避免资源浪费）
 * - 使用 ScheduleTask 的 cron 触发
 * - 检查 Instance 是否被用户修改过时间
 * - 直接发送通知
 */

import type { DomainEvent } from '@dailyuse/utils';
import type { TaskContracts } from '@dailyuse/contracts';
import { TaskContainer } from '../../infrastructure/di/TaskContainer';

interface ScheduleTaskTriggeredPayload {
  taskUuid: string;
  taskName: string;
  sourceModule: string;
  sourceEntityId: string; // TaskTemplate.uuid
  executionTime: number;
  metadata?: {
    payload?: {
      taskUuid?: string;
      taskTitle?: string;
      taskType?: TaskContracts.TaskType;
      reminderTriggers?: Array<{
        type: TaskContracts.ReminderTriggerType;
        relativeValue?: number;
        relativeUnit?: TaskContracts.ReminderTimeUnit;
        absoluteTime?: number;
      }>;
    };
  };
}

export class TaskReminderScheduleHandler {
  /**
   * 处理 ScheduleTask 触发事件
   */
  async handle(event: DomainEvent<ScheduleTaskTriggeredPayload>): Promise<void> {
    const { sourceModule, sourceEntityId, metadata } = event.payload;

    // 只处理 TASK 模块的事件
    if (sourceModule !== 'TASK') {
      return;
    }

    const templateUuid = sourceEntityId;
    console.log(`[TaskReminderScheduleHandler] 收到 Task 提醒触发: template=${templateUuid}`);

    try {
      // 1. 获取今天的 TaskInstance
      const today = new Date().setHours(0, 0, 0, 0);
      const container = TaskContainer.getInstance();
      const instanceRepository = container.getTaskInstanceRepository();
      
      const instances = await instanceRepository.findByTemplateUuidAndDateRange(
        templateUuid,
        today,
        today
      );

      if (instances.length === 0) {
        console.warn(`[TaskReminderScheduleHandler] 未找到今天的任务实例: template=${templateUuid}, date=${new Date(today).toISOString()}`);
        return;
      }

      const instance = instances[0];
      console.log(`[TaskReminderScheduleHandler] 找到今天的任务实例: ${instance.uuid}, title="${instance.title}"`);

      // 2. 获取提醒配置
      const reminderTriggers = metadata?.payload?.reminderTriggers;
      if (!reminderTriggers || reminderTriggers.length === 0) {
        console.log(`[TaskReminderScheduleHandler] 任务实例没有提醒触发器，跳过`);
        return;
      }

      // 3. 发送提醒通知
      await this.sendReminderNotification(instance, reminderTriggers);
      
      console.log(`✅ [TaskReminderScheduleHandler] 提醒发送成功: instance=${instance.uuid}`);
    } catch (error) {
      console.error(`❌ [TaskReminderScheduleHandler] 处理失败:`, error);
    }
  }

  /**
   * 发送提醒通知
   * 
   * @param instance 任务实例
   * @param triggers 提醒触发器配置
   */
  private async sendReminderNotification(
    instance: any,
    triggers: Array<{
      type: TaskContracts.ReminderTriggerType;
      relativeValue?: number;
      relativeUnit?: TaskContracts.ReminderTimeUnit;
      absoluteTime?: number;
    }>
  ): Promise<void> {
    // 获取第一个触发器（简化处理，后续可以支持多个）
    const trigger = triggers[0];

    // 计算提醒时间
    let reminderTime = Date.now();
    if (trigger.type === 'ABSOLUTE' && trigger.absoluteTime) {
      reminderTime = trigger.absoluteTime;
    } else if (trigger.type === 'RELATIVE' && trigger.relativeValue && trigger.relativeUnit) {
      // 从任务的时间配置中获取任务时间
      const instanceDate = instance.instanceDate; // TaskInstance 的日期（timestamp）
      const offsetMinutes = this.convertToMinutes(trigger.relativeValue, trigger.relativeUnit);
      reminderTime = instanceDate - offsetMinutes * 60 * 1000;
    }

    // 检查是否已经到达提醒时间
    const now = Date.now();
    if (reminderTime > now) {
      console.log(`[TaskReminderScheduleHandler] 提醒时间未到，跳过: reminderTime=${new Date(reminderTime).toISOString()}, now=${new Date(now).toISOString()}`);
      return;
    }

    // 发送通知（TODO: 集成通知服务）
    console.log(`📢 [TaskReminderScheduleHandler] 发送提醒通知:`);
    console.log(`   - 任务: ${instance.title}`);
    console.log(`   - 时间: ${new Date(reminderTime).toLocaleString('zh-CN')}`);
    console.log(`   - 实例: ${instance.uuid}`);

    // TODO: 调用通知服务
    // await notificationService.send({
    //   accountUuid: instance.accountUuid,
    //   title: `任务提醒: ${instance.title}`,
    //   body: `您的任务即将开始`,
    //   type: 'TASK_REMINDER',
    //   metadata: {
    //     instanceUuid: instance.uuid,
    //     templateUuid: instance.templateUuid,
    //   },
    // });
  }

  /**
   * 转换时间单位到分钟
   */
  private convertToMinutes(value: number, unit: TaskContracts.ReminderTimeUnit): number {
    switch (unit) {
      case 'MINUTES':
        return value;
      case 'HOURS':
        return value * 60;
      case 'DAYS':
        return value * 24 * 60;
      default:
        return 0;
    }
  }
}
