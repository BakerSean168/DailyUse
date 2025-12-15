/**
 * Goal IPC Client Unit Tests
 *
 * Story 13.53: IPC Client 单元测试
 *
 * Tests for GoalIPCClient using mock IPC infrastructure
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  MockIPCClient,
  setupMockElectronAPI,
  createSuccessResponse,
  type MockElectronAPI,
} from '@/renderer/shared/testing';

// Mock goal data
const mockGoal = {
  uuid: 'goal-123',
  accountUuid: 'account-456',
  title: 'Test Goal',
  description: 'A test goal description',
  status: 'active',
  progress: 50,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockGoalsList = [
  mockGoal,
  { ...mockGoal, uuid: 'goal-456', title: 'Another Goal' },
];

describe('GoalIPCClient', () => {
  let mockClient: MockIPCClient;

  beforeEach(() => {
    mockClient = new MockIPCClient();
  });

  afterEach(() => {
    mockClient.reset();
  });

  describe('list', () => {
    it('should return goals for an account', async () => {
      // Setup
      mockClient.mockResponse('goal:list', mockGoalsList);

      // Execute
      const result = await mockClient.invoke<typeof mockGoalsList>(
        'goal:list',
        { accountUuid: 'account-456' }
      );

      // Verify
      expect(result).toEqual(mockGoalsList);
      expect(mockClient.wasCalledWith('goal:list', { accountUuid: 'account-456' })).toBe(true);
    });

    it('should handle empty list', async () => {
      mockClient.mockResponse('goal:list', []);

      const result = await mockClient.invoke<unknown[]>('goal:list', { accountUuid: 'account-456' });

      expect(result).toEqual([]);
    });
  });

  describe('get', () => {
    it('should return a single goal by uuid', async () => {
      mockClient.mockResponse('goal:get', mockGoal);

      const result = await mockClient.invoke<typeof mockGoal>('goal:get', { uuid: 'goal-123' });

      expect(result).toEqual(mockGoal);
      expect(mockClient.wasCalledWith('goal:get', { uuid: 'goal-123' })).toBe(true);
    });

    it('should throw when goal not found', async () => {
      mockClient.mockError('goal:get', new Error('Goal not found'));

      await expect(
        mockClient.invoke('goal:get', { uuid: 'nonexistent' })
      ).rejects.toThrow('Goal not found');
    });
  });

  describe('create', () => {
    it('should create a new goal', async () => {
      const newGoal = {
        accountUuid: 'account-456',
        title: 'New Goal',
        description: 'Description',
      };

      mockClient.mockResponse('goal:create', {
        ...mockGoal,
        ...newGoal,
        uuid: 'new-goal-uuid',
      });

      const result = await mockClient.invoke<typeof mockGoal>('goal:create', newGoal);

      expect(result.title).toBe('New Goal');
      expect(mockClient.wasCalledWith('goal:create', newGoal)).toBe(true);
    });
  });

  describe('update', () => {
    it('should update an existing goal', async () => {
      const updates = { title: 'Updated Title' };
      mockClient.mockResponse('goal:update', { ...mockGoal, ...updates });

      const result = await mockClient.invoke<typeof mockGoal>('goal:update', {
        uuid: 'goal-123',
        updates,
      });

      expect(result.title).toBe('Updated Title');
    });
  });

  describe('delete', () => {
    it('should delete a goal', async () => {
      mockClient.mockResponse('goal:delete', { success: true });

      const result = await mockClient.invoke<{ success: boolean }>('goal:delete', {
        uuid: 'goal-123',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('call tracking', () => {
    it('should track all IPC calls', async () => {
      mockClient
        .mockResponse('goal:list', mockGoalsList)
        .mockResponse('goal:get', mockGoal);

      await mockClient.invoke('goal:list', { accountUuid: 'account-456' });
      await mockClient.invoke('goal:get', { uuid: 'goal-123' });

      expect(mockClient.callCount).toBe(2);
      expect(mockClient.getCallsFor('goal:list')).toHaveLength(1);
      expect(mockClient.getCallsFor('goal:get')).toHaveLength(1);
    });

    it('should return last call', async () => {
      mockClient
        .mockResponse('goal:list', mockGoalsList)
        .mockResponse('goal:get', mockGoal);

      await mockClient.invoke('goal:list', { accountUuid: 'account-456' });
      await mockClient.invoke('goal:get', { uuid: 'goal-123' });

      const lastCall = mockClient.getLastCall();
      expect(lastCall?.channel).toBe('goal:get');
      expect(lastCall?.payload).toEqual({ uuid: 'goal-123' });
    });
  });

  describe('multiple responses', () => {
    it('should return responses in order', async () => {
      mockClient.mockResponses('goal:list', [
        mockGoalsList,
        [],
        [mockGoal],
      ]);

      const result1 = await mockClient.invoke<unknown[]>('goal:list', {});
      const result2 = await mockClient.invoke<unknown[]>('goal:list', {});
      const result3 = await mockClient.invoke<unknown[]>('goal:list', {});

      expect(result1).toHaveLength(2);
      expect(result2).toHaveLength(0);
      expect(result3).toHaveLength(1);
    });
  });
});

describe('Electron API Integration', () => {
  let mockAPI: MockElectronAPI;
  let restore: () => void;

  beforeEach(() => {
    const setup = setupMockElectronAPI();
    mockAPI = setup.mockAPI;
    restore = setup.restore;
  });

  afterEach(() => {
    restore();
  });

  it('should setup mock electron API on window', () => {
    expect((globalThis as any).window.electronAPI).toBeDefined();
    expect((globalThis as any).window.electronAPI.invoke).toBeDefined();
  });

  it('should allow mocking invoke responses', async () => {
    mockAPI.invoke.mockResolvedValue({ data: mockGoal });

    const result = await (globalThis as any).window.electronAPI.invoke('goal:get', {
      uuid: 'goal-123',
    });

    expect(result).toEqual({ data: mockGoal });
    expect(mockAPI.invoke).toHaveBeenCalledWith('goal:get', { uuid: 'goal-123' });
  });

  it('should track event listeners', () => {
    const callback = vi.fn();
    (globalThis as any).window.electronAPI.on('some-event', callback);

    expect(mockAPI.on).toHaveBeenCalledWith('some-event', callback);
  });
});
