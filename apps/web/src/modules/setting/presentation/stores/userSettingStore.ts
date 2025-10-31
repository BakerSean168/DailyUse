/**
 * User Setting Store
 * 用户设置状态管理
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { SettingContracts } from '@dailyuse/contracts';
import {
  getCurrentUserSettings,
  updateUserSettings,
  resetUserSettings,
  getDefaultSettings,
} from '../../api/userSettingApi';
import { useToast } from '@/shared/composables/useToast';

export const useUserSettingStore = defineStore(
  'userSetting',
  () => {
    // ==================== State ====================
    const settings = ref<SettingContracts.UserSettingDTO | null>(null);
    const defaults = ref<SettingContracts.DefaultSettingsDTO | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // ==================== Getters ====================
    const isLoaded = computed(() => settings.value !== null);
    const currentTheme = computed(() => settings.value?.appearanceTheme ?? 'AUTO');
    const currentLanguage = computed(() => settings.value?.localeLanguage ?? 'zh-CN');
    const notificationsEnabled = computed(() => ({
      email: settings.value?.notificationEmail ?? true,
      push: settings.value?.notificationPush ?? true,
      inApp: settings.value?.notificationInApp ?? true,
      sound: settings.value?.notificationSound ?? true,
    }));

    // ==================== Actions ====================

    /**
     * 加载用户设置
     */
    async function loadSettings(): Promise<void> {
      loading.value = true;
      error.value = null;

      try {
        settings.value = await getCurrentUserSettings();
      } catch (err: any) {
        error.value = err.message || '加载设置失败';
        console.error('Failed to load user settings:', err);
        throw err;
      } finally {
        loading.value = false;
      }
    }

    /**
     * 加载默认设置
     */
    async function loadDefaults(): Promise<void> {
      try {
        defaults.value = await getDefaultSettings();
      } catch (err: any) {
        console.error('Failed to load default settings:', err);
      }
    }

    /**
     * 更新设置
     */
    async function updateSettings(
      updates: SettingContracts.UpdateUserSettingDTO,
    ): Promise<void> {
      loading.value = true;
      error.value = null;

      try {
        settings.value = await updateUserSettings(updates);
        useToast().success('设置已保存');
      } catch (err: any) {
        error.value = err.message || '保存设置失败';
        useToast().error(error.value);
        console.error('Failed to update settings:', err);
        throw err;
      } finally {
        loading.value = false;
      }
    }

    /**
     * 批量更新设置（防抖）
     */
    let updateTimer: ReturnType<typeof setTimeout> | null = null;
    async function updateSettingsDebounced(
      updates: SettingContracts.UpdateUserSettingDTO,
      delay = 500,
    ): Promise<void> {
      if (updateTimer) {
        clearTimeout(updateTimer);
      }

      // 立即更新本地状态
      if (settings.value) {
        settings.value = { ...settings.value, ...updates } as SettingContracts.UserSettingDTO;
      }

      // 延迟保存到服务器
      updateTimer = setTimeout(async () => {
        try {
          await updateUserSettings(updates);
        } catch (err: any) {
          console.error('Failed to update settings (debounced):', err);
          // 失败时重新加载
          await loadSettings();
        }
      }, delay);
    }

    /**
     * 重置为默认设置
     */
    async function resetToDefaults(): Promise<void> {
      loading.value = true;
      error.value = null;

      try {
        settings.value = await resetUserSettings();
        useToast().success('已恢复默认设置');
      } catch (err: any) {
        error.value = err.message || '重置设置失败';
        useToast().error(error.value);
        console.error('Failed to reset settings:', err);
        throw err;
      } finally {
        loading.value = false;
      }
    }

    /**
     * 更新主题
     */
    async function updateTheme(theme: 'AUTO' | 'LIGHT' | 'DARK'): Promise<void> {
      await updateSettings({ appearanceTheme: theme });
    }

    /**
     * 更新语言
     */
    async function updateLanguage(language: string): Promise<void> {
      await updateSettings({ localeLanguage: language });
    }

    /**
     * 更新通知偏好
     */
    async function updateNotifications(notifications: {
      email?: boolean;
      push?: boolean;
      inApp?: boolean;
      sound?: boolean;
    }): Promise<void> {
      await updateSettings({
        notificationEmail: notifications.email,
        notificationPush: notifications.push,
        notificationInApp: notifications.inApp,
        notificationSound: notifications.sound,
      });
    }

    /**
     * 更新编辑器设置
     */
    async function updateEditorSettings(editorSettings: {
      theme?: string;
      fontSize?: number;
      tabSize?: number;
      wordWrap?: boolean;
      lineNumbers?: boolean;
      minimap?: boolean;
    }): Promise<void> {
      await updateSettings({
        editorTheme: editorSettings.theme,
        editorFontSize: editorSettings.fontSize,
        editorTabSize: editorSettings.tabSize,
        editorWordWrap: editorSettings.wordWrap,
        editorLineNumbers: editorSettings.lineNumbers,
        editorMinimap: editorSettings.minimap,
      });
    }

    return {
      // State
      settings,
      defaults,
      loading,
      error,

      // Getters
      isLoaded,
      currentTheme,
      currentLanguage,
      notificationsEnabled,

      // Actions
      loadSettings,
      loadDefaults,
      updateSettings,
      updateSettingsDebounced,
      resetToDefaults,
      updateTheme,
      updateLanguage,
      updateNotifications,
      updateEditorSettings,
    };
  },
  {
    persist: {
      key: 'dailyuse-user-settings',
      storage: localStorage,
      paths: ['settings'], // 只持久化 settings
    },
  },
);
