import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StatisticsCacheService } from '../StatisticsCacheService';
import type { DashboardContracts } from '@dailyuse/contracts';
import Redis from 'ioredis';

// Mock ioredis
vi.mock('ioredis');

describe('StatisticsCacheService - Unit Tests', () => {
  let service: StatisticsCacheService;
  let mockRedis: any;

  const TEST_USER_ID = 'user-123';
  const TEST_DATA: DashboardContracts.DashboardStatisticsClientDTO = {
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

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock Redis instance
    mockRedis = {
      get: vi.fn(),
      setex: vi.fn(),
      del: vi.fn(),
      keys: vi.fn(),
      ttl: vi.fn(),
      ping: vi.fn(),
      info: vi.fn(),
      on: vi.fn(),
      quit: vi.fn(),
    };

    // Mock Redis constructor
    (Redis as any).mockImplementation(() => mockRedis);

    service = new StatisticsCacheService();
  });

  afterEach(async () => {
    await service['redis'].quit();
  });

  describe('get', () => {
    it('should return cached data if exists', async () => {
      // Arrange
      const cachedJson = JSON.stringify(TEST_DATA);
      mockRedis.get.mockResolvedValue(cachedJson);

      // Act
      const result = await service.get(TEST_USER_ID);

      // Assert
      expect(result).toEqual(TEST_DATA);
      expect(mockRedis.get).toHaveBeenCalledWith('dashboard:statistics:user-123');
    });

    it('should return null if cache miss', async () => {
      // Arrange
      mockRedis.get.mockResolvedValue(null);

      // Act
      const result = await service.get(TEST_USER_ID);

      // Assert
      expect(result).toBeNull();
      expect(mockRedis.get).toHaveBeenCalledWith('dashboard:statistics:user-123');
    });

    it('should return null on Redis error', async () => {
      // Arrange
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));

      // Act
      const result = await service.get(TEST_USER_ID);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null on invalid JSON', async () => {
      // Arrange
      mockRedis.get.mockResolvedValue('invalid-json{');

      // Act
      const result = await service.get(TEST_USER_ID);

      // Assert
      expect(result).toBeNull();
    });

    it('should use correct key format', async () => {
      // Act
      await service.get('test-user-456');

      // Assert
      expect(mockRedis.get).toHaveBeenCalledWith('dashboard:statistics:test-user-456');
    });
  });

  describe('set', () => {
    it('should store data with TTL', async () => {
      // Arrange
      mockRedis.setex.mockResolvedValue('OK');

      // Act
      await service.set(TEST_USER_ID, TEST_DATA);

      // Assert
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'dashboard:statistics:user-123',
        300, // 5 minutes TTL
        JSON.stringify(TEST_DATA),
      );
    });

    it('should handle Redis write errors gracefully', async () => {
      // Arrange
      mockRedis.setex.mockRejectedValue(new Error('Redis write failed'));

      // Act & Assert - Should not throw
      await expect(service.set(TEST_USER_ID, TEST_DATA)).resolves.toBeUndefined();
    });

    it('should use correct key format and TTL', async () => {
      // Act
      await service.set('user-789', TEST_DATA);

      // Assert
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'dashboard:statistics:user-789',
        300,
        expect.any(String),
      );
    });
  });

  describe('invalidate', () => {
    it('should delete cache key', async () => {
      // Arrange
      mockRedis.del.mockResolvedValue(1);

      // Act
      await service.invalidate(TEST_USER_ID);

      // Assert
      expect(mockRedis.del).toHaveBeenCalledWith('dashboard:statistics:user-123');
    });

    it('should handle key not found gracefully', async () => {
      // Arrange
      mockRedis.del.mockResolvedValue(0);

      // Act & Assert - Should not throw
      await expect(service.invalidate(TEST_USER_ID)).resolves.toBeUndefined();
    });

    it('should handle Redis delete errors gracefully', async () => {
      // Arrange
      mockRedis.del.mockRejectedValue(new Error('Redis delete failed'));

      // Act & Assert - Should not throw
      await expect(service.invalidate(TEST_USER_ID)).resolves.toBeUndefined();
    });
  });

  describe('invalidatePattern', () => {
    it('should delete keys matching pattern', async () => {
      // Arrange
      const keys = [
        'dashboard:statistics:user-1',
        'dashboard:statistics:user-2',
        'dashboard:statistics:user-3',
      ];
      mockRedis.keys.mockResolvedValue(keys);
      mockRedis.del.mockResolvedValue(3);

      // Act
      await service.invalidatePattern('dashboard:statistics:*');

      // Assert
      expect(mockRedis.keys).toHaveBeenCalledWith('dashboard:statistics:*');
      expect(mockRedis.del).toHaveBeenCalledWith(...keys);
    });

    it('should handle empty key set', async () => {
      // Arrange
      mockRedis.keys.mockResolvedValue([]);

      // Act & Assert - Should not throw
      await expect(service.invalidatePattern('dashboard:statistics:*')).resolves.toBeUndefined();
      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should handle Redis pattern errors gracefully', async () => {
      // Arrange
      mockRedis.keys.mockRejectedValue(new Error('Redis keys failed'));

      // Act & Assert - Should not throw
      await expect(service.invalidatePattern('dashboard:*')).resolves.toBeUndefined();
    });
  });

  describe('getTtl', () => {
    it('should return remaining TTL in seconds', async () => {
      // Arrange
      mockRedis.ttl.mockResolvedValue(250);

      // Act
      const result = await service.getTtl(TEST_USER_ID);

      // Assert
      expect(result).toBe(250);
      expect(mockRedis.ttl).toHaveBeenCalledWith('dashboard:statistics:user-123');
    });

    it('should return -1 for non-existent key', async () => {
      // Arrange
      mockRedis.ttl.mockResolvedValue(-2);

      // Act
      const result = await service.getTtl(TEST_USER_ID);

      // Assert
      expect(result).toBe(-2);
    });

    it('should return -1 on Redis error', async () => {
      // Arrange
      mockRedis.ttl.mockRejectedValue(new Error('Redis TTL failed'));

      // Act
      const result = await service.getTtl(TEST_USER_ID);

      // Assert
      expect(result).toBe(-1);
    });
  });

  describe('ping', () => {
    it('should return PONG on successful connection', async () => {
      // Arrange
      mockRedis.ping.mockResolvedValue('PONG');

      // Act
      const result = await service.ping();

      // Assert
      expect(result).toBe('PONG');
      expect(mockRedis.ping).toHaveBeenCalled();
    });

    it('should throw on connection error', async () => {
      // Arrange
      mockRedis.ping.mockRejectedValue(new Error('Redis unavailable'));

      // Act & Assert
      await expect(service.ping()).rejects.toThrow('Redis unavailable');
    });
  });

  describe('getStats', () => {
    it('should return memory stats', async () => {
      // Arrange
      const mockInfo = `# Memory
used_memory:1048576
used_memory_human:1.00M
connected_clients:10`;
      mockRedis.info.mockResolvedValue(mockInfo);

      // Act
      const result = await service.getStats();

      // Assert
      expect(result).toEqual({
        used_memory: '1048576',
        used_memory_human: '1.00M',
        connected_clients: '10',
      });
      expect(mockRedis.info).toHaveBeenCalledWith('memory');
    });

    it('should handle partial stats', async () => {
      // Arrange
      const mockInfo = `# Memory
used_memory:2097152`;
      mockRedis.info.mockResolvedValue(mockInfo);

      // Act
      const result = await service.getStats();

      // Assert
      expect(result.used_memory).toBe('2097152');
      expect(result.used_memory_human).toBeUndefined();
    });

    it('should return empty object on Redis error', async () => {
      // Arrange
      mockRedis.info.mockRejectedValue(new Error('Redis info failed'));

      // Act
      const result = await service.getStats();

      // Assert
      expect(result).toEqual({});
    });
  });

  describe('error handling and resilience', () => {
    it('should handle Redis connection errors on initialization', () => {
      // Arrange
      const errorHandler = vi.fn();
      mockRedis.on.mockImplementation((event: string, handler: any) => {
        if (event === 'error') {
          errorHandler.mockImplementation(handler);
        }
      });

      // Act
      new StatisticsCacheService();

      // Assert
      expect(mockRedis.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should use default TTL of 300 seconds', async () => {
      // Act
      await service.set(TEST_USER_ID, TEST_DATA);

      // Assert
      expect(mockRedis.setex).toHaveBeenCalledWith(expect.any(String), 300, expect.any(String));
    });

    it('should handle concurrent get requests', async () => {
      // Arrange
      mockRedis.get.mockResolvedValue(JSON.stringify(TEST_DATA));

      // Act
      const promises = [service.get('user-1'), service.get('user-2'), service.get('user-3')];
      const results = await Promise.all(promises);

      // Assert
      expect(results).toHaveLength(3);
      expect(mockRedis.get).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent set requests', async () => {
      // Arrange
      mockRedis.setex.mockResolvedValue('OK');

      // Act
      const promises = [
        service.set('user-1', TEST_DATA),
        service.set('user-2', TEST_DATA),
        service.set('user-3', TEST_DATA),
      ];
      await Promise.all(promises);

      // Assert
      expect(mockRedis.setex).toHaveBeenCalledTimes(3);
    });
  });

  describe('key format validation', () => {
    it('should generate correct key for various user IDs', async () => {
      // Test different user ID formats
      const userIds = ['123', 'abc-def-456', 'user@example.com', 'user_with_underscore'];

      for (const userId of userIds) {
        await service.get(userId);
        expect(mockRedis.get).toHaveBeenCalledWith(`dashboard:statistics:${userId}`);
      }
    });
  });
});
