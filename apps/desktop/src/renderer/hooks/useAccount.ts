/**
 * useAccount Hook
 *
 * 账户管理 Hook
 * Story-008: Auth & Account UI
 */

import { useState, useEffect, useCallback } from 'react';
import { AccountContainer } from '@dailyuse/infrastructure-client';
import type { AccountDTO, UpdateAccountProfileRequestDTO, UpdateAccountPreferencesRequestDTO } from '@dailyuse/contracts/account';

interface AccountState {
  account: AccountDTO | null;
  loading: boolean;
  error: string | null;
}

interface UseAccountReturn extends AccountState {
  // Profile
  loadProfile: () => Promise<void>;
  updateProfile: (request: UpdateAccountProfileRequestDTO) => Promise<void>;
  
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
      const accountApiClient = AccountContainer.getInstance().getApiClient();
      const account = await accountApiClient.getMyProfile();
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
  const updateProfile = useCallback(
    async (request: UpdateAccountProfileRequestDTO) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const accountApiClient = AccountContainer.getInstance().getApiClient();
        const account = await accountApiClient.updateMyProfile(request);
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
        const accountApiClient = AccountContainer.getInstance().getApiClient();
        const account = await accountApiClient.updatePreferences(state.account.uuid, request);
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
  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const accountApiClient = AccountContainer.getInstance().getApiClient();
        await accountApiClient.changeMyPassword({ currentPassword, newPassword });
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
    updateProfile,
    updatePreferences,
    changePassword,
    clearError,
    refresh,
  };
}

export default useAccount;
