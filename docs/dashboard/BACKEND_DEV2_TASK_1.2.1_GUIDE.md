# TASK-1.2.1: 实现 StatisticsCacheService

**开发人员**: Backend Dev 2  
**预估时间**: 10h (5 SP)  
**开始日期**: 2025-11-12  
**依赖**: 无（可并行开发）

---

## 📋 任务目标

实现一个基于 Redis 的缓存服务，用于缓存 Dashboard 统计数据，提高查询性能并减少数据库压力。

## 📦 验收标准

- [ ] Redis 连接正常
- [ ] 缓存读写功能测试通过
- [ ] TTL 设置为 5 分钟
- [ ] 支持主动失效
- [ ] 单元测试覆盖率 ≥ 85%

---

## 🏗️ 架构设计

### 文件位置

```
apps/api/src/dashboard/
├── services/
│   ├── statistics-cache.service.ts         (缓存服务)
│   └── dashboard-statistics-aggregate.service.ts
├── dashboard.module.ts
└── __tests__/
    └── statistics-cache.service.spec.ts
```

### 缓存策略

- **TTL**: 5 分钟（300 秒）
- **Key 格式**: `dashboard:statistics:{userId}`
- **数据格式**: JSON 字符串
- **失效策略**:
  - 时间失效（TTL）
  - 事件驱动失效（Statistics 更新时）

---

## 💻 实现代码

### 1. 安装 Redis 依赖

```bash
pnpm add ioredis
pnpm add -D @types/ioredis
```

### 2. 创建缓存服务

```typescript
// apps/api/src/dashboard/services/statistics-cache.service.ts
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { DashboardContracts } from '@dailyuse/contracts';

@Injectable()
export class StatisticsCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(StatisticsCacheService.name);
  private readonly redis: Redis;
  private readonly TTL_SECONDS = 300; // 5 分钟
  private readonly KEY_PREFIX = 'dashboard:statistics';

  constructor() {
    // 从环境变量读取 Redis 配置
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    this.redis = new Redis(redisUrl, {
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        this.logger.warn(`Redis 连接失败，${delay}ms 后重试 (尝试 ${times} 次)`);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.redis.on('connect', () => {
      this.logger.log('✅ Redis 连接成功');
    });

    this.redis.on('error', (error) => {
      this.logger.error('❌ Redis 连接错误', error);
    });
  }

  /**
   * 生成缓存键
   */
  private getCacheKey(userId: string): string {
    return `${this.KEY_PREFIX}:${userId}`;
  }

  /**
   * 获取缓存的统计数据
   * @param userId 用户ID
   * @returns 缓存的数据，如果不存在返回 null
   */
  async get(userId: string): Promise<DashboardContracts.DashboardStatisticsClientDTO | null> {
    const key = this.getCacheKey(userId);

    try {
      const cached = await this.redis.get(key);

      if (!cached) {
        this.logger.debug(`缓存未命中: ${key}`);
        return null;
      }

      this.logger.debug(`✅ 缓存命中: ${key}`);
      return JSON.parse(cached);
    } catch (error) {
      this.logger.error(`缓存读取失败: ${key}`, error);
      return null; // 降级处理：缓存失败时返回 null
    }
  }

  /**
   * 设置缓存数据
   * @param userId 用户ID
   * @param data 统计数据
   */
  async set(userId: string, data: DashboardContracts.DashboardStatisticsClientDTO): Promise<void> {
    const key = this.getCacheKey(userId);

    try {
      const serialized = JSON.stringify(data);
      await this.redis.setex(key, this.TTL_SECONDS, serialized);

      this.logger.debug(`缓存已设置: ${key} (TTL: ${this.TTL_SECONDS}s)`);
    } catch (error) {
      this.logger.error(`缓存写入失败: ${key}`, error);
      // 不抛出错误，允许系统继续运行
    }
  }

  /**
   * 删除缓存数据（主动失效）
   * @param userId 用户ID
   */
  async invalidate(userId: string): Promise<void> {
    const key = this.getCacheKey(userId);

    try {
      const deleted = await this.redis.del(key);

      if (deleted > 0) {
        this.logger.log(`🗑️  缓存已失效: ${key}`);
      } else {
        this.logger.debug(`缓存不存在，无需失效: ${key}`);
      }
    } catch (error) {
      this.logger.error(`缓存失效失败: ${key}`, error);
    }
  }

  /**
   * 批量删除缓存（用于管理操作）
   * @param pattern 键模式，例如 "dashboard:statistics:*"
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);

      if (keys.length === 0) {
        this.logger.debug(`没有匹配的缓存键: ${pattern}`);
        return 0;
      }

      const deleted = await this.redis.del(...keys);
      this.logger.log(`🗑️  批量删除 ${deleted} 个缓存键: ${pattern}`);

      return deleted;
    } catch (error) {
      this.logger.error(`批量缓存失效失败: ${pattern}`, error);
      return 0;
    }
  }

  /**
   * 获取缓存的剩余 TTL
   * @param userId 用户ID
   * @returns 剩余秒数，-2 表示不存在，-1 表示无过期时间
   */
  async getTTL(userId: string): Promise<number> {
    const key = this.getCacheKey(userId);

    try {
      return await this.redis.ttl(key);
    } catch (error) {
      this.logger.error(`获取 TTL 失败: ${key}`, error);
      return -2;
    }
  }

  /**
   * 检查 Redis 连接状态
   */
  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error('Redis ping 失败', error);
      return false;
    }
  }

  /**
   * 模块销毁时关闭 Redis 连接
   */
  async onModuleDestroy() {
    this.logger.log('正在关闭 Redis 连接...');
    await this.redis.quit();
  }
}
```

