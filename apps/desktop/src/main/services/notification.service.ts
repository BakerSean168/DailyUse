/**
 * Notification Service
 *
 * Electron 原生通知服务 - 管理系统托盘通知
 */

import { Notification, nativeImage, BrowserWindow } from 'electron';
import path from 'path';
import { eventBus } from '@dailyuse/utils';

/**
 * 通知配置
 */
export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  sound?: boolean;
  urgency?: 'normal' | 'critical' | 'low';
  silent?: boolean;
  data?: Record<string, unknown>;
}

/**
 * 通知服务类
 */
export class NotificationService {
  private static instance: NotificationService;
  private mainWindow: BrowserWindow | null = null;
  private defaultIcon: Electron.NativeImage | null = null;
  
  // Do Not Disturb (DND) 模式
  private dndEnabled: boolean = false;
  private dndStartHour: number = 22;  // 默认 22:00 开始
  private dndEndHour: number = 7;     // 默认 07:00 结束
  private dndScheduleEnabled: boolean = false;

  private constructor() {
    this.initDefaultIcon();
    this.initEventListeners();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * 设置主窗口引用
   */
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  // ===== Do Not Disturb 相关方法 =====

  /**
   * 启用勿扰模式
   */
  enableDND(): void {
    this.dndEnabled = true;
    console.log('[NotificationService] DND mode enabled');
  }

  /**
   * 禁用勿扰模式
   */
  disableDND(): void {
    this.dndEnabled = false;
    console.log('[NotificationService] DND mode disabled');
  }

  /**
   * 切换勿扰模式
   */
  toggleDND(): boolean {
    this.dndEnabled = !this.dndEnabled;
    console.log(`[NotificationService] DND mode ${this.dndEnabled ? 'enabled' : 'disabled'}`);
    return this.dndEnabled;
  }

  /**
   * 获取勿扰模式状态
   */
  isDNDEnabled(): boolean {
    return this.dndEnabled;
  }

  /**
   * 设置定时勿扰
   */
  setDNDSchedule(startHour: number, endHour: number): void {
    this.dndStartHour = startHour;
    this.dndEndHour = endHour;
    this.dndScheduleEnabled = true;
    console.log(`[NotificationService] DND schedule set: ${startHour}:00 - ${endHour}:00`);
  }

  /**
   * 禁用定时勿扰
   */
  disableDNDSchedule(): void {
    this.dndScheduleEnabled = false;
    console.log('[NotificationService] DND schedule disabled');
  }

  /**
   * 获取勿扰模式配置
   */
  getDNDConfig(): {
    enabled: boolean;
    scheduleEnabled: boolean;
    startHour: number;
    endHour: number;
  } {
    return {
      enabled: this.dndEnabled,
      scheduleEnabled: this.dndScheduleEnabled,
      startHour: this.dndStartHour,
      endHour: this.dndEndHour,
    };
  }

  /**
   * 检查当前是否在勿扰时间段内
   */
  private isInDNDPeriod(): boolean {
    if (this.dndEnabled) {
      return true;
    }

    if (!this.dndScheduleEnabled) {
      return false;
    }

    const now = new Date();
    const currentHour = now.getHours();

    // 处理跨午夜的时间段（如 22:00 - 07:00）
    if (this.dndStartHour > this.dndEndHour) {
      return currentHour >= this.dndStartHour || currentHour < this.dndEndHour;
    }

    // 普通时间段（如 14:00 - 16:00）
    return currentHour >= this.dndStartHour && currentHour < this.dndEndHour;
  }

  /**
   * 初始化默认图标
   */
  private initDefaultIcon(): void {
    try {
      // 尝试加载应用图标
      const iconPath = path.join(__dirname, '../assets/icon.png');
      this.defaultIcon = nativeImage.createFromPath(iconPath);
    } catch (err) {
      console.warn('[NotificationService] Failed to load default icon:', err);
    }
  }

  /**
   * 初始化事件监听器
   */
  private initEventListeners(): void {
    // 监听提醒触发事件
    eventBus.on('reminder.triggered', (data: {
      uuid: string;
      title: string;
      body?: string;
      templateUuid: string;
    }) => {
      this.showNotification({
        title: data.title,
        body: data.body || '',
        data: {
          type: 'reminder',
          uuid: data.uuid,
          templateUuid: data.templateUuid,
        },
      });
    });

    // 监听调度任务触发事件
    eventBus.on('schedule.task.executed', (data: {
      uuid: string;
      name: string;
      description?: string;
    }) => {
      this.showNotification({
        title: `调度任务: ${data.name}`,
        body: data.description || '任务已执行',
        data: {
          type: 'schedule',
          uuid: data.uuid,
        },
      });
    });
  }

  /**
   * 显示通知
   */
  showNotification(options: NotificationOptions): Notification | null {
    // 检查勿扰模式
    if (this.isInDNDPeriod()) {
      console.log('[NotificationService] Notification suppressed (DND mode):', options.title);
      // 仍然记录通知，但不显示
      if (this.mainWindow) {
        this.mainWindow.webContents.send('notification:suppressed', {
          title: options.title,
          body: options.body,
          data: options.data,
        });
      }
      return null;
    }

    // 检查是否支持通知
    if (!Notification.isSupported()) {
      console.warn('[NotificationService] Notifications are not supported on this system');
      return null;
    }

    const notification = new Notification({
      title: options.title,
      body: options.body,
      icon: options.icon ? nativeImage.createFromPath(options.icon) : this.defaultIcon ?? undefined,
      silent: options.silent ?? !options.sound,
      urgency: options.urgency ?? 'normal',
    });

    // 点击通知时聚焦窗口并导航
    notification.on('click', () => {
      this.handleNotificationClick(options.data);
    });

    // 通知关闭时的处理
    notification.on('close', () => {
      console.log('[NotificationService] Notification closed:', options.title);
    });

    notification.show();
    return notification;
  }

  /**
   * 处理通知点击
   */
  private handleNotificationClick(data?: Record<string, unknown>): void {
    // 聚焦主窗口
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.focus();

      // 发送 IPC 消息到渲染进程
      if (data) {
        this.mainWindow.webContents.send('notification:clicked', data);
      }
    }
  }

