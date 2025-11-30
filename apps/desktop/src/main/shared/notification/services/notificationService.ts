import { BrowserWindow } from 'electron';
import { NotificationWindowManager } from '../windows/notificationWindow';

import type { NotificationWindow } from '../types';
import type { ApiResponse } from '@dailyuse/contracts/response';

export interface NotificationServiceConfig {
  mainWindow: BrowserWindow;
  MAIN_DIST: string;
  RENDERER_DIST: string;
  VITE_DEV_SERVER_URL?: string;
}

/**
 * 通知服务 - 统一管理通知功能
 */
class NotificationService {
  private static instance: NotificationService;
  private windowManagementService = new NotificationWindowManager();

  constructor() {}

  static getInstance(): NotificationService {
    if (!this.instance) {
      this.instance = new NotificationService();
    }
    return this.instance;
  }
  public async showNotification(options: NotificationWindow): Promise<ApiResponse> {
    try {
      const window = this.windowManagementService.createWindow(options);
      const url = this.windowManagementService.buildNotificationUrl(options);
      // 加载 URL
      await window.loadURL(url);
      window.show();
      return {
        success: true,
        message: 'Notification displayed successfully',
      };
    } catch (error) {
      console.error('NotificationService - showNotification Error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public closeNotification(uuid: string): ApiResponse {
    try {
      const response = this.windowManagementService.closeWindow(uuid);
      if (!response) {
        throw new Error(`Notification with ID ${uuid} not found or already closed`);
      }
      return {
        success: true,
        message: 'Notification closed successfully',
      };
    } catch (error) {
      console.error('NotificationService - closeNotification Error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public handleNotificationAction(uuid: string, action: { text: string; type: string }): void {
    const window = this.windowManagementService.getWindow(uuid);
    if (window) {
      if (action.type === 'cancel' || action.type === 'confirm') {
        window.close();
      }
      window.webContents.send('notification-action', { uuid, action });
    } else {
      console.warn(`Notification with ID ${uuid} not found.`);
    }
  }
}

export const notificationService = NotificationService.getInstance();
