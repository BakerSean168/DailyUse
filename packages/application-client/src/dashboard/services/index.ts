/**
 * Dashboard Module Services
 */

// Statistics
export { GetDashboardStatistics, getDashboardStatistics } from './get-dashboard-statistics';
export { RefreshDashboardStatistics, refreshDashboardStatistics } from './refresh-dashboard-statistics';

// Config
export { GetDashboardConfig, getDashboardConfig } from './get-dashboard-config';
export { UpdateDashboardConfig, updateDashboardConfig } from './update-dashboard-config';
export type { UpdateDashboardConfigInput } from './update-dashboard-config';
export { ResetDashboardConfig, resetDashboardConfig } from './reset-dashboard-config';
