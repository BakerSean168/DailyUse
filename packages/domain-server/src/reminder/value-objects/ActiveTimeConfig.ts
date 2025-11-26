/**
 * ActiveTimeConfig 值对象
 * 生效时间配置 - 不可变值对象
 * 
 * 重构说明：
 * - 移除 endDate 字段（生效控制改由 ReminderTemplate.status 负责）
 * - startDate 重命名为 activatedAt（语义更清晰）
 * - activatedAt 作为循环提醒的计算基准
 */

import type {
  ActiveTimeConfigServerDTO,
  ActiveTimeConfigClientDTO,
  ActiveTimeConfigPersistenceDTO,
} from '@dailyuse/contracts/src/modules/reminder';
import { ValueObject } from '@dailyuse/utils';

/**
 * ActiveTimeConfig 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * 
 * @property activatedAt - 启动时间（最后一次启用的时间戳）
 */
export class ActiveTimeConfig extends ValueObject implements ActiveTimeConfigServerDTO {
  public readonly activatedAt: number;

  constructor(params: { activatedAt: number }) {
    super();

    this.activatedAt = params.activatedAt;

    // 确保不可变
    Object.freeze(this);
  }

  /**
   * 创建修改后的新实例
   */
  public with(
    changes: Partial<{
      activatedAt: number;
    }>,
  ): ActiveTimeConfig {
    return new ActiveTimeConfig({
      activatedAt: changes.activatedAt ?? this.activatedAt,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof ActiveTimeConfig)) {
      return false;
    }

    return this.activatedAt === other.activatedAt;
  }

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): ActiveTimeConfigServerDTO {
    return {
      activatedAt: this.activatedAt,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): ActiveTimeConfigClientDTO {
    const formatDate = (ts: number) => {
      const date = new Date(ts);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    return {
      activatedAt: this.activatedAt,
      displayText: `启动于 ${formatDate(this.activatedAt)}`,
    };
  }

  /**
   * 转换为 Persistence DTO（数据库存储格式）
   */
  public toPersistenceDTO(): ActiveTimeConfigPersistenceDTO {
    return {
      activatedAt: this.activatedAt,
    };
  }

  /**
   * 从 DTO 创建值对象
   */
  public static fromServerDTO(dto: ActiveTimeConfigServerDTO): ActiveTimeConfig {
    return new ActiveTimeConfig(dto);
  }

  /**
   * 创建新的 ActiveTimeConfig（使用当前时间）
   */
  public static createNow(): ActiveTimeConfig {
    return new ActiveTimeConfig({
      activatedAt: Date.now(),
    });
  }
}
