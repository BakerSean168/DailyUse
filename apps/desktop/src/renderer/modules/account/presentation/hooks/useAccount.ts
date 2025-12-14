/**
 * useAccount Hook
 *
 * 账户管理 Hook
 * Story-008: Auth & Account UI
 * 
 * 使用 @dailyuse/application-client 的 Use Case 实现 DDD 架构
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getMyProfile,
  updateMyProfile,
  updateAccountPreferences,
  changeMyPassword,
  type UpdateMyProfileInput,
} from '@dailyuse/application-client';
import type { AccountDTO, UpdateAccountPreferencesRequestDTO } from '@dailyuse/contracts/account';

interface AccountState {
  account: AccountDTO | null;
  loading: boolean;
  error: string | null;
}

interface UseAccountReturn extends AccountState {
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

export function useAccount(): UseAccountReturn {
  const [state, setState] = useState<AccountState>({
    account: null,
    loading: false,
    error: null,
  });

  // Load profile
  const loadProfile = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // 使用 application-client Use Case
      const account = await getMyProfile();
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

  // Update profile
  const updateProfileFn = useCallback(
    async (request: UpdateMyProfileInput) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // 使用 application-client Use Case
        const account = await updateMyProfile(request);
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
    },
    [],
  );

  // Update preferences
  const updatePreferencesFn = useCallback(
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
        // 使用 application-client Use Case
        const account = await updateAccountPreferences({
          accountId: state.account.uuid,
          request,
        });
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

  // Change password
  const changePasswordFn = useCallback(
    async (currentPassword: string, newPassword: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // 使用 application-client Use Case
        await changeMyPassword({ currentPassword, newPassword });
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

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Refresh
  const refresh = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    account: state.account,
    loading: state.loading,
    error: state.error,
    loadProfile,
    updateProfile: updateProfileFn,
    updatePreferences: updatePreferencesFn,
    changePassword: changePasswordFn,
    clearError,
    refresh,
  };
}

export type { AccountState, UseAccountReturn };
export default useAccount;
