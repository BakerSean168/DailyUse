/**
 * Dashboard DI Container - 仪表板模块依赖注入容器
 * 
 * @module renderer/modules/dashboard/infrastructure/di
 */

import {
  RendererContainer,
  createServiceToken,
  ModuleName,
} from '@/renderer/shared/infrastructure/di';

import {
  DashboardIPCClient,
  dashboardIPCClient,
} from '../ipc/dashboard.ipc-client';

// ============ Service Tokens ============

export const DashboardTokens = {
  DashboardIPCClient: createServiceToken<DashboardIPCClient>('dashboard:ipc-client'),
} as const;

// ============ Container ============

/**
 * Dashboard Container - 仪表板模块容器
 */
export class DashboardContainer extends RendererContainer {
  readonly moduleName = ModuleName.Dashboard;

  protected registerServices(): void {
    // Register IPC Clients
    this.registerInstance(DashboardTokens.DashboardIPCClient, dashboardIPCClient);
  }

  // ============ Service Accessors ============

  get dashboardIPCClient(): DashboardIPCClient {
    return this.get(DashboardTokens.DashboardIPCClient);
  }
}
