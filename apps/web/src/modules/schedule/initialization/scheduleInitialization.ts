/**
 * Schedule 模块初始化任务注册
 * @description 为 schedule 模块注册初始化任务到应用级别的初始化管理器中
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';

export function registerScheduleInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // 🎨 立即注册 Dashboard Widgets（不等待初始化阶段）
  console.log('🎨 [Schedule] 注册 Schedule Widgets（立即执行）...');
  import('../presentation/widgets/registerScheduleWidgets').then(({ registerScheduleWidgets }) => {
    registerScheduleWidgets();
    console.log('✅ [Schedule] Schedule Widgets 注册完成');
  });

  // Schedule 模块基础初始化任务
  const scheduleModuleInitTask: InitializationTask = {
    name: 'schedule-module',
    phase: InitializationPhase.APP_STARTUP,
    priority: 35,
    initialize: async () => {
      console.log('📅 [Schedule] 开始初始化 Schedule 模块...');

      try {
        // 延迟一小段时间，确保 Pinia 完全初始化
        await new Promise((resolve) => setTimeout(resolve, 100));
       
        console.log('✅ [Schedule] Schedule 模块初始化完成');
      } catch (error) {
        console.error('❌ [Schedule] Schedule 模块初始化失败:', error);
        console.warn('Schedule 模块初始化失败，但应用将继续启动');
      }
    },
    cleanup: async () => {
      console.log('🧹 [Schedule] 清理 Schedule 模块数据...');
    },
  };

  manager.registerTask(scheduleModuleInitTask);
  console.log('📝 [Schedule] Schedule 模块初始化任务已注册');
}

