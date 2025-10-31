/**
 * ActiveTimeConfig 值对象
 * 生效时间配置 - 不可变值对象
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
 */
export class ActiveTimeConfig extends ValueObject implements ActiveTimeConfigServerDTO {
  public readonly startDate: number;
  public readonly endDate: number | null;

  constructor(params: { startDate: number; endDate?: number | null }) {
    super();

    this.startDate = params.startDate;
    this.endDate = params.endDate ?? null;

    // 确保不可变
    Object.freeze(this);
  }

  /**
   * 创建修改后的新实例
   */
  public with(
    changes: Partial<{
      startDate: number;
      endDate: number | null;
    }>,
  ): ActiveTimeConfig {
    return new ActiveTimeConfig({
      startDate: changes.startDate ?? this.startDate,
      endDate: changes.endDate !== undefined ? changes.endDate : this.endDate,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof ActiveTimeConfig)) {
      return false;
    }

    return this.startDate === other.startDate && this.endDate === other.endDate;
  }

  /**
   * 转换为 DTO
   */
  public toServerDTO(): ActiveTimeConfigServerDTO {
    return {
      startDate: this.startDate,
      endDate: this.endDate,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): ActiveTimeConfigClientDTO {
    const formatDate = (ts: number) => new Date(ts).toLocaleDateString();
    let displayText = `从 ${formatDate(this.startDate)} 开始`;
    if (this.endDate) {
      displayText = `${formatDate(this.startDate)} 至 ${formatDate(this.endDate)}`;
    }

    const now = Date.now();
    const isActive = now >= this.startDate && (!this.endDate || now <= this.endDate);

    return {
      startDate: this.startDate,
      endDate: this.endDate,
      displayText,
      isActive,
    };
  }

  /**
   * 转换为 Persistence DTO（数据库存储格式）
   */
  public toPersistenceDTO(): ActiveTimeConfigPersistenceDTO {
    return {
      startDate: this.startDate,
      endDate: this.endDate,
    };
  }

  /**
   * 从 DTO 创建值对象
   */
  public static fromServerDTO(dto: ActiveTimeConfigServerDTO): ActiveTimeConfig {
    return new ActiveTimeConfig(dto);
  }
}
