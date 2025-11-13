/**
 * DashboardConfig Repository Interface
 * Dashboard 配置仓储接口
 */
import type { DashboardConfig } from '../aggregates/DashboardConfig';

/**
 * Dashboard 配置仓储接口
 */
export interface IDashboardConfigRepository {
  /**
   * 根据账户 UUID 查找配置
   */
  findByAccountUuid(accountUuid: string): Promise<DashboardConfig | null>;

  /**
   * 保存配置（新增或更新）
   */
  save(config: DashboardConfig): Promise<DashboardConfig>;

  /**
   * 删除配置
   */
  delete(accountUuid: string): Promise<void>;

  /**
   * 检查配置是否存在
   */
  exists(accountUuid: string): Promise<boolean>;
}
