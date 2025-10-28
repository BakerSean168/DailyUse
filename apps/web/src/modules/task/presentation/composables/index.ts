/**
 * Task Composables - Barrel Export
 * 任务模块组合式函数 - 统一导出
 *
 * 按照 DDD 应用服务层的拆分方式组织：
 * - useTaskTemplate: 任务模板相关
 * - useTaskInstance: 任务实例相关
 * - useTaskSync: 数据同步相关
 * - useTaskStatistics: 统计数据相关
 */

// 任务模板
export { useTaskTemplate, useTaskTemplateData } from './useTaskTemplate';

// 任务实例
export { useTaskInstance, useTaskInstanceData } from './useTaskInstance';

// 数据同步
export { useTaskSync, useTaskSyncStatus } from './useTaskSync';

// 统计数据
export { useTaskStatistics, useTaskStatisticsData } from './useTaskStatistics';

// 工具函数
export { useTaskUtils } from './useTaskUtils';

// 表单相关
export { useTaskTemplateForm } from './useTaskTemplateForm';