---

## 🧪 单元测试

```typescript
// apps/api/src/dashboard/__tests__/statistics-cache.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsCacheService } from '../services/statistics-cache.service';
import { DashboardContracts } from '@dailyuse/contracts';
import Redis from 'ioredis';

// Mock ioredis
jest.mock('ioredis');

describe('StatisticsCacheService', () => {
  let service: StatisticsCacheService;
  let redisMock: jest.Mocked<Redis>;

  const mockUserId = 'user-123';
  const mockData: DashboardContracts.DashboardStatisticsClientDTO = {
    userId: mockUserId,
    summary: {
      totalTasks: 10,
      totalGoals: 5,
      totalReminders: 20,
      totalSchedules: 8,
      overallCompletionRate: 0.75,
    },
    taskStatistics: {
      totalTasks: 10,
      completedTasks: 8,
      todayTasks: 5,
      todayCompleted: 4,
      todayCompletionRate: 0.8,
      weekStats: [],
      tags: [],
    },
    goalStatistics: {
      totalGoals: 5,
      activeGoals: 3,
      completedGoals: 2,
      averageProgress: 0.6,
      keyResults: [],
    },
    reminderStatistics: {
      totalReminders: 20,
      activeReminders: 15,
      triggeredCount: 100,
      successCount: 95,
      triggerSuccessRate: 0.95,
    },
    scheduleStatistics: {
      totalSchedules: 8,
      activeSchedules: 6,
      executedCount: 50,
      successCount: 45,
      executionSuccessRate: 0.9,
    },
    lastUpdated: '2025-11-12T10:00:00Z',
  };

  beforeEach(async () => {
    // 重置 ioredis mock
    (Redis as jest.MockedClass<typeof Redis>).mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [StatisticsCacheService],
    }).compile();

    service = module.get<StatisticsCacheService>(StatisticsCacheService);

    // 获取 Redis mock 实例
    redisMock = (service as any).redis as jest.Mocked<Redis>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('应该返回缓存的数据', async () => {
      redisMock.get = jest.fn().mockResolvedValue(JSON.stringify(mockData));

      const result = await service.get(mockUserId);

      expect(result).toEqual(mockData);
      expect(redisMock.get).toHaveBeenCalledWith(`dashboard:statistics:${mockUserId}`);
    });

    it('应该在缓存不存在时返回 null', async () => {
      redisMock.get = jest.fn().mockResolvedValue(null);

      const result = await service.get(mockUserId);

      expect(result).toBeNull();
    });

    it('应该在缓存读取失败时返回 null（降级处理）', async () => {
      redisMock.get = jest.fn().mockRejectedValue(new Error('Redis error'));

      const result = await service.get(mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('应该设置缓存数据并设置 TTL', async () => {
      redisMock.setex = jest.fn().mockResolvedValue('OK');

      await service.set(mockUserId, mockData);

      expect(redisMock.setex).toHaveBeenCalledWith(
        `dashboard:statistics:${mockUserId}`,
        300, // TTL 5 分钟
        JSON.stringify(mockData),
      );
    });

    it('应该在缓存写入失败时不抛出错误', async () => {
      redisMock.setex = jest.fn().mockRejectedValue(new Error('Redis error'));

      await expect(service.set(mockUserId, mockData)).resolves.not.toThrow();
    });
  });

  describe('invalidate', () => {
    it('应该删除指定用户的缓存', async () => {
      redisMock.del = jest.fn().mockResolvedValue(1);

      await service.invalidate(mockUserId);

      expect(redisMock.del).toHaveBeenCalledWith(`dashboard:statistics:${mockUserId}`);
    });

    it('应该处理缓存不存在的情况', async () => {
      redisMock.del = jest.fn().mockResolvedValue(0);

      await service.invalidate(mockUserId);

      expect(redisMock.del).toHaveBeenCalled();
    });
  });

  describe('invalidatePattern', () => {
    it('应该批量删除匹配的缓存键', async () => {
      const pattern = 'dashboard:statistics:*';
      const keys = ['dashboard:statistics:user-1', 'dashboard:statistics:user-2'];

      redisMock.keys = jest.fn().mockResolvedValue(keys);
      redisMock.del = jest.fn().mockResolvedValue(2);

      const deleted = await service.invalidatePattern(pattern);

      expect(deleted).toBe(2);
      expect(redisMock.keys).toHaveBeenCalledWith(pattern);
      expect(redisMock.del).toHaveBeenCalledWith(...keys);
    });

    it('应该在没有匹配键时返回 0', async () => {
      redisMock.keys = jest.fn().mockResolvedValue([]);

      const deleted = await service.invalidatePattern('dashboard:statistics:*');

      expect(deleted).toBe(0);
    });
  });

  describe('getTTL', () => {
    it('应该返回缓存的剩余 TTL', async () => {
      redisMock.ttl = jest.fn().mockResolvedValue(250);

      const ttl = await service.getTTL(mockUserId);

      expect(ttl).toBe(250);
      expect(redisMock.ttl).toHaveBeenCalledWith(`dashboard:statistics:${mockUserId}`);
    });

    it('应该在缓存不存在时返回 -2', async () => {
      redisMock.ttl = jest.fn().mockResolvedValue(-2);

      const ttl = await service.getTTL(mockUserId);

      expect(ttl).toBe(-2);
    });
  });

  describe('ping', () => {
    it('应该在 Redis 连接正常时返回 true', async () => {
      redisMock.ping = jest.fn().mockResolvedValue('PONG');

      const result = await service.ping();

      expect(result).toBe(true);
    });

    it('应该在 Redis 连接失败时返回 false', async () => {
      redisMock.ping = jest.fn().mockRejectedValue(new Error('Connection error'));

      const result = await service.ping();

      expect(result).toBe(false);
    });
  });
});
```

