/**
 * UserSetting Web Application Service
 * 用户设置 Web 应用服务 - 协调 API 调用和状态管理
 */

import { userSettingApiClient } from '../../infrastructure/api/userSettingApiClient';
import { useUserSettingStore } from '../../presentation/stores/userSettingStore';
import { SettingDomain } from '@dailyuse/domain-client';
import { type SettingContracts } from '@dailyuse/contracts';
import { CrossPlatformEventBus } from '@dailyuse/utils';

/**
 * 用户设置事件类型枚举
 */
export enum UserSettingEventType {
  THEME_CHANGED = 'user-setting:theme-changed',
  LANGUAGE_CHANGED = 'user-setting:language-changed',
  NOTIFICATIONS_CHANGED = 'user-setting:notifications-changed',
  SHORTCUTS_CHANGED = 'user-setting:shortcuts-changed',
  PRIVACY_CHANGED = 'user-setting:privacy-changed',
  WORKFLOW_CHANGED = 'user-setting:workflow-changed',
  EXPERIMENTAL_CHANGED = 'user-setting:experimental-changed',
  SETTING_UPDATED = 'user-setting:updated',
  SETTING_CREATED = 'user-setting:created',
  SETTING_DELETED = 'user-setting:deleted',
  ERROR = 'user-setting:error',
}

/**
 * 事件数据类型映射
 */
export interface UserSettingEventData {
  [UserSettingEventType.THEME_CHANGED]: { theme: string };
  [UserSettingEventType.LANGUAGE_CHANGED]: { language: string };
  [UserSettingEventType.NOTIFICATIONS_CHANGED]: { enabled: boolean };
  [UserSettingEventType.SHORTCUTS_CHANGED]: { action: string; shortcut: string | null };
  [UserSettingEventType.PRIVACY_CHANGED]: Record<string, any>;
  [UserSettingEventType.WORKFLOW_CHANGED]: Record<string, any>;
  [UserSettingEventType.EXPERIMENTAL_CHANGED]: Record<string, any>;
  [UserSettingEventType.SETTING_UPDATED]: { uuid: string };
  [UserSettingEventType.SETTING_CREATED]: { uuid: string };
  [UserSettingEventType.SETTING_DELETED]: { uuid: string };
  [UserSettingEventType.ERROR]: { error: Error; context?: string };
}

/**
 * 类型安全的事件处理器
 */
export type UserSettingEventHandler<T extends UserSettingEventType> = (
  data: UserSettingEventData[T],
) => void;

const { UserSetting } = SettingDomain;

/**
 * UserSetting Web 应用服务
 * 负责协调 API 客户端和 Store 之间的数据流
 * 实现缓存优先的数据同步策略 + 乐观更新 + 事件系统
 */
export class UserSettingWebApplicationService {
  private static instance: UserSettingWebApplicationService | null = null;

  // 事件总线 - 使用共享的跨平台事件系统
  private eventBus: CrossPlatformEventBus = new CrossPlatformEventBus();

  /**
   * 懒加载获取 UserSetting Store
   * 避免在 Pinia 初始化之前调用
   */
  private get userSettingStore() {
    return useUserSettingStore();
  }

  private constructor() {}

  /**
   * 获取服务实例（单例）
   */
  public static async getInstance(): Promise<UserSettingWebApplicationService> {
    if (!UserSettingWebApplicationService.instance) {
      UserSettingWebApplicationService.instance = new UserSettingWebApplicationService();
    }
    return UserSettingWebApplicationService.instance;
  }

  // ===== Query Methods (查询方法) =====

  /**
   * 获取用户设置（UUID）
   */
  public async getUserSetting(uuid: string): Promise<ReturnType<typeof UserSetting.fromClientDTO>> {
    try {
      const dto = await userSettingApiClient.getUserSettingByUuid(uuid);
      const entity = UserSetting.fromClientDTO(dto);
      this.userSettingStore.settings = entity.toClientDTO();
      return entity;
    } catch (error) {
      console.error('[UserSettingWebApplicationService] 获取用户设置失败:', error);
      throw error;
    }
  }

