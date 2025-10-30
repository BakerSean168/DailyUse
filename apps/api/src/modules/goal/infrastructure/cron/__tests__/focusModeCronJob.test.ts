import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  startFocusModeCronJob,
  stopFocusModeCronJob,
  isFocusModeCronJobRunning,
  manualCheckExpiredFocusModes,
} from '../focusModeCronJob';

// Mock FocusModeApplicationService
vi.mock('../../../application/FocusModeApplicationService', () => ({
  FocusModeApplicationService: {
    getInstance: vi.fn(() => ({
      checkAndDeactivateExpired: vi.fn(async () => 0),
    })),
  },
}));

describe('FocusModeCronJob', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (isFocusModeCronJobRunning()) {
      stopFocusModeCronJob();
    }
  });

  afterEach(() => {
    if (isFocusModeCronJobRunning()) {
      stopFocusModeCronJob();
    }
  });

  describe('startFocusModeCronJob', () => {
    it('应该成功启动 cron job', () => {
      const task = startFocusModeCronJob();
      expect(task).toBeDefined();
      expect(isFocusModeCronJobRunning()).toBe(true);
    });

    it('应该防止重复启动', () => {
      const task1 = startFocusModeCronJob();
      const task2 = startFocusModeCronJob();
      expect(task1).toBe(task2);
    });
  });

  describe('stopFocusModeCronJob', () => {
    it('应该成功停止 cron job', () => {
      startFocusModeCronJob();
      expect(isFocusModeCronJobRunning()).toBe(true);

      stopFocusModeCronJob();
      expect(isFocusModeCronJobRunning()).toBe(false);
    });
  });

  describe('isFocusModeCronJobRunning', () => {
    it('应该正确报告运行状态', () => {
      expect(isFocusModeCronJobRunning()).toBe(false);

      startFocusModeCronJob();
      expect(isFocusModeCronJobRunning()).toBe(true);

      stopFocusModeCronJob();
      expect(isFocusModeCronJobRunning()).toBe(false);
    });
  });
});
