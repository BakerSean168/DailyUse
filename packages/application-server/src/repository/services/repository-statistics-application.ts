/**
 * Repository Statistics Service
 *
 * 仓储统计相关的应用服务
 */

import type {
  IRepositoryStatisticsRepository,
  IRepositoryRepository,
} from '@dailyuse/domain-server/repository';
import { RepositoryStatisticsDomainService } from '@dailyuse/domain-server/repository';
import type {
  RepositoryStatisticsServerDTO,
  RecalculateStatisticsRequest,
  RecalculateStatisticsResponse,
  StatisticsUpdateEvent,
} from '@dailyuse/contracts/repository';
import { RepositoryContainer } from '@dailyuse/infrastructure-server';

/**
 * Repository Statistics Service
 */
export class RepositoryStatisticsService {
  private static instance: RepositoryStatisticsService;
  private domainService: RepositoryStatisticsDomainService;

  private constructor(
    statisticsRepository: IRepositoryStatisticsRepository,
    repositoryRepository: IRepositoryRepository,
  ) {
    this.domainService = new RepositoryStatisticsDomainService(
      statisticsRepository,
      repositoryRepository,
    );
  }

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(
    statisticsRepository?: IRepositoryStatisticsRepository,
    repositoryRepository?: IRepositoryRepository,
  ): RepositoryStatisticsService {
    const container = RepositoryContainer.getInstance();
    const statsRepo = statisticsRepository || container.getRepositoryStatisticsRepository();
    const repoRepo = repositoryRepository || container.getRepositoryAggregateRepository();

    RepositoryStatisticsService.instance = new RepositoryStatisticsService(
      statsRepo,
      repoRepo,
    );
    return RepositoryStatisticsService.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): RepositoryStatisticsService {
    if (!RepositoryStatisticsService.instance) {
      RepositoryStatisticsService.instance =
        RepositoryStatisticsService.createInstance();
    }
    return RepositoryStatisticsService.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    RepositoryStatisticsService.instance =
      undefined as unknown as RepositoryStatisticsService;
  }

  // ===== 统计查询 =====

  /**
   * 获取账户的统计信息（不存在则自动创建）
   */
  async getOrCreateStatistics(accountUuid: string): Promise<RepositoryStatisticsServerDTO> {
    const statistics = await this.domainService.getOrCreateStatistics(accountUuid);
    return statistics.toClientDTO();
  }

  /**
   * 获取账户的统计信息（不自动创建）
   */
  async getStatistics(accountUuid: string): Promise<RepositoryStatisticsServerDTO | null> {
    const statistics = await this.domainService.getStatistics(accountUuid);
    return statistics ? statistics.toClientDTO() : null;
  }

  /**
   * 初始化统计信息
   */
  async initializeStatistics(accountUuid: string): Promise<RepositoryStatisticsServerDTO> {
    const statistics = await this.domainService.initializeStatistics(accountUuid);
    return statistics.toClientDTO();
  }

  /**
   * 重新计算统计信息
   */
  async recalculateStatistics(
    request: RecalculateStatisticsRequest,
  ): Promise<RecalculateStatisticsResponse> {
    return await this.domainService.recalculateStatistics(request);
  }

  /**
   * 处理统计更新事件
   */
  async handleStatisticsUpdateEvent(event: StatisticsUpdateEvent): Promise<void> {
    await this.domainService.handleStatisticsUpdateEvent(event);
  }

  /**
   * 删除统计信息
   */
  async deleteStatistics(accountUuid: string): Promise<void> {
    await this.domainService.deleteStatistics(accountUuid);
  }

  /**
   * 批量获取多个账户的统计
   */
  async getStatisticsByAccountUuids(
    accountUuids: string[],
  ): Promise<RepositoryStatisticsServerDTO[]> {
    const statisticsList = await this.domainService.getStatisticsByAccountUuids(accountUuids);
    return statisticsList.map((stats) => stats.toClientDTO());
  }

  /**
   * 获取所有账户的统计（分页）
   */
  async getAllStatistics(options?: {
    skip?: number;
    take?: number;
  }): Promise<RepositoryStatisticsServerDTO[]> {
    const statisticsList = await this.domainService.getAllStatistics(options);
    return statisticsList.map((stats) => stats.toClientDTO());
  }

  /**
   * 统计账户总数
   */
  async countStatistics(): Promise<number> {
    return await this.domainService.countStatistics();
  }
}

// ===== 便捷函数 =====

export const getOrCreateStatistics = (accountUuid: string) =>
  RepositoryStatisticsService.getInstance().getOrCreateStatistics(accountUuid);

export const getStatistics = (accountUuid: string) =>
  RepositoryStatisticsService.getInstance().getStatistics(accountUuid);

export const initializeStatistics = (accountUuid: string) =>
  RepositoryStatisticsService.getInstance().initializeStatistics(accountUuid);

export const recalculateStatistics = (request: RecalculateStatisticsRequest) =>
  RepositoryStatisticsService.getInstance().recalculateStatistics(request);

export const handleStatisticsUpdateEvent = (event: StatisticsUpdateEvent) =>
  RepositoryStatisticsService.getInstance().handleStatisticsUpdateEvent(event);

export const deleteStatistics = (accountUuid: string) =>
  RepositoryStatisticsService.getInstance().deleteStatistics(accountUuid);