---

## 📝 环境配置

### 1. 添加 Redis 环境变量

```bash
# apps/api/.env
REDIS_URL=redis://localhost:6379
```

### 2. Docker Compose 配置（开发环境）

```yaml
# docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  redis-data:
```

### 3. 启动 Redis

```bash
docker-compose up -d redis
```

---

## 📝 模块集成

```typescript
// apps/api/src/dashboard/dashboard.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardStatisticsAggregateService } from './services/dashboard-statistics-aggregate.service';
import { StatisticsCacheService } from './services/statistics-cache.service';
import {
  TaskStatistics,
  GoalStatistics,
  ReminderStatistics,
  ScheduleStatistics,
} from '@dailyuse/domain-server';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TaskStatistics,
      GoalStatistics,
      ReminderStatistics,
      ScheduleStatistics,
    ]),
  ],
  providers: [
    DashboardStatisticsAggregateService,
    StatisticsCacheService, // 新增
  ],
  exports: [
    DashboardStatisticsAggregateService,
    StatisticsCacheService, // 导出供其他模块使用
  ],
})
export class DashboardModule {}
```

---

## ✅ 验证步骤

### 1. 运行单元测试

```bash
pnpm nx test api --testPathPattern=statistics-cache
```

**预期结果**:

- ✅ 所有测试通过
- ✅ 覆盖率 ≥ 85%

