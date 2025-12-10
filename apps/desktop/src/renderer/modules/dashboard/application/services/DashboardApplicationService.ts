/**
 * Dashboard Application Service - Renderer
 *
 * This service acts as a facade for dashboard-related operations in the renderer process.
 * It interfaces with the `@dailyuse/application-client` layer to communicate with the main process.
 *
 * @module renderer/modules/dashboard/application/services
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
 * Service class for managing Dashboard data and configuration.
 * Implements the Singleton pattern.
 */
export class DashboardApplicationService {
  private static instance: DashboardApplicationService;

  private constructor() {}

  /**
   * Retrieves the singleton instance of DashboardApplicationService.
   *
   * @returns {DashboardApplicationService} The singleton instance.
   */
  static getInstance(): DashboardApplicationService {
    if (!DashboardApplicationService.instance) {
      DashboardApplicationService.instance = new DashboardApplicationService();
    }
    return DashboardApplicationService.instance;
  }

  // ===== Statistics Operations =====

  /**
   * Fetches the current dashboard statistics.
   *
   * @returns {Promise<DashboardStatisticsClientDTO>} A promise that resolves to the statistics DTO.
   */
  async getDashboardStatistics(): Promise<DashboardStatisticsClientDTO> {
    return getDashboardStatistics();
  }

  /**
   * Forces a recalculation and refresh of the dashboard statistics.
   *
   * @returns {Promise<DashboardStatisticsClientDTO>} A promise that resolves to the updated statistics DTO.
   */
  async refreshDashboardStatistics(): Promise<DashboardStatisticsClientDTO> {
    return refreshDashboardStatistics();
  }

  // ===== Config Operations =====

  /**
   * Retrieves the current dashboard configuration.
   *
   * @returns {Promise<DashboardConfigClientDTO>} A promise that resolves to the configuration DTO.
   */
  async getDashboardConfig(): Promise<DashboardConfigClientDTO> {
    return getDashboardConfig();
  }

  /**
   * Updates the dashboard configuration.
   *
   * @param {UpdateDashboardConfigInput} input - The partial configuration to update.
   * @returns {Promise<DashboardConfigClientDTO>} A promise that resolves to the updated configuration DTO.
   */
  async updateDashboardConfig(input: UpdateDashboardConfigInput): Promise<DashboardConfigClientDTO> {
    return updateDashboardConfig(input);
  }

  /**
   * Resets the dashboard configuration to its default state.
   *
   * @returns {Promise<DashboardConfigClientDTO>} A promise that resolves to the default configuration DTO.
   */
  async resetDashboardConfig(): Promise<DashboardConfigClientDTO> {
    return resetDashboardConfig();
  }
}

// Singleton instance export
export const dashboardApplicationService = DashboardApplicationService.getInstance();
