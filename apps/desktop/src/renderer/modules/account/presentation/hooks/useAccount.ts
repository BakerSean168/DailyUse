/**
 * useAccount Hook
 *
 * 账户管理 Hook - 渲染进程
 *
 * 职责：
 * - 封装账户状态管理
 * - 调用 ApplicationService 执行业务逻辑
 * - 提供响应式状态给组件
 *
 * 架构：Presentation Layer → Application Layer → Use Cases
 */

import { useState, useEffect, useCallback } from 'react';
import { accountApplicationService } from '../../application/services';
import type { AccountDTO, UpdateAccountPreferencesRequestDTO } from '@dailyuse/contracts/account';
import type { UpdateMyProfileInput } from '@dailyuse/application-client';

// ===== Types =====

export interface AccountState {
  account: AccountDTO | null;
  loading: boolean;
  error: string | null;
}

export interface UseAccountReturn extends AccountState {
  // Profile
  loadProfile: () => Promise<void>;
  updateProfile: (request: UpdateMyProfileInput) => Promise<void>;

  // Preferences
  updatePreferences: (request: UpdateAccountPreferencesRequestDTO) => Promise<void>;

  // Password
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;

  // Utilities
  clearError: () => void;
  refresh: () => Promise<void>;
}

// ===== Hook Implementation =====

export function useAccount(): UseAccountReturn {
  const [state, setState] = useState<AccountState>({
    account: null,
    loading: false,
    error: null,
  });

  // ===== Actions =====

  /**
   * 加载用户资料
   */
  const loadProfile = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const account = await accountApplicationService.getMyProfile();
      setState((prev) => ({ ...prev, account, loading: false }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '加载账户失败';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, []);

  /**
   * 更新用户资料
   */
  const updateProfile = useCallback(async (request: UpdateMyProfileInput) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const account = await accountApplicationService.updateMyProfile(request);
      setState((prev) => ({ ...prev, account, loading: false }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '更新资料失败';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw e;
    }
  }, []);

  /**
   * 更新偏好设置
   */
  const updatePreferences = useCallback(
    async (request: UpdateAccountPreferencesRequestDTO) => {
      if (!state.account?.uuid) {
        setState((prev) => ({
          ...prev,
          error: '请先登录',
        }));
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const account = await accountApplicationService.updatePreferences(
          state.account.uuid,
          request,
        );
        setState((prev) => ({ ...prev, account, loading: false }));
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '更新偏好设置失败';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        throw e;
      }
    },
    [state.account?.uuid],
  );

  /**
   * 修改密码
   */
  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        await accountApplicationService.changeMyPassword({
          currentPassword,
          newPassword,
        });
        setState((prev) => ({ ...prev, loading: false }));
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '修改密码失败';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        throw e;
      }
    },
    [],
  );

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * 刷新数据
   */
  const refresh = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  // ===== Effects =====

  // 组件挂载时加载资料
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // ===== Return =====

  return {
    // State
    account: state.account,
    loading: state.loading,
    error: state.error,

    // Actions
    loadProfile,
    updateProfile,
    updatePreferences,
    changePassword,
    clearError,
    refresh,
  };
}

export default useAccount;
