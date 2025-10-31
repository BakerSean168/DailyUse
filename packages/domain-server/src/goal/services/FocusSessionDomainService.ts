/**
 * FocusSession 领域服务
 *
 * DDD 领域服务职责：
 * - 纯业务逻辑（不注入 Repository）
 * - 验证专注周期业务规则
 * - 复杂的领域计算（时间计算、进度计算）
 * - 跨聚合根的业务协调（不持久化）
 *
 * 注意：
 * - ✅ 所有方法都是同步的（纯业务逻辑）
 * - ✅ 不依赖外部服务（不注入 Repository）
 * - ✅ 接收聚合根对象作为参数（由 ApplicationService 查询后传入）
 * - ✅ 只返回验证结果或计算结果（不持久化）
 * - ❌ 不调用 repository.save() 或 repository.find()
 */

import { FocusSession } from '../aggregates/FocusSession';
import type { Goal } from '../aggregates/Goal';
import { GoalContracts } from '@dailyuse/contracts';

type FocusSessionStatus = GoalContracts.FocusSessionStatus;

// 枚举值别名
const FocusSessionStatus = GoalContracts.FocusSessionStatus;

// 显式导出类型以解决 tsup dts 生成问题
export type { FocusSessionStatus };

/**
 * FocusSessionDomainService
 *
 * 纯业务逻辑服务，负责专注周期管理规则
 */
export class FocusSessionDomainService {
  /**
   * 构造函数 - 无依赖注入
   */
  constructor() {
    // 领域服务不注入仓储
  }

  /**
   * 验证专注时长是否在有效范围内
   *
   * 业务规则：
   * - 时长必须大于 0 分钟
   * - 时长不能超过 4 小时（240 分钟）
   *
   * @param durationMinutes - 计划时长（分钟）
   * @throws Error - 如果时长无效
   */
  validateDuration(durationMinutes: number): void {
    if (durationMinutes <= 0) {
      throw new Error('专注时长必须大于 0 分钟');
    }

    if (durationMinutes > 240) {
      throw new Error('专注时长不能超过 4 小时（240 分钟）');
    }

    // 可选：验证时长是否为合理的数值（例如 5 分钟的倍数）
    if (durationMinutes % 5 !== 0) {
      console.warn(`建议将专注时长设置为 5 分钟的倍数，当前值：${durationMinutes} 分钟`);
    }
  }

  /**
   * 验证单个活跃会话规则
   *
   * 业务规则：每个账户同时只能有一个活跃的专注周期（IN_PROGRESS 或 PAUSED）
   *
   * @param existingSessions - 账户的现有会话列表（由 ApplicationService 查询后传入）
   * @param accountUuid - 账户 UUID
   * @throws Error - 如果存在活跃会话
   */
  validateSingleActiveSession(existingSessions: FocusSession[], accountUuid: string): void {
    const activeSessions = existingSessions.filter((session) => session.isActive());

    if (activeSessions.length > 0) {
      const activeSession = activeSessions[0];
      throw new Error(
        `您有正在进行的专注周期（UUID: ${activeSession.uuid}），请先完成或取消后再创建新的专注周期`,
      );
    }
  }

  /**
   * 验证关联目标的有效性
   *
   * 业务规则：
   * - 目标必须属于同一个账户
   * - 目标不能是已归档或已删除的
   *
   * @param goal - 关联的目标聚合根（由 ApplicationService 查询后传入）
   * @param accountUuid - 当前账户 UUID
   * @throws Error - 如果目标无效
   */
  validateAssociatedGoal(goal: Goal | null, accountUuid: string): void {
    if (!goal) {
      throw new Error('关联的目标不存在');
    }

    // 验证目标所有权
    if (goal.accountUuid !== accountUuid) {
      throw new Error('无权关联此目标，目标不属于当前账户');
    }

    // 验证目标状态
    if (goal.status === GoalContracts.GoalStatus.ARCHIVED) {
      throw new Error('不能关联已归档的目标');
    }

    if (goal.deletedAt !== null && goal.deletedAt !== undefined) {
      throw new Error('不能关联已删除的目标');
    }
  }

