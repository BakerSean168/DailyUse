/**
 * SkipRecord 值对象 (Server)
 * 跳过记录 - 不可变值对象
 */

import type {
  SkipRecordClientDTO,
  SkipRecordPersistenceDTO,
  SkipRecordServer,
  SkipRecordServerDTO,
} from '@dailyuse/contracts/task';
import { ValueObject } from '@dailyuse/utils';

/**
 * SkipRecord 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 可以自由复制和替换
 */
export class SkipRecord extends ValueObject implements SkipRecordServer {
  public readonly skippedAt: number;
  public readonly reason: string | null;

  constructor(params: { skippedAt: number; reason?: string | null }) {
    super();

    this.skippedAt = params.skippedAt;
    this.reason = params.reason ?? null;

    // 确保不可变
    Object.freeze(this);
  }

  /**
   * 创建修改后的新实例（值对象不可变，修改时创建新实例）
   */
  public with(
    changes: Partial<{
      skippedAt: number;
      reason: string | null;
    }>,
  ): SkipRecord {
    return new SkipRecord({
      skippedAt: changes.skippedAt ?? this.skippedAt,
      reason: changes.reason ?? this.reason,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: SkipRecord): boolean {
    if (!(other instanceof SkipRecord)) {
      return false;
    }

    return this.skippedAt === other.skippedAt && this.reason === other.reason;
  }

  /**
   * DTO 转换
   */
  public toServerDTO(): SkipRecordServerDTO {
    return {
      skippedAt: this.skippedAt,
      reason: this.reason,
    };
  }

  public toClientDTO(): SkipRecordClientDTO {
    return {
      skippedAt: this.skippedAt,
      reason: this.reason,
      formattedSkippedAt: this.getFormattedSkippedAt(),
      hasReason: this.reason !== null,
      displayText: this.getDisplayText(),
    };
  }

  public toPersistenceDTO(): SkipRecordPersistenceDTO {
    return {
      skippedAt: this.skippedAt,
      reason: this.reason,
    };
  }

  /**
   * 静态工厂方法
   */
  public static fromServerDTO(dto: SkipRecordServerDTO): SkipRecord {
    return new SkipRecord({
      skippedAt: dto.skippedAt,
      reason: dto.reason,
    });
  }

  public static fromPersistenceDTO(dto: SkipRecordPersistenceDTO): SkipRecord {
    return new SkipRecord({
      skippedAt: dto.skippedAt,
      reason: dto.reason,
    });
  }

  /**
   * 辅助方法（用于 ClientDTO）
   */
  private getFormattedSkippedAt(): string {
    return new Date(this.skippedAt).toLocaleString('zh-CN');
  }

  private getDisplayText(): string {
    if (this.reason) {
      return `已跳过: ${this.reason}`;
    }
    return '已跳过';
  }
}
