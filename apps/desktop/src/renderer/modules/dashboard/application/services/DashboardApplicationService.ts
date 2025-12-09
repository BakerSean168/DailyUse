/**
 * Dashboard Application Service - Renderer
 *
 * 仪表盘应用服务 - 渲染进程
 */

import {
  // Statistics
  getDashboardStatistics,
  refreshDashboardStatistics,
  // Config
  getDashboardConfig,
  updateDashboardConfig,
  resetDashboardConfig,
  // Types
  type UpdateDashboardConfigInput,
} from '@dailyuse/application-client';
import type {
  DashboardStatisticsClientDTO,
  DashboardConfigClientDTO,
} from '@dailyuse/contracts/dashboard';

/**
 * Dashboard Application Service
 */
export class DashboardApplicationService {
  private static instance: DashboardApplicationService;

  private constructor() {}

  static getInstance(): DashboardApplicationService {
    if (!DashboardApplicationService.instance) {
      DashboardApplicationService.instance = new DashboardApplicationService();
    }
    return DashboardApplicationService.instance;
  }

  // ===== Statistics Operations =====

  async getDashboardStatistics(): Promise<DashboardStatisticsClientDTO> {
    return getDashboardStatistics();
  }

  async refreshDashboardStatistics(): Promise<DashboardStatisticsClientDTO> {
    return refreshDashboardStatistics();
  }

  // ===== Config Operations =====

  async getDashboardConfig(): Promise<DashboardConfigClientDTO> {
    return getDashboardConfig();
  }

  async updateDashboardConfig(input: UpdateDashboardConfigInput): Promise<DashboardConfigClientDTO> {
    return updateDashboardConfig(input);
  }

  async resetDashboardConfig(): Promise<DashboardConfigClientDTO> {
    return resetDashboardConfig();
  }
}

// Singleton instance
export const dashboardApplicationService = DashboardApplicationService.getInstance();
