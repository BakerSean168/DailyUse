/**
 * Get Quota Service
 *
 * 获取配额应用服务
 */

import type { IAIUsageQuotaRepository } from '@dailyuse/domain-server/ai';
import type { QuotaResponse } from '@dailyuse/contracts/ai';
import { QuotaResetPeriod } from '@dailyuse/contracts/ai';
import { AIContainer } from '../AIContainer';

/**
 * Get Quota Input
 */
export interface GetQuotaInput {
  accountUuid: string;
}

/**
 * Get Quota Output
 */
export type GetQuotaOutput = QuotaResponse;

/**
 * Get Quota Service
 */
export class GetQuota {
  private static instance: GetQuota;

  private constructor(private readonly quotaRepository: IAIUsageQuotaRepository) {}

  static createInstance(quotaRepository?: IAIUsageQuotaRepository): GetQuota {
    const container = AIContainer.getInstance();
    const repo = quotaRepository || container.getUsageQuotaRepository();
    GetQuota.instance = new GetQuota(repo);
    return GetQuota.instance;
  }

  static getInstance(): GetQuota {
    if (!GetQuota.instance) {
      GetQuota.instance = GetQuota.createInstance();
    }
    return GetQuota.instance;
  }

  static resetInstance(): void {
    GetQuota.instance = undefined as unknown as GetQuota;
  }

  async execute(input: GetQuotaInput): Promise<GetQuotaOutput> {
    const quota = await this.quotaRepository.findByAccountUuid(input.accountUuid);

    if (!quota) {
      // 返回默认配额
      const now = Date.now();
      const nextReset = now + 30 * 24 * 60 * 60 * 1000;
      return {
        quota: {
          uuid: '',
          accountUuid: input.accountUuid,
          quotaLimit: 1000,
          currentUsage: 0,
          resetPeriod: QuotaResetPeriod.MONTHLY,
          lastResetAt: now,
          nextResetAt: nextReset,
          createdAt: now,
          updatedAt: now,
          remainingQuota: 1000,
          usagePercentage: 0,
          isExceeded: false,
          formattedResetPeriod: 'Monthly',
        },
      };
    }

    // 如果 quota 有 toClientDTO 方法则使用，否则直接返回
    const quotaDTO =
      typeof (quota as any).toClientDTO === 'function'
        ? (quota as any).toClientDTO()
        : (quota as any);

    return {
      quota: quotaDTO,
    };
  }
}

export const getQuota = (input: GetQuotaInput): Promise<GetQuotaOutput> =>
  GetQuota.getInstance().execute(input);
