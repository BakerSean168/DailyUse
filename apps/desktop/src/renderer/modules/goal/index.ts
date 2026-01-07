/**
 * Goal Module - Renderer
 *
 * 目标模块 - 渲染进程
 * 遵循 DDD 分层架构
 * 
 * EPIC-015 重构: 移除 State 类型导出
 */

// ===== Application Layer =====
export { GoalApplicationService, goalApplicationService } from './application/services';

// ===== Presentation Layer =====
export {
  useGoal,
  useGoalFolder,
  type UseGoalReturn,
  type UseGoalFolderReturn,
} from './presentation/hooks';

// ===== Initialization =====
export { registerGoalModule, initializeGoalModule } from './initialization';
