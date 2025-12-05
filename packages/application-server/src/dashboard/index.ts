/**
 * Dashboard Application Module (Server)
 *
 * 提供 Dashboard 模块的所有 Services
 */

// ===== Container (from infrastructure-server) =====
export { DashboardContainer, type IStatisticsCacheService } from '@dailyuse/infrastructure-server';

// ===== Services =====
export * from './services';
