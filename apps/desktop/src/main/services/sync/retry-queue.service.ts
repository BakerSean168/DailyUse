/**
 * Retry Queue Service
 * 
 * EPIC-004: Offline Sync - 指数退避重试
 * STORY-020: Network Sync Layer
 * 
 * 职责：
 * - 管理失败操作的重试队列
 * - 实现指数退避算法
 * - 限制最大重试次数
 */

export interface RetryTask<T = unknown> {
  id: string;
  task: () => Promise<T>;
  retryCount: number;
  maxRetries: number;
  lastAttemptAt: number;
  nextAttemptAt: number;
  error?: Error;
}

export interface RetryQueueConfig {
  /** 基础延迟（毫秒），默认 1000 */
  baseDelay?: number;
  /** 最大延迟（毫秒），默认 32000 */
  maxDelay?: number;
  /** 最大重试次数，默认 5 */
  maxRetries?: number;
  /** 延迟倍数，默认 2 */
  backoffMultiplier?: number;
}

export class RetryQueueService {
  private queue: Map<string, RetryTask> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private readonly baseDelay: number;
  private readonly maxDelay: number;
  private readonly maxRetries: number;
  private readonly backoffMultiplier: number;

  constructor(config: RetryQueueConfig = {}) {
    this.baseDelay = config.baseDelay || 1000; // 1s
    this.maxDelay = config.maxDelay || 32000; // 32s
    this.maxRetries = config.maxRetries || 5;
    this.backoffMultiplier = config.backoffMultiplier || 2;
  }

  /**
   * 计算下次重试延迟（指数退避）
   * 
   * 重试次数 | 延迟
   * 1       | 1s
   * 2       | 2s
   * 3       | 4s
   * 4       | 8s
   * 5       | 16s
   */
  calculateDelay(retryCount: number): number {
    const delay = this.baseDelay * Math.pow(this.backoffMultiplier, retryCount - 1);
    return Math.min(delay, this.maxDelay);
  }

  /**
   * 添加任务到重试队列
   */
  async enqueue<T>(
    id: string,
    task: () => Promise<T>,
    onSuccess?: (result: T) => void,
    onFailure?: (error: Error) => void
  ): Promise<void> {
    // 如果已存在，不重复添加
    if (this.queue.has(id)) {
      console.log(`[RetryQueue] Task ${id} already in queue`);
      return;
    }

    const retryTask: RetryTask<T> = {
      id,
      task,
      retryCount: 0,
      maxRetries: this.maxRetries,
      lastAttemptAt: Date.now(),
      nextAttemptAt: Date.now(),
    };

    this.queue.set(id, retryTask);
    
    // 立即尝试执行
    this.executeWithRetry(id, task, onSuccess, onFailure);
  }

  /**
   * 执行任务（带重试）
   */
  private async executeWithRetry<T>(
    id: string,
    task: () => Promise<T>,
    onSuccess?: (result: T) => void,
    onFailure?: (error: Error) => void
  ): Promise<void> {
    const retryTask = this.queue.get(id);
    if (!retryTask) return;

    retryTask.retryCount++;
    retryTask.lastAttemptAt = Date.now();

    try {
      console.log(`[RetryQueue] Executing task ${id} (attempt ${retryTask.retryCount}/${retryTask.maxRetries})`);
      const result = await task();
      
      // 成功，从队列移除
      this.remove(id);
      console.log(`[RetryQueue] Task ${id} succeeded`);
      onSuccess?.(result);
    } catch (error) {
      retryTask.error = error as Error;
      console.warn(`[RetryQueue] Task ${id} failed:`, error);

      if (retryTask.retryCount >= retryTask.maxRetries) {
        // 超过最大重试次数
        console.error(`[RetryQueue] Task ${id} exceeded max retries (${retryTask.maxRetries})`);
        this.remove(id);
        onFailure?.(error as Error);
      } else {
        // 安排下次重试
        const delay = this.calculateDelay(retryTask.retryCount);
        retryTask.nextAttemptAt = Date.now() + delay;
        
        console.log(`[RetryQueue] Task ${id} will retry in ${delay}ms`);
        
        const timer = setTimeout(() => {
          this.executeWithRetry(id, task, onSuccess, onFailure);
        }, delay);
        
        this.timers.set(id, timer);
      }
    }
  }

  /**
   * 从队列移除任务
   */
  remove(id: string): boolean {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    return this.queue.delete(id);
  }

  /**
   * 获取队列中的任务数
   */
  size(): number {
    return this.queue.size;
  }

  /**
   * 获取所有待重试任务
   */
  getPendingTasks(): RetryTask[] {
    return Array.from(this.queue.values());
  }

  /**
   * 清空队列
   */
  clear(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.queue.clear();
    console.log('[RetryQueue] Queue cleared');
  }

  /**
   * 检查任务是否在队列中
   */
  has(id: string): boolean {
    return this.queue.has(id);
  }

  /**
   * 获取任务信息
   */
  getTask(id: string): RetryTask | undefined {
    return this.queue.get(id);
  }
}
