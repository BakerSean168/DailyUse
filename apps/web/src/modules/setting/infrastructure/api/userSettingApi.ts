/**
 * User Setting API Client
 * 用户设置 API 客户端
 */

import { apiClient } from '@/shared/api';
import type { SettingContracts } from '@dailyuse/contracts';

// 类型别名
type UserSettingClientDTO = SettingContracts.UserSettingClientDTO;
type UpdateUserSettingRequest = SettingContracts.UpdateUserSettingRequest;

/**
 * 获取当前用户设置
 */
export async function getCurrentUserSettings(): Promise<UserSettingClientDTO> {
  return await apiClient.get<UserSettingClientDTO>('/settings/me');
}

/**
 * 更新当前用户设置
 */
export async function updateUserSettings(
  updates: UpdateUserSettingRequest,
): Promise<UserSettingClientDTO> {
  return await apiClient.put<UserSettingClientDTO>('/settings/me', updates);
}

/**
 * 重置用户设置为默认值
 */
export async function resetUserSettings(): Promise<UserSettingClientDTO> {
  return await apiClient.post<UserSettingClientDTO>('/settings/reset');
}

/**
 * 获取默认设置
 */
export async function getDefaultSettings(): Promise<UserSettingClientDTO> {
  return await apiClient.get<UserSettingClientDTO>('/settings/defaults');
}

/**
 * 导出用户设置为 JSON
 */
export async function exportUserSettings(): Promise<Record<string, any>> {
  return await apiClient.get<Record<string, any>>('/settings/export');
}

/**
 * 导入用户设置
 * @param data 导出的设置数据
 * @param options 导入选项
 */
export async function importUserSettings(
  data: Record<string, any>,
  options?: {
    merge?: boolean; // 是否合并现有设置（默认：false，完全替换）
    validate?: boolean; // 是否验证数据（默认：true）
  },
): Promise<UserSettingClientDTO> {
  return await apiClient.post<UserSettingClientDTO>('/settings/import', {
    data,
    options,
  });
}

