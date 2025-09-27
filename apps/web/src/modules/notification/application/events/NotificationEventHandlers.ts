/**
 * Notification 模块事件处理器
 * @description 监听Schedule模块的提醒触发事件，处理系统级通知
 */

import { eventBus } from '@dailyuse/utils';
import { NotificationService } from '../services/NotificationService';

import {
  NotificationType,
  NotificationPriority,
  NotificationMethod,
  SoundType,
} from '../../domain/types';

import type { ReminderTriggeredPayload, NotificationConfig, SoundConfig } from '../../domain/types';

import {
  NOTIFICATION_EVENTS,
  SCHEDULE_EVENTS,
  onReminderTriggered,
  onScheduleReminderTriggered,
} from '../events/notificationEvents';

/**
 * Notification模块事件处理器
 */
export class NotificationEventHandlers {
  private notificationService: NotificationService;
  private isInitialized = false;

  constructor() {
    this.notificationService = NotificationService.getInstance();
  }

  /**
   * 初始化事件监听器
   */
  initializeEventHandlers(): void {
    if (this.isInitialized) {
      console.warn('[NotificationEventHandlers] 事件处理器已初始化');
      return;
    }

    console.log('[NotificationEventHandlers] 初始化事件处理器...');

    // 监听Schedule模块的提醒触发事件
    this.setupScheduleEventListeners();

    // 监听Notification模块内部事件
    this.setupInternalEventListeners();

    // 监听系统事件
    this.setupSystemEventListeners();

    this.isInitialized = true;
    console.log('[NotificationEventHandlers] 事件处理器初始化完成');
  }

  /**
   * 设置Schedule模块事件监听器
   */
  private setupScheduleEventListeners(): void {
    console.log('[NotificationEventHandlers] 设置Schedule事件监听器');

    // 监听调度器发送的弹窗提醒事件（主要事件）
    eventBus.on('ui:show-popup-reminder', async (payload: any) => {
      console.log('[NotificationEventHandlers] 🔔 收到调度器弹窗提醒事件:', {
        id: payload.id,
        title: payload.title,
        type: payload.type,
        priority: payload.priority,
      });

      // 转换调度器载荷为标准格式
      const standardPayload = this.convertSchedulerPayloadToStandard(payload);
      await this.handleReminderTriggered(standardPayload);
    });

    // 监听通用的提醒触发事件
    onScheduleReminderTriggered(async (payload: ReminderTriggeredPayload) => {
      await this.handleReminderTriggered(payload);
    });

    // 监听Notification模块内部的提醒触发事件（用于测试）
    onReminderTriggered(async (payload: ReminderTriggeredPayload) => {
      await this.handleReminderTriggered(payload);
    });

    // 监听具体的Schedule事件类型
    eventBus.on('schedule:task-reminder-triggered', async (payload: ReminderTriggeredPayload) => {
      console.log('[NotificationEventHandlers] 收到任务提醒触发事件:', payload.reminderId);
      await this.handleTaskReminderTriggered(payload);
    });

    eventBus.on('schedule:goal-reminder-triggered', async (payload: ReminderTriggeredPayload) => {
      console.log('[NotificationEventHandlers] 收到目标提醒触发事件:', payload.reminderId);
      await this.handleGoalReminderTriggered(payload);
    });

    eventBus.on('schedule:custom-reminder-triggered', async (payload: ReminderTriggeredPayload) => {
      console.log('[NotificationEventHandlers] 收到自定义提醒触发事件:', payload.reminderId);
      await this.handleCustomReminderTriggered(payload);
    });

    // 监听通用的Schedule提醒事件（兼容不同版本）
    eventBus.on('reminder-triggered', async (payload: any) => {
      console.log('[NotificationEventHandlers] 收到通用提醒触发事件（兼容）:', payload);

      // 转换为标准格式
      const standardPayload = this.convertToStandardPayload(payload);
      await this.handleReminderTriggered(standardPayload);
    });
  }

