import type { IGoalRepository } from '@dailyuse/domain-server';
import { GoalContainer } from '../../infrastructure/di/GoalContainer';
import { GoalDomainService, Goal, GoalRecord } from '@dailyuse/domain-server';
import type { GoalContracts } from '@dailyuse/contracts';
import { GoalEventPublisher } from './GoalEventPublisher';
import { GoalStatisticsApplicationService } from './GoalStatisticsApplicationService';

type GoalStatisticsClientDTO = GoalContracts.GoalStatisticsClientDTO;

/**
 * Goal 应用服务
 * 负责协调领域服务和仓储，处理业务用例
 *
 * 架构职责：
 * - 委托给 DomainService 处理业务逻辑
 * - 协调多个领域服务
 * - 事务管理
 * - DTO 转换（Domain → ClientDTO）
 * - 调用 Repository 进行持久化
 *
 * 注意：返回给客户端的数据必须使用 ClientDTO（通过 toClientDTO() 方法）
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
    importance: GoalContracts.ImportanceLevel;
    urgency: GoalContracts.UrgencyLevel;
    parentGoalUuid?: string;
    folderUuid?: string;
    startDate?: number;
    targetDate?: number;
    tags?: string[];
    metadata?: any;
    color?: string;
    feasibilityAnalysis?: string;
    motivation?: string;
  }): Promise<GoalContracts.GoalClientDTO> {
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
  ): Promise<GoalContracts.GoalClientDTO | null> {
    const goal = await this.goalRepository.findById(uuid, options);
    return goal ? goal.toClientDTO() : null;
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
  ): Promise<GoalContracts.GoalClientDTO[]> {
    console.log('[GoalApplicationService.getUserGoals] options:', options);
    const goals = await this.goalRepository.findByAccountUuid(accountUuid, options);
    console.log('[GoalApplicationService.getUserGoals] 从Repository获取Goals数量:', goals.length);
    console.log('[GoalApplicationService.getUserGoals] 第一个Goal实体:', goals[0]);
    console.log('[GoalApplicationService.getUserGoals] 第一个Goal的KeyResults数量:', goals[0]?.keyResults?.length || 0);
    
    const dtos = goals.map((g: Goal) => g.toClientDTO(true));
    console.log('[GoalApplicationService.getUserGoals] 转换后DTO数量:', dtos.length);
    console.log('[GoalApplicationService.getUserGoals] 第一个DTO的KeyResults:', dtos[0]?.keyResults);
    
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
      importance: GoalContracts.ImportanceLevel;
      urgency: GoalContracts.UrgencyLevel;
      category: string;
      deadline: number;
      tags: string[];
      metadata: any;
      color: string;
      feasibilityAnalysis: string;
      motivation: string;
    }>,
  ): Promise<GoalContracts.GoalClientDTO> {
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
  async deleteGoal(uuid: string): Promise<void> {
    await this.goalRepository.softDelete(uuid);
  }

  /**
   * 归档目标
   */
  async archiveGoal(uuid: string): Promise<GoalContracts.GoalClientDTO> {
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
  async activateGoal(uuid: string): Promise<GoalContracts.GoalClientDTO> {
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
  async completeGoal(uuid: string): Promise<GoalContracts.GoalClientDTO> {
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

  // ===== KeyResult 管理 =====

  /**
   * 添加关键结果
   */
  async addKeyResult(
    goalUuid: string,
    keyResult: {
      title: string;
      valueType: GoalContracts.KeyResultValueType;
      aggregationMethod?: GoalContracts.AggregationMethod;
      targetValue: number;
      currentValue?: number;
      unit?: string;
      weight: number;
    },
  ): Promise<GoalContracts.GoalClientDTO> {
    // 1. 查询目标（包含子实体）
    const goal = await this.goalRepository.findById(goalUuid, { includeChildren: true });
    if (!goal) {
      throw new Error(`Goal not found: ${goalUuid}`);
    }

    // 2. 委托领域服务添加关键结果
    this.domainService.addKeyResultToGoal(goal, keyResult);

    // 3. 持久化
    await this.goalRepository.save(goal);

    // 4. 发布领域事件
    await GoalEventPublisher.publishGoalEvents(goal);

    // 5. 返回 ClientDTO（包含子实体）
    return goal.toClientDTO(true);
  }

  /**
   * 更新关键结果配置（标题、权重等）
   */
  async updateKeyResult(
    goalUuid: string,
    keyResultUuid: string,
    updates: {
      title?: string;
      description?: string;
      weight?: number;
      targetValue?: number;
      unit?: string;
    },
  ): Promise<GoalContracts.GoalClientDTO> {
    // 1. 查询目标（包含子实体）
    const goal = await this.goalRepository.findById(goalUuid, { includeChildren: true });
    if (!goal) {
      throw new Error(`Goal not found: ${goalUuid}`);
    }

    // 2. 查找关键结果
    const keyResult = goal.keyResults.find((kr) => kr.uuid === keyResultUuid);
    if (!keyResult) {
      throw new Error(`KeyResult not found: ${keyResultUuid}`);
    }

    // 3. 更新关键结果属性
    if (updates.title !== undefined) {
      keyResult.updateTitle(updates.title);
    }
    if (updates.description !== undefined) {
      keyResult.updateDescription(updates.description);
    }
    if (updates.weight !== undefined) {
      keyResult.updateWeight(updates.weight);
    }
    // 注意: targetValue和unit目前没有直接的update方法,需要通过progress对象更新

    // 4. 持久化
    await this.goalRepository.save(goal);

    // 5. 发布领域事件
    await GoalEventPublisher.publishGoalEvents(goal);

    // 6. 返回 ClientDTO（包含子实体）
    return goal.toClientDTO(true);
  }

  /**
   * 更新关键结果进度
   */
  async updateKeyResultProgress(
    goalUuid: string,
    keyResultUuid: string,
    currentValue: number,
    note?: string,
  ): Promise<GoalContracts.GoalClientDTO> {
    // 1. 查询目标（包含子实体）
    const goal = await this.goalRepository.findById(goalUuid, { includeChildren: true });
    if (!goal) {
      throw new Error(`Goal not found: ${goalUuid}`);
    }

    // 2. 委托领域服务更新进度
    this.domainService.updateKeyResultProgress(goal, keyResultUuid, currentValue, note);

    // 3. 持久化
    await this.goalRepository.save(goal);

    // 4. 发布领域事件
    await GoalEventPublisher.publishGoalEvents(goal);

    // 5. 返回 ClientDTO（包含子实体）
    return goal.toClientDTO(true);
  }

  /**
   * 删除关键结果
   */
  async deleteKeyResult(
    goalUuid: string,
    keyResultUuid: string,
  ): Promise<GoalContracts.GoalClientDTO> {
    // 1. 查询目标（包含子实体）
    const goal = await this.goalRepository.findById(goalUuid, { includeChildren: true });
    if (!goal) {
      throw new Error(`Goal not found: ${goalUuid}`);
    }

    // 2. 调用聚合根方法删除关键结果
    goal.removeKeyResult(keyResultUuid);

    // 3. 持久化
    await this.goalRepository.save(goal);

    // 4. 发布领域事件
    await GoalEventPublisher.publishGoalEvents(goal);

    // 5. 返回 ClientDTO（包含子实体）
    return goal.toClientDTO(true);
  }

  // ===== GoalReview 管理 =====

  /**
   * 添加目标回顾
   */
  async addReview(
    goalUuid: string,
    params: {
      title: string;
      content: string;
      reviewType: string;
      rating?: number;
      achievements?: string;
      challenges?: string;
      nextActions?: string;
    },
  ): Promise<GoalContracts.GoalClientDTO> {
    // 1. 查询目标（包含子实体）
    const goal = await this.goalRepository.findById(goalUuid, { includeChildren: true });
    if (!goal) {
      throw new Error(`Goal not found: ${goalUuid}`);
    }

    // 2. 委托领域服务添加回顾
    this.domainService.addReviewToGoal(goal, params);

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
  async searchGoals(accountUuid: string, query: string): Promise<GoalContracts.GoalClientDTO[]> {
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
