import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';
import { ScheduleEventPublisher } from '../application/services/ScheduleEventPublisher';
import { ScheduleBootstrap } from '../application/services/ScheduleBootstrap';
import { registerScheduleEventListeners } from '../../notification/application/event-handlers/ScheduleTaskTriggeredHandler';

/**
 * Schedule 模块初始化任务
 * 负责在应用启动时注册所有必要的事件监听器
 */
const scheduleEventHandlersInitTask: InitializationTask = {
  name: 'scheduleEventHandlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 25, // 在 Goal(20), Task(20), Reminder(20) 之后初始化
  initialize: async () => {
    // 1. 注册领域事件发布器（Schedule 内部事件）
    await ScheduleEventPublisher.initialize();
    
    // 2. 注册跨模块事件监听器（Schedule → Notification）
    registerScheduleEventListeners();
    
    console.log('✓ Schedule event handlers initialized');
  },
};

/**
 * Schedule CronJobManager 初始化任务
 * 负责启动 node-cron 调度引擎并从数据库加载活跃任务
 */
const scheduleCronJobInitTask: InitializationTask = {
  name: 'scheduleCronJob',
  phase: InitializationPhase.APP_STARTUP,
  priority: 30, // 在事件处理器之后初始化
  initialize: async () => {
    const bootstrap = await ScheduleBootstrap.getInstance();
    await bootstrap.initialize();
    console.log('✓ Schedule CronJobManager initialized');
  },
};

/**
 * 注册 Schedule 模块的初始化任务
 */
export function registerScheduleInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // 1. 注册事件处理器初始化任务
  manager.registerTask(scheduleEventHandlersInitTask);
  
  // 2. 注册 CronJobManager 初始化任务
  manager.registerTask(scheduleCronJobInitTask);

  console.log('Schedule module initialization tasks registered');
}
