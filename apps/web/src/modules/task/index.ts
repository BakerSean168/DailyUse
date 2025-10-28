/**
 * Task Web Module
 * 任务Web模块导出
 */

// 导出应用层
export * from './application/index';

// 导出基础设施层 API 客户端
export * from './infrastructure/api/index';

// 导出 Store
export { useTaskStore } from './presentation/stores/taskStore';

// 导出模块服务获取函数（便捷别名）
export {
  taskTemplateApplicationService as getTaskTemplateService,
  taskInstanceApplicationService as getTaskInstanceService,
  taskStatisticsApplicationService as getTaskStatisticsService,
  taskSyncApplicationService as getTaskSyncService,
} from './application/index';

// 导出初始化任务
export { registerTaskInitializationTasks } from './initialization';

/**
 * 初始化Task模块
 */
export function initializeTaskModule(): void {
  console.log('✅ Task 模块已初始化');
}
