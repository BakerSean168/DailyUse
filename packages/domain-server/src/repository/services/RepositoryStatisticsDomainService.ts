/**
 * RepositoryStatistics 领域服务
 *
 * DDD 领域服务职责：
 * - 统计数据的业务逻辑协调
 * - 初始化和重新计算统计
 * - 响应仓储事件更新统计
 * - 使用仓储接口进行持久化
 */

import type { IRepositoryStatisticsRepository } from '../repositories/IRepositoryStatisticsRepository';
import type { IRepositoryRepository } from '../repositories/IRepositoryRepository';
import { RepositoryStatistics } from '../aggregates/RepositoryStatistics';
import type { RepositoryContracts } from '@dailyuse/contracts';

type StatisticsUpdateEvent = RepositoryContracts.StatisticsUpdateEvent;
type RecalculateStatisticsRequest = RepositoryContracts.RecalculateStatisticsRequest;
type RecalculateStatisticsResponse = RepositoryContracts.RecalculateStatisticsResponse;

/**
 * RepositoryStatisticsDomainService
 *
 * 注意：
 * - 通过构造函数注入仓储接口
 * - 不直接操作数据库
 * - 业务逻辑在聚合根中，服务只是协调
 * - 负责统计数据的初始化、更新和重算
 */
export class RepositoryStatisticsDomainService {
  constructor(
    private readonly statisticsRepo: IRepositoryStatisticsRepository,
    private readonly repositoryRepo: IRepositoryRepository,
  ) {}

  /**
   * 获取或创建统计信息
   *
   * 如果账户还没有统计记录，则创建一个空统计
   */
  public async getOrCreateStatistics(accountUuid: string): Promise<RepositoryStatistics> {
    // 1. 尝试获取现有统计
    let statistics = await this.statisticsRepo.findByAccountUuid(accountUuid);

    // 2. 如果不存在，创建空统计
    if (!statistics) {
      statistics = RepositoryStatistics.createEmpty(accountUuid);
      await this.statisticsRepo.upsert(statistics);
    }

    return statistics;
  }

  /**
   * 获取统计信息（不自动创建）
   */
  public async getStatistics(accountUuid: string): Promise<RepositoryStatistics | null> {
    return await this.statisticsRepo.findByAccountUuid(accountUuid);
  }

  /**
   * 初始化统计信息（从现有数据计算）
   *
   * 用于：
   * - 新账户首次创建统计
   * - 数据迁移后初始化统计
   */
  public async initializeStatistics(accountUuid: string): Promise<RepositoryStatistics> {
    // 1. 检查是否已存在
    const existing = await this.statisticsRepo.findByAccountUuid(accountUuid);
    if (existing) {
      return existing;
    }

    // 2. 从数据库重新计算所有统计
    const statistics = await this.calculateStatisticsFromDatabase(accountUuid);

    // 3. 保存统计
    await this.statisticsRepo.upsert(statistics);

    return statistics;
  }

