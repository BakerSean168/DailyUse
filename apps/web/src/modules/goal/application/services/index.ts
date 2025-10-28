/**
 * Goal Application Services
 * 按用例拆分的应用服务
 */

export {
  GoalManagementApplicationService,
  goalManagementApplicationService,
} from './GoalManagementApplicationService';

export {
  GoalFolderApplicationService,
  goalFolderApplicationService,
} from './GoalFolderApplicationService';

// 保留旧的导出用于向后兼容（如果需要）
export { GoalWebApplicationService } from './GoalWebApplicationService';

// Web Application Service 单例
export { goalWebApplicationService } from './GoalWebApplicationService';
