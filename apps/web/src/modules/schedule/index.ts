/**
 * Schedule Web Module
 * 调度Web模块导出
 */

// 导出应用层服务
export {
  ScheduleWebApplicationService,
  scheduleWebApplicationService,
} from './services/ScheduleWebApplicationService';

// 便捷别名（向后兼容）
export { scheduleWebApplicationService as getScheduleWebService } from './services/ScheduleWebApplicationService';

// 导出基础设施层 API 客户端
export * from './infrastructure/api/index';

// 导出路由
export { scheduleRoutes } from './router';

// 导出组件
export * from './presentation/components';

// 导出 composables
export { useSchedule } from './presentation/composables/useSchedule';

// 导出初始化
export { registerScheduleInitializationTasks } from './initialization/scheduleInitialization';
