/**
 * DashboardConfig Prisma Repository
 *
 * Prisma implementation of IDashboardConfigRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 */

import type { IDashboardConfigRepository } from '../../ports/dashboard-config-repository.port';
import type { DashboardConfig } from '@dailyuse/domain-server/dashboard';

/**
 * DashboardConfig Prisma Repository
 *
 * Skeleton implementation - to be completed when extracting from apps/api.
 */
export class DashboardConfigPrismaRepository implements IDashboardConfigRepository {
  constructor(private readonly prisma: any) {}

  async findByAccountUuid(accountUuid: string): Promise<DashboardConfig | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async save(config: DashboardConfig): Promise<DashboardConfig> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async delete(accountUuid: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async exists(accountUuid: string): Promise<boolean> {
    throw new Error('Not implemented - extract from apps/api');
  }
}
