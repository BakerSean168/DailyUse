/**
 * User Setting API Client
 * 用户设置 API 客户端
 */

import { apiClient } from '@/services/api/apiClient';
import type { SettingContracts } from '@dailyuse/contracts';

/**
 * 获取当前用户设置
 */
export async function getCurrentUserSettings(): Promise<SettingContracts.UserSettingDTO> {
  const response = await apiClient.get<SettingContracts.UserSettingDTO>('/settings/me');
  return response.data;
}

/**
 * 更新当前用户设置
 */
export async function updateUserSettings(
  updates: SettingContracts.UpdateUserSettingDTO,
): Promise<SettingContracts.UserSettingDTO> {
  const response = await apiClient.put<SettingContracts.UserSettingDTO>('/settings/me', updates);
  return response.data;
}

/**
 * 重置用户设置为默认值
 */
export async function resetUserSettings(): Promise<SettingContracts.UserSettingDTO> {
  const response = await apiClient.post<SettingContracts.UserSettingDTO>('/settings/reset');
  return response.data;
}

/**
 * 获取默认设置
 */
export async function getDefaultSettings(): Promise<SettingContracts.DefaultSettingsDTO> {
  const response = await apiClient.get<SettingContracts.DefaultSettingsDTO>('/settings/defaults');
  return response.data;
}
