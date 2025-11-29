import { describe, it, expect, vi, beforeEach } from 'vitest';
import ScheduleConflictDetectionService from '../ScheduleConflictDetectionService';
import type { ScheduleServerDTO } from '@dailyuse/contracts/schedule';
import { Schedule as DomainSchedule } from '@dailyuse/domain-server/schedule';

describe('ScheduleConflictDetectionService', () => {
  let service: ScheduleConflictDetectionService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      findByTimeRange: vi.fn(),
      findByUuid: vi.fn(),
      save: vi.fn(),
      findByAccountUuid: vi.fn(),
      deleteByUuid: vi.fn(),
    };

    service = new ScheduleConflictDetectionService(mockRepo);
  });

  describe('detectConflictsForSchedule', () => {
    it('returns no conflict when repository returns empty', async () => {
      mockRepo.findByTimeRange.mockResolvedValue([]);

      const schedule: ScheduleServerDTO = {
        uuid: 's-1',
        accountUuid: 'a-1',
        title: 'Test',
        startTime: new Date('2025-10-24T10:00:00.000Z').toISOString(),
        endTime: new Date('2025-10-24T11:00:00.000Z').toISOString(),
        duration: 60,
        hasConflict: false,
        conflictingSchedules: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as ScheduleServerDTO;

      const result = await service.detectConflictsForSchedule(schedule);

      expect(result).toHaveProperty('hasConflict', false);
      expect(result.conflicts).toHaveLength(0);
      expect(mockRepo.findByTimeRange).toHaveBeenCalledWith(
        'a-1',
        new Date('2025-10-24T10:00:00.000Z').getTime(),
        new Date('2025-10-24T11:00:00.000Z').getTime(),
        's-1'
      );
    });

    it('detects conflict when overlapping schedule exists', async () => {
      // Create a domain aggregate for the overlapping schedule using fromServerDTO
      const otherDTO: ScheduleServerDTO = {
        uuid: 's-2',
        accountUuid: 'a-1',
        title: 'Other',
        startTime: new Date('2025-10-24T10:30:00.000Z').toISOString(),
        endTime: new Date('2025-10-24T11:30:00.000Z').toISOString(),
        duration: 60,
        hasConflict: false,
        conflictingSchedules: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as ScheduleServerDTO;
      
      const otherAggregate = DomainSchedule.fromServerDTO(otherDTO);

      mockRepo.findByTimeRange.mockResolvedValue([otherAggregate]);

      const schedule: ScheduleServerDTO = {
        uuid: 's-1',
        accountUuid: 'a-1',
        title: 'Test',
        startTime: new Date('2025-10-24T10:00:00.000Z').toISOString(),
        endTime: new Date('2025-10-24T11:00:00.000Z').toISOString(),
        duration: 60,
        hasConflict: false,
        conflictingSchedules: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as ScheduleServerDTO;

      const result = await service.detectConflictsForSchedule(schedule);

      expect(result).toHaveProperty('hasConflict', true);
      expect(result.conflicts.length).toBeGreaterThan(0);
      expect(result.conflicts[0].scheduleUuid).toBe('s-2');
      // Verify overlap details are present
      expect(result.conflicts[0]).toHaveProperty('overlapStart');
      expect(result.conflicts[0]).toHaveProperty('overlapEnd');
    });

    it('detects multiple conflicts when multiple overlapping schedules exist', async () => {
      // Create multiple overlapping domain aggregates using fromServerDTO
      const other1DTO: ScheduleServerDTO = {
        uuid: 's-2',
        accountUuid: 'a-1',
        title: 'Other 1',
        startTime: new Date('2025-10-24T10:15:00.000Z').toISOString(),
        endTime: new Date('2025-10-24T10:45:00.000Z').toISOString(),
        duration: 30,
        hasConflict: false,
        conflictingSchedules: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as ScheduleServerDTO;
      const other1 = DomainSchedule.fromServerDTO(other1DTO);

      const other2DTO: ScheduleServerDTO = {
        uuid: 's-3',
        accountUuid: 'a-1',
        title: 'Other 2',
        startTime: new Date('2025-10-24T10:30:00.000Z').toISOString(),
        endTime: new Date('2025-10-24T11:30:00.000Z').toISOString(),
        duration: 60,
        hasConflict: false,
        conflictingSchedules: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as ScheduleServerDTO;
      const other2 = DomainSchedule.fromServerDTO(other2DTO);

      mockRepo.findByTimeRange.mockResolvedValue([other1, other2]);

      const schedule: ScheduleServerDTO = {
        uuid: 's-1',
        accountUuid: 'a-1',
        title: 'Test',
        startTime: new Date('2025-10-24T10:00:00.000Z').toISOString(),
        endTime: new Date('2025-10-24T11:00:00.000Z').toISOString(),
        duration: 60,
        hasConflict: false,
        conflictingSchedules: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as ScheduleServerDTO;

      const result = await service.detectConflictsForSchedule(schedule);

      expect(result.hasConflict).toBe(true);
      expect(result.conflicts).toHaveLength(2);
      expect(result.conflicts[0].scheduleUuid).toBe('s-2');
      expect(result.conflicts[1].scheduleUuid).toBe('s-3');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('passes excludeUuid to repository for editing scenario', async () => {
      mockRepo.findByTimeRange.mockResolvedValue([]);

      const schedule: ScheduleServerDTO = {
        uuid: 's-edit',
        accountUuid: 'a-1',
        title: 'Editing Schedule',
        startTime: new Date('2025-10-24T10:00:00.000Z').toISOString(),
        endTime: new Date('2025-10-24T11:00:00.000Z').toISOString(),
        duration: 60,
        hasConflict: false,
        conflictingSchedules: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as ScheduleServerDTO;

      await service.detectConflictsForSchedule(schedule);

      // Verify excludeUuid is passed (should be the schedule's own uuid)
      expect(mockRepo.findByTimeRange).toHaveBeenCalledWith(
        'a-1',
        expect.any(Number),
        expect.any(Number),
        's-edit'
      );
    });

    it('throws error for invalid time range', async () => {
      const schedule: ScheduleServerDTO = {
        uuid: 's-1',
        accountUuid: 'a-1',
        title: 'Invalid',
        startTime: new Date('2025-10-24T11:00:00.000Z').toISOString(),
        endTime: new Date('2025-10-24T10:00:00.000Z').toISOString(), // end before start
        duration: 60,
        hasConflict: false,
        conflictingSchedules: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as ScheduleServerDTO;

      await expect(service.detectConflictsForSchedule(schedule)).rejects.toThrow(
        'Invalid time range: startTime must be before endTime'
      );
    });
  });

  describe('getScheduleConflicts', () => {
    it('successfully retrieves and detects conflicts for existing schedule', async () => {
      // Create the target schedule aggregate using fromServerDTO
      const targetDTO: ScheduleServerDTO = {
        uuid: 's-1',
        accountUuid: 'a-1',
        title: 'Target',
        startTime: new Date('2025-10-24T10:00:00.000Z').toISOString(),
        endTime: new Date('2025-10-24T11:00:00.000Z').toISOString(),
        duration: 60,
        hasConflict: false,
        conflictingSchedules: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as ScheduleServerDTO;
      const targetAggregate = DomainSchedule.fromServerDTO(targetDTO);

      // Create an overlapping schedule
      const otherDTO: ScheduleServerDTO = {
        uuid: 's-2',
        accountUuid: 'a-1',
        title: 'Other',
        startTime: new Date('2025-10-24T10:30:00.000Z').toISOString(),
        endTime: new Date('2025-10-24T11:30:00.000Z').toISOString(),
        duration: 60,
        hasConflict: false,
        conflictingSchedules: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as ScheduleServerDTO;
      const otherAggregate = DomainSchedule.fromServerDTO(otherDTO);

      mockRepo.findByUuid.mockResolvedValue(targetAggregate);
      mockRepo.findByTimeRange.mockResolvedValue([otherAggregate]);

      const result = await service.getScheduleConflicts('s-1');

      expect(mockRepo.findByUuid).toHaveBeenCalledWith('s-1');
      expect(result.hasConflict).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].scheduleUuid).toBe('s-2');
    });

    it('throws error when schedule not found', async () => {
      mockRepo.findByUuid.mockResolvedValue(null);

      await expect(service.getScheduleConflicts('invalid-uuid')).rejects.toThrow(
        'Schedule not found: invalid-uuid'
      );

      expect(mockRepo.findByUuid).toHaveBeenCalledWith('invalid-uuid');
    });

    it('returns no conflicts when no overlapping schedules exist', async () => {
      const targetDTO: ScheduleServerDTO = {
        uuid: 's-1',
        accountUuid: 'a-1',
        title: 'Target',
        startTime: new Date('2025-10-24T10:00:00.000Z').toISOString(),
        endTime: new Date('2025-10-24T11:00:00.000Z').toISOString(),
        duration: 60,
        hasConflict: false,
        conflictingSchedules: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as ScheduleServerDTO;
      const targetAggregate = DomainSchedule.fromServerDTO(targetDTO);

      mockRepo.findByUuid.mockResolvedValue(targetAggregate);
      mockRepo.findByTimeRange.mockResolvedValue([]);

      const result = await service.getScheduleConflicts('s-1');

      expect(result.hasConflict).toBe(false);
      expect(result.conflicts).toHaveLength(0);
    });
  });
});


