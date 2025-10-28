/**
 * 提醒模块调度集成服务
 * 处理提醒系统与调度系统的集成逻辑
 */
import { getScheduleWebService } from '../../schedule';

// 临时类型定义，与调度模块保持一致
interface CreateScheduleTaskRequest {
  name: string;
  description: string;
  taskType: string;
  cronExpression: string;
  config?: any;
  status: 'ACTIVE' | 'PAUSED';
  metadata?: any;
}

interface UpdateScheduleTaskRequest {
  name?: string;
  description?: string;
  taskType?: string;
  cronExpression?: string;
  config?: any;
  metadata?: any;
}

interface ScheduleConfig {
  retryOnFailure?: boolean;
  maxRetries?: number;
  retryInterval?: number;
  timeout?: number;
  environment?: string;
}

interface ScheduleTask {
  id: string;
  name: string;
  description?: string;
  taskType: string;
  cronExpression: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'FAILED';
  config?: any;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

// 提醒信息接口
export interface ReminderInfo {
  id: string;
  title: string;
  content: string;
  scheduledTime: string;
  reminderType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  isRecurring?: boolean;
  scheduleConfig?: ScheduleConfig;
  tags?: string[];
}

// 提醒调度配置接口
export interface ReminderScheduleConfig extends ScheduleConfig {
  reminderType: string;
  priority: string;
  notificationChannels: ('DESKTOP' | 'EMAIL' | 'SMS')[];
  snoozeEnabled: boolean;
  snoozeDuration: number; // 分钟
  maxSnoozeCount: number;
}

// 操作结果接口
export interface ReminderScheduleResult {
  success: boolean;
  scheduleId?: string;
  message?: string;
  data?: any;
}

class ReminderScheduleIntegrationService {
  /**
   * 创建提醒调度
   */
  async createReminderSchedule(reminder: ReminderInfo): Promise<ReminderScheduleResult> {
    try {
      const scheduleRequest: CreateScheduleTaskRequest = {
        name: `提醒: ${reminder.title}`,
        description: reminder.content || '自动生成的提醒任务',
        taskType: this.mapReminderTypeToScheduleType(reminder.reminderType),
        cronExpression: this.generateCronExpression(reminder),
        config: reminder.scheduleConfig || this.createDefaultReminderScheduleConfig(reminder),
        status: 'ACTIVE',
        metadata: {
          reminderInfo: reminder,
          source: 'REMINDER_MODULE',
          priority: reminder.priority,
          tags: reminder.tags || [],
        },
      };

      const scheduleTask = await getScheduleWebService().createScheduleTask(scheduleRequest);

      // 发布集成事件（暂时使用 console.log 代替 eventBus）
      console.log('reminder-schedule-created', {
        reminderId: reminder.id,
        scheduleId: scheduleTask.uuid,
        scheduleTask,
      });

      return {
        success: true,
        scheduleId: scheduleTask.uuid,
        message: '提醒调度创建成功',
        data: scheduleTask,
      };
    } catch (error) {
      console.error('创建提醒调度失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  /**
   * 更新提醒调度
   */
  async updateReminderSchedule(
    scheduleId: string,
    reminder: ReminderInfo,
  ): Promise<ReminderScheduleResult> {
    try {
      const updateRequest: UpdateScheduleTaskRequest = {
        name: `提醒: ${reminder.title}`,
        description: reminder.content || '自动生成的提醒任务',
        taskType: this.mapReminderTypeToScheduleType(reminder.reminderType),
        cronExpression: this.generateCronExpression(reminder),
        config: reminder.scheduleConfig || this.createDefaultReminderScheduleConfig(reminder),
        metadata: {
          reminderInfo: reminder,
          source: 'REMINDER_MODULE',
          priority: reminder.priority,
          tags: reminder.tags || [],
        },
      };

      const scheduleTask = await getScheduleWebService().updateScheduleTask(
        scheduleId,
        updateRequest,
      );

      // 发布集成事件（暂时使用 console.log 代替 eventBus）
      console.log('reminder-schedule-updated', {
        reminderId: reminder.id,
        scheduleId,
        scheduleTask,
      });

      return {
        success: true,
        scheduleId,
        message: '提醒调度更新成功',
        data: scheduleTask,
      };
    } catch (error) {
      console.error('更新提醒调度失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  /**
   * 删除提醒调度
   */
  async deleteReminderSchedule(
    scheduleId: string,
    reminderId?: string,
  ): Promise<ReminderScheduleResult> {
    try {
      await getScheduleWebService().deleteScheduleTask(scheduleId);

      // 发布集成事件（暂时使用 console.log 代替 eventBus）
      console.log('reminder-schedule-deleted', {
        reminderId,
        scheduleId,
      });

      return {
        success: true,
        scheduleId,
        message: '提醒调度删除成功',
      };
    } catch (error) {
      console.error('删除提醒调度失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  /**
   * 暂停提醒调度
   */
  async pauseReminderSchedule(scheduleId: string): Promise<ReminderScheduleResult> {
    try {
      await getScheduleWebService().pauseScheduleTask(scheduleId);

      console.log('reminder-schedule-paused', { scheduleId });

      return {
        success: true,
        scheduleId,
        message: '提醒调度已暂停',
      };
    } catch (error) {
      console.error('暂停提醒调度失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  /**
   * 启用提醒调度
   */
  async enableReminderSchedule(scheduleId: string): Promise<ReminderScheduleResult> {
    try {
      await getScheduleWebService().enableScheduleTask(scheduleId);

      console.log('reminder-schedule-enabled', { scheduleId });

      return {
        success: true,
        scheduleId,
        message: '提醒调度已启用',
      };
    } catch (error) {
      console.error('启用提醒调度失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  /**
   * 获取提醒相关的调度任务
   */
  async getReminderSchedules(): Promise<ScheduleTask[]> {
    try {
      const response = await getScheduleWebService().getScheduleTasks();
      // @ts-expect-error - 临时类型不匹配，待重构
      return response.tasks.filter(
        (task: ScheduleTask) =>
          task.taskType.includes('REMINDER') || task.taskType.includes('NOTIFICATION'),
      );
    } catch (error) {
      console.error('获取提醒调度列表失败:', error);
      return [];
    }
  }

  /**
   * 创建默认的提醒调度配置
   */
  createDefaultReminderScheduleConfig(reminder: ReminderInfo): ReminderScheduleConfig {
    return {
      reminderType: reminder.reminderType,
      priority: reminder.priority,
      notificationChannels: ['DESKTOP'],
      snoozeEnabled: true,
      snoozeDuration: 5, // 默认5分钟
      maxSnoozeCount: 3,
      retryOnFailure: true,
      maxRetries: 2,
      retryInterval: 60000, // 1分钟
      timeout: 30000, // 30秒
      environment: process.env.NODE_ENV || 'development',
    };
  }

  /**
   * 映射提醒类型到调度类型
   */
  private mapReminderTypeToScheduleType(reminderType: string): string {
    const typeMap: Record<string, string> = {
      DAILY: 'DAILY_REMINDER',
      WEEKLY: 'WEEKLY_REMINDER',
      MONTHLY: 'MONTHLY_REMINDER',
      CUSTOM: 'CUSTOM_REMINDER',
      ONCE: 'ONE_TIME_REMINDER',
      RECURRING: 'RECURRING_REMINDER',
    };
    return typeMap[reminderType] || 'CUSTOM_REMINDER';
  }

  /**
   * 生成 Cron 表达式
   */
  private generateCronExpression(reminder: ReminderInfo): string {
    const scheduledDate = new Date(reminder.scheduledTime);
    const minute = scheduledDate.getMinutes();
    const hour = scheduledDate.getHours();
    const day = scheduledDate.getDate();
    const month = scheduledDate.getMonth() + 1;
    const dayOfWeek = scheduledDate.getDay();

    switch (reminder.reminderType) {
      case 'DAILY':
        return `${minute} ${hour} * * *`;
      case 'WEEKLY':
        return `${minute} ${hour} * * ${dayOfWeek}`;
      case 'MONTHLY':
        return `${minute} ${hour} ${day} * *`;
      case 'CUSTOM':
        // 对于自定义类型，检查是否是重复提醒
        if (reminder.isRecurring) {
          return `${minute} ${hour} * * *`; // 默认每日重复
        } else {
          // 一次性提醒 - 在指定时间执行一次
          return `${minute} ${hour} ${day} ${month} *`;
        }
      default:
        return `${minute} ${hour} ${day} ${month} *`;
    }
  }

  /**
   * 验证提醒调度配置
   */
  validateReminderScheduleConfig(reminder: ReminderInfo): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!reminder.title?.trim()) {
      errors.push('提醒标题不能为空');
    }

    if (!reminder.scheduledTime) {
      errors.push('调度时间不能为空');
    } else {
      const scheduledDate = new Date(reminder.scheduledTime);
      if (isNaN(scheduledDate.getTime())) {
        errors.push('调度时间格式无效');
      } else if (scheduledDate <= new Date()) {
        errors.push('调度时间不能早于当前时间');
      }
    }

    const validTypes = ['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM'];
    if (!validTypes.includes(reminder.reminderType)) {
      errors.push('无效的提醒类型');
    }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    if (!validPriorities.includes(reminder.priority)) {
      errors.push('无效的优先级');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 获取提醒调度统计信息
   */
  async getReminderScheduleStats() {
    try {
      const reminderSchedules = await this.getReminderSchedules();
      const activeSchedules = reminderSchedules.filter((task) => task.status === 'ACTIVE');
      const pausedSchedules = reminderSchedules.filter((task) => task.status === 'PAUSED');

      return {
        total: reminderSchedules.length,
        active: activeSchedules.length,
        paused: pausedSchedules.length,
        byType: this.groupSchedulesByType(reminderSchedules),
        byPriority: this.groupSchedulesByPriority(reminderSchedules),
      };
    } catch (error) {
      console.error('获取提醒调度统计失败:', error);
      return {
        total: 0,
        active: 0,
        paused: 0,
        byType: {},
        byPriority: {},
      };
    }
  }

  private groupSchedulesByType(schedules: ScheduleTask[]) {
    return schedules.reduce(
      (acc, schedule) => {
        const type = schedule.taskType;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  private groupSchedulesByPriority(schedules: ScheduleTask[]) {
    return schedules.reduce(
      (acc, schedule) => {
        const priority = schedule.metadata?.priority || 'MEDIUM';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }
}

// 导出单例实例
export const reminderScheduleIntegrationService = new ReminderScheduleIntegrationService();
export default reminderScheduleIntegrationService;
