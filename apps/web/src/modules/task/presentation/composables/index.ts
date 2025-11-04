/**
 * Task Composables - Barrel Export
 * 任务模块组合式函数 - 统一导出
 *
 * 按照 DDD 应用服务层的拆分方式组织：
 * - Task Template Composables: 任务模板相关（包括 ONE_TIME 和 RECURRING 类型）
 * - Task Instance Composables: 任务实例相关
 * - Shared Composables: 共享功能
 */

// ===== Task Template Composables =====

// 任务模板（包括一次性和循环任务）
export { useTaskTemplate, useTaskTemplateData } from './useTaskTemplate';

// 任务仪表板
export { useTaskDashboard } from './useTaskDashboard';

// 批量操作
export { useTaskBatchOperations } from './useTaskBatchOperations';

// ===== Task Instance Composables =====

// 任务实例
export { useTaskInstance, useTaskInstanceData } from './useTaskInstance';

// ===== Shared Composables =====

// 数据同步
export { useTaskSync, useTaskSyncStatus } from './useTaskSync';

// 统计数据
export { useTaskStatistics, useTaskStatisticsData } from './useTaskStatistics';

// 表单相关
export { useTaskTemplateForm } from './useTaskTemplateForm';
