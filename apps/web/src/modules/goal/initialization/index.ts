/**
 * Goal 模块初始化任务
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';
import {
  initializeGoalModule,
  getGoalManagementService,
} from '../index';
import { useGoalStore } from '../presentation/stores/goalStore';

/**
 * 注册 Goal 模块的初始化任务
 */
export function registerGoalInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // Goal 模块基础初始化任务
  const goalModuleInitTask: InitializationTask = {
    name: 'goal-module',
    phase: InitializationPhase.APP_STARTUP,
    priority: 20, // 在基础设施之后初始化
    initialize: async () => {
      console.log('🎯 [Goal] 开始初始化 Goal 模块...');

      try {
        // 只初始化 Goal 模块
        await initializeGoalModule();
        console.log('✅ [Goal] Goal 模块初始化完成');
      } catch (error) {
        console.error('❌ [Goal] Goal 模块初始化失败:', error);
        throw error;
      }
    },
    cleanup: async () => {
      console.log('🧹 [Goal] 清理 Goal 模块数据...');

      try {
        const store = useGoalStore();

        // 清空所有数据
        store.clearAll();
        console.log('✅ [Goal] Goal 模块数据清理完成');
      } catch (error) {
        console.error('❌ [Goal] Goal 模块清理失败:', error);
      }
    },
  };

  // 用户登录时的 Goal 数据同步任务
  const goalUserDataSyncTask: InitializationTask = {
    name: 'goal-user-data-sync',
    phase: InitializationPhase.USER_LOGIN,
    priority: 15,
    initialize: async (context?: { accountUuid?: string }) => {
      console.log(`🔄 [Goal] 同步用户 Goal 数据: ${context?.accountUuid || 'unknown'}`);

      try {
        // 初始化模块（如果需要）
        await initializeGoalModule();

        // 获取 Goals
        console.log('📥 [Goal] 获取 Goal 列表...');
        try {
          const goals = await getGoalManagementService.getGoals({ limit: 100 });
          console.log(`✅ [Goal] 成功获取 ${goals.length} 个 Goal`);
        } catch (error) {
          console.warn('⚠️ [Goal] 获取 Goal 失败，继续初始化', error);
        }

        console.log('✅ [Goal] 用户 Goal 数据同步完成');
      } catch (error) {
        console.error('❌ [Goal] 用户 Goal 数据同步失败:', error);
        // 不抛出错误，允许其他模块继续初始化
      }
    },
    cleanup: async () => {
      console.log('🧹 [Goal] 清理用户 Goal 数据...');

      try {
        const store = useGoalStore();

        // 清空用户相关的目标数据
        store.clearAll();
        console.log('✅ [Goal] 用户 Goal 数据清理完成');
      } catch (error) {
        console.error('❌ [Goal] 用户 Goal 数据清理失败:', error);
      }
    },
  };

  manager.registerTask(goalModuleInitTask);
  manager.registerTask(goalUserDataSyncTask);

  console.log('📝 [Goal] Goal 模块初始化任务已注册');
}
