import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DashboardStatisticsApplicationService } from '../DashboardStatisticsApplicationService';
import { DashboardContainer } from '../../../infrastructure/di/DashboardContainer';
import type {
  ITaskStatisticsRepository,
  IGoalStatisticsRepository,
  IReminderStatisticsRepository,
  IScheduleStatisticsRepository,
  TaskStatistics,
  GoalStatistics,
  ReminderStatistics,
  ScheduleStatistics,
} from '@dailyuse/domain-server';
import type { StatisticsCacheService } from '../../../infrastructure/services/StatisticsCacheService';
import type { DashboardContracts } from '@dailyuse/contracts';

describe('DashboardStatisticsApplicationService - Unit Tests', () => {
  let service: DashboardStatisticsApplicationService;
  let mockTaskRepository: ITaskStatisticsRepository;
  let mockGoalRepository: IGoalStatisticsRepository;
  let mockReminderRepository: IReminderStatisticsRepository;
  let mockScheduleRepository: IScheduleStatisticsRepository;
  let mockCacheService: StatisticsCacheService;
  let container: DashboardContainer;

  const TEST_ACCOUNT_UUID = 'test-account-123';

  // Mock statistics data
  const mockTaskStatistics: TaskStatistics = {
    accountUuid: TEST_ACCOUNT_UUID,
    totalTaskTemplates: 10,
    totalTaskInstances: 25,
    completedTaskInstances: 20,
    taskCompletionRate: 80,
    totalPendingInstances: 5,
    averageCompletionTime: 60,
    totalCompletionTime: 1200,
    totalCompletedTaskInstances: 20,
    lastUpdatedAt: Date.now(),
    toDTO: vi.fn().mockReturnValue({
      accountUuid: TEST_ACCOUNT_UUID,
      totalTaskTemplates: 10,
      totalTaskInstances: 25,
      completedTaskInstances: 20,
      taskCompletionRate: 80,
    }),
  } as any;

  const mockGoalStatistics: GoalStatistics = {
    accountUuid: TEST_ACCOUNT_UUID,
    totalGoals: 5,
    activeGoals: 3,
    completedGoals: 2,
    completionRate: 40,
    averageProgress: 60,
    totalProgress: 300,
    totalKeyResults: 15,
    completedKeyResults: 10,
    keyResultsCompletionRate: 66.67,
    lastUpdatedAt: Date.now(),
    toDTO: vi.fn().mockReturnValue({
      accountUuid: TEST_ACCOUNT_UUID,
      totalGoals: 5,
      activeGoals: 3,
      completedGoals: 2,
      completionRate: 40,
    }),
  } as any;

  const mockReminderStatistics: ReminderStatistics = {
    accountUuid: TEST_ACCOUNT_UUID,
    totalReminders: 8,
    activeReminders: 6,
    pausedReminders: 1,
    completedReminders: 1,
    totalTriggers: 50,
    successfulTriggers: 45,
    successRate: 90,
    lastUpdatedAt: Date.now(),
    toDTO: vi.fn().mockReturnValue({
      accountUuid: TEST_ACCOUNT_UUID,
      totalReminders: 8,
      activeReminders: 6,
      totalTriggers: 50,
      successRate: 90,
    }),
  } as any;

  const mockScheduleStatistics: ScheduleStatistics = {
    accountUuid: TEST_ACCOUNT_UUID,
    totalExecutions: 100,
    successfulExecutions: 95,
    failedExecutions: 5,
    completionRate: 95,
    totalTasks: 20,
    activeTasks: 18,
    completedTasks: 2,
    lastUpdatedAt: Date.now(),
    toDTO: vi.fn().mockReturnValue({
      accountUuid: TEST_ACCOUNT_UUID,
      totalTasks: 20,
      totalExecutions: 100,
      successfulExecutions: 95,
      completionRate: 95,
    }),
  } as any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock repositories
    mockTaskRepository = {
      findByAccountUuid: vi.fn().mockResolvedValue(mockTaskStatistics),
    } as any;

    mockGoalRepository = {
      findByAccountUuid: vi.fn().mockResolvedValue(mockGoalStatistics),
    } as any;

    mockReminderRepository = {
      findByAccountUuid: vi.fn().mockResolvedValue(mockReminderStatistics),
    } as any;

    mockScheduleRepository = {
      findByAccountUuid: vi.fn().mockResolvedValue(mockScheduleStatistics),
    } as any;

    mockCacheService = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      invalidate: vi.fn().mockResolvedValue(undefined),
    } as any;

    // Get container instance and inject mocks
    container = DashboardContainer.getInstance();
    vi.spyOn(container, 'getTaskStatisticsRepository').mockReturnValue(mockTaskRepository);
    vi.spyOn(container, 'getGoalStatisticsRepository').mockReturnValue(mockGoalRepository);
    vi.spyOn(container, 'getReminderStatisticsRepository').mockReturnValue(mockReminderRepository);
    vi.spyOn(container, 'getScheduleStatisticsRepository').mockReturnValue(mockScheduleRepository);
    vi.spyOn(container, 'getCacheService').mockReturnValue(mockCacheService);

    service = new DashboardStatisticsApplicationService(container);
  });

  describe('getDashboardStatistics', () => {
    it('should return cached data if available', async () => {
      // Arrange
      const cachedData: DashboardContracts.DashboardStatisticsClientDTO = {
        task: {
          totalTaskTemplates: 10,
          totalTaskInstances: 25,
          completedTaskInstances: 20,
          taskCompletionRate: 80,
        },
        goal: {
          totalGoals: 5,
          activeGoals: 3,
          completedGoals: 2,
          completionRate: 40,
        },
        reminder: {
          totalReminders: 8,
          activeReminders: 6,
          totalTriggers: 50,
          successRate: 90,
        },
        schedule: {
          totalTasks: 20,
          totalExecutions: 100,
          successfulExecutions: 95,
          completionRate: 95,
        },
        overall: {
          completionRate: 76.25,
        },
      };

      mockCacheService.get = vi.fn().mockResolvedValue(cachedData);

      // Act
      const result = await service.getDashboardStatistics(TEST_ACCOUNT_UUID);

      // Assert
      expect(result).toEqual(cachedData);
      expect(mockCacheService.get).toHaveBeenCalledWith(TEST_ACCOUNT_UUID);
      expect(mockTaskRepository.findByAccountUuid).not.toHaveBeenCalled(); // Should not query DB
    });

    it('should aggregate from repositories on cache miss', async () => {
      // Arrange
      mockCacheService.get = vi.fn().mockResolvedValue(null);

      // Act
      const result = await service.getDashboardStatistics(TEST_ACCOUNT_UUID);

      // Assert
      expect(mockCacheService.get).toHaveBeenCalledWith(TEST_ACCOUNT_UUID);
      expect(mockTaskRepository.findByAccountUuid).toHaveBeenCalledWith(TEST_ACCOUNT_UUID);
      expect(mockGoalRepository.findByAccountUuid).toHaveBeenCalledWith(TEST_ACCOUNT_UUID);
      expect(mockReminderRepository.findByAccountUuid).toHaveBeenCalledWith(TEST_ACCOUNT_UUID);
      expect(mockScheduleRepository.findByAccountUuid).toHaveBeenCalledWith(TEST_ACCOUNT_UUID);
      expect(mockCacheService.set).toHaveBeenCalledWith(TEST_ACCOUNT_UUID, result);
    });

    it('should handle missing task statistics gracefully', async () => {
      // Arrange
      mockTaskRepository.findByAccountUuid = vi.fn().mockResolvedValue(null);

      // Act
      const result = await service.getDashboardStatistics(TEST_ACCOUNT_UUID);

      // Assert
      expect(result.task).toEqual({
        totalTaskTemplates: 0,
        totalTaskInstances: 0,
        completedTaskInstances: 0,
        taskCompletionRate: 0,
      });
    });

    it('should handle missing goal statistics gracefully', async () => {
      // Arrange
      mockGoalRepository.findByAccountUuid = vi.fn().mockResolvedValue(null);

      // Act
      const result = await service.getDashboardStatistics(TEST_ACCOUNT_UUID);

      // Assert
      expect(result.goal).toEqual({
        totalGoals: 0,
        activeGoals: 0,
        completedGoals: 0,
        completionRate: 0,
      });
    });

    it('should handle missing reminder statistics gracefully', async () => {
      // Arrange
      mockReminderRepository.findByAccountUuid = vi.fn().mockResolvedValue(null);

      // Act
      const result = await service.getDashboardStatistics(TEST_ACCOUNT_UUID);

      // Assert
      expect(result.reminder).toEqual({
        totalReminders: 0,
        activeReminders: 0,
        totalTriggers: 0,
        successRate: 0,
      });
    });

    it('should handle missing schedule statistics gracefully', async () => {
      // Arrange
      mockScheduleRepository.findByAccountUuid = vi.fn().mockResolvedValue(null);

      // Act
      const result = await service.getDashboardStatistics(TEST_ACCOUNT_UUID);

      // Assert
      expect(result.schedule).toEqual({
        totalTasks: 0,
        totalExecutions: 0,
        successfulExecutions: 0,
        completionRate: 0,
      });
    });

    it('should calculate overall completion rate correctly', async () => {
      // Act
      const result = await service.getDashboardStatistics(TEST_ACCOUNT_UUID);

      // Assert
      // Weighted average: (80 + 40 + 90 + 95) / 4 = 76.25
      expect(result.overall.completionRate).toBeCloseTo(76.25, 2);
    });

    it('should handle all statistics missing', async () => {
      // Arrange
      mockTaskRepository.findByAccountUuid = vi.fn().mockResolvedValue(null);
      mockGoalRepository.findByAccountUuid = vi.fn().mockResolvedValue(null);
      mockReminderRepository.findByAccountUuid = vi.fn().mockResolvedValue(null);
      mockScheduleRepository.findByAccountUuid = vi.fn().mockResolvedValue(null);

      // Act
      const result = await service.getDashboardStatistics(TEST_ACCOUNT_UUID);

      // Assert
      expect(result.task.totalTaskTemplates).toBe(0);
      expect(result.goal.totalGoals).toBe(0);
      expect(result.reminder.totalReminders).toBe(0);
      expect(result.schedule.totalTasks).toBe(0);
      expect(result.overall.completionRate).toBe(0);
    });

    it('should write to cache after aggregation', async () => {
      // Arrange
      mockCacheService.get = vi.fn().mockResolvedValue(null);

      // Act
      const result = await service.getDashboardStatistics(TEST_ACCOUNT_UUID);

      // Assert
      expect(mockCacheService.set).toHaveBeenCalledWith(TEST_ACCOUNT_UUID, result);
      expect(mockCacheService.set).toHaveBeenCalledTimes(1);
    });

    it('should handle cache read errors gracefully', async () => {
      // Arrange
      mockCacheService.get = vi.fn().mockRejectedValue(new Error('Redis connection failed'));

      // Act
      const result = await service.getDashboardStatistics(TEST_ACCOUNT_UUID);

      // Assert - Should still return aggregated data
      expect(result).toBeDefined();
      expect(result.task.totalTaskTemplates).toBe(10);
      expect(mockTaskRepository.findByAccountUuid).toHaveBeenCalled();
    });

    it('should handle cache write errors gracefully', async () => {
      // Arrange
      mockCacheService.get = vi.fn().mockResolvedValue(null);
      mockCacheService.set = vi.fn().mockRejectedValue(new Error('Redis write failed'));

      // Act & Assert - Should not throw error
      await expect(service.getDashboardStatistics(TEST_ACCOUNT_UUID)).resolves.toBeDefined();
    });
  });

  describe('invalidateCache', () => {
    it('should call cache service invalidate', async () => {
      // Act
      await service.invalidateCache(TEST_ACCOUNT_UUID);

      // Assert
      expect(mockCacheService.invalidate).toHaveBeenCalledWith(TEST_ACCOUNT_UUID);
      expect(mockCacheService.invalidate).toHaveBeenCalledTimes(1);
    });

    it('should handle cache invalidation errors gracefully', async () => {
      // Arrange
      mockCacheService.invalidate = vi.fn().mockRejectedValue(new Error('Redis delete failed'));

      // Act & Assert - Should not throw error
      await expect(service.invalidateCache(TEST_ACCOUNT_UUID)).resolves.toBeUndefined();
    });
  });

  describe('aggregateStatistics (parallel queries)', () => {
    it('should query all repositories in parallel', async () => {
      // Arrange
      const startTime = Date.now();

      // Act
      await service.getDashboardStatistics(TEST_ACCOUNT_UUID);

      // Assert
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Parallel execution should be faster than sequential (< 100ms for mocks)
      expect(duration).toBeLessThan(100);
      expect(mockTaskRepository.findByAccountUuid).toHaveBeenCalled();
      expect(mockGoalRepository.findByAccountUuid).toHaveBeenCalled();
      expect(mockReminderRepository.findByAccountUuid).toHaveBeenCalled();
      expect(mockScheduleRepository.findByAccountUuid).toHaveBeenCalled();
    });

    it('should handle partial repository failures', async () => {
      // Arrange
      mockGoalRepository.findByAccountUuid = vi
        .fn()
        .mockRejectedValue(new Error('Goal repository error'));

      // Act
      const result = await service.getDashboardStatistics(TEST_ACCOUNT_UUID);

      // Assert - Should use default for failed repository
      expect(result.goal).toEqual({
        totalGoals: 0,
        activeGoals: 0,
        completedGoals: 0,
        completionRate: 0,
      });
      expect(result.task.totalTaskTemplates).toBe(10); // Other repositories still work
    });
  });
});