  /**
   * 根据账户UUID获取用户设置
   */
  public async getUserSettingByAccount(
    accountUuid: string,
  ): Promise<ReturnType<typeof UserSetting.fromClientDTO>> {
    try {
      const dto = await userSettingApiClient.getUserSettingByAccount(accountUuid);
      const entity = UserSetting.fromClientDTO(dto);
      this.userSettingStore.settings = entity.toClientDTO();
      return entity;
    } catch (error) {
      console.error('[UserSettingWebApplicationService] 根据账户获取设置失败:', error);
      throw error;
    }
  }

  /**
   * 获取或创建用户设置（如果不存在则自动创建）
   */
  public async getOrCreateUserSetting(
    accountUuid: string,
  ): Promise<ReturnType<typeof UserSetting.fromClientDTO>> {
    try {
      const dto = await userSettingApiClient.getOrCreateUserSetting(accountUuid);
      const entity = UserSetting.fromClientDTO(dto);
      this.userSettingStore.settings = entity.toClientDTO();
      return entity;
    } catch (error) {
      console.error('[UserSettingWebApplicationService] 获取或创建设置失败:', error);
      throw error;
    }
  }

  // ===== Command Methods (命令方法) =====

  /**
   * 创建用户设置
   */
  public async createUserSetting(
    request: SettingContracts.CreateUserSettingRequest,
  ): Promise<ReturnType<typeof UserSetting.fromClientDTO>> {
    try {
      const dto = await userSettingApiClient.createUserSetting(request);
      const entity = UserSetting.fromClientDTO(dto);
      this.userSettingStore.settings = entity.toClientDTO();
      return entity;
    } catch (error) {
      console.error('[UserSettingWebApplicationService] 创建用户设置失败:', error);
      throw error;
    }
  }

  /**
   * 更新用户设置（完整更新）
   */
  public async updateUserSetting(
    uuid: string,
    request: SettingContracts.UpdateUserSettingRequest,
  ): Promise<ReturnType<typeof UserSetting.fromClientDTO>> {
    try {
      const dto = await userSettingApiClient.updateUserSetting(uuid, request);
      const entity = UserSetting.fromClientDTO(dto);
      this.userSettingStore.settings = entity.toClientDTO();
      return entity;
    } catch (error) {
      console.error('[UserSettingWebApplicationService] 更新用户设置失败:', error);
      throw error;
    }
  }

  /**
   * 删除用户设置
   */
  public async deleteUserSetting(uuid: string): Promise<void> {
    try {
      await userSettingApiClient.deleteUserSetting(uuid);
      this.userSettingStore.settings = null;
    } catch (error) {
      console.error('[UserSettingWebApplicationService] 删除用户设置失败:', error);
      throw error;
    }
  }

  // ===== Partial Update Methods (部分更新方法) =====

  /**
   * 更新外观设置
   */
  public async updateAppearance(
    uuid: string,
    appearance: SettingContracts.UpdateAppearanceRequest,
  ): Promise<ReturnType<typeof UserSetting.fromClientDTO>> {
    try {
      const dto = await userSettingApiClient.updateAppearance(uuid, appearance);
      const entity = UserSetting.fromClientDTO(dto);
      this.userSettingStore.settings = entity.toClientDTO();
      return entity;
    } catch (error) {
      console.error('[UserSettingWebApplicationService] 更新外观设置失败:', error);
      throw error;
    }
  }

  /**
   * 更新本地化设置
   */
  public async updateLocale(
    uuid: string,
    locale: SettingContracts.UpdateLocaleRequest,
  ): Promise<ReturnType<typeof UserSetting.fromClientDTO>> {
    try {
      const dto = await userSettingApiClient.updateLocale(uuid, locale);
      const entity = UserSetting.fromClientDTO(dto);
      this.userSettingStore.settings = entity.toClientDTO();
      return entity;
    } catch (error) {
      console.error('[UserSettingWebApplicationService] 更新本地化设置失败:', error);
      throw error;
    }
  }

