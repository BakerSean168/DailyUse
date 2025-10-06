/**
 * User Preferences API Client
 * 用户偏好设置 API 客户端
 */

import { apiClient } from '@/shared/api/instances';
import { SettingContracts } from '@dailyuse/contracts';

// 导出 contracts 中的类型
export type UserPreferencesDTO = SettingContracts.UserPreferencesDTO;
export type UpdateUserPreferencesRequestDTO = SettingContracts.UpdateUserPreferencesRequestDTO;
export type SwitchThemeModeRequestDTO = SettingContracts.SwitchThemeModeRequestDTO;
export type ChangeLanguageRequestDTO = SettingContracts.ChangeLanguageRequestDTO;
export type SetNotificationsRequestDTO = SettingContracts.SetNotificationsRequestDTO;

/**
 * 用户偏好设置 API
 */
export const userPreferencesApi = {
  /**
   * 获取用户偏好设置
   */
  async getPreferences(): Promise<UserPreferencesDTO> {
    return apiClient.get<UserPreferencesDTO>('/settings/preferences');
  },

  /**
   * 切换主题模式
   */
  async switchThemeMode(themeMode: 'light' | 'dark' | 'system'): Promise<UserPreferencesDTO> {
    return apiClient.post<UserPreferencesDTO>('/settings/preferences/theme-mode', { themeMode });
  },

  /**
   * 更改语言
   */
  async changeLanguage(language: string): Promise<UserPreferencesDTO> {
    return apiClient.post<UserPreferencesDTO>('/settings/preferences/language', { language });
  },

  /**
   * 更新通知偏好
   */
  async updateNotificationPreferences(
    preferences: Partial<UpdateUserPreferencesRequestDTO>,
  ): Promise<UserPreferencesDTO> {
    return apiClient.post<UserPreferencesDTO>('/settings/preferences/notifications', preferences);
  },

  /**
   * 更新用户偏好（批量）
   */
  async updatePreferences(updates: UpdateUserPreferencesRequestDTO): Promise<UserPreferencesDTO> {
    return apiClient.put<UserPreferencesDTO>('/settings/preferences', updates);
  },

  /**
   * 重置为默认设置
   */
  async resetToDefault(): Promise<UserPreferencesDTO> {
    return apiClient.post<UserPreferencesDTO>('/settings/preferences/reset');
  },
};
