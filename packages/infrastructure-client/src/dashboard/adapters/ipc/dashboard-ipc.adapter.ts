/**
 * Dashboard IPC Adapter
 *
 * IPC implementation of IDashboardApiClient for Electron desktop app.
 */

import type { IDashboardApiClient } from '../../ports/dashboard-api-client.port';
import type { IpcClient } from '../../../shared/ipc-client.types';
import type {
  DashboardStatisticsClientDTO,
  DashboardConfigClientDTO,
} from '@dailyuse/contracts/dashboard';

/**
 * Dashboard IPC Adapter
 *
 * Implements IDashboardApiClient using Electron IPC.
 */
export class DashboardIpcAdapter implements IDashboardApiClient {
  private readonly channel = 'dashboard';

  constructor(private readonly ipcClient: IpcClient) {}

  // ===== Statistics =====

  async getStatistics(): Promise<DashboardStatisticsClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:statistics:get`);
  }

  async refreshStatistics(): Promise<DashboardStatisticsClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:statistics:refresh`);
  }

  // ===== Config =====

  async getConfig(): Promise<DashboardConfigClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:config:get`);
  }

  async updateConfig(config: Partial<DashboardConfigClientDTO>): Promise<DashboardConfigClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:config:update`, config);
  }

  async resetConfig(): Promise<DashboardConfigClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:config:reset`);
  }
}
