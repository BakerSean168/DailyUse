/**
 * UserSetting Web Application Service
 * 用户设置 Web 应用服务 - 协调 API 调用和状态管理
 */

import * as userSettingApi from '../../infrastructure/api/userSettingApi';
import { useUserSettingStore } from '../../presentation/stores/userSettingStore';
import { UserSetting } from '@dailyuse/domain-client';
import { type SettingContracts } from '@dailyuse/contracts';

/**
 * UserSetting Web 应用服务
 * 负责协调 API 客户端和 Store 之间的数据流
 */
export class UserSettingWebApplicationService {
  private static instance: UserSettingWebApplicationService | null = null;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static async getInstance(): Promise<UserSettingWebApplicationService> {
    if (!UserSettingWebApplicationService.instance) {
      UserSettingWebApplicationService.instance = new UserSettingWebApplicationService();
    }
    return UserSettingWebApplicationService.instance;
  }

  /**
   * 懒加载获取 UserSetting Store
   */
  private get userSettingStore(): ReturnType<typeof useUserSettingStore> {
    return useUserSettingStore();
  }

  /**
   * 获取当前用户设置
   */
  public async getCurrentUserSettings(): Promise<ReturnType<typeof UserSetting.fromClientDTO>> {
    try {
      const dto = await userSettingApi.getCurrentUserSettings();
      const entity = UserSetting.fromClientDTO(dto);
      this.userSettingStore.settings = entity.toClientDTO();
      return entity;
    } catch (error) {
      console.error('[UserSettingWebApplicationService] 获取用户设置失败:', error);
      throw error;
    }
  }

  /**
   * 获取或创建用户设置
   */
  public async getOrCreateUserSetting(
    accountUuid: string,
  ): Promise<ReturnType<typeof UserSetting.fromClientDTO>> {
    try {
      return await this.getCurrentUserSettings();
    } catch (error) {
      console.error('[UserSettingWebApplicationService] 获取或创建设置失败:', error);
      throw error;
    }
  }

  /**
   * 获取默认设置
   */
  public async getDefaultSettings(): Promise<ReturnType<typeof UserSetting.fromClientDTO>> {
    try {
      const dto = await userSettingApi.getDefaultSettings();
      const entity = UserSetting.fromClientDTO(dto);
      return entity;
    } catch (error) {
      console.error('[UserSettingWebApplicationService] 获取默认设置失败:', error);
      throw error;
    }
  }

  /**
   * 更新用户设置
   */
  public async updateUserSettings(
    request: SettingContracts.UpdateUserSettingRequest,
  ): Promise<ReturnType<typeof UserSetting.fromClientDTO>> {
    try {
      const dto = await userSettingApi.updateUserSettings(request);
      const entity = UserSetting.fromClientDTO(dto);
      this.userSettingStore.settings = entity.toClientDTO();
      return entity;
    } catch (error) {
      console.error('[UserSettingWebApplicationService] 更新用户设置失败:', error);
      throw error;
    }
  }

  /**
   * 重置用户设置
   */
  public async resetUserSettings(): Promise<ReturnType<typeof UserSetting.fromClientDTO>> {
    try {
      const dto = await userSettingApi.resetUserSettings();
      const entity = UserSetting.fromClientDTO(dto);
      this.userSettingStore.settings = entity.toClientDTO();
      return entity;
    } catch (error) {
      console.error('[UserSettingWebApplicationService] 重置用户设置失败:', error);
      throw error;
    }
  }

  /**
   * 更新外观设置
   */
  public async updateAppearance(
    appearance: SettingContracts.UpdateAppearanceRequest,
  ): Promise<ReturnType<typeof UserSetting.fromClientDTO>> {
    try {
      const currentSettings = this.userSettingStore.settings;
      if (!currentSettings) {
        throw new Error('No current settings found');
      }

      const request: SettingContracts.UpdateUserSettingRequest = {
        uuid: currentSettings.uuid,
        appearance,
      };
      return await this.updateUserSettings(request);
    } catch (error) {
      console.error('[UserSettingWebApplicationService] 更新外观设置失败:', error);
      throw error;
    }
  }

  /**
   * 更新本地化设置
   */
  public async updateLocale(
    locale: SettingContracts.UpdateLocaleRequest,
  ): Promise<ReturnType<typeof UserSetting.fromClientDTO>> {
    try {
      const currentSettings = this.userSettingStore.settings;
      if (!currentSettings) {
        throw new Error('No current settings found');
      }

      const request: SettingContracts.UpdateUserSettingRequest = {
        uuid: currentSettings.uuid,
        locale,
      };
      return await this.updateUserSettings(request);
    } catch (error) {
      console.error('[UserSettingWebApplicationService] 更新本地化设置失败:', error);
      throw error;
    }
  }

