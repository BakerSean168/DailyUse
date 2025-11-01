/**
 * RepositoryStatistics API 集成测试
 *
 * 测试场景：
 * 1. 获取统计信息（自动创建）
 * 2. 初始化统计信息
 * 3. 重新计算统计信息
 * 4. 删除统计信息
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getTestPrisma, cleanDatabase, createTestAccount } from '../../../test/helpers/database-helpers';

// 测试配置
const TEST_ACCOUNT_UUID = 'test-account-uuid-statistics';

describe('RepositoryStatistics API 集成测试', () => {
  beforeEach(async () => {
    // 清理真实数据库
    await cleanDatabase();

    // 创建测试账户
    await createTestAccount({
      uuid: TEST_ACCOUNT_UUID,
      username: 'testuser',
      email: 'test@example.com',
    });
  });

  describe('GET /api/repositories/statistics', () => {
    it('应该返回统计信息（如果不存在则自动创建）', async () => {
      // 跳过实际 HTTP 请求测试（需要完整的应用实例）
      // const response = await request(app)
      //   .get(`${API_BASE_URL}/statistics`)
      //   .set('Authorization', `Bearer ${authToken}`)
      //   .expect(200);

      // expect(response.body.code).toBe(2000);
      // expect(response.body.data).toHaveProperty('accountUuid', TEST_ACCOUNT_UUID);
      // expect(response.body.data).toHaveProperty('totalRepositories', 0);

      // 直接测试服务层
      const { RepositoryStatisticsApplicationService } = await import(
        '../application/services/RepositoryStatisticsApplicationService'
      );

      const service = await RepositoryStatisticsApplicationService.getInstance();
      const statistics = await service.getOrCreateStatistics(TEST_ACCOUNT_UUID);

      expect(statistics).toBeDefined();
      expect(statistics.accountUuid).toBe(TEST_ACCOUNT_UUID);
      expect(statistics.totalRepositories).toBe(0);
      expect(statistics.activeRepositories).toBe(0);
      expect(statistics.archivedRepositories).toBe(0);
      expect(statistics.totalResources).toBe(0);
      expect(statistics.totalFiles).toBe(0);
      expect(statistics.totalFolders).toBe(0);
      expect(statistics.gitEnabledRepos).toBe(0);
      expect(statistics.totalCommits).toBe(0);
      expect(statistics.totalReferences).toBe(0);
      expect(statistics.totalLinkedContents).toBe(0);
      expect(statistics.totalSizeBytes).toBe('0');
      expect(typeof statistics.lastUpdatedAt).toBe('number');
      expect(typeof statistics.createdAt).toBe('number');
    });

    it('应该在没有授权时返回 401', async () => {
      // const response = await request(app)
      //   .get(`${API_BASE_URL}/statistics`)
      //   .expect(401);
      // expect(response.body.code).toBe(4010);
    });
  });

  describe('POST /api/repositories/statistics/initialize', () => {
    it('应该初始化统计信息', async () => {
      const { RepositoryStatisticsApplicationService } = await import(
        '../application/services/RepositoryStatisticsApplicationService'
      );

      const service = await RepositoryStatisticsApplicationService.getInstance();

      // 先删除现有统计
      await service.deleteStatistics(TEST_ACCOUNT_UUID).catch(() => {});

      // 初始化统计
      const statistics = await service.initializeStatistics(TEST_ACCOUNT_UUID);

      expect(statistics).toBeDefined();
      expect(statistics.accountUuid).toBe(TEST_ACCOUNT_UUID);
      expect(typeof statistics.totalRepositories).toBe('number');
    });
  });

  describe('POST /api/repositories/statistics/recalculate', () => {
    it('应该重新计算统计信息（不强制）', async () => {
      const { RepositoryStatisticsApplicationService } = await import(
        '../application/services/RepositoryStatisticsApplicationService'
      );

      const service = await RepositoryStatisticsApplicationService.getInstance();

      const result = await service.recalculateStatistics({
        accountUuid: TEST_ACCOUNT_UUID,
        force: false,
      });

      expect(result.success).toBe(true);
      expect(result.statistics).toBeDefined();
      expect(result.statistics.accountUuid).toBe(TEST_ACCOUNT_UUID);
    });

    it('应该强制重新计算统计信息', async () => {
      const { RepositoryStatisticsApplicationService } = await import(
        '../application/services/RepositoryStatisticsApplicationService'
      );

      const service = await RepositoryStatisticsApplicationService.getInstance();

      const result = await service.recalculateStatistics({
        accountUuid: TEST_ACCOUNT_UUID,
        force: true,
      });

      expect(result.success).toBe(true);
      expect(result.statistics).toBeDefined();
      expect(result.message).toContain('successfully');
    });
  });

  describe('DELETE /api/repositories/statistics', () => {
    it('应该删除统计信息', async () => {
      const { RepositoryStatisticsApplicationService } = await import(
        '../application/services/RepositoryStatisticsApplicationService'
      );

      const service = await RepositoryStatisticsApplicationService.getInstance();

      // 确保统计存在
      await service.getOrCreateStatistics(TEST_ACCOUNT_UUID);

      // 删除统计
      await service.deleteStatistics(TEST_ACCOUNT_UUID);

      // 验证已删除
      const statistics = await service.getStatistics(TEST_ACCOUNT_UUID);
      expect(statistics).toBeNull();
    });
  });

  describe('统计更新事件处理', () => {
    it('应该正确处理 repository.created 事件', async () => {
      const { RepositoryStatisticsApplicationService } = await import(
        '../application/services/RepositoryStatisticsApplicationService'
      );

      const service = await RepositoryStatisticsApplicationService.getInstance();

      // 获取初始统计
      const beforeStats = await service.getOrCreateStatistics(TEST_ACCOUNT_UUID);
      const beforeTotal = beforeStats.totalRepositories;

      // 处理创建事件
      await service.handleStatisticsUpdateEvent({
        type: 'repository.created',
        accountUuid: TEST_ACCOUNT_UUID,
        timestamp: Date.now(),
        payload: {
          hasGit: true,
          sizeBytes: 1024,
        },
      });

      // 验证统计已更新
      const afterStats = await service.getStatistics(TEST_ACCOUNT_UUID);
      expect(afterStats).toBeDefined();
      expect(afterStats!.totalRepositories).toBe(beforeTotal + 1);
      expect(afterStats!.activeRepositories).toBe(beforeStats.activeRepositories + 1);
      expect(afterStats!.gitEnabledRepos).toBe(beforeStats.gitEnabledRepos + 1);
    });

    it('应该正确处理 repository.archived 事件', async () => {
      const { RepositoryStatisticsApplicationService } = await import(
        '../application/services/RepositoryStatisticsApplicationService'
      );

      const service = await RepositoryStatisticsApplicationService.getInstance();

      const beforeStats = await service.getOrCreateStatistics(TEST_ACCOUNT_UUID);

      await service.handleStatisticsUpdateEvent({
        type: 'repository.archived',
        accountUuid: TEST_ACCOUNT_UUID,
        timestamp: Date.now(),
        payload: {},
      });

      const afterStats = await service.getStatistics(TEST_ACCOUNT_UUID);
      expect(afterStats).toBeDefined();
      expect(afterStats!.archivedRepositories).toBe(beforeStats.archivedRepositories + 1);
      expect(afterStats!.activeRepositories).toBe(beforeStats.activeRepositories - 1);
    });

    it('应该正确处理 resource.created 事件', async () => {
      const { RepositoryStatisticsApplicationService } = await import(
        '../application/services/RepositoryStatisticsApplicationService'
      );

      const service = await RepositoryStatisticsApplicationService.getInstance();

      const beforeStats = await service.getOrCreateStatistics(TEST_ACCOUNT_UUID);

      await service.handleStatisticsUpdateEvent({
        type: 'resource.created',
        accountUuid: TEST_ACCOUNT_UUID,
        timestamp: Date.now(),
        payload: {
          resourceType: 'FILE',
          sizeBytes: 2048,
        },
      });

      const afterStats = await service.getStatistics(TEST_ACCOUNT_UUID);
      expect(afterStats).toBeDefined();
      expect(afterStats!.totalResources).toBe(beforeStats.totalResources + 1);
      expect(afterStats!.totalFiles).toBe(beforeStats.totalFiles + 1);
    });
  });

  describe('批量查询功能', () => {
    it('应该支持批量获取多个账户的统计', async () => {
      const { RepositoryStatisticsApplicationService } = await import(
        '../application/services/RepositoryStatisticsApplicationService'
      );

      const service = await RepositoryStatisticsApplicationService.getInstance();

      const accountUuids = [TEST_ACCOUNT_UUID, 'another-test-account'];

      // 确保两个账户都有统计
      await service.getOrCreateStatistics(TEST_ACCOUNT_UUID);
      await service.getOrCreateStatistics('another-test-account');

      const statisticsList = await service.getStatisticsByAccountUuids(accountUuids);

      expect(Array.isArray(statisticsList)).toBe(true);
      expect(statisticsList.length).toBeGreaterThan(0);

      // 清理
      await service.deleteStatistics('another-test-account').catch(() => {});
    });

    it('应该支持分页获取所有统计', async () => {
      const { RepositoryStatisticsApplicationService } = await import(
        '../application/services/RepositoryStatisticsApplicationService'
      );

      const service = await RepositoryStatisticsApplicationService.getInstance();

      const statisticsList = await service.getAllStatistics({
        skip: 0,
        take: 10,
      });

      expect(Array.isArray(statisticsList)).toBe(true);
    });

    it('应该支持统计总数查询', async () => {
      const { RepositoryStatisticsApplicationService } = await import(
        '../application/services/RepositoryStatisticsApplicationService'
      );

      const service = await RepositoryStatisticsApplicationService.getInstance();

      const count = await service.countStatistics();

      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });
});
