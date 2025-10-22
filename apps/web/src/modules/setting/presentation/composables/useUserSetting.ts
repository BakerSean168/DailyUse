/**
 * UserSetting Composable
 * 用户设置可组合函数 - 封装业务逻辑和状态管理
 */

import { ref, computed, onMounted } from 'vue';
import { UserSettingWebApplicationService } from '../../application/services/UserSettingWebApplicationService';
import { useUserSettingStore } from '../stores/userSettingStore';
import { useSnackbar } from '@/shared/composables/useSnackbar';
import { type SettingContracts } from '@dailyuse/contracts';

/**
 * UserSetting 模块组合式函数
 * 提供统一的用户设置管理接口
 */
export function useUserSetting() {
  const userSettingStore = useUserSettingStore();
  const snackbar = useSnackbar();

  // ===== 本地状态 =====
  const loading = ref(false);
  const error = ref<string>('');

  // ===== 计算属性 =====

  /**
   * 当前用户设置
   */
  const userSetting = computed(() => userSettingStore.getUserSetting);

  /**
   * 当前主题
   */
  const currentTheme = computed(() => userSettingStore.getTheme);

  /**
   * 当前语言
   */
  const currentLanguage = computed(() => userSettingStore.getLanguage);

  /**
   * 当前主题文本
   */
  const themeText = computed(() => userSetting.value?.getThemeText() || '未设置');

  /**
   * 当前语言文本
   */
  const languageText = computed(() => userSetting.value?.getLanguageText() || '未设置');

  /**
   * 自动保存是否启用
   */
  const autoSaveEnabled = computed(() => userSettingStore.getAutoSave);

  /**
   * 自动保存间隔
   */
  const autoSaveInterval = computed(() => userSettingStore.getAutoSaveInterval);

  /**
   * 快捷键是否启用
   */
  const shortcutsEnabled = computed(() => userSettingStore.getShortcutsEnabled);

  /**
   * 自定义快捷键
   */
  const customShortcuts = computed(() => userSettingStore.getCustomShortcuts);

  /**
   * 是否正在加载
   */
  const isLoading = computed(() => loading.value || userSettingStore.isLoading);

  // ===== 业务方法 =====

  /**
   * 加载用户设置（通过 UUID）
   */
  const loadUserSetting = async (uuid: string): Promise<void> => {
    loading.value = true;
    error.value = '';

    try {
      const service = await UserSettingWebApplicationService.getInstance();
      await service.getUserSetting(uuid);
      snackbar.showSuccess('用户设置加载成功');
    } catch (err: any) {
      const errorMsg = err.message || '加载用户设置失败';
      error.value = errorMsg;
      snackbar.showError(errorMsg);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 根据账户加载用户设置
   */
  const loadUserSettingByAccount = async (accountUuid: string): Promise<void> => {
    loading.value = true;
    error.value = '';

    try {
      const service = await UserSettingWebApplicationService.getInstance();
      await service.getUserSettingByAccount(accountUuid);
      snackbar.showSuccess('用户设置加载成功');
    } catch (err: any) {
      error.value = err.message || '加载用户设置失败';
      snackbar.showError(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 获取或创建用户设置
   */
  const getOrCreateUserSetting = async (accountUuid: string): Promise<void> => {
    loading.value = true;
    error.value = '';

    try {
      const service = await UserSettingWebApplicationService.getInstance();
      await service.getOrCreateUserSetting(accountUuid);
    } catch (err: any) {
      error.value = err.message || '获取或创建用户设置失败';
      snackbar.showError(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 创建用户设置
   */
  const createUserSetting = async (
    request: SettingContracts.CreateUserSettingRequest,
  ): Promise<void> => {
    loading.value = true;
    error.value = '';

    try {
      const service = await UserSettingWebApplicationService.getInstance();
      await service.createUserSetting(request);
      snackbar.showSuccess('用户设置创建成功');
    } catch (err: any) {
      error.value = err.message || '创建用户设置失败';
      snackbar.showError(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 更新用户设置（完整更新）
   */
  const updateUserSetting = async (
    uuid: string,
    request: SettingContracts.UpdateUserSettingRequest,
  ): Promise<void> => {
    loading.value = true;
    error.value = '';

    try {
      const service = await UserSettingWebApplicationService.getInstance();
      await service.updateUserSetting(uuid, request);
      snackbar.showSuccess('用户设置更新成功');
    } catch (err: any) {
      error.value = err.message || '更新用户设置失败';
      snackbar.showError(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // ===== 快捷更新方法 =====

  /**
   * 更新外观设置
   */
  const updateAppearance = async (
    appearance: SettingContracts.UpdateAppearanceRequest,
  ): Promise<void> => {
    if (!userSetting.value) {
      snackbar.showError('未找到用户设置');
      return;
    }

    loading.value = true;
    error.value = '';

    try {
      const service = await UserSettingWebApplicationService.getInstance();
      await service.updateAppearance(userSetting.value.uuid, appearance);
      snackbar.showSuccess('外观设置更新成功');
    } catch (err: any) {
      error.value = err.message || '更新外观设置失败';
      snackbar.showError(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 更新本地化设置
   */
  const updateLocale = async (locale: SettingContracts.UpdateLocaleRequest): Promise<void> => {
    if (!userSetting.value) {
      snackbar.showError('未找到用户设置');
      return;
    }

    loading.value = true;
    error.value = '';

    try {
      const service = await UserSettingWebApplicationService.getInstance();
      await service.updateLocale(userSetting.value.uuid, locale);
      snackbar.showSuccess('本地化设置更新成功');
    } catch (err: any) {
      error.value = err.message || '更新本地化设置失败';
      snackbar.showError(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 更新工作流设置
   */
  const updateWorkflow = async (
    workflow: SettingContracts.UpdateWorkflowRequest,
  ): Promise<void> => {
    if (!userSetting.value) {
      snackbar.showError('未找到用户设置');
      return;
    }

    loading.value = true;
    error.value = '';

    try {
      const service = await UserSettingWebApplicationService.getInstance();
      await service.updateWorkflow(userSetting.value.uuid, workflow);
      snackbar.showSuccess('工作流设置更新成功');
    } catch (err: any) {
      error.value = err.message || '更新工作流设置失败';
      snackbar.showError(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 更新隐私设置
   */
  const updatePrivacy = async (privacy: SettingContracts.UpdatePrivacyRequest): Promise<void> => {
    if (!userSetting.value) {
      snackbar.showError('未找到用户设置');
      return;
    }

    loading.value = true;
    error.value = '';

    try {
      const service = await UserSettingWebApplicationService.getInstance();
      await service.updatePrivacy(userSetting.value.uuid, privacy);
      snackbar.showSuccess('隐私设置更新成功');
    } catch (err: any) {
      error.value = err.message || '更新隐私设置失败';
      snackbar.showError(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 更新实验性功能设置
   */
  const updateExperimental = async (
    experimental: SettingContracts.UpdateExperimentalRequest,
  ): Promise<void> => {
    if (!userSetting.value) {
      snackbar.showError('未找到用户设置');
      return;
    }

    loading.value = true;
    error.value = '';

    try {
      const service = await UserSettingWebApplicationService.getInstance();
      await service.updateExperimental(userSetting.value.uuid, experimental);
      snackbar.showSuccess('实验性功能设置更新成功');
    } catch (err: any) {
      error.value = err.message || '更新实验性功能设置失败';
      snackbar.showError(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 快速切换主题
   */
  const switchTheme = async (theme: string): Promise<void> => {
    if (!userSetting.value) {
      snackbar.showError('未找到用户设置');
      return;
    }

    loading.value = true;
    error.value = '';

    try {
      const service = await UserSettingWebApplicationService.getInstance();
      await service.updateTheme(userSetting.value.uuid, theme);
      snackbar.showSuccess(`主题已切换为：${theme}`);
    } catch (err: any) {
      error.value = err.message || '切换主题失败';
      snackbar.showError(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 快速切换语言
   */
  const switchLanguage = async (language: string): Promise<void> => {
    if (!userSetting.value) {
      snackbar.showError('未找到用户设置');
      return;
    }

    loading.value = true;
    error.value = '';

    try {
      const service = await UserSettingWebApplicationService.getInstance();
      await service.updateLanguage(userSetting.value.uuid, language);
      snackbar.showSuccess(`语言已切换为：${language}`);
    } catch (err: any) {
      error.value = err.message || '切换语言失败';
      snackbar.showError(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 设置快捷键
   */
  const setShortcut = async (action: string, shortcut: string): Promise<void> => {
    if (!userSetting.value) {
      snackbar.showError('未找到用户设置');
      return;
    }

    loading.value = true;
    error.value = '';

    try {
      const service = await UserSettingWebApplicationService.getInstance();
      await service.updateShortcut(userSetting.value.uuid, action, shortcut);
      snackbar.showSuccess(`快捷键 ${action} 已设置为：${shortcut}`);
    } catch (err: any) {
      error.value = err.message || '设置快捷键失败';
      snackbar.showError(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 删除快捷键
   */
  const removeShortcut = async (action: string): Promise<void> => {
    if (!userSetting.value) {
      snackbar.showError('未找到用户设置');
      return;
    }

    loading.value = true;
    error.value = '';

    try {
      const service = await UserSettingWebApplicationService.getInstance();
      await service.deleteShortcut(userSetting.value.uuid, action);
      snackbar.showSuccess(`快捷键 ${action} 已删除`);
    } catch (err: any) {
      error.value = err.message || '删除快捷键失败';
      snackbar.showError(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 检查快捷键
   */
  const hasShortcut = (action: string): boolean => {
    return userSetting.value?.hasShortcut(action) || false;
  };

  /**
   * 获取快捷键
   */
  const getShortcut = (action: string): string | null => {
    return userSetting.value?.getShortcut(action) || null;
  };

  /**
   * 检查实验性功能
   */
  const hasExperimentalFeature = (feature: string): boolean => {
    return userSetting.value?.hasExperimentalFeature(feature) || false;
  };

  // ===== 生命周期 =====

  /**
   * 初始化时自动加载（如果有 accountUuid）
   */
  const initialize = async (accountUuid?: string): Promise<void> => {
    if (accountUuid) {
      await getOrCreateUserSetting(accountUuid);
    }
  };

  return {
    // 状态
    userSetting,
    loading: isLoading,
    error,

    // 计算属性
    currentTheme,
    currentLanguage,
    themeText,
    languageText,
    autoSaveEnabled,
    autoSaveInterval,
    shortcutsEnabled,
    customShortcuts,

    // 查询方法
    hasShortcut,
    getShortcut,
    hasExperimentalFeature,

    // 命令方法
    initialize,
    loadUserSetting,
    loadUserSettingByAccount,
    getOrCreateUserSetting,
    createUserSetting,
    updateUserSetting,

    // 快捷更新方法
    updateAppearance,
    updateLocale,
    updateWorkflow,
    updatePrivacy,
    updateExperimental,
    switchTheme,
    switchLanguage,
    setShortcut,
    removeShortcut,
  };
}

/**
 * 轻量级 UserSetting 模块访问
 * 只提供数据访问，不执行网络操作
 */
export function useUserSettingData() {
  const userSettingStore = useUserSettingStore();

  return {
    userSetting: computed(() => userSettingStore.getUserSetting),
    currentTheme: computed(() => userSettingStore.getTheme),
    currentLanguage: computed(() => userSettingStore.getLanguage),
    themeText: computed(() => {
      const setting = userSettingStore.getUserSetting;
      return setting?.getThemeText() || '未设置';
    }),
    languageText: computed(() => {
      const setting = userSettingStore.getUserSetting;
      return setting?.getLanguageText() || '未设置';
    }),
    autoSaveEnabled: computed(() => userSettingStore.getAutoSave),
    autoSaveInterval: computed(() => userSettingStore.getAutoSaveInterval),
    shortcutsEnabled: computed(() => userSettingStore.getShortcutsEnabled),
    customShortcuts: computed(() => userSettingStore.getCustomShortcuts),
  };
}
