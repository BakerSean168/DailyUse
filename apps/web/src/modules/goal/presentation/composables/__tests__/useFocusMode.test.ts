import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFocusMode } from '../useFocusMode';
import type { GoalContracts } from '@dailyuse/contracts';

// Mock API client
vi.mock('../../infrastructure/api/focusModeApiClient', () => ({
  focusModeApiClient: {
    activateFocusMode: vi.fn(),
    deactivateFocusMode: vi.fn(),
    extendFocusMode: vi.fn(),
    getActiveFocusMode: vi.fn(),
    getFocusModeHistory: vi.fn(),
  },
}));

// Mock snackbar
vi.mock('../../../../../shared/composables/useSnackbar', () => ({
  useSnackbar: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

describe('useFocusMode', () => {
  let composable: ReturnType<typeof useFocusMode>;

  beforeEach(() => {
    composable = useFocusMode();
    vi.clearAllMocks();
  });

  describe('初始状态', () => {
    it('应该有正确的初始值', () => {
      expect(composable.isLoading.value).toBe(false);
      expect(composable.error.value).toBeNull();
      expect(composable.activeFocusMode.value).toBeNull();
      expect(composable.focusModeHistory.value).toEqual([]);
      expect(composable.hasActiveFocusMode.value).toBe(false);
      expect(composable.remainingDays.value).toBe(0);
    });
  });

  describe('计算属性', () => {
    it('hasActiveFocusMode 应该根据 activeFocusMode 正确计算', () => {
      expect(composable.hasActiveFocusMode.value).toBe(false);

      const mockFocusMode: GoalContracts.FocusModeClientDTO = {
        uuid: 'test-uuid',
        accountUuid: 'account-uuid',
        focusedGoals: [],
        startTime: Date.now(),
        endTime: Date.now() + 30 * 24 * 60 * 60 * 1000,
        hiddenGoalsMode: 'hide_all',
        isActive: true,
        isExpired: false,
        remainingDays: 30,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      composable.activeFocusMode.value = mockFocusMode;
      expect(composable.hasActiveFocusMode.value).toBe(true);
    });

    it('isExpired 应该正确判断过期状态', () => {
      const expiredFocusMode: GoalContracts.FocusModeClientDTO = {
        uuid: 'test-uuid',
        accountUuid: 'account-uuid',
        focusedGoals: [],
        startTime: Date.now() - 60 * 24 * 60 * 60 * 1000,
        endTime: Date.now() - 1 * 24 * 60 * 60 * 1000, // 昨天过期
        hiddenGoalsMode: 'hide_all',
        isActive: true,
        isExpired: false,
        remainingDays: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      composable.activeFocusMode.value = expiredFocusMode;
      expect(composable.isExpired.value).toBe(true);
    });

    it('remainingDays 应该返回正确的天数', () => {
      const focusMode: GoalContracts.FocusModeClientDTO = {
        uuid: 'test-uuid',
        accountUuid: 'account-uuid',
        focusedGoals: [],
        startTime: Date.now(),
        endTime: Date.now() + 30 * 24 * 60 * 60 * 1000,
        hiddenGoalsMode: 'hide_all',
        isActive: true,
        isExpired: false,
        remainingDays: 25,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      composable.activeFocusMode.value = focusMode;
      expect(composable.remainingDays.value).toBe(25);
    });
  });

  describe('clearState', () => {
    it('应该清除所有状态', () => {
      // 设置一些状态
      composable.activeFocusMode.value = {
        uuid: 'test-uuid',
        accountUuid: 'account-uuid',
        focusedGoals: [],
        startTime: Date.now(),
        endTime: Date.now() + 30 * 24 * 60 * 60 * 1000,
        hiddenGoalsMode: 'hide_all',
        isActive: true,
        isExpired: false,
        remainingDays: 30,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      composable.error.value = 'Test error';

      // 清除状态
      composable.clearState();

      // 验证
      expect(composable.activeFocusMode.value).toBeNull();
      expect(composable.focusModeHistory.value).toEqual([]);
      expect(composable.error.value).toBeNull();
    });
  });
});
