/**
 * Dashboard HTTP Adapter
 *
 * HTTP implementation of IDashboardApiClient.
 */

import type { IDashboardApiClient } from '../../ports/dashboard-api-client.port';
import type { HttpClient } from '../../../shared/http-client.types';
import type {
  DashboardStatisticsClientDTO,
  DashboardConfigClientDTO,
} from '@dailyuse/contracts/dashboard';

/**
 * Dashboard HTTP Adapter
 *
 * Implements IDashboardApiClient using HTTP REST API calls.
 */
export class DashboardHttpAdapter implements IDashboardApiClient {
  private readonly baseUrl = '/dashboard';

  constructor(private readonly httpClient: HttpClient) {}

  // ===== Statistics =====

  async getStatistics(): Promise<DashboardStatisticsClientDTO> {
    return this.httpClient.get(`${this.baseUrl}/statistics`);
  }

  async refreshStatistics(): Promise<DashboardStatisticsClientDTO> {
    return this.httpClient.post(`${this.baseUrl}/statistics/refresh`);
  }

  // ===== Config =====

  async getConfig(): Promise<DashboardConfigClientDTO> {
    return this.httpClient.get(`${this.baseUrl}/config`);
  }

  async updateConfig(config: Partial<DashboardConfigClientDTO>): Promise<DashboardConfigClientDTO> {
    return this.httpClient.patch(`${this.baseUrl}/config`, config);
  }

  async resetConfig(): Promise<DashboardConfigClientDTO> {
    return this.httpClient.post(`${this.baseUrl}/config/reset`);
  }
}
