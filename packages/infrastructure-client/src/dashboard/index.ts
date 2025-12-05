/**
 * Dashboard Module - Infrastructure Client
 *
 * Exports:
 * - Container: DashboardContainer
 * - Ports: IDashboardApiClient
 * - Adapters: HTTP and IPC implementations
 */

// Container
export { DashboardContainer, DashboardDependencyKeys } from './dashboard.container';

// Ports
export type { IDashboardApiClient } from './ports';

// Adapters
export { DashboardHttpAdapter } from './adapters/http';
export { DashboardIpcAdapter } from './adapters/ipc';
