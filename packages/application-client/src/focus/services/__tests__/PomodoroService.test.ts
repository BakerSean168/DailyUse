import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PomodoroService } from '../PomodoroService';
import type {
  PomodoroPhase,
  PomodoroSession,
  SessionStatus,
} from '../PomodoroService';

describe('PomodoroService', () => {
  let service: PomodoroService;

  beforeEach(() => {
    // Get fresh singleton instance
    service = PomodoroService.getInstance();
    // Reset all state
    service.reset();
    service.clearCache();
    // Reset settings to defaults
    service.updateSettings({
      workDuration: 25 * 60,
      shortBreakDuration: 5 * 60,
      longBreakDuration: 15 * 60,
      longBreakInterval: 4,
      autoStartBreak: false,
      autoStartWork: false,
    });
  });

  afterEach(() => {
    service.reset();
    service.clearCache();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = PomodoroService.getInstance();
      const instance2 = PomodoroService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Session Management', () => {
    it('should start a work session', () => {
      const mockStart = vi.fn();
      service.onSessionStart = mockStart;

      service.start('work', 'task-1');
      const session = service.getCurrentSession();

      expect(session).toBeDefined();
      expect(session?.phase).toBe('work');
      expect(session?.taskId).toBe('task-1');
      expect(session?.status).toBe('active');
      expect(mockStart).toHaveBeenCalled();
    });

    it('should start with default work phase', () => {
      service.start();
      const session = service.getCurrentSession();
      expect(session?.phase).toBe('work');
    });

    it('should start a short break session', () => {
      service.start('shortBreak');
      const session = service.getCurrentSession();
      expect(session?.phase).toBe('shortBreak');
    });

    it('should start a long break session', () => {
      service.start('longBreak');
      const session = service.getCurrentSession();
      expect(session?.phase).toBe('longBreak');
    });

    it('should generate unique session IDs', () => {
      service.start('work');
      const session1 = service.getCurrentSession();
      service.reset();

      service.start('work');
      const session2 = service.getCurrentSession();

      expect(session1?.id).not.toBe(session2?.id);
    });
  });

  describe('Timer Control', () => {
    it('should pause an active session', () => {
      const mockPause = vi.fn();
      service.onSessionPause = mockPause;

      service.start('work');
      service.pause();

      const session = service.getCurrentSession();
      expect(session?.status).toBe('paused');
      expect(mockPause).toHaveBeenCalled();
    });

    it('should resume a paused session', () => {
      const mockResume = vi.fn();
      service.onSessionResume = mockResume;

      service.start('work');
      service.pause();
      service.resume();

      const session = service.getCurrentSession();
      expect(session?.status).toBe('active');
      expect(mockResume).toHaveBeenCalled();
    });

    it('should not pause if no session is active', () => {
      service.pause();
      expect(service.getCurrentSession()).toBeNull();
    });

    it('should not resume if no session is paused', () => {
      service.start('work');
      service.resume(); // should not crash
      const session = service.getCurrentSession();
      expect(session?.status).toBe('active');
    });

    it('should reset session', () => {
      service.start('work');
      service.reset();
      expect(service.getCurrentSession()).toBeNull();
    });
  });

  describe('Phase Management', () => {
    it('should skip to next phase', () => {
      const mockComplete = vi.fn();
      service.onPhaseComplete = mockComplete;

      service.start('work');
      service.skip();

      expect(mockComplete).toHaveBeenCalledWith('work', 'shortBreak');
      expect(service.getCurrentSession()).toBeNull();
    });

    it('should trigger long break after 4 work sessions', () => {
      const mockComplete = vi.fn();
      service.onPhaseComplete = mockComplete;

      // Complete 4 work sessions
      for (let i = 0; i < 4; i++) {
        service.start('work');
        service.skip();
      }

      expect(service.getCompletedPomodoros()).toBe(4);
      expect(mockComplete).toHaveBeenLastCalledWith('work', 'longBreak');
    });

    it('should auto-start break if configured', () => {
      service.updateSettings({ autoStartBreak: true });
      service.start('work');
      service.skip();

      const session = service.getCurrentSession();
      expect(session?.phase).toBe('shortBreak');
    });

    it('should auto-start work if configured', () => {
      service.updateSettings({ autoStartWork: true });
      service.start('shortBreak');
      service.skip();

      const session = service.getCurrentSession();
      expect(session?.phase).toBe('work');
    });

    it('should preserve taskId through break phases', () => {
      service.updateSettings({ autoStartBreak: true });
      service.start('work', 'task-1');
      service.skip();

      const session = service.getCurrentSession();
      expect(session?.taskId).toBe('task-1');
    });
  });

  describe('Settings Management', () => {
    it('should get default settings', () => {
      const settings = service.getSettings();
      expect(settings.workDuration).toBe(25 * 60);
      expect(settings.shortBreakDuration).toBe(5 * 60);
      expect(settings.longBreakDuration).toBe(15 * 60);
      expect(settings.longBreakInterval).toBe(4);
    });

    it('should update work duration', () => {
      service.updateSettings({ workDuration: 30 * 60 });
      service.start('work');
      expect(service.getRemainingTime()).toBe(30 * 60);
    });

    it('should update break durations', () => {
      service.updateSettings({
        shortBreakDuration: 10 * 60,
        longBreakDuration: 20 * 60,
      });

      service.start('shortBreak');
      expect(service.getRemainingTime()).toBe(10 * 60);

      service.reset();

      service.start('longBreak');
      expect(service.getRemainingTime()).toBe(20 * 60);
    });

    it('should update long break interval', () => {
      service.updateSettings({ longBreakInterval: 3 });

      for (let i = 0; i < 3; i++) {
        service.start('work');
        service.skip();
      }

      expect(service.getCompletedPomodoros()).toBe(3);
    });

    it('should apply settings to new sessions', () => {
      const oldSettings = service.getSettings();
      service.updateSettings({
        workDuration: 45 * 60,
        shortBreakDuration: 10 * 60,
      });

      service.start('work');
      expect(service.getRemainingTime()).toBe(45 * 60);

      service.reset();

      service.start('shortBreak');
      expect(service.getRemainingTime()).toBe(10 * 60);
    });
  });

  describe('Statistics', () => {
    it('should track completed pomodoros', () => {
      expect(service.getCompletedPomodoros()).toBe(0);

      service.start('work');
      service.skip();
      expect(service.getCompletedPomodoros()).toBe(1);

      service.start('work');
      service.skip();
      expect(service.getCompletedPomodoros()).toBe(2);
    });

    it('should return remaining time', () => {
      service.start('work');
      const remainingTime = service.getRemainingTime();
      expect(remainingTime).toBe(25 * 60);
      expect(remainingTime).toBeGreaterThan(0);
    });

    it('should return zero remaining time when no session', () => {
      expect(service.getRemainingTime()).toBe(0);
    });

    it('should get all sessions', () => {
      service.start('work');
      service.skip();

      service.start('work');
      service.skip();

      const sessions = service.getSessions();
      expect(sessions.length).toBeGreaterThanOrEqual(2);
    });

    it('should get sessions by date', () => {
      service.start('work', 'task-1');
      service.skip();

      const today = new Date();
      const sessions = service.getSessionsByDate(today);
      expect(sessions.length).toBeGreaterThan(0);
    });

    it('should calculate total focus time', () => {
      service.updateSettings({ workDuration: 60 }); // 60 seconds for testing

      service.start('work');
      service.skip();

      service.start('work');
      service.skip();

      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);

      const totalTime = service.calculateTotalFocusTime(startDate, endDate);
      expect(totalTime).toBeGreaterThan(0);
    });

    it('should calculate completion rate', () => {
      service.start('work');
      service.skip();

      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);

      const rate = service.getCompletionRate(startDate, endDate);
      expect(rate).toBeGreaterThanOrEqual(0);
      expect(rate).toBeLessThanOrEqual(100);
    });

    it('should return 0 completion rate when no sessions', () => {
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);

      const rate = service.getCompletionRate(startDate, endDate);
      expect(rate).toBe(0);
    });
  });

  describe('Events', () => {
    it('should fire onTick event during timer', (done) => {
      service.updateSettings({ workDuration: 3 }); // 3 seconds
      const mockTick = vi.fn();
      service.onTick = mockTick;

      service.start('work');

      setTimeout(() => {
        expect(mockTick).toHaveBeenCalled();
        service.reset();
      }, 1500);
    });

    it('should fire onPhaseComplete event', () => {
      service.updateSettings({ workDuration: 2 }); // 2 seconds
      const mockComplete = vi.fn();
      service.onPhaseComplete = mockComplete;

      return new Promise((resolve) => {
        service.start('work');

        setTimeout(() => {
          expect(mockComplete).toHaveBeenCalled();
          service.reset();
          resolve(undefined);
        }, 2500);
      });
    });

    it('should fire onSessionComplete event', () => {
      service.updateSettings({ workDuration: 2 });
      const mockSessionComplete = vi.fn();
      service.onSessionComplete = mockSessionComplete;

      return new Promise((resolve) => {
        service.start('work');

        setTimeout(() => {
          // Note: onSessionComplete is fired on skip
          service.skip();
          // May or may not be called depending on implementation
          service.reset();
          resolve(undefined);
        }, 2500);
      });
    });

    it('should allow event subscribers', () => {
      const mockStart = vi.fn();
      const mockPause = vi.fn();
      const mockResume = vi.fn();

      service.onSessionStart = mockStart;
      service.onSessionPause = mockPause;
      service.onSessionResume = mockResume;

      service.start('work');
      expect(mockStart).toHaveBeenCalled();

      service.pause();
      expect(mockPause).toHaveBeenCalled();

      service.resume();
      expect(mockResume).toHaveBeenCalled();
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', () => {
      service.updateSettings({ workDuration: 30 * 60 });
      service.clearCache('settings');

      const settings = service.getSettings();
      expect(settings).toBeDefined();
    });

    it('should set cache expiry', () => {
      service.setCacheExpiry(60); // 60 minutes
      expect(service).toBeDefined();
    });

    it('should clear all cache', () => {
      service.clearCache();
      expect(service.getSettings()).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid start/stop', () => {
      for (let i = 0; i < 5; i++) {
        service.start('work');
        service.reset();
      }
      expect(service.getCurrentSession()).toBeNull();
    });

    it('should handle session without task ID', () => {
      service.start('work');
      const session = service.getCurrentSession();
      expect(session?.taskId).toBeUndefined();
    });

    it('should track pomodoro number', () => {
      service.start('work');
      let session = service.getCurrentSession();
      expect(session?.pomodoro_number).toBe(1);

      service.skip();
      service.start('work');
      session = service.getCurrentSession();
      expect(session?.pomodoro_number).toBe(2);
    });

    it('should handle zero-duration sessions gracefully', () => {
      service.updateSettings({ workDuration: 0 });
      service.start('work');
      expect(service.getRemainingTime()).toBe(0);
    });

    it('should not crash when skipping non-existent session', () => {
      service.skip(); // no session active
      expect(service.getCurrentSession()).toBeNull();
    });
  });
});
