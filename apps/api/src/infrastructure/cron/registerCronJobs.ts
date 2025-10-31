import { CronSchedulerManager } from './CronSchedulerManager';
import { DailyAnalysisCronJob } from '../../modules/reminder/infrastructure/cron/dailyAnalysisCronJob';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('CronJobRegistration');

/**
 * 注册所有 Cron Jobs
 * 
 * 在应用启动时调用此函数来注册所有定时任务
 */
export function registerAllCronJobs(): void {
  logger.info('Registering all cron jobs...');

  const scheduler = CronSchedulerManager.getInstance();

  // ===== Reminder Module Jobs =====

  /**
   * Daily Analysis Cron Job
   * 
   * 功能: 每天分析所有提醒模板的效果,自动调整低效提醒的频率
   * 时间: 每天凌晨 2:00
   * 模块: Reminder - Smart Frequency
   */
  scheduler.register({
    name: 'reminder:daily-analysis',
    schedule: '0 2 * * *', // 每天凌晨 2:00
    task: async () => {
      const job = new DailyAnalysisCronJob();
      await job.execute();
    },
    enabled: process.env.ENABLE_DAILY_ANALYSIS !== 'false', // 默认启用
    timezone: process.env.TZ || 'Asia/Shanghai',
  });

  // ===== 未来可以在这里添加更多 Jobs =====

  // 示例: Schedule Module Jobs
  // scheduler.register({
  //   name: 'schedule:cleanup-expired',
  //   schedule: '0 3 * * *', // 每天凌晨 3:00
  //   task: async () => {
  //     // 清理过期的 Schedule 记录
  //   },
  //   enabled: true,
  // });

  // 示例: Task Module Jobs
  // scheduler.register({
  //   name: 'task:send-due-reminders',
  //   schedule: '*/30 * * * *', // 每 30 分钟
  //   task: async () => {
  //     // 发送即将到期的任务提醒
  //   },
  //   enabled: true,
  // });

  const status = scheduler.getStatus();
  logger.info('All cron jobs registered', {
    totalJobs: status.length,
    jobs: status.map((j) => `${j.name} (${j.schedule})`),
  });
}

/**
 * 启动 Cron 调度器
 * 
 * 在应用启动时调用此函数来启动所有已注册的定时任务
 */
export function startCronScheduler(): void {
  const scheduler = CronSchedulerManager.getInstance();
  scheduler.start();

  logger.info('Cron scheduler started', {
    status: scheduler.getStatus(),
  });
}

/**
 * 停止 Cron 调度器
 * 
 * 在应用关闭时调用此函数来停止所有定时任务
 */
export function stopCronScheduler(): void {
  const scheduler = CronSchedulerManager.getInstance();
  scheduler.stop();

  logger.info('Cron scheduler stopped');
}