  /**
   * 设置内部事件监听器
   */
  private setupInternalEventListeners(): void {
    console.log('[NotificationEventHandlers] 设置内部事件监听器');

    // 监听通知创建事件（用于统计和日志）
    eventBus.on(NOTIFICATION_EVENTS.NOTIFICATION_CREATED, (payload) => {
      console.log('[NotificationEventHandlers] 通知已创建:', payload.notification.id);
    });

    // 监听通知显示事件
    eventBus.on(NOTIFICATION_EVENTS.NOTIFICATION_SHOWN, (payload) => {
      console.log(
        '[NotificationEventHandlers] 通知已显示:',
        payload.notification.id,
        payload.displayMethod,
      );
    });

    // 监听通知点击事件
    eventBus.on(NOTIFICATION_EVENTS.NOTIFICATION_CLICKED, (payload) => {
      console.log(
        '[NotificationEventHandlers] 通知被点击:',
        payload.notification.id,
        payload.actionId,
      );
    });

    // 监听权限变更事件
    eventBus.on(NOTIFICATION_EVENTS.PERMISSION_CHANGED, (payload) => {
      console.log(
        '[NotificationEventHandlers] 通知权限变更:',
        payload.oldPermission,
        '->',
        payload.newPermission,
      );
    });

    // 监听配置更新事件
    eventBus.on(NOTIFICATION_EVENTS.CONFIG_UPDATED, (payload) => {
      console.log('[NotificationEventHandlers] 通知配置已更新:', payload.changedFields);
    });

    // 监听错误事件
    eventBus.on(NOTIFICATION_EVENTS.ERROR, (payload) => {
      console.error(
        '[NotificationEventHandlers] 通知错误:',
        payload.error.message,
        payload.context,
      );
    });
  }

