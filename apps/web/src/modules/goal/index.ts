/**
 * Goal 模块导出
 */

// ===== Application Layer =====
export * from './application/services';

// 便捷别名导出
export {
  goalManagementApplicationService as getGoalManagementService,
  goalFolderApplicationService as getGoalFolderService,
} from './application/services';

// ===== Presentation Layer =====
export { useGoalStore, getGoalStore } from './presentation/stores/goalStore';
export { useGoal } from './presentation/composables/useGoal';

// 导出初始化相关
export { registerGoalInitializationTasks } from './initialization';

// 导出类型
export type { GoalStore } from './presentation/stores/goalStore';

/**
 * 初始化 Goal 模块
 * 应用启动时调用此方法来加载所有目标数据
 */
export async function initializeGoalModule(): Promise<void> {
  try {
    console.log('正在初始化 Goal 模块...');
    // Goal 模块已拆分为多个服务，不再需要统一的初始化方法
    // 各个服务独立初始化
    console.log('Goal 模块初始化完成');
  } catch (error) {
    console.error('Goal 模块初始化失败:', error);
    throw error;
  }
}
