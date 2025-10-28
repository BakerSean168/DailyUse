/**
 * Infrastructure API 客户端导出
 * 创建 Task 模块的基础设施层 API 导出
 */

export {
  taskTemplateApiClient,
  taskInstanceApiClient,
  taskStatisticsApiClient,
} from './taskApiClient';

// 导出类型
export type {
  TaskTemplateApiClient,
  TaskInstanceApiClient,
  TaskStatisticsApiClient,
} from './taskApiClient';