  /**
   * 验证状态转换是否合法
   *
   * 业务规则：遵循状态机规则
   * - DRAFT → start() → IN_PROGRESS
   * - IN_PROGRESS → pause() → PAUSED
   * - PAUSED → resume() → IN_PROGRESS
   * - IN_PROGRESS/PAUSED → complete() → COMPLETED
   * - Any (except COMPLETED/CANCELLED) → cancel() → CANCELLED
   *
   * @param currentStatus - 当前状态
   * @param action - 要执行的动作
   * @throws Error - 如果状态转换不合法
   */
  validateStateTransition(
    currentStatus: FocusSessionStatus,
    action: 'start' | 'pause' | 'resume' | 'complete' | 'cancel',
  ): void {
    switch (action) {
      case 'start':
        if (currentStatus !== FocusSessionStatus.DRAFT) {
          throw new Error(`只能从草稿状态开始专注周期，当前状态：${currentStatus}`);
        }
        break;

      case 'pause':
        if (currentStatus !== FocusSessionStatus.IN_PROGRESS) {
          throw new Error(`只能暂停进行中的专注周期，当前状态：${currentStatus}`);
        }
        break;

      case 'resume':
        if (currentStatus !== FocusSessionStatus.PAUSED) {
          throw new Error(`只能恢复已暂停的专注周期，当前状态：${currentStatus}`);
        }
        break;

      case 'complete':
        if (
          currentStatus !== FocusSessionStatus.IN_PROGRESS &&
          currentStatus !== FocusSessionStatus.PAUSED
        ) {
          throw new Error(`只能完成进行中或已暂停的专注周期，当前状态：${currentStatus}`);
        }
        break;

      case 'cancel':
        if (
          currentStatus === FocusSessionStatus.COMPLETED ||
          currentStatus === FocusSessionStatus.CANCELLED
        ) {
          throw new Error(`不能取消已完成或已取消的专注周期，当前状态：${currentStatus}`);
        }
        break;

      default:
        throw new Error(`未知的状态转换动作：${action}`);
    }
  }

  /**
   * 计算实际专注时长（已完成的会话）
   *
   * 计算公式：actualDuration = totalDuration - pausedDuration
   *
   * @param session - 专注周期聚合根
   * @returns 实际专注时长（分钟）
   */
  calculateActualDuration(session: FocusSession): number {
    if (session.status !== FocusSessionStatus.COMPLETED) {
      throw new Error('只能计算已完成会话的实际时长');
    }

    if (!session.startedAt || !session.completedAt) {
      throw new Error('会话缺少必要的时间戳');
    }

    // 总时长（毫秒 → 分钟）
    const totalDurationMs = session.completedAt - session.startedAt;
    const totalDurationMinutes = Math.round(totalDurationMs / 1000 / 60);

    // 实际时长 = 总时长 - 暂停时长
    const actualDuration = totalDurationMinutes - session.pausedDurationMinutes;

    // 确保不为负数
    return Math.max(0, actualDuration);
  }

  /**
   * 计算剩余时间（活跃会话）
   *
   * @param session - 专注周期聚合根
   * @returns 剩余时间（分钟）
   */
  calculateRemainingMinutes(session: FocusSession): number {
    return session.getRemainingMinutes();
  }

  /**
   * 计算进度百分比
   *
   * @param session - 专注周期聚合根
   * @returns 进度百分比（0-100）
   */
  calculateProgressPercentage(session: FocusSession): number {
    if (session.status === FocusSessionStatus.DRAFT) {
      return 0;
    }

    if (
      session.status === FocusSessionStatus.COMPLETED ||
      session.status === FocusSessionStatus.CANCELLED
    ) {
      return 100;
    }

    const remaining = session.getRemainingMinutes();
    const total = session.durationMinutes;

    if (total === 0) return 100;

    const progress = ((total - remaining) / total) * 100;
    return Math.round(Math.max(0, Math.min(100, progress)));
  }

