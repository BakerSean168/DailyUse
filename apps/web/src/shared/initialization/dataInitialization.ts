/**
 * 数据初始化任务注册
 * Data Initialization Tasks
 * 
 * 负责在用户登录后加载应用数据（Goals、Tasks、Reminders等）
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';
import { searchDataProvider } from '../services/SearchDataProvider';

/**
 * 注册数据初始化任务
 */
export function registerDataInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // ========== USER_LOGIN 阶段：用户数据加载 ==========
  const userDataLoadTask: InitializationTask = {
    name: 'user-data-load',
    phase: InitializationPhase.USER_LOGIN,
    priority: 50, // 较低优先级，在核心服务初始化后加载
    initialize: async (context) => {
      console.log(`📦 [DataInit] 开始加载用户数据: ${context?.accountUuid}`);

      try {
        // 加载搜索数据（Goals、Tasks、Reminders）
        await searchDataProvider.loadData(true); // forceRefresh = true

        console.log('✅ [DataInit] 用户数据加载完成');
      } catch (error) {
        console.error('❌ [DataInit] 用户数据加载失败:', error);
        // 数据加载失败不应该阻止用户登录
      }
    },
    cleanup: async (context) => {
      console.log(`🧹 [DataInit] 清理用户数据缓存: ${context?.accountUuid}`);

      try {
        // 清除搜索数据缓存
        searchDataProvider.clearCache();

        console.log('✅ [DataInit] 用户数据缓存已清理');
      } catch (error) {
        console.error('❌ [DataInit] 用户数据缓存清理失败:', error);
      }
    },
  };

  // 注册任务
  manager.registerTask(userDataLoadTask);

  console.log('📝 [DataInit] 数据初始化任务已注册');
}
