/**
 * BreeExecutionEngine - Bree 调度引擎实现
 * 
 * 职责：
 * - 实现 IScheduleExecutionEngine 接口
 * - 封装 Bree 库的具体调用
 * - 将 ScheduleTask 转换为 Bree JobOptions
 * 
 * 架构位置：基础设施层（Infrastructure Layer）
 */

import Bree from 'bree';
import type { JobOptions } from 'bree';
import path from 'path';
import {
  type IScheduleExecutionEngine,
  type TaskExecutionContext,
  ScheduleTask,
} from '@dailyuse/domain-server';

/**
 * Bree 执行引擎配置
 */
export interface BreeExecutionEngineConfig {
  /**
   * Worker 脚本目录路径
   */
  workerPath: string;

  /**
   * 是否启用详细日志
   */
  verbose?: boolean;

  /**
   * 默认时区
   */
  timezone?: string;

  /**
   * Worker 超时时间（毫秒）
   */
  workerTimeout?: number;
}

/**
 * BreeExecutionEngine - Bree 调度引擎实现
 */
export class BreeExecutionEngine implements IScheduleExecutionEngine {
  private bree: Bree | null = null;
  private config: BreeExecutionEngineConfig;
  private isRunning = false;
  private activeTasks = new Map<string, ScheduleTask>();

  constructor(config: BreeExecutionEngineConfig) {
    this.config = config;
  }

  /**
   * 初始化并启动调度引擎
   */
  async start(tasks: ScheduleTask[]): Promise<void> {
    if (this.isRunning) {
      console.warn('⚠️  BreeExecutionEngine is already running');
      return;
    }

    console.log('🚀 Starting BreeExecutionEngine...');

    // 转换任务为 Bree job 配置
    const jobs: JobOptions[] = tasks.map((task) => this.toJobOptions(task));

    // 初始化 Bree
    this.bree = new Bree({
      root: this.config.workerPath,
      jobs,
      defaultExtension: 'js', // Worker 会被编译为 JS
      timezone: this.config.timezone ?? 'Asia/Shanghai',
      errorHandler: this.handleError.bind(this),
      workerMessageHandler: this.handleWorkerMessage.bind(this),
      logger: this.config.verbose
        ? console
        : {
            info: () => {},
            warn: console.warn,
            error: console.error,
          },
      outputWorkerMetadata: true,
    });

    // 记录活跃任务
    tasks.forEach((task) => this.activeTasks.set(task.uuid, task));

    // 启动引擎
    await this.bree.start();
    this.isRunning = true;

    console.log(`✅ BreeExecutionEngine started with ${tasks.length} tasks`);
  }

  /**
   * 停止调度引擎
   */
  async stop(): Promise<void> {
    if (!this.isRunning || !this.bree) {
      console.warn('⚠️  BreeExecutionEngine is not running');
      return;
    }

    console.log('⏹️  Stopping BreeExecutionEngine...');

    await this.bree.stop();
    this.bree = null;
    this.isRunning = false;
    this.activeTasks.clear();

    console.log('✅ BreeExecutionEngine stopped');
  }

  /**
   * 添加新的调度任务
   */
  async addTask(task: ScheduleTask): Promise<void> {
    if (!this.bree) {
      throw new Error('BreeExecutionEngine is not started');
    }

    // 检查任务状态
    if (task.status !== 'active') {
      console.warn(`⚠️  Task ${task.uuid} is not active, skipping`);
      return;
    }

    // 添加到 Bree
    const jobOptions = this.toJobOptions(task);
    await this.bree.add(jobOptions);
    await this.bree.start(task.uuid);

    // 记录活跃任务
    this.activeTasks.set(task.uuid, task);

    console.log(`✅ Added task ${task.uuid} to execution engine`);
  }

  /**
   * 移除调度任务
   */
  async removeTask(taskId: string): Promise<void> {
    if (!this.bree) {
      throw new Error('BreeExecutionEngine is not started');
    }

    // 从 Bree 移除
    await this.bree.remove(taskId);

    // 从活跃任务移除
    this.activeTasks.delete(taskId);

    console.log(`✅ Removed task ${taskId} from execution engine`);
  }

  /**
   * 暂停任务
   */
  async pauseTask(taskId: string): Promise<void> {
    if (!this.bree) {
      throw new Error('BreeExecutionEngine is not started');
    }

    await this.bree.stop(taskId);
    console.log(`⏸️  Paused task ${taskId}`);
  }

  /**
   * 恢复任务
   */
  async resumeTask(taskId: string): Promise<void> {
    if (!this.bree) {
      throw new Error('BreeExecutionEngine is not started');
    }

    await this.bree.start(taskId);
    console.log(`▶️  Resumed task ${taskId}`);
  }

  /**
   * 立即执行任务（忽略调度时间）
   */
  async runTask(taskId: string): Promise<void> {
    if (!this.bree) {
      throw new Error('BreeExecutionEngine is not started');
    }

    await this.bree.run(taskId);
    console.log(`🏃 Manually triggered task ${taskId}`);
  }

  /**
   * 获取活跃任务列表
   */
  getActiveTasks(): ScheduleTask[] {
    return Array.from(this.activeTasks.values());
  }

  /**
   * 检查引擎是否运行中
   */
  isEngineRunning(): boolean {
    return this.isRunning;
  }

  /**
   * 将 ScheduleTask 转换为 Bree JobOptions
   */
  private toJobOptions(task: ScheduleTask): JobOptions {
    const scheduleConfig = task.schedule;
    const metadata = task.metadata.toDTO();

    // 构建执行上下文
    const context: TaskExecutionContext = {
      taskId: task.uuid,
      accountUuid: task.accountUuid,
      sourceModule: task.sourceModule,
      sourceEntityId: task.sourceEntityId,
      metadata: {
        priority: metadata.priority,
        tags: metadata.tags,
        customData: metadata.customData,
      },
      executedAt: Date.now(),
    };

    // 基础配置
    const jobOptions: JobOptions = {
      name: task.uuid,
      path: path.join(this.config.workerPath, 'schedule-worker.js'),
      worker: {
        workerData: context,
      },
      timeout: this.config.workerTimeout ?? 60000, // 默认 60 秒
    };

    // 调度配置
    const dto = scheduleConfig.toDTO();

    if (dto.cronExpression) {
      // Cron 表达式调度
      jobOptions.cron = dto.cronExpression;
    } else if (dto.intervalMs) {
      // 间隔调度
      jobOptions.interval = `${dto.intervalMs}ms`;
    } else if (dto.date) {
      // 一次性调度
      jobOptions.date = new Date(dto.date);
    }

    // 时区
    if (dto.timezone) {
      jobOptions.timezone = dto.timezone;
    }

    return jobOptions;
  }

  /**
   * 处理 Worker 错误
   */
  private handleError(error: Error, workerMetadata?: any): void {
    console.error('❌ Worker error:', error);
    if (workerMetadata) {
      console.error('   Task:', workerMetadata.name);
    }

    // TODO: 记录到执行历史，触发重试逻辑
  }

  /**
   * 处理 Worker 消息
   */
  private handleWorkerMessage(message: any, workerMetadata?: any): void {
    console.log('📨 Worker message:', message);
    if (workerMetadata) {
      console.log('   Task:', workerMetadata.name);
    }

    // TODO: 处理执行结果，更新统计信息
  }
}
