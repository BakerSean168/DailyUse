/**
 * User Setting API Client
 * 用户设置 API 客户端
 */

import { apiClient } from '@/shared/api';
import type { UserSettingClientDTO, UpdateUserSettingRequest } from '@dailyuse/contracts';

/**
 * 获取当前用户设置
 */
export async function getCurrentUserSettings(): Promise<UserSettingClientDTO> {
  return await apiClient.get<UserSettingClientDTO>('/api/v1/settings/me');
}

/**
 * 更新当前用户设置
 */
export async function updateUserSettings(
  updates: UpdateUserSettingRequest,
): Promise<UserSettingClientDTO> {
  return await apiClient.put<UserSettingClientDTO>('/api/v1/settings/me', updates);
}

/**
 * 重置用户设置为默认值
 */
export async function resetUserSettings(): Promise<UserSettingClientDTO> {
  return await apiClient.post<UserSettingClientDTO>('/api/v1/settings/reset');
}

/**
 * 获取默认设置
 */
export async function getDefaultSettings(): Promise<UserSettingClientDTO> {
  return await apiClient.get<UserSettingClientDTO>('/api/v1/settings/defaults');
}
