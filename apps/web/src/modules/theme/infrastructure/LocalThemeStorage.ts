/**
 * Local Theme Storage
 * 本地主题存储（LocalStorage）
 * 
 * 用于未登录用户的主题持久化
 */

import type { ThemeConfig } from '../domain/ThemeConfig';
import { DEFAULT_THEME_CONFIG } from '../domain/ThemeConfig';

const STORAGE_KEY = 'dailyuse-theme-config';

export class LocalThemeStorage {
  /**
   * 从 LocalStorage 加载主题配置
   */
  static load(): ThemeConfig | null {
    try {
      const json = localStorage.getItem(STORAGE_KEY);
      if (!json) return null;

      const data = JSON.parse(json);
      console.log('📦 [LocalThemeStorage] 已从 LocalStorage 加载主题:', data);
      return data;
    } catch (error) {
      console.error('❌ [LocalThemeStorage] 加载主题失败:', error);
      return null;
    }
  }

  /**
   * 保存主题配置到 LocalStorage
   */
  static save(config: ThemeConfig): void {
    try {
      const json = JSON.stringify(config);
      localStorage.setItem(STORAGE_KEY, json);
      console.log('💾 [LocalThemeStorage] 已保存主题到 LocalStorage:', config);
    } catch (error) {
      console.error('❌ [LocalThemeStorage] 保存主题失败:', error);
    }
  }

  /**
   * 清除本地主题配置
   */
  static clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('🧹 [LocalThemeStorage] 已清除本地主题配置');
    } catch (error) {
      console.error('❌ [LocalThemeStorage] 清除主题失败:', error);
    }
  }

  /**
   * 获取系统主题偏好
   */
  static getSystemPreference(): 'light' | 'dark' {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }
}
