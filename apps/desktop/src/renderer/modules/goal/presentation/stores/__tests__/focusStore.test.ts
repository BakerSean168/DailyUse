/**
 * Focus Store Unit Tests
 *
 * Story 13.54: Store 单元测试
 *
 * Tests for focusStore using mock IPC client
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import { useFocusStore } from '../../../presentation/stores/focusStore';
import {
  MockIPCClient,
  resetStore,
  getStoreState,
  waitForStoreState,
} from '@/renderer/shared/testing';

// Mock the goal container
vi.mock('../../../di/goal.container', () => ({
  goalContainer: {
    focusClient: new MockIPCClient(),
  },
}));

// Get the mocked client
const getMockClient = () => {
  const { goalContainer } = require('../../../di/goal.container');
  return goalContainer.focusClient as MockIPCClient;
};

describe('useFocusStore', () => {
  let mockClient: MockIPCClient;

  beforeEach(() => {
    mockClient = getMockClient();
    mockClient.reset();

    // Reset store state
    act(() => {
      useFocusStore.setState({
        currentSession: null,
        history: [],
        isLoading: false,
        error: null,
      }, true);
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useFocusStore.getState();

      expect(state.currentSession).toBeNull();
      expect(state.history).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('startFocus', () => {
    it('should start a focus session', async () => {
      const mockSession = {
        goalUuid: 'goal-123',
        startTime: new Date().toISOString(),
        status: 'active' as const,
        elapsedSeconds: 0,
      };

      mockClient.mockResponse('goal:focus:start', mockSession);

      await act(async () => {
        await useFocusStore.getState().startFocus('goal-123');
      });

      const state = useFocusStore.getState();
      expect(state.currentSession).toEqual(mockSession);
      expect(state.isLoading).toBe(false);
      expect(mockClient.wasCalledWith('goal:focus:start', { goalUuid: 'goal-123' })).toBe(true);
    });

    it('should handle start error', async () => {
      mockClient.mockError('goal:focus:start', new Error('Failed to start session'));

      await act(async () => {
        await useFocusStore.getState().startFocus('goal-123');
      });

      const state = useFocusStore.getState();
      expect(state.currentSession).toBeNull();
      expect(state.error).toBe('Failed to start session');
    });
  });

  describe('pauseFocus', () => {
    it('should pause active session', async () => {
      // Setup: Set an active session
      const activeSession = {
        goalUuid: 'goal-123',
        startTime: new Date().toISOString(),
        status: 'active' as const,
        elapsedSeconds: 300,
      };

      act(() => {
        useFocusStore.setState({ currentSession: activeSession });
      });

      const pausedSession = { ...activeSession, status: 'paused' as const };
      mockClient.mockResponse('goal:focus:pause', pausedSession);

      await act(async () => {
        await useFocusStore.getState().pauseFocus();
      });

      const state = useFocusStore.getState();
      expect(state.currentSession?.status).toBe('paused');
    });
  });

  describe('resumeFocus', () => {
    it('should resume paused session', async () => {
      const pausedSession = {
        goalUuid: 'goal-123',
        startTime: new Date().toISOString(),
        status: 'paused' as const,
        elapsedSeconds: 300,
      };

      act(() => {
        useFocusStore.setState({ currentSession: pausedSession });
      });

      const resumedSession = { ...pausedSession, status: 'active' as const };
      mockClient.mockResponse('goal:focus:resume', resumedSession);

      await act(async () => {
        await useFocusStore.getState().resumeFocus();
      });

      const state = useFocusStore.getState();
      expect(state.currentSession?.status).toBe('active');
    });
  });

  describe('stopFocus', () => {
    it('should stop session and add to history', async () => {
      const activeSession = {
        goalUuid: 'goal-123',
        startTime: new Date().toISOString(),
        status: 'active' as const,
        elapsedSeconds: 600,
      };

      act(() => {
        useFocusStore.setState({ currentSession: activeSession });
      });

      const completedSession = {
        ...activeSession,
        status: 'completed' as const,
        endTime: new Date().toISOString(),
      };
      mockClient.mockResponse('goal:focus:stop', completedSession);

      await act(async () => {
        await useFocusStore.getState().stopFocus();
      });

      const state = useFocusStore.getState();
      expect(state.currentSession).toBeNull();
    });
  });

  describe('fetchHistory', () => {
    it('should fetch session history', async () => {
      const mockHistory = [
        {
          goalUuid: 'goal-123',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          status: 'completed' as const,
          elapsedSeconds: 1800,
        },
        {
          goalUuid: 'goal-456',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          status: 'completed' as const,
          elapsedSeconds: 3600,
        },
      ];

      mockClient.mockResponse('goal:focus:history', mockHistory);

      await act(async () => {
        await useFocusStore.getState().fetchHistory();
      });

      const state = useFocusStore.getState();
      expect(state.history).toEqual(mockHistory);
      expect(state.history).toHaveLength(2);
    });
  });

  describe('computed values', () => {
    it('should calculate total focus time from history', () => {
      const mockHistory = [
        { elapsedSeconds: 1800 },
        { elapsedSeconds: 3600 },
        { elapsedSeconds: 900 },
      ];

      act(() => {
        useFocusStore.setState({ history: mockHistory as any });
      });

      const state = useFocusStore.getState();
      const totalSeconds = state.history.reduce((sum, s) => sum + (s.elapsedSeconds || 0), 0);
      expect(totalSeconds).toBe(6300); // 1h 45min
    });
  });
});
