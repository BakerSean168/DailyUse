import type { IGoalStatisticsRepository, IGoalRepository } from '@dailyuse/domain-server/goal';
import { GoalStatisticsDomainService } from '@dailyuse/domain-server/goal';
import { GoalContainer } from '../../infrastructure/di/GoalContainer';
import type { 
  GoalServerDTO, 
  GoalClientDTO, 
  KeyResultServerDTO, 
  GoalStatisticsClientDTO,
  InitializeGoalStatisticsRequest,
  InitializeGoalStatisticsResponse,
  RecalculateGoalStatisticsRequest,
  RecalculateGoalStatisticsResponse,
  GoalStatisticsUpdateEvent,
} from '@dailyuse/contracts/goal';

/**
 * GoalStatistics 应用服务
 * 负责协调统计相关的领域服务，处理业务用例
 *
 * 架构职责：
 * - 委托给 DomainService 处理业务逻辑
 * - 协调多个领域服务
 * - 事务管理
 * - DTO 转换（Domain ↔ Contracts）
 */
export class GoalStatisticsApplicationService {
  private static instance: GoalStatisticsApplicationService;
  private domainService: GoalStatisticsDomainService;
  private statisticsRepository: IGoalStatisticsRepository;
  private goalRepository: IGoalRepository;
  // 用于保护并发统计更新的锁
  private readonly locks = new Map<string, Promise<void>>();

  private constructor(
    statisticsRepository: IGoalStatisticsRepository,
    goalRepository: IGoalRepository,
  ) {
    this.domainService = new GoalStatisticsDomainService();
    this.statisticsRepository = statisticsRepository;
    this.goalRepository = goalRepository;
  }

  /**
   * 使用锁来保护操作，确保同一 accountUuid 的操作是串行的
   */
  private async withLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
    // 等待之前的操作完成
    while (this.locks.has(key)) {
      await this.locks.get(key);
    }

    // 创建新的锁
    let resolve!: () => void;
    const promise = new Promise<void>((r) => {
      resolve = r;
    });
    this.locks.set(key, promise);

