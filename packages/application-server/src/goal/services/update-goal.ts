/**
 * Update Goal Service
 *
 * 更新目标基本信息的应用服务
 */

import type { IGoalRepository } from '@dailyuse/domain-server/goal';
import { GoalDomainService, Goal } from '@dailyuse/domain-server/goal';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts/shared';
import { eventBus } from '@dailyuse/utils';
import { GoalContainer } from '../GoalContainer';

/**
 * Update Goal Input
 */
export interface UpdateGoalInput {
  uuid: string;
  title?: string;
  description?: string;
  importance?: ImportanceLevel;
  urgency?: UrgencyLevel;
  category?: string;
  deadline?: number;
  tags?: string[];
  metadata?: unknown;
  color?: string;
  feasibilityAnalysis?: string;
  motivation?: string;
}

/**
 * Update Goal Output
 */
export interface UpdateGoalOutput {
  goal: GoalClientDTO;
}

/**
 * Update Goal Service
 */
export class UpdateGoal {
  private static instance: UpdateGoal;
  private readonly domainService: GoalDomainService;

  private constructor(private readonly goalRepository: IGoalRepository) {
    this.domainService = new GoalDomainService();
  }

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(goalRepository?: IGoalRepository): UpdateGoal {
    const container = GoalContainer.getInstance();
    const repo = goalRepository || container.getGoalRepository();
    UpdateGoal.instance = new UpdateGoal(repo);
    return UpdateGoal.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): UpdateGoal {
    if (!UpdateGoal.instance) {
      UpdateGoal.instance = UpdateGoal.createInstance();
    }
    return UpdateGoal.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    UpdateGoal.instance = undefined as unknown as UpdateGoal;
  }

  async execute(input: UpdateGoalInput): Promise<UpdateGoalOutput> {
    // 1. 查询目标
    const goal = await this.goalRepository.findById(input.uuid);
    if (!goal) {
      throw new Error(`Goal not found: ${input.uuid}`);
    }

    // 2. 委托领域服务更新
    const { uuid, ...updates } = input;
    this.domainService.updateGoalBasicInfo(goal, updates);

    // 3. 持久化
    await this.goalRepository.save(goal);

    // 4. 发布领域事件
    await this.publishEvents(goal);

    // 5. 返回结果
    return {
      goal: goal.toClientDTO(),
    };
  }

  private async publishEvents(goal: Goal): Promise<void> {
    const events = goal.getUncommittedDomainEvents();
    for (const event of events) {
      await eventBus.emit(event.eventType, event);
    }
  }
}

/**
 * 便捷函数：更新目标
 */
export const updateGoal = (input: UpdateGoalInput): Promise<UpdateGoalOutput> =>
  UpdateGoal.getInstance().execute(input);
