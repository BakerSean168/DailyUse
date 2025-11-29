import type { IGoalRepository } from '@dailyuse/domain-server/goal';
import { GoalContainer } from '../../infrastructure/di/GoalContainer';
import { GoalDomainService, Goal } from '@dailyuse/domain-server/goal';
import type { GoalServerDTO, GoalClientDTO, KeyResultServerDTO, GoalStatisticsClientDTO } from '@dailyuse/contracts/goal';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts/shared';
import { GoalEventPublisher } from './GoalEventPublisher';
import { GoalStatisticsApplicationService } from './GoalStatisticsApplicationService';

/**
 * Goal 应用服务
 * 负责目标（Goal）本身的 CRUD 操作
 *
 * 职责：
 * - 创建目标
 * - 获取目标详情
 * - 更新目标基本信息
 * - 删除/归档/激活/完成目标
 * - 搜索目标
 * - 获取目标统计
 *
 * 注意：
 * - KeyResult 管理 → GoalKeyResultApplicationService
 * - GoalRecord 管理 → GoalRecordApplicationService
 * - GoalReview 管理 → GoalReviewApplicationService
 */
export class GoalApplicationService {
  private static instance: GoalApplicationService;
  private domainService: GoalDomainService;
  private goalRepository: IGoalRepository;

  private constructor(goalRepository: IGoalRepository) {
    this.domainService = new GoalDomainService();
    this.goalRepository = goalRepository;
  }

