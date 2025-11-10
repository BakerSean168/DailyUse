/**
 * Quota Enforcement Service
 * 配额管理领域服务
 *
 * 职责：
 * - 检查配额可用性的业务逻辑
 * - 配额计算和验证规则
 * - 不注入仓储（由 ApplicationService 负责持久化）
 *
 * 注意：
 * - 当前简化实现，基于 DTO 操作
 * - 后续可扩展为完整聚合根模式（需创建 AIUsageQuota 聚合根类）
 */

import { AIContracts, QuotaResetPeriod } from '@dailyuse/contracts';
import { AIQuotaExceededError } from '../errors/AIErrors';

type AIUsageQuotaServerDTO = AIContracts.AIUsageQuotaServerDTO;

export class QuotaEnforcementService {
  constructor() {
    // 领域服务不注入仓储
  }

  /**
   * 检查配额是否充足（核心业务逻辑）
   *
   * @throws AIQuotaExceededError 如果配额不足
   */
  public checkQuota(quota: AIUsageQuotaServerDTO, requestedAmount: number = 1): void {
    // 1. 检查是否需要重置配额
    const now = Date.now();
    const needsReset = now >= quota.nextResetAt;

    let currentUsage = quota.currentUsage;
    if (needsReset) {
      currentUsage = 0; // 重置后使用量归零
    }

    // 2. 检查配额是否充足
    const availableQuota = quota.quotaLimit - currentUsage;
    if (availableQuota < requestedAmount) {
      throw new AIQuotaExceededError(
        quota.quotaLimit,
        currentUsage,
        new Date(needsReset ? this.calculateNextResetTime(now, quota.resetPeriod) : quota.nextResetAt),
      );
    }
  }

  /**
   * 计算配额消费后的新状态
   *
   * @returns 更新后的配额 DTO（不持久化）
   */
  public consumeQuota(
    quota: AIUsageQuotaServerDTO,
    amount: number = 1,
  ): AIUsageQuotaServerDTO {
    const now = Date.now();
    const needsReset = now >= quota.nextResetAt;

    return {
      ...quota,
      currentUsage: needsReset ? amount : quota.currentUsage + amount,
      lastResetAt: needsReset ? now : quota.lastResetAt,
      nextResetAt: needsReset ? this.calculateNextResetTime(now, quota.resetPeriod) : quota.nextResetAt,
      updatedAt: now,
    };
  }

  /**
   * 计算下次重置时间（业务规则）
   * @returns timestamp (number)
   */
  public calculateNextResetTime(from: number, period: QuotaResetPeriod): number {
    const next = new Date(from);
    switch (period) {
      case QuotaResetPeriod.DAILY:
        next.setDate(next.getDate() + 1);
        next.setHours(0, 0, 0, 0);
        break;
      case QuotaResetPeriod.WEEKLY:
        next.setDate(next.getDate() + (7 - next.getDay()));
        next.setHours(0, 0, 0, 0);
        break;
      case QuotaResetPeriod.MONTHLY:
        next.setMonth(next.getMonth() + 1);
        next.setDate(1);
        next.setHours(0, 0, 0, 0);
        break;
      default:
        throw new Error(`Unsupported reset period: ${period}`);
    }
    return next.getTime();
  }

  /**
   * 获取配额状态统计（业务计算）
   */
  public getQuotaStatus(quota: AIUsageQuotaServerDTO): {
    available: number;
    used: number;
    limit: number;
    usagePercentage: number;
    resetAt: Date;
    needsReset: boolean;
  } {
    const now = Date.now();
    const needsReset = now >= quota.nextResetAt;

    const currentUsage = needsReset ? 0 : quota.currentUsage;
    const available = quota.quotaLimit - currentUsage;
    const usagePercentage = quota.quotaLimit > 0 ? (currentUsage / quota.quotaLimit) * 100 : 0;

    return {
      available,
      used: currentUsage,
      limit: quota.quotaLimit,
      usagePercentage,
      resetAt: new Date(needsReset ? this.calculateNextResetTime(now, quota.resetPeriod) : quota.nextResetAt),
      needsReset,
    };
  }
}