  /**
   * 验证会话所有权
   *
   * @param session - 专注周期聚合根
   * @param accountUuid - 当前账户 UUID
   * @throws Error - 如果会话不属于当前账户
   */
  validateSessionOwnership(session: FocusSession, accountUuid: string): void {
    if (session.accountUuid !== accountUuid) {
      throw new Error('无权操作此专注周期，会话不属于当前账户');
    }
  }

  /**
   * 验证暂停次数是否合理
   *
   * 业务规则：过多的暂停次数可能影响专注效果
   *
   * @param session - 专注周期聚合根
   * @returns 警告信息（如果暂停次数过多）
   */
  validatePauseCount(session: FocusSession): string | null {
    const maxRecommendedPauses = 3;

    if (session.pauseCount > maxRecommendedPauses) {
      return `当前暂停次数（${session.pauseCount}）超过推荐值（${maxRecommendedPauses}），可能影响专注效果`;
    }

    return null;
  }

  /**
   * 验证会话是否可以删除
   *
   * 业务规则：只能删除已完成或已取消的会话
   *
   * @param session - 专注周期聚合根
   * @throws Error - 如果会话不能删除
   */
  validateSessionDeletion(session: FocusSession): void {
    if (
      session.status !== FocusSessionStatus.COMPLETED &&
      session.status !== FocusSessionStatus.CANCELLED
    ) {
      throw new Error(`只能删除已完成或已取消的专注周期，当前状态：${session.status}`);
    }
  }

  /**
   * 计算会话统计信息
   *
   * @param sessions - 专注周期列表（由 ApplicationService 查询后传入）
   * @returns 统计信息
   */
  calculateSessionStatistics(sessions: FocusSession[]): {
    totalSessions: number;
    completedSessions: number;
    cancelledSessions: number;
    totalFocusMinutes: number;
    totalPauseMinutes: number;
    averageFocusMinutes: number;
    completionRate: number;
  } {
    const completedSessions = sessions.filter((s) => s.status === FocusSessionStatus.COMPLETED);
    const cancelledSessions = sessions.filter((s) => s.status === FocusSessionStatus.CANCELLED);

    const totalFocusMinutes = completedSessions.reduce(
      (sum, s) => sum + s.actualDurationMinutes,
      0,
    );

    const totalPauseMinutes = sessions.reduce((sum, s) => sum + s.pausedDurationMinutes, 0);

    const averageFocusMinutes =
      completedSessions.length > 0 ? totalFocusMinutes / completedSessions.length : 0;

    const completionRate =
      sessions.length > 0 ? (completedSessions.length / sessions.length) * 100 : 0;

    return {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      cancelledSessions: cancelledSessions.length,
      totalFocusMinutes: Math.round(totalFocusMinutes),
      totalPauseMinutes: Math.round(totalPauseMinutes),
      averageFocusMinutes: Math.round(averageFocusMinutes),
      completionRate: Math.round(completionRate),
    };
  }

  /**
   * 验证会话描述
   *
   * @param description - 会话描述
   * @throws Error - 如果描述无效
   */
  validateDescription(description: string | null | undefined): void {
    if (description && description.length > 500) {
      throw new Error('会话描述不能超过 500 个字符');
    }
  }

  /**
   * 创建专注周期（协调聚合根创建逻辑）
   *
   * @param params - 创建参数
   * @param goal - 关联的目标（可选，由 ApplicationService 查询后传入）
   * @returns 新创建的专注周期聚合根（未持久化）
   */
  createFocusSession(
    params: {
      accountUuid: string;
      goalUuid?: string | null;
      durationMinutes: number;
      description?: string | null;
    },
    goal?: Goal | null,
  ): FocusSession {
    // 1. 验证时长
    this.validateDuration(params.durationMinutes);

    // 2. 验证描述
    this.validateDescription(params.description);

    // 3. 验证关联目标（如果提供）
    if (params.goalUuid && goal) {
      this.validateAssociatedGoal(goal, params.accountUuid);
    }

    // 4. 创建聚合根（通过工厂方法）
    const session = FocusSession.create({
      accountUuid: params.accountUuid,
      goalUuid: params.goalUuid || null,
      durationMinutes: params.durationMinutes,
      description: params.description || null,
    });

    // 5. 返回聚合根（不持久化）
    return session;
  }
}