  /**
   * 创建应用服务实例（支持依赖注入）
   */
  static async createInstance(goalRepository?: IGoalRepository): Promise<GoalApplicationService> {
    const container = GoalContainer.getInstance();
    const repo = goalRepository || container.getGoalRepository();

    GoalApplicationService.instance = new GoalApplicationService(repo);
    return GoalApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static async getInstance(): Promise<GoalApplicationService> {
    if (!GoalApplicationService.instance) {
      GoalApplicationService.instance = await GoalApplicationService.createInstance();
    }
    return GoalApplicationService.instance;
  }

  // ===== Goal CRUD 操作 =====

  /**
   * 创建目标
   */
  async createGoal(params: {
    accountUuid: string;
    title: string;
    description?: string;
    importance: ImportanceLevel;
    urgency: UrgencyLevel;
    parentGoalUuid?: string;
    folderUuid?: string;
    startDate?: number;
    targetDate?: number;
    tags?: string[];
    metadata?: any;
    color?: string;
    feasibilityAnalysis?: string;
    motivation?: string;
  }): Promise<GoalClientDTO> {
    // 1. 如果有父目标，先查询
    let parentGoal: Goal | undefined;
    if (params.parentGoalUuid) {
      const found = await this.goalRepository.findById(params.parentGoalUuid);
      if (!found) {
        throw new Error(`Parent goal not found: ${params.parentGoalUuid}`);
      }
      parentGoal = found;
    }

    // 2. 委托领域服务创建聚合根（不持久化）
    const goal = this.domainService.createGoal(params, parentGoal);

    // 3. 持久化
    await this.goalRepository.save(goal);

    // 4. 发布领域事件
    await GoalEventPublisher.publishGoalEvents(goal);

    // 5. 返回 ClientDTO
    return goal.toClientDTO();
  }

  /**
   * 获取目标详情
   */
  async getGoal(
    uuid: string,
    options?: { includeChildren?: boolean },
  ): Promise<GoalClientDTO | null> {
    const goal = await this.goalRepository.findById(uuid, options);
    return goal ? goal.toClientDTO(true) : null;
  }

  /**
   * 获取用户的所有目标
   */
  async getUserGoals(
    accountUuid: string,
    options?: {
      includeChildren?: boolean;
      status?: string;
      folderUuid?: string;
    },
  ): Promise<GoalClientDTO[]> {
    const goals = await this.goalRepository.findByAccountUuid(accountUuid, options);
    const dtos = goals.map((g: Goal) => g.toClientDTO(true));
    
    return dtos;
  }

  /**
   * 更新目标基本信息
   */
  async updateGoal(
    uuid: string,
    updates: Partial<{
      title: string;
      description: string;
      importance: ImportanceLevel;
      urgency: UrgencyLevel;
      category: string;
      deadline: number;
      tags: string[];
      metadata: any;
      color: string;
      feasibilityAnalysis: string;
      motivation: string;
    }>,
  ): Promise<GoalClientDTO> {
    // 1. 查询目标
    const goal = await this.goalRepository.findById(uuid);
    if (!goal) {
      throw new Error(`Goal not found: ${uuid}`);
    }

    // 2. 委托领域服务更新（业务逻辑）
    this.domainService.updateGoalBasicInfo(goal, updates);

    // 3. 持久化
    await this.goalRepository.save(goal);

    // 4. 发布领域事件
    await GoalEventPublisher.publishGoalEvents(goal);

    // 5. 返回 ClientDTO
    return goal.toClientDTO();
  }

  /**
   * 删除目标（软删除）
   */
  /**
   * 检查目标是否有关联数据
   * @returns 返回关联信息
   */
  async checkGoalDependencies(uuid: string): Promise<{
    hasKeyResults: boolean;
    keyResultCount: number;
    hasReviews: boolean;
    reviewCount: number;
    hasTaskLinks: boolean; // 未来扩展：检查 Task 模块关联
    canDelete: boolean;
    warnings: string[];
  }> {
    // 1. 查询目标（包含子实体）
    const goal = await this.goalRepository.findById(uuid, { includeChildren: true });
    if (!goal) {
      throw new Error(`Goal not found: ${uuid}`);
    }

    const keyResults = goal.keyResults || [];
    const reviews = goal.reviews || [];
    const keyResultCount = keyResults.length;
    const reviewCount = reviews.length;

    const warnings: string[] = [];
    
    if (keyResultCount > 0) {
      warnings.push(`该目标包含 ${keyResultCount} 个关键结果`);
    }
    
    if (reviewCount > 0) {
      warnings.push(`该目标包含 ${reviewCount} 条复盘记录`);
    }

    // TODO: 未来检查 Task 模块关联
    // const hasTaskLinks = await this.checkTaskLinks(uuid);
    const hasTaskLinks = false;

    return {
      hasKeyResults: keyResultCount > 0,
      keyResultCount,
      hasReviews: reviewCount > 0,
      reviewCount,
      hasTaskLinks,
      canDelete: true, // 即使有关联也允许删除（级联删除）
      warnings,
    };
  }

  /**
   * 删除目标（软删除，级联删除子实体）
   */
  async deleteGoal(uuid: string): Promise<void> {
    // 1. 查询目标（包含子实体）
    const goal = await this.goalRepository.findById(uuid, { includeChildren: true });
    if (!goal) {
      throw new Error(`Goal not found: ${uuid}`);
    }

    // 2. 调用聚合根的软删除方法
    goal.softDelete();

    // 3. 持久化（包括子实体）
    await this.goalRepository.save(goal);

    // 4. 级联删除子实体（如果需要物理删除）
    // 注意：Prisma 的级联删除配置应该在 schema 中设置
    // 这里只是软删除，实际数据仍保留
    
    // 5. 发布领域事件
    await GoalEventPublisher.publishGoalEvents(goal);
  }

  /**
   * 归档目标
   */
  async archiveGoal(uuid: string): Promise<GoalClientDTO> {
    // 1. 查询目标
    const goal = await this.goalRepository.findById(uuid);
    if (!goal) {
      throw new Error(`Goal not found: ${uuid}`);
    }

    // 2. 调用聚合根方法
    goal.archive();

    // 3. 持久化
    await this.goalRepository.save(goal);

    // 4. 发布领域事件
    await GoalEventPublisher.publishGoalEvents(goal);

    // 5. 返回 ClientDTO
    return goal.toClientDTO();
  }

  /**
   * 激活目标
   */
  async activateGoal(uuid: string): Promise<GoalClientDTO> {
    // 1. 查询目标
    const goal = await this.goalRepository.findById(uuid);
    if (!goal) {
      throw new Error(`Goal not found: ${uuid}`);
    }

    // 2. 调用聚合根方法
    goal.activate();

    // 3. 持久化
    await this.goalRepository.save(goal);

    // 4. 发布领域事件
    await GoalEventPublisher.publishGoalEvents(goal);

    // 5. 返回 ClientDTO
    return goal.toClientDTO();
  }

  /**
   * 完成目标
   */
  async completeGoal(uuid: string): Promise<GoalClientDTO> {
    // 1. 查询目标
    const goal = await this.goalRepository.findById(uuid);
    if (!goal) {
      throw new Error(`Goal not found: ${uuid}`);
    }

    // 2. 调用聚合根方法
    goal.complete();

    // 3. 持久化
    await this.goalRepository.save(goal);

    // 4. 发布领域事件
    await GoalEventPublisher.publishGoalEvents(goal);

    // 5. 返回 ClientDTO
    return goal.toClientDTO();
  }

  // ===== 查询操作 =====

  /**
   * 搜索目标
   */
  async searchGoals(accountUuid: string, query: string): Promise<GoalClientDTO[]> {
    const goals = await this.goalRepository.findByAccountUuid(accountUuid, {});
    return goals
      .filter((g) => g.title.includes(query) || g.description?.includes(query))
      .map((g: Goal) => g.toClientDTO());
  }

  /**
   * 获取目标统计
   *
   * 注意：这个方法已重构为事件驱动架构，应该直接使用 GoalStatisticsApplicationService
   *
   * 架构说明：
   * 1. Query: 从数据库读取持久化的统计（O(1) 查询）
   * 2. Lazy Init: 如果不存在则自动创建
   * 3. Return: 返回统计 DTO
   */
  async getGoalStatistics(accountUuid: string): Promise<GoalStatisticsClientDTO> {
    // 委托给 GoalStatisticsApplicationService（新架构）
    const statisticsService = await GoalStatisticsApplicationService.getInstance();
    const statistics = await statisticsService.getOrCreateStatistics(accountUuid);
    return statistics;
  }
}

