/**
 * DashboardConfig Memory Repository
 *
 * In-memory implementation of IDashboardConfigRepository for testing.
 */

import type { IDashboardConfigRepository } from '../../ports/dashboard-config-repository.port';
import type { DashboardConfig } from '@dailyuse/domain-server/dashboard';

/**
 * DashboardConfig Memory Repository
 *
 * In-memory implementation for testing purposes.
 */
export class DashboardConfigMemoryRepository implements IDashboardConfigRepository {
  private configs = new Map<string, DashboardConfig>(); // keyed by accountUuid

  async findByAccountUuid(accountUuid: string): Promise<DashboardConfig | null> {
    return this.configs.get(accountUuid) ?? null;
  }

  async save(config: DashboardConfig): Promise<DashboardConfig> {
    const cfg = config as any;
    this.configs.set(cfg.accountUuid, config);
    return config;
  }

  async delete(accountUuid: string): Promise<void> {
    this.configs.delete(accountUuid);
  }

  async exists(accountUuid: string): Promise<boolean> {
    return this.configs.has(accountUuid);
  }

  // Test helpers
  clear(): void {
    this.configs.clear();
  }

  seed(configs: DashboardConfig[]): void {
    configs.forEach((c: any) => this.configs.set(c.accountUuid, c));
  }
}
