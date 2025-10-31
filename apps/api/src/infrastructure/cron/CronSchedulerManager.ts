import * as cron from 'node-cron';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('CronSchedulerManager');

/**
 * Cron Job 配置
 */
export interface CronJobConfig {
  name: string;
  schedule: string; // Cron 表达式
  task: () => Promise<void>;
  enabled?: boolean;
  timezone?: string;
}

/**
 * 内部 Job 存储结构
 */
interface StoredJob {
  task: cron.ScheduledTask;
  config: CronJobConfig;
}

interface CronJobStatus {
  name: string;
  schedule: string;
  enabled: boolean;
  timezone?: string;
}

/**
 * Cron 调度管理器
 * 
 * 职责:
 * - 统一管理所有 Cron Jobs
 * - 启动/停止/暂停 Jobs
 * - 监控 Job 执行状态
 * - 错误处理和重试
 * 
 * 支持的 Cron 表达式格式 (分钟 小时 日期 月份 星期):
 * 分钟: 0 - 59
 * 小时: 0 - 23
 * 日期: 1 - 31
 * 月份: 1 - 12
 * 星期: 0 - 7 (0 和 7 都代表星期日)
 * 
 * 示例:
 * 每天凌晨 2:00 -> 0 2 星号 星号 星号
 * 每 5 分钟 -> 星号斜杠5 星号 星号 星号 星号
 * 每周日午夜 -> 0 0 星号 星号 0
 * 每月 1 号午夜 -> 0 0 1 星号 星号
 */
export class CronSchedulerManager {
  private static instance: CronSchedulerManager;
  private jobs: Map<string, StoredJob> = new Map();
  private isStarted: boolean = false;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): CronSchedulerManager {
    if (!CronSchedulerManager.instance) {
      CronSchedulerManager.instance = new CronSchedulerManager();
    }
    return CronSchedulerManager.instance;
  }

  /**
   * 注册 Cron Job
   */
  register(config: CronJobConfig): void {
    if (this.jobs.has(config.name)) {
      logger.warn(`Cron job ${config.name} already registered, skipping`);
      return;
    }

    // 验证 cron 表达式
    if (!cron.validate(config.schedule)) {
      throw new Error(`Invalid cron expression: ${config.schedule}`);
    }

    logger.info('Registering cron job', {
      name: config.name,
      schedule: config.schedule,
      enabled: config.enabled ?? true,
      timezone: config.timezone,
    });

    // 创建包装任务(添加错误处理和日志)
    const wrappedTask = async () => {
      const startTime = Date.now();
      logger.info(`[${config.name}] Starting execution`);

      try {
        await config.task();
        const duration = Date.now() - startTime;
        logger.info(`[${config.name}] Completed successfully`, {
          duration: `${(duration / 1000).toFixed(2)}s`,
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`[${config.name}] Execution failed`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: `${(duration / 1000).toFixed(2)}s`,
        });
        // 不抛出错误,避免影响其他 Jobs
      }
    };

    // 创建 cron 任务(但不启动)
    const task = cron.schedule(config.schedule, wrappedTask, {
      timezone: config.timezone || 'Asia/Shanghai',
    });
    
    // 立即停止,等待统一启动
    task.stop();

    this.jobs.set(config.name, { task, config });

    logger.info(`Cron job ${config.name} registered successfully`);
  }

  /**
   * 启动所有已注册的 Jobs
   */
  start(): void {
    if (this.isStarted) {
      logger.warn('Cron scheduler already started');
      return;
    }

    logger.info('Starting cron scheduler...');

    let startedCount = 0;
    let skippedCount = 0;

    for (const [name, { task, config }] of Array.from(this.jobs.entries())) {
      if (config.enabled !== false) {
        task.start();
        startedCount++;
        logger.info(`[${name}] Started (schedule: ${config.schedule})`);
      } else {
        skippedCount++;
        logger.info(`[${name}] Skipped (disabled)`);
      }
    }

    this.isStarted = true;

    logger.info('Cron scheduler started', {
      totalJobs: this.jobs.size,
      started: startedCount,
      skipped: skippedCount,
    });
  }

  /**
   * 停止所有 Jobs
   */
  stop(): void {
    if (!this.isStarted) {
      logger.warn('Cron scheduler not started');
      return;
    }

    logger.info('Stopping cron scheduler...');

    let stoppedCount = 0;

    for (const [name, { task }] of Array.from(this.jobs.entries())) {
      task.stop();
      stoppedCount++;
      logger.info(`[${name}] Stopped`);
    }

    this.isStarted = false;

    logger.info('Cron scheduler stopped', {
      totalJobs: this.jobs.size,
      stopped: stoppedCount,
    });
  }

  /**
   * 启动指定的 Job
   */
  startJob(name: string): void {
    const job = this.jobs.get(name);
    if (!job) {
      throw new Error(`Cron job ${name} not found`);
    }

    job.task.start();
    logger.info(`[${name}] Started manually`);
  }

  /**
   * 停止指定的 Job
   */
  stopJob(name: string): void {
    const job = this.jobs.get(name);
    if (!job) {
      throw new Error(`Cron job ${name} not found`);
    }

    job.task.stop();
    logger.info(`[${name}] Stopped manually`);
  }

  /**
   * 手动触发指定的 Job
   */
  async triggerJob(name: string): Promise<void> {
    const job = this.jobs.get(name);
    if (!job) {
      throw new Error(`Cron job ${name} not found`);
    }

    logger.info(`[${name}] Triggering manually...`);
    await job.config.task();
  }

  /**
   * 获取所有任务的状态
   */
  public getStatus(): CronJobStatus[] {
    const status: CronJobStatus[] = [];
    for (const [name, { task, config }] of Array.from(this.jobs.entries())) {
      status.push({
        name,
        schedule: config.schedule,
        enabled: config.enabled !== false,
        timezone: config.timezone,
      });
    }
    return status;
  }

  /**
   * 注销指定的 Job
   */
  unregister(name: string): void {
    const job = this.jobs.get(name);
    if (!job) {
      logger.warn(`Cron job ${name} not found, skipping unregister`);
      return;
    }

    job.task.stop();
    this.jobs.delete(name);
    logger.info(`[${name}] Unregistered`);
  }

  /**
   * 清空所有 Jobs
   */
  clear(): void {
    this.stop();
    this.jobs.clear();
    logger.info('All cron jobs cleared');
  }
}
