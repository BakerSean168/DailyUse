/**
 * RateLimit 值对象
 * 频率限制 - 不可变值对象
 */

import type { NotificationContracts } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type IRateLimit = NotificationContracts.RateLimitServerDTO;
type RateLimitPersistenceDTO = NotificationContracts.RateLimitPersistenceDTO;
type RateLimitClientDTO = NotificationContracts.RateLimitClientDTO;

/**
 * RateLimit 值对象
 */
export class RateLimit extends ValueObject implements IRateLimit {
  public readonly enabled: boolean;
  public readonly maxPerHour: number;
  public readonly maxPerDay: number;

  constructor(params: { enabled: boolean; maxPerHour: number; maxPerDay: number }) {
    super();

    this.enabled = params.enabled;
    this.maxPerHour = params.maxPerHour;
    this.maxPerDay = params.maxPerDay;

    // 确保不可变
    Object.freeze(this);
  }

  /**
   * 创建修改后的新实例
   */
  public with(
    changes: Partial<{
      enabled: boolean;
      maxPerHour: number;
      maxPerDay: number;
    }>,
  ): RateLimit {
    return new RateLimit({
      enabled: changes.enabled ?? this.enabled,
      maxPerHour: changes.maxPerHour ?? this.maxPerHour,
      maxPerDay: changes.maxPerDay ?? this.maxPerDay,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof RateLimit)) {
      return false;
    }

    return (
      this.enabled === other.enabled &&
      this.maxPerHour === other.maxPerHour &&
      this.maxPerDay === other.maxPerDay
    );
  }

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): IRateLimit {
    return {
      enabled: this.enabled,
      maxPerHour: this.maxPerHour,
      maxPerDay: this.maxPerDay,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): RateLimitClientDTO {
    return {
      enabled: this.enabled,
      maxPerHour: this.maxPerHour,
      maxPerDay: this.maxPerDay,
      limitText: this.enabled ? `每小时${this.maxPerHour}次，每天${this.maxPerDay}次` : '无限制',
    };
  }

  /**
   * 转换为 Persistence DTO
   */
  public toPersistenceDTO(): RateLimitPersistenceDTO {
    return {
      enabled: this.enabled,
      maxPerHour: this.maxPerHour,
      maxPerDay: this.maxPerDay,
    };
  }

  /**
   * 转换为 Contract 接口 (兼容旧代码)
   */
  public toContract(): IRateLimit {
    return this.toServerDTO();
  }

  /**
   * 从 Server DTO 创建值对象
   */
  public static fromServerDTO(dto: IRateLimit): RateLimit {
    return new RateLimit(dto);
  }

  /**
   * 从 Contract 接口创建值对象 (兼容旧代码)
   */
  public static fromContract(rateLimit: IRateLimit): RateLimit {
    return RateLimit.fromServerDTO(rateLimit);
  }

  /**
   * 创建默认配置
   */
  public static createDefault(): RateLimit {
    return new RateLimit({
      enabled: false,
      maxPerHour: 10,
      maxPerDay: 100,
    });
  }
}
