/**
 * Task 模块初始化任务
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';
import {
  initializeTaskModule,
  getTaskTemplateService,
  getTaskSyncService,
} from '../index';
import { useTaskStore } from '../presentation/stores/taskStore';

/**
 * 注册 Task 模块的初始化任务
 */
export function registerTaskInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // Task 模块基础初始化任务
  const taskModuleInitTask: InitializationTask = {
    name: 'task-module',
    phase: InitializationPhase.APP_STARTUP,
    priority: 25, // 在Goal模块之后初始化
    initialize: async () => {
      console.log('📋 [Task] 开始初始化 Task 模块...');

      try {
        // 延迟一小段时间，确保 Pinia 完全初始化
        await new Promise((resolve) => setTimeout(resolve, 100));

        // 只初始化 Task 模块
        await initializeTaskModule();
        console.log('✅ [Task] Task 模块初始化完成');
      } catch (error) {
        console.error('❌ [Task] Task 模块初始化失败:', error);
        // 不抛出错误，允许应用继续启动
        console.warn('Task 模块初始化失败，但应用将继续启动');
      }
    },
    cleanup: async () => {
      console.log('🧹 [Task] 清理 Task 模块数据...');

      try {
        const store = useTaskStore();

        // 清空所有数据
        store.clearAll();
        console.log('✅ [Task] Task 模块数据清理完成');
      } catch (error) {
        console.error('❌ [Task] Task 模块清理失败:', error);
      }
    },
  };

  // 用户登录时的 Task 数据同步任务
  const taskUserDataSyncTask: InitializationTask = {
    name: 'task-user-data-sync',
    phase: InitializationPhase.USER_LOGIN,
    priority: 20, // 在Goal模块之后同步
    initialize: async (context?: { accountUuid?: string }) => {
      console.log(`🔄 [Task] 同步用户 Task 数据: ${context?.accountUuid || 'unknown'}`);

      try {
        // 1. 初始化模块
        await initializeTaskModule();

        // 2. 获取 TaskTemplates（包含 instances）
        console.log('📥 [Task] 获取 TaskTemplate 列表（包含 instances）...');
        try {
          const templates = await getTaskTemplateService.getTaskTemplates({
            limit: 100,
          });
          console.log(`✅ [Task] 成功获取 ${templates.length} 个 TaskTemplate`);
        } catch (error) {
          console.warn('⚠️ [Task] 获取 TaskTemplate 失败，继续初始化', error);
        }

        console.log('✅ [Task] 用户 Task 数据同步完成');
      } catch (error) {
        console.error('❌ [Task] 用户 Task 数据同步失败:', error);
        // 不抛出错误，允许其他模块继续初始化
      }
    },
    cleanup: async () => {
      console.log('🧹 [Task] 清理用户 Task 数据...');

      try {
        const store = useTaskStore();

        // 清空用户相关的任务数据
        store.clearAll();
        console.log('✅ [Task] 用户 Task 数据清理完成');
      } catch (error) {
        console.error('❌ [Task] 用户 Task 数据清理失败:', error);
      }
    },
  };

  // 注册任务
  manager.registerTask(taskModuleInitTask);
  manager.registerTask(taskUserDataSyncTask);

  console.log('✅ [Task] 已注册 Task 模块初始化任务');
}
