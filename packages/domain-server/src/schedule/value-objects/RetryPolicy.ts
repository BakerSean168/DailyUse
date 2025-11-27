/**
 * RetryPolicy 值对象
 * 重试策略 - 不可变值对象
 */

import { ValueObject } from '@dailyuse/utils';
import { ScheduleContracts } from '@dailyuse/contracts';

type RetryPolicyServerDTO = ScheduleContracts.RetryPolicyServerDTO;
type RetryPolicyClientDTO = ScheduleContracts.RetryPolicyClientDTO;
type RetryPolicyPersistenceDTO = ScheduleContracts.RetryPolicyPersistenceDTO;

/**
 * RetryPolicy 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 可以自由复制和替换
 */
export class RetryPolicy extends ValueObject implements ScheduleContracts.RetryPolicyServer {
  public readonly enabled: boolean;
  public readonly maxRetries: number;
  public readonly retryDelay: number;
  public readonly backoffMultiplier: number;
  public readonly maxRetryDelay: number;

  constructor(params: {
    enabled: boolean;
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
    maxRetryDelay: number;
  }) {
    super();

    this.enabled = params.enabled;
    this.maxRetries = params.maxRetries;
    this.retryDelay = params.retryDelay;
    this.backoffMultiplier = params.backoffMultiplier;
    this.maxRetryDelay = params.maxRetryDelay;

    // 验证配置
    this.validate();

    // 确保不可变
    Object.freeze(this);
  }

  /**
   * 验证配置有效性
   */
  private validate(): void {
    if (this.maxRetries < 0) {
      throw new Error('Max retries must be non-negative');
    }
    if (this.retryDelay < 0) {
      throw new Error('Retry delay must be non-negative');
    }
    if (this.backoffMultiplier < 1) {
      throw new Error('Backoff multiplier must be >= 1');
    }
    if (this.maxRetryDelay < this.retryDelay) {
      throw new Error('Max retry delay must be >= retry delay');
    }
  }

  /**
   * 判断是否应该重试
   */
  public shouldRetry(currentRetryCount: number): boolean {
    if (!this.enabled) {
      return false;
    }
    return currentRetryCount < this.maxRetries;
  }

  /**
   * 计算下次重试延迟（指数退避）
   */
  public calculateNextRetryDelay(currentRetryCount: number): number {
    if (!this.enabled || currentRetryCount >= this.maxRetries) {
      return 0;
    }

    // 指数退避算法
    const delay = this.retryDelay * Math.pow(this.backoffMultiplier, currentRetryCount);

    // 限制最大延迟
    return Math.min(delay, this.maxRetryDelay);
  }

  /**
   * 创建修改后的新实例
   */
  public with(
    changes: Partial<{
      enabled: boolean;
      maxRetries: number;
      retryDelay: number;
      backoffMultiplier: number;
      maxRetryDelay: number;
    }>,
  ): RetryPolicy {
    return new RetryPolicy({
      enabled: changes.enabled ?? this.enabled,
      maxRetries: changes.maxRetries ?? this.maxRetries,
      retryDelay: changes.retryDelay ?? this.retryDelay,
      backoffMultiplier: changes.backoffMultiplier ?? this.backoffMultiplier,
      maxRetryDelay: changes.maxRetryDelay ?? this.maxRetryDelay,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof RetryPolicy)) {
      return false;
    }

    return (
      this.enabled === other.enabled &&
      this.maxRetries === other.maxRetries &&
      this.retryDelay === other.retryDelay &&
      this.backoffMultiplier === other.backoffMultiplier &&
      this.maxRetryDelay === other.maxRetryDelay
    );
  }

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): RetryPolicyServerDTO {
    return {
      enabled: this.enabled,
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay,
      backoffMultiplier: this.backoffMultiplier,
      maxRetryDelay: this.maxRetryDelay,
      retryableStatuses: [], // TODO: 支持配置可重试状态
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): RetryPolicyClientDTO {
    return {
      enabled: this.enabled,
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay,
      backoffMultiplier: this.backoffMultiplier,
      maxRetryDelay: this.maxRetryDelay,
      retryableStatuses: [],
      // UI 辅助属性
      summary: this.enabled 
        ? `最多重试 ${this.maxRetries} 次，初始延迟 ${this.retryDelay}ms`
        : '不重试',
    };
  }

  /**
   * 转换为持久化 DTO
   */
  public toPersistenceDTO(): RetryPolicyPersistenceDTO {
    return {
      enabled: this.enabled,
      maxRetries: this.maxRetries,
      retry_delay: this.retryDelay,
      backoff_multiplier: this.backoffMultiplier,
      max_retry_delay: this.maxRetryDelay,
    };
  }

  /**
   * 从 Server DTO 创建值对象
   */
  public static fromServerDTO(dto: RetryPolicyServerDTO): RetryPolicy {
    return new RetryPolicy({
      enabled: dto.enabled,
      maxRetries: dto.maxRetries,
      retryDelay: dto.retryDelay,
      backoffMultiplier: dto.backoffMultiplier,
      maxRetryDelay: dto.maxRetryDelay,
    });
  }

  /**
   * 从 DTO 创建值对象 (兼容旧代码)
   */
  public static fromDTO(dto: any): RetryPolicy {
    return new RetryPolicy(dto);
  }

  /**
   * 创建默认重试策略
   */
  public static createDefault(): RetryPolicy {
    return new RetryPolicy({
      enabled: true,
      maxRetries: 3,
      retryDelay: 5000, // 5 秒
      backoffMultiplier: 2,
      maxRetryDelay: 60000, // 60 秒
    });
  }

  /**
   * 创建禁用重试的策略
   */
  public static createDisabled(): RetryPolicy {
    return new RetryPolicy({
      enabled: false,
      maxRetries: 0,
      retryDelay: 0,
      backoffMultiplier: 1,
      maxRetryDelay: 0,
    });
  }
}