  /**
   * 更新工作流设置
   */
  public async updateWorkflow(
    uuid: string,
    workflow: SettingContracts.UpdateWorkflowRequest,
  ): Promise<ReturnType<typeof UserSetting.fromClientDTO>> {
    try {
      const dto = await userSettingApiClient.updateWorkflow(uuid, workflow);
      const entity = UserSetting.fromClientDTO(dto);
      this.userSettingStore.settings = entity.toClientDTO();
      return entity;
    } catch (error) {
      console.error('[UserSettingWebApplicationService] 更新工作流设置失败:', error);
      throw error;
    }
  }

  /**
   * 更新隐私设置
   */
  public async updatePrivacy(
    uuid: string,
    privacy: SettingContracts.UpdatePrivacyRequest,
  ): Promise<ReturnType<typeof UserSetting.fromClientDTO>> {
    try {
      const dto = await userSettingApiClient.updatePrivacy(uuid, privacy);
      const entity = UserSetting.fromClientDTO(dto);
      this.userSettingStore.settings = entity.toClientDTO();
      return entity;
    } catch (error) {
      console.error('[UserSettingWebApplicationService] 更新隐私设置失败:', error);
      throw error;
    }
  }

  /**
   * 更新实验性功能设置
   */
  public async updateExperimental(
    uuid: string,
    experimental: SettingContracts.UpdateExperimentalRequest,
  ): Promise<ReturnType<typeof UserSetting.fromClientDTO>> {
    try {
      const dto = await userSettingApiClient.updateExperimental(uuid, experimental);
      const entity = UserSetting.fromClientDTO(dto);
      this.userSettingStore.settings = entity.toClientDTO();
      return entity;
    } catch (error) {
      console.error('[UserSettingWebApplicationService] 更新实验性功能设置失败:', error);
      throw error;
    }
  }

  // ===== Quick Action Methods (快捷操作方法) =====

  /**
   * 快速切换主题
   */
  public async updateTheme(
    uuid: string,
    theme: string,
  ): Promise<ReturnType<typeof UserSetting.fromClientDTO>> {
    try {
      const dto = await userSettingApiClient.updateTheme(uuid, theme);
      const entity = UserSetting.fromClientDTO(dto);
      this.userSettingStore.settings = entity.toClientDTO();

      // 触发主题变更事件
      this.eventBus.send(UserSettingEventType.THEME_CHANGED, { theme });

      return entity;
    } catch (error) {
      console.error('[UserSettingWebApplicationService] 更新主题失败:', error);
      this.emitError(error as Error, 'updateTheme');
      throw error;
    }
  }

  /**
   * 快速切换语言
   */
  public async updateLanguage(
    uuid: string,
    language: string,
  ): Promise<ReturnType<typeof UserSetting.fromClientDTO>> {
    try {
      const dto = await userSettingApiClient.updateLanguage(uuid, language);
      const entity = UserSetting.fromClientDTO(dto);
      this.userSettingStore.settings = entity.toClientDTO();

      // 触发语言变更事件
      this.eventBus.send(UserSettingEventType.LANGUAGE_CHANGED, { language });

      return entity;
    } catch (error) {
      console.error('[UserSettingWebApplicationService] 更新语言失败:', error);
      this.emitError(error as Error, 'updateLanguage');
      throw error;
    }
  }

  /**
   * 更新快捷键
   */
  public async updateShortcut(
    uuid: string,
    action: string,
    shortcut: string,
  ): Promise<ReturnType<typeof UserSetting.fromClientDTO>> {
    try {
      const dto = await userSettingApiClient.updateShortcut(uuid, action, shortcut);
      const entity = UserSetting.fromClientDTO(dto);
      this.userSettingStore.settings = entity.toClientDTO();

      // 触发快捷键变更事件
      this.eventBus.send(UserSettingEventType.SHORTCUTS_CHANGED, { action, shortcut });

      return entity;
    } catch (error) {
      console.error('[UserSettingWebApplicationService] 更新快捷键失败:', error);
      this.emitError(error as Error, 'updateShortcut');
      throw error;
    }
  }

