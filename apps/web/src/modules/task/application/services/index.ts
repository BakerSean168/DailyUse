/**
 * Task Application Services - Barrel Export
 * 任务应用服务层 - 统一导出
 *
 * 按照 DDD 应用服务层最佳实践：
 * - 每个服务专注于一个业务能力/用例
 * - 不是按聚合根划分（避免出现 God Service）
 * - 清晰的职责分离
 */

export * from './TaskTemplateApplicationService';
export * from './TaskInstanceApplicationService';
export * from './TaskSyncApplicationService';
export * from './TaskStatisticsApplicationService';

// 便捷导入：导出所有单例实例
export { taskTemplateApplicationService } from './TaskTemplateApplicationService';
export { taskInstanceApplicationService } from './TaskInstanceApplicationService';
export { taskSyncApplicationService } from './TaskSyncApplicationService';
export { taskStatisticsApplicationService } from './TaskStatisticsApplicationService';
