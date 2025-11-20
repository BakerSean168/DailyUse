import type { AIUsageQuotaServer } from '../aggregates/AIUsageQuotaServer';

export interface IAIUsageQuotaRepository {
  save(quota: AIUsageQuotaServer): Promise<void>;
  findByAccountUuid(accountUuid: string): Promise<AIUsageQuotaServer | null>;
  delete(uuid: string): Promise<void>;
}