  /**
   * 更新工作流设置
   */
  public async updateWorkflow(
    workflow: SettingContracts.UpdateWorkflowRequest,
  ): Promise<ReturnType<typeof UserSetting.fromClientDTO>> {
    try {
      const currentSettings = this.userSettingStore.settings;
      if (!currentSettings) {
        throw new Error('No current settings found');
      }

      const request: SettingContracts.UpdateUserSettingRequest = {
        uuid: currentSettings.uuid,
        workflow,
      };
      return await this.updateUserSettings(request);
    } catch (error) {
      console.error('[UserSettingWebApplicationService] 更新工作流设置失败:', error);
      throw error;
    }
  }

  /**
   * 更新隐私设置
   */
  public async updatePrivacy(
    privacy: SettingContracts.UpdatePrivacyRequest,
  ): Promise<ReturnType<typeof UserSetting.fromClientDTO>> {
    try {
      const currentSettings = this.userSettingStore.settings;
      if (!currentSettings) {
        throw new Error('No current settings found');
      }

      const request: SettingContracts.UpdateUserSettingRequest = {
        uuid: currentSettings.uuid,
        privacy,
      };
      return await this.updateUserSettings(request);
    } catch (error) {
      console.error('[UserSettingWebApplicationService] 更新隐私设置失败:', error);
      throw error;
    }
  }

  /**
   * 更新实验性功能设置
   */
  public async updateExperimental(
    experimental: SettingContracts.UpdateExperimentalRequest,
  ): Promise<ReturnType<typeof UserSetting.fromClientDTO>> {
    try {
      const currentSettings = this.userSettingStore.settings;
      if (!currentSettings) {
        throw new Error('No current settings found');
      }

      const request: SettingContracts.UpdateUserSettingRequest = {
        uuid: currentSettings.uuid,
        experimental,
      };
      return await this.updateUserSettings(request);
    } catch (error) {
      console.error('[UserSettingWebApplicationService] 更新实验性功能设置失败:', error);
      throw error;
    }
  }

  /**
   * 快速切换主题
   */
  public async updateTheme(theme: 'LIGHT' | 'DARK' | 'AUTO'): Promise<ReturnType<typeof UserSetting.fromClientDTO>> {
    try {
      return await this.updateAppearance({ theme });
    } catch (error) {
      console.error('[UserSettingWebApplicationService] 切换主题失败:', error);
      throw error;
    }
  }

  /**
   * 快速切换语言
   */
  public async updateLanguage(
    language: string,
  ): Promise<ReturnType<typeof UserSetting.fromClientDTO>> {
    try {
      return await this.updateLocale({ language });
    } catch (error) {
      console.error('[UserSettingWebApplicationService] 切换语言失败:', error);
      throw error;
    }
  }

  /**
   * 更新快捷键
   */
  public async updateShortcut(
    action: string,
    shortcut: string,
  ): Promise<ReturnType<typeof UserSetting.fromClientDTO>> {
    try {
      const currentSettings = this.userSettingStore.settings;
      if (!currentSettings || !currentSettings.shortcuts) {
        throw new Error('No current settings found');
      }

      const updatedCustom = {
        ...currentSettings.shortcuts.custom,
        [action]: shortcut,
      };

      const request: SettingContracts.UpdateUserSettingRequest = {
        uuid: currentSettings.uuid,
        shortcuts: {
          custom: updatedCustom,
        },
      };

      return await this.updateUserSettings(request);
    } catch (error) {
      console.error('[UserSettingWebApplicationService] 更新快捷键失败:', error);
      throw error;
    }
  }

  /**
   * 删除快捷键
   */
  public async deleteShortcut(
    action: string,
  ): Promise<ReturnType<typeof UserSetting.fromClientDTO>> {
    try {
      const currentSettings = this.userSettingStore.settings;
      if (!currentSettings || !currentSettings.shortcuts) {
        throw new Error('No current settings found');
      }

      const updatedCustom = { ...currentSettings.shortcuts.custom };
      delete updatedCustom[action];

      const request: SettingContracts.UpdateUserSettingRequest = {
        uuid: currentSettings.uuid,
        shortcuts: {
          custom: updatedCustom,
        },
      };

      return await this.updateUserSettings(request);
    } catch (error) {
      console.error('[UserSettingWebApplicationService] 删除快捷键失败:', error);
      throw error;
    }
  }

  /**
   * 导出用户设置
   */
  public async exportSettings(): Promise<Record<string, any>> {
    try {
      return await userSettingApi.exportUserSettings();
    } catch (error) {
      console.error('[UserSettingWebApplicationService] 导出设置失败:', error);
      throw error;
    }
  }

  /**
   * 导入用户设置
   */
  public async importSettings(
    data: Record<string, any>,
    options?: { merge?: boolean; validate?: boolean },
  ): Promise<ReturnType<typeof UserSetting.fromClientDTO>> {
    try {
      const dto = await userSettingApi.importUserSettings(data, options);
      const entity = UserSetting.fromClientDTO(dto);
      this.userSettingStore.settings = entity.toClientDTO();
      return entity;
    } catch (error) {
      console.error('[UserSettingWebApplicationService] 导入设置失败:', error);
      throw error;
    }
  }
}