  /**
   * 重新计算统计信息（修复数据不一致）
   *
   * 用于：
   * - 管理员手动触发重算
   * - 数据不一致时修复
   * - 定期校验统计准确性
   */
  public async recalculateStatistics(
    request: RecalculateStatisticsRequest,
  ): Promise<RecalculateStatisticsResponse> {
    const { accountUuid, force = false } = request;

    try {
      // 1. 检查是否存在现有统计
      const existing = await this.statisticsRepo.findByAccountUuid(accountUuid);

      // 2. 如果不强制且已存在，可以选择跳过或比较差异
      if (existing && !force) {
        return {
          success: true,
          message: 'Statistics already exist. Use force=true to recalculate.',
          statistics: existing.toServerDTO(),
        };
      }

      // 3. 从数据库重新计算所有统计
      const statistics = await this.calculateStatisticsFromDatabase(accountUuid);

      // 4. 保存统计
      await this.statisticsRepo.upsert(statistics);

      return {
        success: true,
        message: 'Statistics recalculated successfully.',
        statistics: statistics.toServerDTO(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to recalculate statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        statistics: RepositoryStatistics.createEmpty(accountUuid).toServerDTO(),
      };
    }
  }

  /**
   * 处理统计更新事件（增量更新）
   *
   * 用于：
   * - 实时响应仓储事件
   * - 增量更新统计数据
   * - 避免全量重算
   */
  public async handleStatisticsUpdateEvent(event: StatisticsUpdateEvent): Promise<void> {
    // 1. 获取或创建统计
    const statistics = await this.getOrCreateStatistics(event.accountUuid);

    // 2. 根据事件类型更新统计
    switch (event.type) {
      case 'repository.created':
        statistics.onRepositoryCreated(event);
        break;

      case 'repository.deleted':
        statistics.onRepositoryDeleted(event);
        break;

      case 'repository.archived':
        statistics.onRepositoryArchived(event);
        break;

      case 'repository.activated':
        statistics.onRepositoryActivated(event);
        break;

      case 'resource.created':
        statistics.onResourceCreated(event);
        break;

      case 'resource.deleted':
        statistics.onResourceDeleted(event);
        break;

      case 'reference.created':
        statistics.incrementReferences(event.payload.count ?? 1);
        break;

      case 'reference.deleted':
        statistics.decrementReferences(event.payload.count ?? 1);
        break;

      case 'linked_content.created':
        statistics.incrementLinkedContents(event.payload.count ?? 1);
        break;

      case 'linked_content.deleted':
        statistics.decrementLinkedContents(event.payload.count ?? 1);
        break;

      case 'git.enabled':
        statistics.onGitEnabled();
        break;

      case 'git.disabled':
        statistics.onGitDisabled();
        break;

      case 'commit.created':
        statistics.onCommitCreated(event.payload.count ?? 1);
        break;

      default:
        // 未知事件类型，记录警告
        console.warn(`Unknown statistics update event type: ${event.type}`);
        return;
    }

    // 3. 保存更新后的统计
    await this.statisticsRepo.upsert(statistics);
  }

  /**
   * 删除统计信息
   *
   * 用于：
   * - 删除账户时清理统计
   * - 通常由数据库 CASCADE 自动触发
   */
  public async deleteStatistics(accountUuid: string): Promise<void> {
    await this.statisticsRepo.delete(accountUuid);
  }

  /**
   * 批量获取多个账户的统计信息
   *
   * 用于：
   * - 管理员查看多个账户统计
   * - 数据导出
   */
  public async getStatisticsByAccountUuids(
    accountUuids: string[],
  ): Promise<RepositoryStatistics[]> {
    return await this.statisticsRepo.findByAccountUuids(accountUuids);
  }

  /**
   * 获取所有账户的统计信息（分页）
   *
   * 用于：
   * - 管理员查看系统整体统计
   * - 数据分析
   */
  public async getAllStatistics(options?: {
    skip?: number;
    take?: number;
  }): Promise<RepositoryStatistics[]> {
    return await this.statisticsRepo.findAll(options);
  }

  /**
   * 统计账户总数
   */
  public async countStatistics(): Promise<number> {
    return await this.statisticsRepo.count();
  }

  // ===== 私有辅助方法 =====

  /**
   * 从数据库重新计算统计（私有方法）
   */
  private async calculateStatisticsFromDatabase(
    accountUuid: string,
  ): Promise<RepositoryStatistics> {
    // 1. 创建空统计对象
    const statistics = RepositoryStatistics.createEmpty(accountUuid);

    // 2. 获取账户所有仓库
    const repositories = await this.repositoryRepo.findByAccountUuid(accountUuid, {
      includeChildren: true, // 需要加载资源信息
    });

    // 3. 遍历仓库计算统计
    for (const repo of repositories) {
      // 仓库统计
      const event: StatisticsUpdateEvent = {
        type: 'repository.created',
        accountUuid,
        timestamp: Date.now(),
        payload: {
          hasGit: repo.git?.isGitRepo ?? false,
          sizeBytes: 0, // 初始化时不计算大小
        },
      };
      statistics.onRepositoryCreated(event);

      // 如果是归档状态，需要调整计数
      if (repo.status === 'archived') {
        statistics.onRepositoryArchived({
          type: 'repository.archived',
          accountUuid,
          timestamp: Date.now(),
          payload: {},
        });
      }

      // 资源统计
      const resources = repo.getAllResources();
      for (const resource of resources) {
        const resourceEvent: StatisticsUpdateEvent = {
          type: 'resource.created',
          accountUuid,
          timestamp: Date.now(),
          payload: {
            resourceType: resource.type,
            sizeBytes: 0, // 可以后续优化，计算实际大小
          },
        };
        statistics.onResourceCreated(resourceEvent);
      }

      // Git 提交统计（如果有 git 信息）
      // 注意：这里需要实际查询 git log，暂时跳过
      // 可以在后续优化中添加

      // 引用和链接内容统计
      // 注意：这里需要查询 resource_references 和 linked_contents 表
      // 暂时跳过，可以在后续优化中添加
    }

    return statistics;
  }
}