### 2. 手动测试 Redis 连接

```bash
# 1. 进入 Redis CLI
docker exec -it <redis-container-id> redis-cli

# 2. 测试连接
127.0.0.1:6379> PING
PONG

# 3. 查看所有键
127.0.0.1:6379> KEYS dashboard:statistics:*

# 4. 查看某个键的值
127.0.0.1:6379> GET dashboard:statistics:user-123

# 5. 查看 TTL
127.0.0.1:6379> TTL dashboard:statistics:user-123
```

### 3. 集成测试（配合 TASK-1.1.2）

```bash
# 启动 API 并测试缓存流程
pnpm nx serve api

# 第一次请求（缓存未命中）
curl http://localhost:3000/api/dashboard/statistics \
  -H "Authorization: Bearer <token>"

# 第二次请求（缓存命中，应该更快）
curl http://localhost:3000/api/dashboard/statistics \
  -H "Authorization: Bearer <token>"
```

---

## 🔍 常见问题

### Q1: Redis 连接失败？

**A**: 检查以下内容：

1. Redis 是否启动：`docker ps | grep redis`
2. 端口是否正确：`REDIS_URL=redis://localhost:6379`
3. 防火墙设置

### Q2: 缓存未命中率高？

**A**: 检查：

1. TTL 是否设置正确（5 分钟）
2. 是否频繁失效缓存
3. 多实例环境下 Redis 是否共享

### Q3: 内存占用过高？

**A**: 优化策略：

1. 调整 TTL（减少到 3 分钟）
2. 使用 Redis 的内存淘汰策略（`maxmemory-policy allkeys-lru`）
3. 监控缓存命中率，评估是否需要缓存

---

## 📊 性能指标

### 目标指标

- 缓存命中率 ≥ 95%
- 缓存读取时间 ≤ 5ms
- 缓存写入时间 ≤ 10ms
- Redis 内存使用 ≤ 100MB

### 监控方法

```bash
# Redis 内存信息
redis-cli INFO memory

# 缓存命中率统计
redis-cli INFO stats | grep keyspace
```

---

## 📚 参考资料

- [ioredis 文档](https://github.com/luin/ioredis)
- [Redis 最佳实践](https://redis.io/docs/manual/patterns/)
- [NestJS Redis 集成](https://docs.nestjs.com/techniques/caching)
- [Dashboard 技术设计](./DASHBOARD_TECHNICAL_DESIGN_V2.md)

---

## 🎯 下一步

完成后提交 PR，并通知：

1. **Backend Dev 1** - 可以集成缓存（TASK-1.2.2）
2. **Tech Lead** - 准备代码审查
3. **QA Engineer** - 准备集成测试
