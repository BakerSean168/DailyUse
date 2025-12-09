/**
 * Goal Module - Renderer
 *
 * 目标模块 - 渲染进程
 * 遵循 DDD 分层架构
 */

// ===== Application Layer =====
export { GoalApplicationService, goalApplicationService } from './application/services';

// ===== Presentation Layer =====
export {
  useGoal,
  useGoalFolder,
  type GoalState,
  type UseGoalReturn,
  type GoalFolderState,
  type UseGoalFolderReturn,
} from './presentation/hooks';

// ===== Initialization =====
export { registerGoalModule, initializeGoalModule } from './initialization';
