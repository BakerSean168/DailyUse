import { GoalClient } from '@dailyuse/domain-client';

/**
 * Goal 领域服务
 *
 * 职责：处理跨聚合根或复杂的业务逻辑，这些逻辑不适合放在单个聚合根内部
 *
 * 注意：领域服务应该是无状态的，只包含业务逻辑，不涉及持久化或应用层协调
 */
export class GoalDomainService {
  /**
   * 计算目标之间的依赖冲突
   * 场景：当多个目标有重叠的关键结果时，检查是否会产生冲突
   */
  checkGoalConflicts(
    primaryGoal: Goal,
    relatedGoals: Goal[],
  ): {
    hasConflicts: boolean;
    conflicts: Array<{
      conflictType: 'weight_overlap' | 'resource_conflict' | 'timeline_conflict';
      message: string;
      affectedGoals: string[];
    }>;
  } {
    // 参数验证
    if (!primaryGoal) {
      throw new Error('主目标不能为空');
    }
    if (!Array.isArray(relatedGoals)) {
      throw new Error('相关目标列表必须是数组');
    }

    const conflicts: Array<{
      conflictType: 'weight_overlap' | 'resource_conflict' | 'timeline_conflict';
      message: string;
      affectedGoals: string[];
    }> = [];

    try {
      // 检查权重冲突
      relatedGoals.forEach((relatedGoal) => {
        if (!relatedGoal) return; // 跳过空值

        const weightConflict = this.detectWeightConflicts(primaryGoal, relatedGoal);
        if (weightConflict) {
          conflicts.push(weightConflict);
        }

        // 检查时间冲突
        const timelineConflict = this.detectTimelineConflicts(primaryGoal, relatedGoal);
        if (timelineConflict) {
          conflicts.push(timelineConflict);
        }

        // 检查资源冲突
        const resourceConflict = this.detectResourceConflicts(primaryGoal, relatedGoal);
        if (resourceConflict) {
          conflicts.push(resourceConflict);
        }
      });
    } catch (error) {
      console.error('检查目标冲突时发生错误:', error);
      // 返回错误状态而不是抛出异常，保持服务的稳定性
      conflicts.push({
        conflictType: 'resource_conflict',
        message: '冲突检查过程中发生错误，请重试',
        affectedGoals: [primaryGoal.uuid],
      });
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
    };
  }

  /**
   * 计算目标完成度的复杂业务逻辑
   * 场景：基于多种因素计算目标的真实完成度（不仅仅是简单的百分比）
   */
  calculateGoalHealthScore(goal: Goal): {
    overallScore: number;
    factors: {
      progressScore: number; // 进度得分
      timelinessScore: number; // 时间性得分
      qualityScore: number; // 质量得分
      consistencyScore: number; // 一致性得分
    };
    recommendation: string;
  } {
    // 参数验证
    if (!goal) {
      throw new Error('目标对象不能为空');
    }

    try {
      const progressScore = Math.min(goal.overallProgress / 100, 1);

      // 时间性得分：基于剩余时间和当前进度
      const timelinessScore = this.calculateTimelinessScore(goal);

      // 质量得分：基于关键结果的质量
      const qualityScore = this.calculateQualityScore(goal);

      // 一致性得分：基于记录的频率和规律性
      const consistencyScore = this.calculateConsistencyScore(goal);

      // 权重分配：进度40%，时间性30%，质量20%，一致性10%
      const overallScore = Math.min(
        1,
        progressScore * 0.4 + timelinessScore * 0.3 + qualityScore * 0.2 + consistencyScore * 0.1,
      );

      const factors = {
        progressScore,
        timelinessScore,
        qualityScore,
        consistencyScore,
      };

      return {
        overallScore,
        factors,
        recommendation: this.generateRecommendation(overallScore, factors),
      };
    } catch (error) {
      console.error('计算目标健康度时发生错误:', error);
      // 返回安全的默认值
      return {
        overallScore: 0,
        factors: {
          progressScore: 0,
          timelinessScore: 0,
          qualityScore: 0,
          consistencyScore: 0,
        },
        recommendation: '无法计算健康度，请检查目标数据',
      };
    }
  }

