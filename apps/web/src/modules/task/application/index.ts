/**
 * Task Web Application Layer
 * 任务Web应用层导出
 */

// 导出应用服务类和单例实例
export {
  TaskTemplateApplicationService,
  taskTemplateApplicationService,
} from './services/TaskTemplateApplicationService';

export {
  TaskInstanceApplicationService,
  taskInstanceApplicationService,
} from './services/TaskInstanceApplicationService';

export {
  TaskStatisticsApplicationService,
  taskStatisticsApplicationService,
} from './services/TaskStatisticsApplicationService';

export {
  TaskSyncApplicationService,
  taskSyncApplicationService,
} from './services/TaskSyncApplicationService';

// 导出其他服务（不是单例的工具服务）
export { TaskAutoStatusService } from './services/TaskAutoStatusService';
export { TaskCriticalPathService } from './services/TaskCriticalPathService';
export { TaskDependencyDragDropService } from './services/TaskDependencyDragDropService';
export { TaskDependencyGraphService } from './services/TaskDependencyGraphService';
export { TaskDependencyValidationService } from './services/TaskDependencyValidationService';
