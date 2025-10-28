/**
 * Reminder 模块初始化任务
 * 参考 Goal 模块架构，遵循新的开发规范
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';
import {
  initializeReminderModule,
  getReminderTemplateService,
} from '../index';
import { useReminderStore } from '../presentation/stores/reminderStore';

/**
 * 注册 Reminder 模块的初始化任务
 */
export function registerReminderInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // Reminder 模块基础初始化任务
  const reminderModuleInitTask: InitializationTask = {
    name: 'reminder-module',
    phase: InitializationPhase.APP_STARTUP,
    priority: 30, // 在Goal模块之后初始化
    initialize: async () => {
      console.log('📔 [Reminder] 开始初始化 Reminder 模块...');

      try {
        // 延迟一小段时间，确保 Pinia 完全初始化
        await new Promise((resolve) => setTimeout(resolve, 100));

        // 只初始化 Reminder 模块
        await initializeReminderModule();
        console.log('✅ [Reminder] Reminder 模块初始化完成');
      } catch (error) {
        console.error('❌ [Reminder] Reminder 模块初始化失败:', error);
        // 不抛出错误，允许应用继续启动
        console.warn('Reminder 模块初始化失败，但应用将继续启动');
      }
    },
    cleanup: async () => {
      console.log('🧹 [Reminder] 清理 Reminder 模块数据...');

      try {
        const store = useReminderStore();

        // 清空所有数据
        store.clearAll();
        console.log('✅ [Reminder] Reminder 模块数据清理完成');
      } catch (error) {
        console.error('❌ [Reminder] Reminder 模块清理失败:', error);
      }
    },
  };

  // 用户登录时的 Reminder 数据同步任务
  const reminderUserDataSyncTask: InitializationTask = {
    name: 'reminder-user-data-sync',
    phase: InitializationPhase.USER_LOGIN,
    priority: 20,
    initialize: async (context?: { accountUuid?: string }) => {
      console.log(`📔 [Reminder] 开始用户登录数据同步: ${context?.accountUuid || 'unknown'}`);

      try {
        // 初始化模块（如果需要）
        await initializeReminderModule();

        // 获取 ReminderTemplates
        console.log('📥 [Reminder] 获取 ReminderTemplate 列表...');
        try {
          const templates = await getReminderTemplateService.getReminderTemplates({
            limit: 100,
          });
          console.log(`✅ [Reminder] 成功获取 ${templates.length} 个 ReminderTemplate`);
        } catch (error) {
          console.warn('⚠️ [Reminder] 获取 ReminderTemplate 失败，继续初始化', error);
        }

        console.log(`✅ [Reminder] 用户登录数据同步完成: ${context?.accountUuid || 'unknown'}`);
      } catch (error) {
        console.error(
          `❌ [Reminder] 用户登录数据同步失败: ${context?.accountUuid || 'unknown'}`,
          error,
        );
        // 数据同步失败不应阻止用户登录
        console.warn('Reminder 数据同步失败，但用户登录将继续');
      }
    },
    cleanup: async () => {
      console.log('🧹 [Reminder] 清理用户数据...');

      try {
        const store = useReminderStore();
        store.clearAll();
        console.log('✅ [Reminder] 用户数据清理完成');
      } catch (error) {
        console.error('❌ [Reminder] 用户数据清理失败:', error);
      }
    },
  };

  // 注册任务
  manager.registerTask(reminderModuleInitTask);
  manager.registerTask(reminderUserDataSyncTask);

  console.log('📝 [Reminder] 初始化任务已注册');
}