  /**
   * 设置系统事件监听器
   */
  private setupSystemEventListeners(): void {
    console.log('[NotificationEventHandlers] 设置系统事件监听器');

    // 监听用户登出事件
    eventBus.on('auth:user-logged-out', () => {
      console.log('[NotificationEventHandlers] 用户登出，清理通知');
      this.notificationService.dismissAll();
    });

    // 监听应用失去焦点事件
    window.addEventListener('blur', () => {
      console.log('[NotificationEventHandlers] 应用失去焦点');
    });

    // 监听应用获得焦点事件
    window.addEventListener('focus', () => {
      console.log('[NotificationEventHandlers] 应用获得焦点');
    });

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('[NotificationEventHandlers] 页面隐藏');
      } else {
        console.log('[NotificationEventHandlers] 页面显示');
      }
    });
  }

  /**
   * 处理提醒触发事件
   */
  private async handleReminderTriggered(payload: ReminderTriggeredPayload): Promise<void> {
    try {
      console.log('[NotificationEventHandlers] 处理提醒触发:', {
        reminderId: payload.reminderId,
        sourceType: payload.sourceType,
        sourceId: payload.sourceId,
        title: payload.title,
      });

      // 创建通知配置
      const notificationConfig = this.createNotificationFromReminder(payload);

      // 显示通知
      await this.notificationService.show(notificationConfig);

      console.log('[NotificationEventHandlers] 提醒通知已显示:', notificationConfig.id);
    } catch (error) {
      console.error('[NotificationEventHandlers] 处理提醒触发失败:', error);
    }
  }

  /**
   * 处理任务提醒触发
   */
  private async handleTaskReminderTriggered(payload: ReminderTriggeredPayload): Promise<void> {
    console.log('[NotificationEventHandlers] 处理任务提醒:', payload.reminderId);

    // 任务提醒通常优先级较高
    const enhancedPayload = {
      ...payload,
      priority: NotificationPriority.HIGH,
      methods: [NotificationMethod.DESKTOP, NotificationMethod.SOUND],
    };

    await this.handleReminderTriggered(enhancedPayload);
  }

  /**
   * 处理目标提醒触发
   */
  private async handleGoalReminderTriggered(payload: ReminderTriggeredPayload): Promise<void> {
    console.log('[NotificationEventHandlers] 处理目标提醒:', payload.reminderId);

    // 目标提醒使用特殊音效
    const enhancedPayload = {
      ...payload,
      priority: NotificationPriority.NORMAL,
      methods: [NotificationMethod.DESKTOP, NotificationMethod.SOUND],
    };

    await this.handleReminderTriggered(enhancedPayload);
  }

  /**
   * 处理自定义提醒触发
   */
  private async handleCustomReminderTriggered(payload: ReminderTriggeredPayload): Promise<void> {
    console.log('[NotificationEventHandlers] 处理自定义提醒:', payload.reminderId);
    await this.handleReminderTriggered(payload);
  }

  /**
   * 从提醒载荷创建通知配置
   */
  private createNotificationFromReminder(payload: ReminderTriggeredPayload): NotificationConfig {
    // 根据来源类型确定通知类型
    const notificationType = this.mapSourceTypeToNotificationType(payload.sourceType);

    // 根据来源类型确定音效
    const soundConfig = this.createSoundConfigForSource(payload.sourceType);

    // 创建通知ID
    const notificationId = `reminder-${payload.reminderId}-${Date.now()}`;

    const config: NotificationConfig = {
      id: notificationId,
      title: payload.title,
      message: payload.message,
      type: notificationType,
      priority: payload.priority || NotificationPriority.NORMAL,
      methods: payload.methods || [NotificationMethod.DESKTOP, NotificationMethod.SOUND],
      timestamp: payload.actualTime,
      sourceModule: 'schedule',
      sourceId: payload.sourceId,
      sound: soundConfig,
      data: {
        reminderId: payload.reminderId,
        sourceType: payload.sourceType,
        scheduledTime: payload.scheduledTime,
        actualTime: payload.actualTime,
        metadata: payload.metadata,
      },
      actions: this.createActionsForReminder(payload),
      desktop: {
        icon: this.getIconForSourceType(payload.sourceType),
        requireInteraction: payload.priority === NotificationPriority.URGENT,
        tag: `reminder-${payload.sourceType}-${payload.sourceId}`,
      },
    };

    return config;
  }

  /**
   * 将源类型映射到通知类型
   */
  private mapSourceTypeToNotificationType(sourceType: string): NotificationType {
    const typeMap: Record<string, NotificationType> = {
      task: NotificationType.TASK,
      goal: NotificationType.GOAL,
      reminder: NotificationType.REMINDER,
      custom: NotificationType.SYSTEM,
    };

    return typeMap[sourceType] || NotificationType.REMINDER;
  }

  /**
   * 为来源类型创建音效配置
   */
  private createSoundConfigForSource(sourceType: string): SoundConfig {
    const soundMap: Record<string, SoundType> = {
      task: SoundType.REMINDER,
      goal: SoundType.ALERT,
      reminder: SoundType.NOTIFICATION,
      custom: SoundType.DEFAULT,
    };

    return {
      enabled: true,
      type: soundMap[sourceType] || SoundType.DEFAULT,
      volume: 0.7,
    };
  }

  /**
   * 为提醒创建操作按钮
   */
  private createActionsForReminder(payload: ReminderTriggeredPayload) {
    const actions = [
      {
        id: 'mark-done',
        label: '标记完成',
        action: 'mark-done',
        icon: '/icons/check.png',
        primary: true,
        handler: async (config: NotificationConfig) => {
          console.log('[NotificationEventHandlers] 标记提醒完成:', config.data?.reminderId);

          // 发布完成事件
          eventBus.emit('reminder:marked-done', {
            reminderId: config.data?.reminderId,
            sourceType: config.data?.sourceType,
            sourceId: config.data?.sourceId,
            completedAt: new Date(),
          });
        },
      },
    ];

    // 根据源类型添加特定操作
    if (payload.sourceType === 'task') {
      actions.push({
        id: 'view-task',
        label: '查看任务',
        action: 'view-task',
        icon: '/icons/task.png',
        primary: false,
        handler: async (config: NotificationConfig) => {
          console.log('[NotificationEventHandlers] 查看任务:', config.data?.sourceId);
          // 导航到任务详情页
          // router.push(`/tasks/${config.data?.sourceId}`);
        },
      });
    } else if (payload.sourceType === 'goal') {
      actions.push({
        id: 'view-goal',
        label: '查看目标',
        action: 'view-goal',
        icon: '/icons/goal.png',
        primary: false,
        handler: async (config: NotificationConfig) => {
          console.log('[NotificationEventHandlers] 查看目标:', config.data?.sourceId);
          // 导航到目标详情页
          // router.push(`/goals/${config.data?.sourceId}`);
        },
      });
    }

    return actions;
  }

  /**
   * 获取源类型对应的图标
   */
  private getIconForSourceType(sourceType: string): string {
    const iconMap: Record<string, string> = {
      task: '/icons/task-notification.png',
      goal: '/icons/goal-notification.png',
      reminder: '/icons/reminder-notification.png',
      custom: '/icons/custom-notification.png',
    };

    return iconMap[sourceType] || '/icons/default-notification.png';
  }

  /**
   * 转换调度器载荷为标准格式
   */
  private convertSchedulerPayloadToStandard(payload: any): ReminderTriggeredPayload {
    console.log('[NotificationEventHandlers] 转换调度器载荷:', payload);

    // 调度器发送的载荷格式
    return {
      reminderId: payload.id || `scheduler-${Date.now()}`,
      sourceType: payload.type || 'schedule',
      sourceId: payload.id,
      title: payload.title || '计划提醒',
      message: payload.message || '您有一个计划提醒',
      priority: this.mapSchedulerPriorityToNotificationPriority(payload.priority),
      methods: this.mapSchedulerAlertMethodsToNotificationMethods(payload.alertMethods),
      scheduledTime: new Date(), // 调度器发送时就是计划时间
      actualTime: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      metadata: {
        taskType: payload.type,
        soundVolume: payload.soundVolume,
        popupDuration: payload.popupDuration,
        allowSnooze: payload.allowSnooze,
        snoozeOptions: payload.snoozeOptions,
        customActions: payload.customActions,
        originalPayload: payload,
      },
    };
  }

  /**
   * 转换调度器优先级到通知优先级
   */
  private mapSchedulerPriorityToNotificationPriority(
    schedulerPriority: string,
  ): NotificationPriority {
    const priorityMap: Record<string, NotificationPriority> = {
      LOW: NotificationPriority.LOW,
      NORMAL: NotificationPriority.NORMAL,
      HIGH: NotificationPriority.HIGH,
      URGENT: NotificationPriority.URGENT,
    };

    return priorityMap[schedulerPriority?.toUpperCase()] || NotificationPriority.NORMAL;
  }

  /**
   * 转换调度器提醒方式到通知方式
   */
  private mapSchedulerAlertMethodsToNotificationMethods(
    alertMethods: string[],
  ): NotificationMethod[] {
    if (!Array.isArray(alertMethods)) {
      return [NotificationMethod.DESKTOP, NotificationMethod.SOUND];
    }

    const methods: NotificationMethod[] = [];

    if (alertMethods.includes('POPUP')) {
      methods.push(NotificationMethod.DESKTOP);
    }
    if (alertMethods.includes('SOUND') || alertMethods.includes('AUDIO')) {
      methods.push(NotificationMethod.SOUND);
    }
    if (alertMethods.includes('VIBRATE')) {
      methods.push(NotificationMethod.VIBRATION);
    }

    // 如果没有匹配的方法，默认使用桌面通知
    return methods.length > 0 ? methods : [NotificationMethod.DESKTOP];
  }

  /**
   * 转换为标准载荷格式（兼容处理）
   */
  private convertToStandardPayload(payload: any): ReminderTriggeredPayload {
    return {
      reminderId: payload.id || payload.reminderId || `unknown-${Date.now()}`,
      sourceType: payload.type || payload.sourceType || 'custom',
      sourceId: payload.sourceId || payload.targetId || 'unknown',
      title: payload.title || '提醒',
      message: payload.message || payload.content || '您有一个提醒',
      priority: payload.priority || NotificationPriority.NORMAL,
      methods: payload.methods || [NotificationMethod.DESKTOP, NotificationMethod.SOUND],
      scheduledTime: payload.scheduledTime ? new Date(payload.scheduledTime) : new Date(),
      actualTime: payload.actualTime ? new Date(payload.actualTime) : new Date(),
      metadata: payload.metadata || payload.data || {},
    };
  }

  /**
   * 销毁事件监听器
   */
  destroy(): void {
    if (!this.isInitialized) return;

    console.log('[NotificationEventHandlers] 销毁事件监听器');

    // 移除Schedule事件监听
    Object.values(SCHEDULE_EVENTS).forEach((event) => {
      eventBus.off(event);
    });

    // 移除调度器的弹窗提醒事件监听
    eventBus.off('ui:show-popup-reminder');

    // 移除Notification事件监听
    Object.values(NOTIFICATION_EVENTS).forEach((event) => {
      eventBus.off(event);
    });

    // 移除系统事件监听
    eventBus.off('auth:user-logged-out');
    eventBus.off('reminder-triggered');

    this.isInitialized = false;
    console.log('[NotificationEventHandlers] 事件监听器已销毁');
  }
}
