/**
 * 提醒通知处理器
 * @description 监听 SSE 提醒事件并触发系统通知
 */

import { eventBus } from '@dailyuse/utils';
import { NotificationService } from '../services/NotificationService';
import {
  NotificationType,
  NotificationPriority,
  NotificationMethod,
  SoundType,
} from '../../application/types';
import type { NotificationConfig, SoundConfig } from '../../application/types';

/**
 * SSE 提醒事件数据格式
 */
interface ReminderEventData {
  id: string;
  title: string;
  message: string;
  type: 'GENERAL_REMINDER' | 'TASK_REMINDER' | 'GOAL_REMINDER';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  alertMethods: Array<'POPUP' | 'SOUND' | 'SYSTEM_NOTIFICATION'>;
  soundVolume?: number;
  popupDuration?: number;
  allowSnooze?: boolean;
  snoozeOptions?: number[];
  customActions?: Array<{
    id: string;
    label: string;
    action: string;
  }>;
  timestamp: string;
  // 额外的任务/目标信息
  taskId?: string;
  goalId?: string;
  scheduleTaskUuid?: string;
}

/**
 * 提醒通知处理器
 */
export class ReminderNotificationHandler {
  private notificationService: NotificationService;
  private initialized = false;

  constructor() {
    this.notificationService = NotificationService.getInstance();
  }

  /**
   * 初始化事件监听
   * 统一监听 reminder-triggered 事件，根据 payload 中的数据决定通知方式
   */
  initialize(): void {
    if (this.initialized) {
      console.warn('[ReminderNotificationHandler] 已经初始化过了');
      return;
    }

    console.log('[ReminderNotificationHandler] 初始化提醒通知处理器');

    // ✅ 统一监听 reminder-triggered 事件（推荐方式）
    // Schedule 模块触发此事件，Notification 模块处理
    eventBus.on('reminder-triggered', this.handleReminderTriggered.bind(this));

    this.initialized = true;
    console.log('[ReminderNotificationHandler] ✅ 事件监听器已设置（统一 reminder-triggered）');
  }

  /**
   * 标准化提醒数据格式
   * 兼容后端发送的不同数据格式
   */
  private normalizeReminderData(data: any): ReminderEventData | null {
    // 如果已经是完整的 ReminderEventData 格式
    if (data.id && data.title && data.message) {
      return data as ReminderEventData;
    }

    // 如果是系统通知格式 {title, body, icon}
    if (data.title && data.body) {
      return {
        id: `notification-${Date.now()}`,
        title: data.title,
        message: data.body,
        type: 'GENERAL_REMINDER',
        priority: 'NORMAL',
        alertMethods: ['SYSTEM_NOTIFICATION'],
        timestamp: new Date().toISOString(),
      };
    }

    // 如果只有部分信息，无法创建有效通知
    return null;
  }

  /**
   * 处理通用提醒（根据 payload 中的信息决定提醒方式）
   * 这是唯一的处理入口，支持 Schedule 模块发送的标准格式
   */
  private async handleReminderTriggered(data: any): Promise<void> {
    console.log('[ReminderNotificationHandler] 📨 收到提醒事件:', {
      id: data.id || data.reminderId,
      sourceType: data.sourceType || data.type,
      title: data.title,
    });

    // 标准化数据格式
    const reminderData = this.normalizeReminderData(data);
    if (!reminderData) {
      console.warn('[ReminderNotificationHandler] ⚠️ 无效的提醒数据，跳过处理');
      return;
    }

    // 将 alertMethods 转换为 NotificationMethod
    const methods: NotificationMethod[] = [];

    if (
      reminderData.alertMethods?.includes('POPUP') ||
      reminderData.alertMethods?.includes('SYSTEM_NOTIFICATION')
    ) {
      methods.push(NotificationMethod.DESKTOP);
    }

    if (reminderData.alertMethods?.includes('SOUND')) {
      methods.push(NotificationMethod.SOUND);
    }

    // 如果没有指定方法，默认使用桌面通知和声音
    if (methods.length === 0) {
      methods.push(NotificationMethod.DESKTOP, NotificationMethod.SOUND);
    }

    console.log('[ReminderNotificationHandler] 🔔 准备显示通知，方式:', methods);

    const config = this.buildNotificationConfig(reminderData, methods);
    await this.notificationService.show(config);
  }

