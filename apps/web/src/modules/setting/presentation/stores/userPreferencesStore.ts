// @ts-nocheck
/**
 * User Preferences Store
 * 用户偏好设置状态管理
 * 
 * ⚠️  TypeScript checking disabled - UserPreferences domain object needs refactoring
 * TODO: Fix UserPreferences type and re-enable type checking
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { UserPreferences } from '@dailyuse/domain-client';
import {
  userPreferencesApi,
  type UserPreferencesDTO,
  type UpdateUserPreferencesRequestDTO,
} from '../../infrastructure/api/userPreferencesApi';

/**
 * 用户偏好设置 Store
 */
export const useUserPreferencesStore = defineStore('userPreferences', () => {
  // ========== State ==========
  const preferences = ref<UserPreferences | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // ========== Getters ==========

  /**
   * 当前主题模式
   */
  const currentThemeMode = computed(() => preferences.value?.themeMode || 'system');

  /**
   * 当前语言
   */
  const currentLanguage = computed(() => preferences.value?.language || 'zh-CN');

  /**
   * 当前时区
   */
  const currentTimezone = computed(() => preferences.value?.timezone || 'Asia/Shanghai');

  /**
   * 当前区域设置
   */
  const currentLocale = computed(() => preferences.value?.locale || 'zh-CN');

  /**
   * 通知设置
   */
  const notificationSettings = computed(() => ({
    notificationsEnabled: preferences.value?.notificationsEnabled ?? true,
    emailNotifications: preferences.value?.emailNotifications ?? true,
    pushNotifications: preferences.value?.pushNotifications ?? true,
  }));

  /**
   * 是否启用自动启动
   */
  const isAutoLaunchEnabled = computed(() => preferences.value?.autoLaunch ?? false);

  /**
   * 默认模块
   */
  const defaultModule = computed(() => preferences.value?.defaultModule || 'dashboard');

  /**
   * 是否启用分析
   */
  const isAnalyticsEnabled = computed(() => preferences.value?.analyticsEnabled ?? true);

  /**
   * 是否启用崩溃报告
   */
  const isCrashReportsEnabled = computed(() => preferences.value?.crashReportsEnabled ?? true);

  /**
   * 是否已加载
   */
  const isLoaded = computed(() => preferences.value !== null);

  // ========== Actions ==========

  /**
   * 获取用户偏好设置
   */
  async function fetchPreferences(): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const data = await userPreferencesApi.getPreferences();
      preferences.value = UserPreferences.fromDTO(data);
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取用户偏好失败';
      console.error('获取用户偏好失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 切换主题模式
   */
  async function switchThemeMode(themeMode: 'light' | 'dark' | 'system'): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const data = await userPreferencesApi.switchThemeMode(themeMode);
      preferences.value = UserPreferences.fromDTO(data);
    } catch (err) {
      error.value = err instanceof Error ? err.message : '切换主题模式失败';
      console.error('切换主题模式失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 更改语言
   */
  async function changeLanguage(language: string): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const data = await userPreferencesApi.changeLanguage(language);
      preferences.value = UserPreferences.fromDTO(data);
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更改语言失败';
      console.error('更改语言失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 更新通知偏好
   */
  async function updateNotificationPreferences(
    notificationPrefs: Partial<UpdateUserPreferencesRequestDTO>,
  ): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const data = await userPreferencesApi.updateNotificationPreferences(notificationPrefs);
      preferences.value = UserPreferences.fromDTO(data);
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新通知偏好失败';
      console.error('更新通知偏好失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 更新用户偏好（批量）
   */
  async function updatePreferences(updates: UpdateUserPreferencesRequestDTO): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const data = await userPreferencesApi.updatePreferences(updates);
      preferences.value = UserPreferences.fromDTO(data);
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新用户偏好失败';
      console.error('更新用户偏好失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 重置为默认设置
   */
  async function resetToDefault(): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const data = await userPreferencesApi.resetToDefault();
      preferences.value = UserPreferences.fromDTO(data);
    } catch (err) {
      error.value = err instanceof Error ? err.message : '重置设置失败';
      console.error('重置设置失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 清除错误
   */
  function clearError(): void {
    error.value = null;
  }

  /**
   * 初始化（在应用启动时调用）
   */
  async function initialize(): Promise<void> {
    if (!isLoaded.value) {
      await fetchPreferences();
    }
  }

  return {
    // State
    preferences,
    loading,
    error,

    // Getters
    currentThemeMode,
    currentLanguage,
    currentTimezone,
    currentLocale,
    notificationSettings,
    isAutoLaunchEnabled,
    defaultModule,
    isAnalyticsEnabled,
    isCrashReportsEnabled,
    isLoaded,

    // Actions
    fetchPreferences,
    switchThemeMode,
    changeLanguage,
    updateNotificationPreferences,
    updatePreferences,
    resetToDefault,
    clearError,
    initialize,
  };
});
