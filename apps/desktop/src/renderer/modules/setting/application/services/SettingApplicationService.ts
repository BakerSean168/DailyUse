/**
 * Setting Application Service - Renderer
 *
 * 设置模块应用服务层
 * 封装 @dailyuse/application-client 的 Setting Use Cases
 */

import {
  getUserSettings,
  updateAppearance,
  updateLocale,
  resetUserSettings,
  getAppConfig,
  exportSettings,
  importSettings,
  type UpdateAppearanceInput,
  type UpdateLocaleInput,
} from '@dailyuse/application-client';
import type {
  UserSettingClientDTO,
  AppConfigClientDTO,
} from '@dailyuse/contracts/setting';

/**
 * 设置应用服务
 *
 * 提供设置相关的所有业务操作
 */
export class SettingApplicationService {
  // ===== User Settings =====

  /**
   * 获取用户设置
   */
  async getUserSettings(): Promise<UserSettingClientDTO> {
    return getUserSettings();
  }

  /**
   * 更新外观设置
   */
  async updateAppearance(input: UpdateAppearanceInput): Promise<UserSettingClientDTO> {
    return updateAppearance(input);
  }

  /**
   * 更新语言设置
   */
  async updateLocale(input: UpdateLocaleInput): Promise<UserSettingClientDTO> {
    return updateLocale(input);
  }

  /**
   * 重置用户设置
   */
  async resetUserSettings(): Promise<UserSettingClientDTO> {
    return resetUserSettings();
  }

  // ===== App Config =====

  /**
   * 获取应用配置
   */
  async getAppConfig(): Promise<AppConfigClientDTO> {
    return getAppConfig();
  }

  // ===== Import/Export =====

  /**
   * 导出设置
   * 返回 JSON 字符串
   */
  async exportSettings(): Promise<string> {
    return exportSettings();
  }

  /**
   * 导入设置
   * 返回导入后的用户设置
   */
  async importSettings(data: string): Promise<UserSettingClientDTO> {
    return importSettings(data);
  }
}

/**
 * 设置应用服务单例
 */
export const settingApplicationService = new SettingApplicationService();
