/**
 * Dashboard Module Exports
 * Dashboard 模块 - 显式导出
 */

// ============ Enums ============
export { WidgetSize, WidgetSizeText } from './enums';

// ============ Value Objects ============
export type { WidgetConfigDTO, WidgetConfigClient, WidgetConfigServer } from './value-objects';

// ============ Aggregates ============
export type {
  DashboardConfigClientDTO,
  DashboardConfigClient,
  DashboardConfigClientFactory,
} from './aggregates/DashboardConfigClient';

export type {
  DashboardConfigServerDTO,
  DashboardConfigPersistenceDTO,
  DashboardConfigServer,
  DashboardConfigServerFactory,
  WidgetConfigData,
} from './aggregates/DashboardConfigServer';

// ============ Legacy (保持向后兼容) ============
export type { DashboardSummary, DashboardStatisticsClientDTO } from './DashboardStatisticsClient';
