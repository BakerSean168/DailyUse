/**
 * User Setting Store
 * 用户设置状态管理
 * 
 * 设计理念：
 * 1. 使用嵌套结构匹配后端 DTO
 * 2. 提供类型安全的 getter 和 setter
 * 3. 支持局部更新（只更新变化的字段）
 * 4. 自动防抖，减少 API 调用
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { UserSettingClientDTO, UpdateUserSettingRequest } from '@dailyuse/contracts';
import {
  getCurrentUserSettings,
  updateUserSettings,
  resetUserSettings,
  getDefaultSettings,
} from '../../api/userSettingApi';

// ==================== 类型定义 ====================

/** 外观设置 */
type AppearanceSettings = NonNullable<UpdateUserSettingRequest['appearance']>;
/** 区域设置 */
type LocaleSettings = NonNullable<UpdateUserSettingRequest['locale']>;
/** 工作流设置 */
type WorkflowSettings = NonNullable<UpdateUserSettingRequest['workflow']>;
/** 快捷键设置 */
type ShortcutSettings = NonNullable<UpdateUserSettingRequest['shortcuts']>;
/** 隐私设置 */
type PrivacySettings = NonNullable<UpdateUserSettingRequest['privacy']>;

export const useUserSettingStore = defineStore(
  'userSetting',
  () => {
    // ==================== State ====================
    const settings = ref<UserSettingClientDTO | null>(null);
    const defaults = ref<UserSettingClientDTO | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // ==================== Computed Getters ====================
    const isLoaded = computed(() => settings.value !== null);
    
    // 外观设置
    const appearance = computed(() => settings.value?.appearance ?? {
      theme: 'AUTO',
      accentColor: '#1976D2',
      fontSize: 'MEDIUM',
      fontFamily: 'Inter',
      compactMode: false,
    });

    // 区域设置
    const locale = computed(() => settings.value?.locale ?? {
      language: 'zh-CN',
      timezone: 'Asia/Shanghai',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24H',
      weekStartsOn: 1,
      currency: 'CNY',
    });

    // 工作流设置
    const workflow = computed(() => settings.value?.workflow ?? {
      defaultTaskView: 'LIST',
      defaultGoalView: 'LIST',
      defaultScheduleView: 'WEEK',
      autoSave: true,
      autoSaveInterval: 30000,
      confirmBeforeDelete: true,
    });

    // 快捷键设置
    const shortcuts = computed(() => settings.value?.shortcuts ?? {
      enabled: true,
      custom: {},
    });

    // 隐私设置
    const privacy = computed(() => settings.value?.privacy ?? {
      profileVisibility: 'FRIENDS_ONLY',
      showOnlineStatus: true,
      allowSearchByEmail: true,
      allowSearchByPhone: false,
      shareUsageData: true,
    });

    // 实验性功能
    const experimental = computed(() => settings.value?.experimental ?? {
      enabled: false,
      features: [],
    });

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
      updates: UpdateUserSettingRequest,
    ): Promise<void> {
      loading.value = true;
      error.value = null;

      try {
        settings.value = await updateUserSettings(updates);
        console.log('设置已保存');
      } catch (err: any) {
        error.value = err.message || '保存设置失败';
        console.error('保存设置失败:', error.value);
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
      updates: UpdateUserSettingRequest,
      delay = 500,
    ): Promise<void> {
      if (updateTimer) {
        clearTimeout(updateTimer);
      }

      // 延迟保存到服务器（不做本地乐观更新，避免类型问题）
      updateTimer = setTimeout(async () => {
        try {
          settings.value = await updateUserSettings(updates);
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
      if (!confirm('确定要恢复默认设置吗？')) return;
      
      loading.value = true;
      error.value = null;

      try {
        settings.value = await resetUserSettings();
        console.log('已恢复默认设置');
      } catch (err: any) {
        error.value = err.message || '重置设置失败';
        console.error('重置设置失败:', error.value);
        throw err;
      } finally {
        loading.value = false;
      }
    }

    // ==================== 便捷更新方法 ====================

    /**
     * 更新外观设置
     */
    async function updateAppearance(updates: Partial<AppearanceSettings>): Promise<void> {
      if (!settings.value) return;
      await updateSettings({
        uuid: settings.value.uuid,
        appearance: updates,
      });
    }

    /**
     * 更新区域设置
     */
    async function updateLocale(updates: Partial<LocaleSettings>): Promise<void> {
      if (!settings.value) return;
      await updateSettings({
        uuid: settings.value.uuid,
        locale: updates,
      });
    }

    /**
     * 更新工作流设置
     */
    async function updateWorkflow(updates: Partial<WorkflowSettings>): Promise<void> {
      if (!settings.value) return;
      await updateSettings({
        uuid: settings.value.uuid,
        workflow: updates,
      });
    }

    /**
     * 更新快捷键设置
     */
    async function updateShortcuts(updates: Partial<ShortcutSettings>): Promise<void> {
      if (!settings.value) return;
      await updateSettings({
        uuid: settings.value.uuid,
        shortcuts: updates,
      });
    }

    /**
     * 更新隐私设置
     */
    async function updatePrivacy(updates: Partial<PrivacySettings>): Promise<void> {
      if (!settings.value) return;
      await updateSettings({
        uuid: settings.value.uuid,
        privacy: updates,
      });
    }

    // ==================== 防抖版本 ====================

    /**
     * 更新外观设置（防抖）
     */
    async function updateAppearanceDebounced(
      updates: Partial<AppearanceSettings>,
      delay = 500,
    ): Promise<void> {
      if (!settings.value) return;
      await updateSettingsDebounced({
        uuid: settings.value.uuid,
        appearance: updates,
      }, delay);
    }

    /**
     * 更新区域设置（防抖）
     */
    async function updateLocaleDebounced(
      updates: Partial<LocaleSettings>,
      delay = 500,
    ): Promise<void> {
      if (!settings.value) return;
      await updateSettingsDebounced({
        uuid: settings.value.uuid,
        locale: updates,
      }, delay);
    }

    /**
     * 更新工作流设置（防抖）
     */
    async function updateWorkflowDebounced(
      updates: Partial<WorkflowSettings>,
      delay = 500,
    ): Promise<void> {
      if (!settings.value) return;
      await updateSettingsDebounced({
        uuid: settings.value.uuid,
        workflow: updates,
      }, delay);
    }

    return {
      // ========== State ==========
      settings,
      defaults,
      loading,
      error,

      // ========== Computed Getters ==========
      isLoaded,
      appearance,
      locale,
      workflow,
      shortcuts,
      privacy,
      experimental,

      // ========== Core Actions ==========
      loadSettings,
      loadDefaults,
      updateSettings,
      updateSettingsDebounced,
      resetToDefaults,

      // ========== Convenient Update Methods ==========
      updateAppearance,
      updateLocale,
      updateWorkflow,
      updateShortcuts,
      updatePrivacy,

      // ========== Debounced Update Methods ==========
      updateAppearanceDebounced,
      updateLocaleDebounced,
      updateWorkflowDebounced,
    };
  },
  {
    // Pinia 持久化配置
    persist: {
      key: 'dailyuse-user-settings',
      storage: localStorage,
    } as any, // 类型断言避免 Pinia persist plugin 的类型问题
  },
);
