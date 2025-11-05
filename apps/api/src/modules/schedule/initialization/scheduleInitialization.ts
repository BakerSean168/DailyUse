import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';
import { ScheduleEventPublisher } from '../application/services/ScheduleEventPublisher';
import { ScheduleExecutionService } from '../application/services/ScheduleExecutionService';

/**
 * Schedule 模块初始化任务
 * 负责在应用启动时注册所有必要的事件监听器
 */
const scheduleEventHandlersInitTask: InitializationTask = {
  name: 'scheduleEventHandlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 25, // 在 Goal(20), Task(20), Reminder(20) 之后初始化
  initialize: async () => {
    await ScheduleEventPublisher.initialize();
    console.log('✓ Schedule event handlers initialized');
  },
};

/**
 * Schedule 执行引擎初始化任务
 * 负责启动 Bree 调度引擎并加载活跃任务
 */
const scheduleExecutionEngineInitTask: InitializationTask = {
  name: 'scheduleExecutionEngine',
  phase: InitializationPhase.APP_STARTUP,
  priority: 30, // 在事件处理器之后初始化
  initialize: async () => {
    const executionService = ScheduleExecutionService.getInstance();
    await executionService.initialize();
    console.log('✓ Schedule execution engine initialized');
  },
};

/**
 * 注册 Schedule 模块的初始化任务
 */
export function registerScheduleInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // 注册事件处理器初始化任务
  manager.registerTask(scheduleEventHandlersInitTask);
  
  // 注册执行引擎初始化任务
  manager.registerTask(scheduleExecutionEngineInitTask);

  console.log('Schedule module initialization tasks registered');
}
