/**
 * Task Composables - Barrel Export
 * 任务模块组合式函数 - 统一导出
 *
 * 按照 DDD 应用服务层的拆分方式组织：
 * - ONE_TIME Task Composables: 一次性任务相关
 * - RECURRING Task Composables: 循环任务相关
 * - Shared Composables: 共享功能
 */

// ===== ONE_TIME Task Composables =====

// 一次性任务管理
export { useOneTimeTask } from './useOneTimeTask';

// 任务仪表板
export { useTaskDashboard } from './useTaskDashboard';

// 批量操作
export { useTaskBatchOperations } from './useTaskBatchOperations';

// ===== RECURRING Task Composables =====

// 任务模板（循环任务）
export { useTaskTemplate, useTaskTemplateData } from './useTaskTemplate';

// 任务实例
export { useTaskInstance, useTaskInstanceData } from './useTaskInstance';

// ===== Shared Composables =====

// 数据同步
export { useTaskSync, useTaskSyncStatus } from './useTaskSync';

// 统计数据
export { useTaskStatistics, useTaskStatisticsData } from './useTaskStatistics';

// 表单相关
export { useTaskTemplateForm } from './useTaskTemplateForm';
