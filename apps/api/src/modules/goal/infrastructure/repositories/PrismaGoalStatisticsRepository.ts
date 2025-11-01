// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import type { IGoalStatisticsRepository } from '@dailyuse/domain-server';
import { GoalStatistics } from '@dailyuse/domain-server';

/**
 * GoalStatistics Prisma 仓储实现
 * 负责统计数据的持久化
 *
 * 注意：
 * - GoalStatistics 使用 UPSERT 语义（accountUuid 唯一）
 * - 每个账户只有一条统计记录
 */
export class PrismaGoalStatisticsRepository implements IGoalStatisticsRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * 保存统计信息（UPSERT 语义）
   *
   * 返回更新后的统计聚合根
   */
  async upsert(statistics: GoalStatistics): Promise<GoalStatistics> {
    const persistence = statistics.toPersistenceDTO();

    const record = await this.prisma.goalStatistic.upsert({
      where: { accountUuid: persistence.accountUuid },
      create: {
        accountUuid: persistence.accountUuid,
        totalGoals: persistence.totalGoals,
        activeGoals: persistence.activeGoals,
        completedGoals: persistence.completedGoals,
        archivedGoals: persistence.archivedGoals,
        overdueGoals: persistence.overdueGoals,
        totalKeyResults: persistence.totalKeyResults,
        completedKeyResults: persistence.completedKeyResults,
        averageProgress: persistence.averageProgress,
        goalsByImportance: persistence.goalsByImportance,
        goalsByUrgency: persistence.goalsByUrgency,
        goalsByCategory: persistence.goalsByCategory,
        goalsByStatus: persistence.goalsByStatus,
        goalsCreatedThisWeek: persistence.goalsCreatedThisWeek,
        goalsCompletedThisWeek: persistence.goalsCompletedThisWeek,
        goalsCreatedThisMonth: persistence.goalsCreatedThisMonth,
        goalsCompletedThisMonth: persistence.goalsCompletedThisMonth,
        totalReviews: persistence.totalReviews,
        averageRating: persistence.averageRating,
        totalFocusSessions: 0,
        completedFocusSessions: 0,
        totalFocusMinutes: 0,
        lastCalculatedAt: new Date(persistence.lastCalculatedAt),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      update: {
        totalGoals: persistence.totalGoals,
        activeGoals: persistence.activeGoals,
        completedGoals: persistence.completedGoals,
        archivedGoals: persistence.archivedGoals,
        overdueGoals: persistence.overdueGoals,
        totalKeyResults: persistence.totalKeyResults,
        completedKeyResults: persistence.completedKeyResults,
        averageProgress: persistence.averageProgress,
        goalsByImportance: persistence.goalsByImportance,
        goalsByUrgency: persistence.goalsByUrgency,
        goalsByCategory: persistence.goalsByCategory,
        goalsByStatus: persistence.goalsByStatus,
        goalsCreatedThisWeek: persistence.goalsCreatedThisWeek,
        goalsCompletedThisWeek: persistence.goalsCompletedThisWeek,
        goalsCreatedThisMonth: persistence.goalsCreatedThisMonth,
        goalsCompletedThisMonth: persistence.goalsCompletedThisMonth,
        totalReviews: persistence.totalReviews,
        averageRating: persistence.averageRating,
        lastCalculatedAt: new Date(persistence.lastCalculatedAt),
        updatedAt: new Date(),
        // createdAt 不更新
      },
    });

    // 返回更新后的聚合根
    return GoalStatistics.fromPersistenceDTO({
      accountUuid: record.accountUuid,
      totalGoals: record.totalGoals,
      activeGoals: record.activeGoals,
      completedGoals: record.completedGoals,
      archivedGoals: record.archivedGoals,
      overdueGoals: record.overdueGoals,
      totalKeyResults: record.totalKeyResults,
      completedKeyResults: record.completedKeyResults,
      averageProgress: record.averageProgress,
      goalsByImportance: record.goalsByImportance,
      goalsByUrgency: record.goalsByUrgency,
      goalsByCategory: record.goalsByCategory,
      goalsByStatus: record.goalsByStatus,
      goalsCreatedThisWeek: record.goalsCreatedThisWeek,
      goalsCompletedThisWeek: record.goalsCompletedThisWeek,
      goalsCreatedThisMonth: record.goalsCreatedThisMonth,
      goalsCompletedThisMonth: record.goalsCompletedThisMonth,
      totalReviews: record.totalReviews,
      averageRating: record.averageRating,
      lastCalculatedAt: record.lastCalculatedAt.getTime(),
    });
  }

  /**
   * 通过账户 UUID 查找统计
   */
  async findByAccountUuid(accountUuid: string): Promise<GoalStatistics | null> {
    const record = await this.prisma.goalStatistic.findUnique({
      where: { accountUuid },
    });

    if (!record) {
      return null;
    }

    return GoalStatistics.fromPersistenceDTO({
      accountUuid: record.accountUuid,
      totalGoals: record.totalGoals,
      activeGoals: record.activeGoals,
      completedGoals: record.completedGoals,
      archivedGoals: record.archivedGoals,
      overdueGoals: record.overdueGoals,
      totalKeyResults: record.totalKeyResults,
      completedKeyResults: record.completedKeyResults,
      averageProgress: record.averageProgress,
      goalsByImportance: record.goalsByImportance,
      goalsByUrgency: record.goalsByUrgency,
      goalsByCategory: record.goalsByCategory,
      goalsByStatus: record.goalsByStatus,
      goalsCreatedThisWeek: record.goalsCreatedThisWeek,
      goalsCompletedThisWeek: record.goalsCompletedThisWeek,
      goalsCreatedThisMonth: record.goalsCreatedThisMonth,
      goalsCompletedThisMonth: record.goalsCompletedThisMonth,
      totalReviews: record.totalReviews,
      averageRating: record.averageRating,
      lastCalculatedAt: record.lastCalculatedAt.getTime(),
    });
  }

  /**
   * 删除统计
   */
  async delete(accountUuid: string): Promise<boolean> {
    try {
      await this.prisma.goalStatistic.delete({
        where: { accountUuid },
      });
      return true;
    } catch (error) {
      // 如果记录不存在，Prisma会抛出错误
      return false;
    }
  }

  /**
   * 检查统计是否存在
   */
  async exists(accountUuid: string): Promise<boolean> {
    const count = await this.prisma.goalStatistic.count({
      where: { accountUuid },
    });
    return count > 0;
  }
}