    try {
      return await operation();
    } finally {
      this.locks.delete(key);
      resolve();
    }
  }

  /**
   * 创建应用服务实例（支持依赖注入）
   */
  static async createInstance(
    statisticsRepository?: IGoalStatisticsRepository,
    goalRepository?: IGoalRepository,
  ): Promise<GoalStatisticsApplicationService> {
    const container = GoalContainer.getInstance();
    const statsRepo = statisticsRepository || container.getGoalStatisticsRepository();
    const goalRepo = goalRepository || container.getGoalRepository();

    GoalStatisticsApplicationService.instance = new GoalStatisticsApplicationService(
      statsRepo,
      goalRepo,
    );
    return GoalStatisticsApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static async getInstance(): Promise<GoalStatisticsApplicationService> {
    if (!GoalStatisticsApplicationService.instance) {
      GoalStatisticsApplicationService.instance =
        await GoalStatisticsApplicationService.createInstance();
    }
    return GoalStatisticsApplicationService.instance;
  }

  // ===== 统计查询 =====

  /**
   * 获取账户的统计信息（不存在则自动创建）
   */
  async getOrCreateStatistics(accountUuid: string): Promise<GoalStatisticsClientDTO> {
    // 1. 尝试获取现有统计
    let statistics = await this.statisticsRepository.findByAccountUuid(accountUuid);

    // 2. 如果不存在，创建空统计
    if (!statistics) {
      // 使用聚合根的工厂方法创建
      const { GoalStatistics } = await import('@dailyuse/domain-server');
      statistics = GoalStatistics.createEmpty(accountUuid);
      await this.statisticsRepository.upsert(statistics);
    }

    // 转换为 ClientDTO
    return statistics.toClientDTO();
  }

  /**
   * 获取账户的统计信息（不自动创建）
   */
  async getStatistics(accountUuid: string): Promise<GoalStatisticsClientDTO | null> {
    const statistics = await this.statisticsRepository.findByAccountUuid(accountUuid);
    return statistics ? statistics.toClientDTO() : null;
  }

  /**
   * 初始化统计信息（从现有Goal数据计算）
   */
  async initializeStatistics(
    request: InitializeGoalStatisticsRequest,
  ): Promise<InitializeGoalStatisticsResponse> {
    try {
      const accountUuid = request.accountUuid;

      // 1. 检查是否已存在
      const existing = await this.statisticsRepository.findByAccountUuid(accountUuid);
      if (existing) {
        return {
          success: true,
          message: 'Goal statistics already initialized.',
          statistics: existing.toServerDTO(),
        };
      }

      // 2. 从数据库获取所有 Goal
      const goals = await this.goalRepository.findByAccountUuid(accountUuid, {
        includeChildren: true,
      });

      // 3. 委托给领域服务计算
      const statistics = this.domainService.calculateStatisticsFromGoals(accountUuid, goals);

      // 4. 保存统计
      await this.statisticsRepository.upsert(statistics);

      return {
        success: true,
        message: 'Goal statistics initialized successfully.',
        statistics: statistics.toServerDTO(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to initialize statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        statistics: {
          accountUuid: request.accountUuid,
          totalGoals: 0,
          activeGoals: 0,
          completedGoals: 0,
          archivedGoals: 0,
          overdueGoals: 0,
          totalKeyResults: 0,
          completedKeyResults: 0,
          averageProgress: 0,
          goalsByImportance: {},
          goalsByUrgency: {},
          goalsByCategory: {},
          goalsByStatus: {},
          goalsCreatedThisWeek: 0,
          goalsCompletedThisWeek: 0,
          goalsCreatedThisMonth: 0,
          goalsCompletedThisMonth: 0,
          totalReviews: 0,
          averageRating: null,
          lastCalculatedAt: Date.now(),
        },
      };
    }
  }

  /**
   * 重新计算统计信息（修复数据不一致）
   */
  async recalculateStatistics(
    request: RecalculateGoalStatisticsRequest,
  ): Promise<RecalculateGoalStatisticsResponse> {
    const { accountUuid, force = false } = request;

    try {
      // 1. 检查是否存在现有统计
      const existing = await this.statisticsRepository.findByAccountUuid(accountUuid);

      // 2. 如果不强制且已存在，可以选择跳过
      if (existing && !force) {
        return {
          success: true,
          message: 'Statistics already exist. Use force=true to recalculate.',
          statistics: existing.toServerDTO(),
        };
      }

      // 3. 从数据库获取所有 Goal
      const goals = await this.goalRepository.findByAccountUuid(accountUuid, {
        includeChildren: true,
      });

      // 4. 委托给领域服务计算
      const statistics = this.domainService.calculateStatisticsFromGoals(accountUuid, goals);

      // 5. 保存统计
      await this.statisticsRepository.upsert(statistics);

      return {
        success: true,
        message: 'Statistics recalculated successfully.',
        statistics: statistics.toServerDTO(),
      };
    } catch (error) {
      const { GoalStatistics } = await import('@dailyuse/domain-server');
      return {
        success: false,
        message: `Failed to recalculate statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        statistics: GoalStatistics.createEmpty(accountUuid).toServerDTO(),
      };
    }
  }

  /**
   * 处理统计更新事件（增量更新）
   */
  async handleStatisticsUpdateEvent(event: GoalStatisticsUpdateEvent): Promise<void> {
    // 使用锁保护整个"读取-修改-保存"流程
    return this.withLock(event.accountUuid, async () => {
      // 1. 获取或创建统计
      let statistics = await this.statisticsRepository.findByAccountUuid(event.accountUuid);
      if (!statistics) {
        const { GoalStatistics } = await import('@dailyuse/domain-server');
        statistics = GoalStatistics.createEmpty(event.accountUuid);
      }

      // 2. 委托给领域服务更新状态
      this.domainService.applyEventToStatistics(statistics, event);

      // 3. 保存更新后的统计
      await this.statisticsRepository.upsert(statistics);
    });
  }

  /**
   * 删除统计信息
   */
  async deleteStatistics(accountUuid: string): Promise<boolean> {
    return await this.statisticsRepository.delete(accountUuid);
  }
}