  /**
   * 处理通知操作按钮
   */
  private handleNotificationAction(actionType: string, data?: Record<string, unknown>): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('notification:action', {
        actionType,
        data,
      });
    }
  }

  /**
   * 显示提醒通知
   */
  showReminderNotification(reminder: {
    uuid: string;
    title: string;
    body?: string;
    importance?: string;
  }): Notification | null {
    const urgency = reminder.importance === 'vital' || reminder.importance === 'important'
      ? 'critical' as const
      : 'normal' as const;

    return this.showNotification({
      title: `🔔 ${reminder.title}`,
      body: reminder.body || '',
      urgency,
      sound: true,
      data: {
        type: 'reminder',
        uuid: reminder.uuid,
      },
    });
  }

  /**
   * 显示调度任务通知
   */
  showScheduleNotification(task: {
    uuid: string;
    name: string;
    description?: string;
  }): Notification | null {
    return this.showNotification({
      title: `📅 ${task.name}`,
      body: task.description || '调度任务已触发',
      sound: true,
      data: {
        type: 'schedule',
        uuid: task.uuid,
      },
    });
  }

  /**
   * 显示目标进度通知
   */
  showGoalProgressNotification(goal: {
    uuid: string;
    title: string;
    progress: number;
    targetValue: number;
  }): Notification | null {
    const percentage = Math.round((goal.progress / goal.targetValue) * 100);
    return this.showNotification({
      title: `🎯 目标进度更新`,
      body: `${goal.title}: ${percentage}% (${goal.progress}/${goal.targetValue})`,
      data: {
        type: 'goal',
        uuid: goal.uuid,
      },
    });
  }

  /**
   * 显示任务完成通知
   */
  showTaskCompletedNotification(task: {
    uuid: string;
    title: string;
  }): Notification | null {
    return this.showNotification({
      title: `✅ 任务已完成`,
      body: task.title,
      data: {
        type: 'task',
        uuid: task.uuid,
      },
    });
  }
}

/**
 * 初始化通知服务
 */
export function initNotificationService(mainWindow: BrowserWindow): NotificationService {
  const service = NotificationService.getInstance();
  service.setMainWindow(mainWindow);
  return service;
}
