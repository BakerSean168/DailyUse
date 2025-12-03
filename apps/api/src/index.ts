// Load environment variables FIRST before any other imports
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from apps/api directory
config({ path: resolve(__dirname, '../.env') });

import app from './app';
import { connectPrisma, disconnectPrisma, prisma } from './shared/infrastructure/config/prisma';
import { initializeApp } from './shared/initialization/initializer';
// import { ScheduleTaskScheduler } from './modules/schedule/infrastructure/scheduler/ScheduleTaskScheduler'; // DISABLED: Schedule module needs refactoring
// import { PriorityQueueScheduler } from './modules/schedule/infrastructure/scheduler/PriorityQueueScheduler'; // DISABLED: Schedule module needs refactoring
// import { sseController } from './modules/schedule/interface/http/SSEController'; // DISABLED: Schedule module needs refactoring
import { eventBus } from '@dailyuse/utils';
import { initializeLogger, getStartupInfo } from './shared/infrastructure/config/logger.config';
import { createLogger } from '@dailyuse/utils';
import {
  startFocusModeCronJob,
  stopFocusModeCronJob,
} from './modules/goal/infrastructure/cron/focusModeCronJob';
import {
  startReminderTriggerCronJob,
  stopReminderTriggerCronJob,
} from './modules/reminder/infrastructure/cron/reminderTriggerCronJob';
import { registerAllCronJobs, startCronScheduler, stopCronScheduler } from './shared/infrastructure/cron';
import { registerTaskEventListeners } from './modules/task/application/event-handlers/registerTaskEventListeners';

// 初始化日志系统
initializeLogger();
const logger = createLogger('API');

// 调度器配置：可通过环境变量切换
// USE_PRIORITY_QUEUE_SCHEDULER=true 启用优先队列调度器（推荐）
// USE_PRIORITY_QUEUE_SCHEDULER=false 使用传统轮询调度器
const USE_PRIORITY_QUEUE_SCHEDULER = process.env.USE_PRIORITY_QUEUE_SCHEDULER !== 'false'; // 默认启用

const PORT = process.env.PORT || 3888;

(async () => {
  try {
    logger.info('Starting DailyUse API server...', getStartupInfo());

    // Try to connect to database, but don't fail if it's unavailable
    try {
      await connectPrisma();
      logger.info('Database connected successfully');

      await initializeApp();
      logger.info('Application initialized successfully');
    } catch (dbError) {
      logger.warn('Database connection failed, starting in limited mode', dbError);
      logger.warn('Performance metrics endpoint will still be available');
    }

    // 🎯 注册事件处理器（事件驱动架构）
    // registerEventHandlers(prisma, sseController); // DISABLED: Schedule module needs refactoring
    // logger.info('Event handlers registered successfully');
    
    // 注册 Task 事件监听器
    registerTaskEventListeners();
    logger.info('✅ Task event listeners registered successfully');

    // 启动调度器（优先队列 vs 轮询）
    // DISABLED: Schedule module needs complete refactoring for new cron-based schema
    // if (USE_PRIORITY_QUEUE_SCHEDULER) {
    //   const scheduler = PriorityQueueScheduler.getInstance(prisma, eventBus);
    //   await scheduler.start();
    //   logger.info('✅ 优先队列调度器已启动', {
    //     type: 'PriorityQueue',
    //     mechanism: 'setTimeout',
    //     precision: '<100ms',
    //     status: scheduler.getStatus(),
    //   });
    // } else {
    //   const scheduler = ScheduleTaskScheduler.getInstance(prisma, eventBus);
    //   scheduler.start();
    //   logger.info('⚠️  传统轮询调度器已启动（不推荐）', {
    //     type: 'Polling',
    //     mechanism: 'cron',
    //     precision: '0-60s',
    //   });
    // }
    logger.warn(
      '⚠️ Schedule module is temporarily disabled - needs refactoring for new cron-based schema',
    );

    // 启动 FocusMode 自动过期调度器
    startFocusModeCronJob();
    logger.info('✅ FocusMode cron job started', {
      schedule: 'Hourly (0 * * * *)',
      timezone: 'Asia/Shanghai',
      description: 'Auto-deactivate expired focus cycles',
    });

    // 启动 Reminder 触发调度器
    await startReminderTriggerCronJob();
    logger.info('✅ Reminder trigger cron job started', {
      schedule: 'Every minute (* * * * *)',
      description: 'Trigger due reminder templates',
    });

    // 启动统一 Cron 调度器 (Smart Frequency 等)
    registerAllCronJobs();
    startCronScheduler();
    logger.info('✅ Unified cron scheduler started', {
      description: 'Smart Frequency Daily Analysis, etc.',
    });

    app.listen(PORT, () => {
      logger.info(`API server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
})();

process.on('SIGINT', async () => {
  logger.info('Received SIGINT signal, shutting down gracefully...');
  stopFocusModeCronJob();
  await stopReminderTriggerCronJob();
  stopCronScheduler();
  await disconnectPrisma();
  logger.info('Database disconnected');
  process.exit(0);
});
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM signal, shutting down gracefully...');
  stopFocusModeCronJob();
  stopCronScheduler();
  await disconnectPrisma();
  logger.info('Database disconnected');
  process.exit(0);
});
