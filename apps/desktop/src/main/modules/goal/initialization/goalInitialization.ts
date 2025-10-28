import {
  InitializationTask,
  InitializationPhase,
  InitializationManager,
} from '../../../shared/initialization/initializationManager';
import { GoalEventHandlers } from '../application/events/goalEventHandlers';
import { MainGoalApplicationService } from '../application/services/mainGoalApplicationService';
import { registerGoalIpcHandlers } from '../infrastructure/ipcs/goalIpcHandlers';

const goalSystemGoalFoldersInitializationTask: InitializationTask = {
  name: 'goal-system-goal-dirs',
  phase: InitializationPhase.USER_LOGIN,
  priority: 10,
  dependencies: [],
  initialize: async (context: { accountUuid: string }) => {
    const service = await MainGoalApplicationService.getInstance();
    await service.initializeSystemGoalFolders(context.accountUuid);
  },
};

/**
 * Goal 模块初始化任务定义
 */

const goalEventHandlersInitializationTask: InitializationTask = {
  name: 'goal-event-handlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 50,
  dependencies: ['notification'],
  initialize: async () => {
    GoalEventHandlers.registerHandlers();
    console.log('✓ Goal event handlers initialized');
  },
  cleanup: async () => {
    GoalEventHandlers.cleanup();
    console.log('✓ Goal event handlers cleaned up');
  },
};

/**
 * 注册 Goal 模块的 IPC 处理器
 */
const registerGoalIpcHandlersTask: InitializationTask = {
  name: 'register-goal-ipc-handlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 60,
  initialize: async () => {
    registerGoalIpcHandlers();
    console.log('✓ Goal IPC handlers registered');
  },
  cleanup: async () => {
    // 如果需要，可以在这里添加清理逻辑
    console.log('✓ Goal IPC handlers cleanup (if needed)');
  },
};

/**
 * 注册 Goal 模块的所有初始化任务
 */
export function registerGoalInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  manager.registerTask(goalEventHandlersInitializationTask);
  manager.registerTask(registerGoalIpcHandlersTask);
  manager.registerTask(goalSystemGoalFoldersInitializationTask);

  console.log('🚀【主进程::Goal 模块】初始化任务注册完成');
}
