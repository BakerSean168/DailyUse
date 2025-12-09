/**
 * Dashboard Module - Renderer
 *
 * 仪表盘模块 - 渲染进程
 * 遵循 DDD 分层架构
 */

// ===== Application Layer =====
export { DashboardApplicationService, dashboardApplicationService } from './application/services';

// ===== Presentation Layer =====
export {
  useDashboard,
  type DashboardState,
  type UseDashboardReturn,
} from './presentation/hooks';

// ===== Initialization =====
export { registerDashboardModule, initializeDashboardModule } from './initialization';
