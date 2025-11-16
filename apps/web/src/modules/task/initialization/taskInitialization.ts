/**
 * Task 模块前端初始化
 * 注册智能同步服务
 */

import { taskInstanceSyncService } from '../services/taskInstanceSyncService';
import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';

/**
 * 注册 Task 模块的初始化任务
 */
export function registerTaskInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // Task 智能同步服务初始化任务
  const taskSyncTask: InitializationTask = {
    name: 'task-instance-sync',
    phase: InitializationPhase.USER_LOGIN,
    priority: 17, // 在 SSE 连接（priority 15）之后
    initialize: async (context) => {
      console.log(`🔄 [Task] 初始化任务实例智能同步服务: ${context?.accountUuid}`);

      try {
        // 初始化同步服务
        taskInstanceSyncService.initialize();
        
        console.log('✅ [Task] 任务实例智能同步服务已启动');
        console.log('📊 [Task] 加载策略：');
        console.log('  - P0（立即）: 今天的实例');
        console.log('  - P1（预加载）: 本周其他天');
        console.log('  - P2（按需）: 未来几周');
      } catch (error) {
        console.error('❌ [Task] 初始化智能同步服务失败:', error);
        throw error;
      }
    },
    cleanup: async () => {
      console.log('🧹 [Task] 清理任务实例智能同步服务');
      taskInstanceSyncService.dispose();
    },
  };

  manager.registerTask(taskSyncTask);

  console.log('📝 [Task] Task 模块初始化任务已注册');
}