  /**
   * 删除快捷键
   */
  public async deleteShortcut(
    uuid: string,
    action: string,
  ): Promise<ReturnType<typeof UserSetting.fromClientDTO>> {
    try {
      const dto = await userSettingApiClient.deleteShortcut(uuid, action);
      const entity = UserSetting.fromClientDTO(dto);
      this.userSettingStore.settings = entity.toClientDTO();

      // 触发快捷键变更事件（删除）
      this.eventBus.send(UserSettingEventType.SHORTCUTS_CHANGED, { action, shortcut: null });

      return entity;
    } catch (error) {
      console.error('[UserSettingWebApplicationService] 删除快捷键失败:', error);
      this.emitError(error as Error, 'deleteShortcut');
      throw error;
    }
  }

  // ===== Store Access Methods (Store 访问方法) =====

  /**
   * 从 Store 获取当前用户设置
   */
  public getCurrentUserSetting(): ReturnType<typeof UserSetting.fromClientDTO> | null {
    const dto = this.userSettingStore.settings;
    return dto ? UserSetting.fromClientDTO(dto) : null;
  }

  /**
   * 清除用户设置缓存
   */
  public clearUserSettingCache(): void {
    this.userSettingStore.settings = null;
  }

  // ===== Event System Methods (事件系统方法) =====

  /**
   * 注册事件监听器
   * @returns 取消监听的函数
   */
  public on<T extends UserSettingEventType>(
    event: T,
    handler: UserSettingEventHandler<T>,
  ): () => void {
    this.eventBus.on(event, handler);
    return () => this.eventBus.off(event, handler);
  }

  /**
   * 移除事件监听器
   */
  public off<T extends UserSettingEventType>(event: T, handler: UserSettingEventHandler<T>): void {
    this.eventBus.off(event, handler);
  }

  /**
   * 清除所有事件监听器
   */
  public clearAllListeners(): void {
    this.eventBus.removeAllListeners();
  }

  /**
   * 获取事件总线实例（供高级用法）
   */
  public getEventBus(): CrossPlatformEventBus {
    return this.eventBus;
  }

  /**
   * 触发错误事件
   */
  private emitError(error: Error, context?: string): void {
    this.eventBus.send(UserSettingEventType.ERROR, { error, context });
  }

  /**
   * 便捷方法：监听主题变更
   */
  public onThemeChanged(handler: (theme: string) => void): () => void {
    return this.on(UserSettingEventType.THEME_CHANGED, ({ theme }) => handler(theme));
  }

  /**
   * 便捷方法：监听语言变更
   */
  public onLanguageChanged(handler: (language: string) => void): () => void {
    return this.on(UserSettingEventType.LANGUAGE_CHANGED, ({ language }) => handler(language));
  }

  /**
   * 便捷方法：监听通知设置变更
   */
  public onNotificationsChanged(handler: (enabled: boolean) => void): () => void {
    return this.on(UserSettingEventType.NOTIFICATIONS_CHANGED, ({ enabled }) => handler(enabled));
  }

  /**
   * 便捷方法：监听快捷键变更
   */
  public onShortcutsChanged(
    handler: (action: string, shortcut: string | null) => void,
  ): () => void {
    return this.on(UserSettingEventType.SHORTCUTS_CHANGED, ({ action, shortcut }) =>
      handler(action, shortcut),
    );
  }

  /**
   * 便捷方法：监听错误
   */
  public onError(handler: (error: Error, context?: string) => void): () => void {
    return this.on(UserSettingEventType.ERROR, ({ error, context }) => handler(error, context));
  }
}