  /**
   * 目标克隆的业务逻辑
   * 场景：复制目标时需要特殊的业务规则处理
   */
  cloneGoalWithBusinessRules(
    sourceGoal: Goal,
    cloneOptions: {
      includeRecords: boolean;
      includeReviews: boolean;
      adjustTimeframe: boolean;
      newTimeframe?: { startTime: Date; endTime: Date };
    },
  ): Goal {
    // 参数验证
    if (!sourceGoal) {
      throw new Error('源目标不能为空');
    }
    if (!cloneOptions) {
      throw new Error('克隆选项不能为空');
    }

    try {
      // 创建基础目标副本
      const clonedGoal = sourceGoal.clone();

      // 重置特定字段
      clonedGoal.resetForClone();

      // 应用时间调整逻辑
      if (cloneOptions.adjustTimeframe && cloneOptions.newTimeframe) {
        this.adjustGoalTimeframe(clonedGoal, cloneOptions.newTimeframe);
      }

      // 处理关键结果的克隆逻辑
      if (!cloneOptions.includeRecords) {
        clonedGoal.clearAllRecords();
      }

      if (!cloneOptions.includeReviews) {
        clonedGoal.clearAllReviews();
      }

      return clonedGoal;
    } catch (error) {
      console.error('克隆目标时发生错误:', error);
      throw new Error(`目标克隆失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 批量目标权重调整的业务逻辑
   * 场景：当用户需要调整多个目标的优先级权重时
   */
  rebalanceGoalWeights(
    goals: Goal[],
    newWeightDistribution: Map<string, number>,
  ): Map<string, Goal> {
    // 参数验证
    if (!Array.isArray(goals)) {
      throw new Error('目标列表必须是数组');
    }
    if (!(newWeightDistribution instanceof Map)) {
      throw new Error('权重分布必须是Map对象');
    }

    // 验证权重总和
    const weights = Array.from(newWeightDistribution.values());
    const totalWeight = weights.reduce((sum, weight) => {
      if (typeof weight !== 'number' || weight < 0 || weight > 100) {
        throw new Error(`权重值必须是0-100之间的数字，当前值: ${weight}`);
      }
      return sum + weight;
    }, 0);

    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error(`目标权重总和必须为100%，当前为${totalWeight.toFixed(2)}%`);
    }

    const adjustedGoals = new Map<string, Goal>();

    try {
      goals.forEach((goal) => {
        if (!goal) return; // 跳过空值

        const newWeight = newWeightDistribution.get(goal.uuid);
        if (newWeight !== undefined) {
          const adjustedGoal = goal.clone();
          adjustedGoal.adjustPriorityWeight(newWeight);
          adjustedGoals.set(goal.uuid, adjustedGoal);
        }
      });
    } catch (error) {
      console.error('调整目标权重时发生错误:', error);
      throw new Error(`权重调整失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }

    return adjustedGoals;
  }

  // ===== 私有辅助方法 =====

  /**
   * 检测权重冲突
   */
  private detectWeightConflicts(
    goal1: Goal,
    goal2: Goal,
  ): {
    conflictType: 'weight_overlap';
    message: string;
    affectedGoals: string[];
  } | null {
    try {
      // 获取目标的权重（如果有的话）
      const weight1 = (goal1.metadata as any)?.priorityWeight || 0;
      const weight2 = (goal2.metadata as any)?.priorityWeight || 0;

      // 如果两个目标权重都很高（>70%），认为存在冲突
      if (weight1 > 70 && weight2 > 70) {
        return {
          conflictType: 'weight_overlap',
          message: `目标 "${goal1.name}" 和 "${goal2.name}" 都被设置为高优先级，可能存在资源竞争`,
          affectedGoals: [goal1.uuid, goal2.uuid],
        };
      }

      return null;
    } catch (error) {
      console.error('检测权重冲突时发生错误:', error);
      return null;
    }
  }

  /**
   * 检测时间线冲突
   */
  private detectTimelineConflicts(
    goal1: Goal,
    goal2: Goal,
  ): {
    conflictType: 'timeline_conflict';
    message: string;
    affectedGoals: string[];
  } | null {
    try {
      // 检查时间范围是否重叠
      const start1 = goal1.startTime.getTime();
      const end1 = goal1.endTime.getTime();
      const start2 = goal2.startTime.getTime();
      const end2 = goal2.endTime.getTime();

      const hasOverlap = start1 < end2 && start2 < end1;

      if (hasOverlap && goal1.dirUuid === goal2.dirUuid) {
        return {
          conflictType: 'timeline_conflict',
          message: `目标 "${goal1.name}" 和 "${goal2.name}" 在相同目录下时间范围重叠，可能影响执行效果`,
          affectedGoals: [goal1.uuid, goal2.uuid],
        };
      }

      return null;
    } catch (error) {
      console.error('检测时间线冲突时发生错误:', error);
      return null;
    }
  }

  /**
   * 检测资源冲突
   */
  private detectResourceConflicts(
    goal1: Goal,
    goal2: Goal,
  ): {
    conflictType: 'resource_conflict';
    message: string;
    affectedGoals: string[];
  } | null {
    try {
      // 简化的资源冲突检测：如果两个目标在同一目录且都处于活跃状态
      if (
        goal1.dirUuid === goal2.dirUuid &&
        goal1.status === 'active' &&
        goal2.status === 'active' &&
        goal1.keyResults.length > 3 &&
        goal2.keyResults.length > 3
      ) {
        return {
          conflictType: 'resource_conflict',
          message: `目标 "${goal1.name}" 和 "${goal2.name}" 都包含多个关键结果，可能存在资源分配冲突`,
          affectedGoals: [goal1.uuid, goal2.uuid],
        };
      }

      return null;
    } catch (error) {
      console.error('检测资源冲突时发生错误:', error);
      return null;
    }
  }

  /**
   * 计算时间性得分
   */
  private calculateTimelinessScore(goal: Goal): number {
    try {
      const totalDays = goal.totalDuration;
      const remainingDays = goal.daysRemaining;
      const progress = goal.overallProgress;

      if (remainingDays < 0) return 0; // 已逾期
      if (totalDays === 0) return 1; // 没有时间限制

      const expectedProgress = ((totalDays - remainingDays) / totalDays) * 100;
      const progressRatio = expectedProgress > 0 ? progress / expectedProgress : 0;

      return Math.min(progressRatio / 100, 1);
    } catch (error) {
      console.error('计算时间性得分时发生错误:', error);
      return 0;
    }
  }

  /**
   * 计算质量得分
   */
  private calculateQualityScore(goal: Goal): number {
    try {
      // 基于关键结果的完成质量计算
      const keyResults = goal.keyResults;
      if (!keyResults || keyResults.length === 0) return 0;

      const qualitySum = keyResults.reduce((sum, kr) => {
        // 安全检查，避免除零错误
        if (!kr || kr.targetValue === 0) return sum;
        return sum + Math.min(kr.currentValue / kr.targetValue, 1);
      }, 0);

      return Math.min(qualitySum / keyResults.length, 1);
    } catch (error) {
      console.error('计算质量得分时发生错误:', error);
      return 0;
    }
  }

  /**
   * 计算一致性得分
   */
  private calculateConsistencyScore(goal: Goal): number {
    try {
      // 基于记录频率计算一致性
      const records = goal.records;
      if (!records || records.length < 2) return 0.5;

      // 计算记录间隔的标准差来评估一致性
      const intervals: number[] = [];
      for (let i = 1; i < records.length; i++) {
        const prevRecord = records[i - 1];
        const currentRecord = records[i];

        if (prevRecord?.createdAt && currentRecord?.createdAt) {
          const interval = currentRecord.createdAt.getTime() - prevRecord.createdAt.getTime();
          intervals.push(interval);
        }
      }

      if (intervals.length === 0) return 0.5;

      const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
      const variance =
        intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
      const stdDev = Math.sqrt(variance);

      // 标准差越小，一致性越高
      const consistencyScore = avgInterval > 0 ? Math.max(0, 1 - stdDev / avgInterval) : 0;
      return Math.min(consistencyScore, 1);
    } catch (error) {
      console.error('计算一致性得分时发生错误:', error);
      return 0.5;
    }
  }

  /**
   * 生成推荐建议
   */
  private generateRecommendation(
    overallScore: number,
    factors: {
      progressScore: number;
      timelinessScore: number;
      qualityScore: number;
      consistencyScore: number;
    },
  ): string {
    try {
      if (overallScore >= 0.8) {
        return '目标执行状况优秀，继续保持当前节奏';
      } else if (overallScore >= 0.6) {
        // 根据具体得分给出针对性建议
        const lowFactors = [];
        if (factors.timelinessScore < 0.6) lowFactors.push('时间管理');
        if (factors.qualityScore < 0.6) lowFactors.push('执行质量');
        if (factors.consistencyScore < 0.6) lowFactors.push('执行一致性');

        const suggestions =
          lowFactors.length > 0
            ? `，建议重点关注: ${lowFactors.join('、')}`
            : '，建议适度优化时间安排';

        return `目标执行正常${suggestions}`;
      } else if (overallScore >= 0.4) {
        return '目标执行存在问题，建议重新评估计划并调整策略';
      } else {
        return '目标执行严重滞后，建议暂停并重新制定策略';
      }
    } catch (error) {
      console.error('生成推荐建议时发生错误:', error);
      return '无法生成推荐建议，请联系支持';
    }
  }

  /**
   * 调整目标时间框架
   */
  private adjustGoalTimeframe(goal: Goal, newTimeframe: { startTime: Date; endTime: Date }): void {
    try {
      // 验证时间框架的有效性
      if (!newTimeframe.startTime || !newTimeframe.endTime) {
        throw new Error('开始时间和结束时间都不能为空');
      }

      if (newTimeframe.startTime.getTime() >= newTimeframe.endTime.getTime()) {
        throw new Error('开始时间必须早于结束时间');
      }

      // 调整目标时间框架的业务逻辑
      goal.updateTimeframe(newTimeframe.startTime, newTimeframe.endTime);
    } catch (error) {
      console.error('调整目标时间框架时发生错误:', error);
      throw error; // 重新抛出错误，让调用者处理
    }
  }
}