  /**
   * 构建通知配置
   */
  private buildNotificationConfig(
    data: ReminderEventData,
    methods: NotificationMethod[],
  ): NotificationConfig {
    // 映射优先级
    const priorityMap: Record<string, NotificationPriority> = {
      LOW: NotificationPriority.LOW,
      NORMAL: NotificationPriority.NORMAL,
      HIGH: NotificationPriority.HIGH,
      URGENT: NotificationPriority.URGENT,
    };

    const priority = priorityMap[data.priority] || NotificationPriority.NORMAL;

    // 构建音效配置
    const soundConfig: SoundConfig = {
      enabled: methods.includes(NotificationMethod.SOUND),
      type: this.getSoundTypeFromPriority(priority),
      volume: data.soundVolume !== undefined ? data.soundVolume / 100 : 0.7,
    };

    // 构建操作按钮
    const actions = this.buildNotificationActions(data);

    // 构建通知配置
    const config: NotificationConfig = {
      id: data.id || `reminder-${Date.now()}`,
      title: data.title,
      message: data.message,
      type: NotificationType.REMINDER,
      priority,
      methods,
      sound: soundConfig,
      autoClose: data.popupDuration ? data.popupDuration * 1000 : 30000, // 转换为毫秒
      persistent: priority === NotificationPriority.URGENT,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      actions,
      desktop: {
        icon: this.getNotificationIcon(data.type),
        requireInteraction: priority === NotificationPriority.URGENT,
        tag: `reminder-${data.id}`,
        renotify: false,
      },
      sourceModule: 'schedule',
      data: {
        taskId: data.taskId,
        goalId: data.goalId,
        scheduleTaskUuid: data.scheduleTaskUuid,
        reminderType: data.type,
      },
    };

    return config;
  }

  /**
   * 根据优先级获取音效类型
   */
  private getSoundTypeFromPriority(priority: NotificationPriority): SoundType {
    switch (priority) {
      case NotificationPriority.URGENT:
      case NotificationPriority.HIGH:
        return SoundType.ALERT;
      case NotificationPriority.NORMAL:
        return SoundType.REMINDER;
      case NotificationPriority.LOW:
        return SoundType.NOTIFICATION;
      default:
        return SoundType.DEFAULT;
    }
  }

  /**
   * 获取通知图标
   */
  private getNotificationIcon(reminderType: string): string {
    const iconMap: Record<string, string> = {
      GENERAL_REMINDER: '/icons/reminder.png',
      TASK_REMINDER: '/icons/task.png',
      GOAL_REMINDER: '/icons/goal.png',
    };

    return iconMap[reminderType] || '/icons/reminder.png';
  }

  /**
   * 构建通知操作按钮
   */
  private buildNotificationActions(data: ReminderEventData) {
    const actions = [];

    // 小睡按钮（如果允许）
    if (data.allowSnooze && data.snoozeOptions && data.snoozeOptions.length > 0) {
      actions.push({
        id: 'snooze',
        label: `稍后提醒 (${data.snoozeOptions[0]}分钟)`,
        action: 'snooze',
        primary: false,
        handler: (config: NotificationConfig) => {
          console.log(`[ReminderNotificationHandler] 小睡 ${data.snoozeOptions![0]} 分钟`);
          // TODO: 实现小睡功能
          eventBus.emit('reminder:snooze', {
            reminderId: data.id,
            duration: data.snoozeOptions![0],
          });
        },
      });
    }

    // 查看详情按钮
    actions.push({
      id: 'view',
      label: '查看详情',
      action: 'view',
      primary: true,
      handler: (config: NotificationConfig) => {
        console.log('[ReminderNotificationHandler] 查看详情');

        // 根据提醒类型跳转到相应页面
        if (data.taskId) {
          // 跳转到任务详情
          eventBus.emit('navigate:task-detail', data.taskId);
        } else if (data.goalId) {
          // 跳转到目标详情
          eventBus.emit('navigate:goal-detail', data.goalId);
        } else if (data.scheduleTaskUuid) {
          // 跳转到调度任务列表
          eventBus.emit('navigate:schedule-list', { highlightId: data.scheduleTaskUuid });
        }
      },
    });

    // 关闭按钮
    actions.push({
      id: 'dismiss',
      label: '关闭',
      action: 'dismiss',
      primary: false,
      handler: (config: NotificationConfig) => {
        console.log('[ReminderNotificationHandler] 关闭通知');
        // 通知会自动关闭
      },
    });

    // 自定义操作
    if (data.customActions && data.customActions.length > 0) {
      data.customActions.forEach((customAction) => {
        actions.push({
          id: customAction.id,
          label: customAction.label,
          action: customAction.action,
          primary: false,
          handler: (config: NotificationConfig) => {
            console.log(`[ReminderNotificationHandler] 执行自定义操作: ${customAction.action}`);
            eventBus.emit('reminder:custom-action', {
              reminderId: data.id,
              actionId: customAction.id,
              action: customAction.action,
            });
          },
        });
      });
    }

    return actions;
  }

  /**
   * 销毁处理器
   */
  destroy(): void {
    if (!this.initialized) return;

    console.log('[ReminderNotificationHandler] 销毁提醒通知处理器');

    // 移除统一的事件监听
    eventBus.off('reminder-triggered', this.handleReminderTriggered.bind(this));

    this.initialized = false;
    console.log('[ReminderNotificationHandler] ✅ 提醒通知处理器已销毁');
  }
}

// 导出单例
export const reminderNotificationHandler = new ReminderNotificationHandler();
