import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scheduleApiClient } from '../scheduleApiClient';
import type { ScheduleTaskClientDTO, ScheduleClientDTO, ConflictDetectionResult } from '@dailyuse/contracts/schedule';

// Mock the apiClient module
vi.mock('@/shared/api/instances', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from '@/shared/api/instances';

describe('scheduleApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('detectConflicts()', () => {
    it('should call POST /schedules/detect-conflicts with correct params', async () => {
      const mockResponse: ConflictDetectionResult = {
        hasConflict: false,
        conflicts: [],
        suggestions: [],
      };

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

      const params = {
        userId: 'user-123',
        startTime: 1000,
        endTime: 2000,
        excludeUuid: 'schedule-456',
      };

      const result = await scheduleApiClient.detectConflicts(params);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/schedules/detect-conflicts',
        params
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle conflicts in response', async () => {
      const mockResponse: ConflictDetectionResult = {
        hasConflict: true,
        conflicts: [
          {
            scheduleUuid: 'conflict-1',
            scheduleTitle: 'Existing Meeting',
            overlapStart: 1000,
            overlapEnd: 1800,
            overlapDuration: 30,
            severity: 'severe',
          },
        ],
        suggestions: [
          {
            type: 'move_later',
            newStartTime: 2000,
            newEndTime: 3000,
          },
        ],
      };

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

      const result = await scheduleApiClient.detectConflicts({
        userId: 'user-123',
        startTime: 1000,
        endTime: 2000,
      });

      expect(result.hasConflict).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.suggestions).toHaveLength(1);
    });

    it('should handle API errors', async () => {
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Network error'));

      await expect(
        scheduleApiClient.detectConflicts({
          userId: 'user-123',
          startTime: 1000,
          endTime: 2000,
        })
      ).rejects.toThrow('Network error');
    });

    it('should pass excludeUuid parameter', async () => {
      const mockResponse: ConflictDetectionResult = {
        hasConflict: false,
        conflicts: [],
        suggestions: [],
      };

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

      await scheduleApiClient.detectConflicts({
        userId: 'user-123',
        startTime: 1000,
        endTime: 2000,
        excludeUuid: 'exclude-me',
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/schedules/detect-conflicts',
        expect.objectContaining({
          excludeUuid: 'exclude-me',
        })
      );
    });
  });

  describe('createSchedule()', () => {
    const mockRequest: CreateScheduleRequestDTO = {
      accountUuid: 'user-123',
      title: 'New Meeting',
      description: 'Meeting description',
      startTime: 1000,
      endTime: 2000,
      duration: 60,
      priority: 3,
      location: 'Room A',
      autoDetectConflicts: true,
    };

    it('should call POST /schedules with correct data', async () => {
      const mockSchedule: ScheduleClient = {
        uuid: 'new-schedule-uuid',
        accountUuid: 'user-123',
        title: 'New Meeting',
        description: 'Meeting description',
        startTime: 1000,
        endTime: 2000,
        duration: 60,
        hasConflict: false,
        conflictingSchedules: null,
        priority: 3,
        location: 'Room A',
        attendees: null,
        createdAt: 5000,
        updatedAt: 5000,
      };

      const mockResponse: CreateScheduleResponseDTO = {
        schedule: mockSchedule,
        conflicts: null,
      };

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

      const result = await scheduleApiClient.createSchedule(mockRequest);

      expect(apiClient.post).toHaveBeenCalledWith('/schedules', mockRequest);
      expect(result.schedule).toEqual(mockSchedule);
      expect(result.conflicts).toBeNull();
    });

    it('should return conflicts when autoDetectConflicts is true', async () => {
      const mockSchedule: ScheduleClient = {
        uuid: 'new-schedule-uuid',
        accountUuid: 'user-123',
        title: 'New Meeting',
        description: null,
        startTime: 1000,
        endTime: 2000,
        duration: 60,
        hasConflict: true,
        conflictingSchedules: ['conflict-1'],
        priority: 3,
        location: null,
        attendees: null,
        createdAt: 5000,
        updatedAt: 5000,
      };

      const mockConflicts: ConflictDetectionResult = {
        hasConflict: true,
        conflicts: [
          {
            scheduleUuid: 'conflict-1',
            scheduleTitle: 'Existing Meeting',
            overlapStart: 1000,
            overlapEnd: 1800,
            overlapDuration: 30,
            severity: 'severe',
          },
        ],
        suggestions: [],
      };

      const mockResponse: CreateScheduleResponseDTO = {
        schedule: mockSchedule,
        conflicts: mockConflicts,
      };

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

      const result = await scheduleApiClient.createSchedule({
        ...mockRequest,
        autoDetectConflicts: true,
      });

      expect(result.schedule.hasConflict).toBe(true);
      expect(result.conflicts).not.toBeNull();
      expect(result.conflicts?.hasConflict).toBe(true);
    });

    it('should handle API errors during creation', async () => {
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Validation failed'));

      await expect(scheduleApiClient.createSchedule(mockRequest)).rejects.toThrow(
        'Validation failed'
      );
    });
  });

  describe('resolveConflict()', () => {
    it('should call POST /schedules/:id/resolve-conflict with RESCHEDULE strategy', async () => {
      const scheduleUuid = 'schedule-123';
      const mockRequest: ResolveConflictRequestDTO = {
        strategy: 'RESCHEDULE',
        newStartTime: 2000,
        newEndTime: 3000,
      };

      const mockSchedule: ScheduleClient = {
        uuid: scheduleUuid,
        accountUuid: 'user-123',
        title: 'Rescheduled Meeting',
        description: null,
        startTime: 2000,
        endTime: 3000,
        duration: 60,
        hasConflict: false,
        conflictingSchedules: null,
        priority: 3,
        location: null,
        attendees: null,
        createdAt: 5000,
        updatedAt: 6000,
      };

      const mockResponse: ResolveConflictResponseDTO = {
        schedule: mockSchedule,
        conflicts: {
          hasConflict: false,
          conflicts: [],
          suggestions: [],
        },
        appliedChanges: {
          strategy: 'RESCHEDULE',
          previousStartTime: 1000,
          previousEndTime: 2000,
          newStartTime: 2000,
          newEndTime: 3000,
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

      const result = await scheduleApiClient.resolveConflict(scheduleUuid, mockRequest);

      expect(apiClient.post).toHaveBeenCalledWith(
        `/schedules/${scheduleUuid}/resolve-conflict`,
        mockRequest
      );
      expect(result.schedule.startTime).toBe(2000);
      expect(result.schedule.endTime).toBe(3000);
      expect(result.conflicts.hasConflict).toBe(false);
    });

    it('should handle CANCEL strategy', async () => {
      const scheduleUuid = 'schedule-123';
      const mockRequest: ResolveConflictRequestDTO = {
        strategy: 'CANCEL',
      };

      const mockResponse: ResolveConflictResponseDTO = {
        schedule: null as any, // Schedule is deleted
        conflicts: {
          hasConflict: false,
          conflicts: [],
          suggestions: [],
        },
        appliedChanges: {
          strategy: 'CANCEL',
          deleted: true,
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

      const result = await scheduleApiClient.resolveConflict(scheduleUuid, mockRequest);

      expect(apiClient.post).toHaveBeenCalledWith(
        `/schedules/${scheduleUuid}/resolve-conflict`,
        { strategy: 'CANCEL' }
      );
      expect(result.appliedChanges.deleted).toBe(true);
    });

    it('should handle ADJUST_DURATION strategy', async () => {
      const scheduleUuid = 'schedule-123';
      const mockRequest: ResolveConflictRequestDTO = {
        strategy: 'ADJUST_DURATION',
        newDuration: 30,
      };

      const mockSchedule: ScheduleClient = {
        uuid: scheduleUuid,
        accountUuid: 'user-123',
        title: 'Shortened Meeting',
        description: null,
        startTime: 1000,
        endTime: 1800, // Reduced duration
        duration: 30,
        hasConflict: false,
        conflictingSchedules: null,
        priority: 3,
        location: null,
        attendees: null,
        createdAt: 5000,
        updatedAt: 6000,
      };

      const mockResponse: ResolveConflictResponseDTO = {
        schedule: mockSchedule,
        conflicts: {
          hasConflict: false,
          conflicts: [],
          suggestions: [],
        },
        appliedChanges: {
          strategy: 'ADJUST_DURATION',
          previousDuration: 60,
          newDuration: 30,
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

      const result = await scheduleApiClient.resolveConflict(scheduleUuid, mockRequest);

      expect(result.schedule.duration).toBe(30);
      expect(result.appliedChanges.newDuration).toBe(30);
    });

    it('should handle IGNORE strategy', async () => {
      const scheduleUuid = 'schedule-123';
      const mockRequest: ResolveConflictRequestDTO = {
        strategy: 'IGNORE',
      };

      const mockSchedule: ScheduleClient = {
        uuid: scheduleUuid,
        accountUuid: 'user-123',
        title: 'Meeting',
        description: null,
        startTime: 1000,
        endTime: 2000,
        duration: 60,
        hasConflict: false, // Conflict flag cleared
        conflictingSchedules: null,
        priority: 3,
        location: null,
        attendees: null,
        createdAt: 5000,
        updatedAt: 6000,
      };

      const mockResponse: ResolveConflictResponseDTO = {
        schedule: mockSchedule,
        conflicts: {
          hasConflict: false,
          conflicts: [],
          suggestions: [],
        },
        appliedChanges: {
          strategy: 'IGNORE',
          conflictFlagCleared: true,
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

      const result = await scheduleApiClient.resolveConflict(scheduleUuid, mockRequest);

      expect(result.schedule.hasConflict).toBe(false);
      expect(result.appliedChanges.conflictFlagCleared).toBe(true);
    });

    it('should handle API errors during conflict resolution', async () => {
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Not found'));

      await expect(
        scheduleApiClient.resolveConflict('non-existent', { strategy: 'IGNORE' })
      ).rejects.toThrow('Not found');
    });
  });
});

