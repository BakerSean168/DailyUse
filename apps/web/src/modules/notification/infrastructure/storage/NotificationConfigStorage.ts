/**
 * 通知配置存储服务
 * @description 管理通知配置的持久化存储
 */

import type { NotificationServiceConfig } from '../../application/types';

/**
 * 通知配置存储服务
 */
export class NotificationConfigStorage {
  private static readonly STORAGE_KEY = 'dailyuse_notification_config';

  /**
   * 保存配置到localStorage
   */
  static saveConfig(config: NotificationServiceConfig): void {
    try {
      const configJson = JSON.stringify(config);
      localStorage.setItem(this.STORAGE_KEY, configJson);
      console.log('[NotificationConfigStorage] 配置已保存');
    } catch (error) {
      console.error('[NotificationConfigStorage] 保存配置失败:', error);
    }
  }

  /**
   * 从localStorage加载配置
   */
  static loadConfig(): NotificationServiceConfig | null {
    try {
      const configJson = localStorage.getItem(this.STORAGE_KEY);
      if (!configJson) {
        return null;
      }

      const config = JSON.parse(configJson) as NotificationServiceConfig;
      console.log('[NotificationConfigStorage] 配置已加载');
      return config;
    } catch (error) {
      console.error('[NotificationConfigStorage] 加载配置失败:', error);
      return null;
    }
  }

  /**
   * 清除存储的配置
   */
  static clearConfig(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('[NotificationConfigStorage] 配置已清除');
    } catch (error) {
      console.error('[NotificationConfigStorage] 清除配置失败:', error);
    }
  }

  /**
   * 检查localStorage是否可用
   */
  static isStorageAvailable(): boolean {
    try {
      const testKey = '__notification_storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
}
