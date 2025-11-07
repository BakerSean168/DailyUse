/**
 * Theme Module Initialization
 * 主题模块初始化
 */

import {
  InitializationPhase,
  type InitializationTask,
  InitializationManager,
} from '@dailyuse/utils';
import { ThemeApplicationService } from '../application/services/ThemeApplicationService';

/**
 * 注册主题模块初始化任务
 */
export function registerThemeInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // APP_STARTUP 阶段：初始化主题（最高优先级，在用户设置加载前）
  const themeInitTask: InitializationTask = {
    name: 'theme-init',
    phase: InitializationPhase.APP_STARTUP,
    priority: 5, // 高优先级，最先执行
    initialize: async () => {
      console.log('🎨 [Theme] 初始化主题模块...');
      
      try {
        const themeService = ThemeApplicationService.getInstance();
        await themeService.initialize();
        console.log('✅ [Theme] 主题模块初始化完成');
      } catch (error) {
        console.error('❌ [Theme] 主题模块初始化失败:', error);
        // 不抛出错误，使用默认主题
      }
    },
    cleanup: async () => {
      console.log('🧹 [Theme] 清理主题模块...');
      const themeService = ThemeApplicationService.getInstance();
      themeService.dispose();
    },
  };

  manager.registerTask(themeInitTask);

  console.log('📝 [Theme] 主题模块初始化任务已注册');
}
