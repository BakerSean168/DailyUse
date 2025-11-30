/**
 * CompletionRecord 值对象 (Server)
 * 完成记录 - 不可变值对象
 */

import type {
  CompletionRecordClientDTO,
  CompletionRecordPersistenceDTO,
  CompletionRecordServer,
  CompletionRecordServerDTO,
} from '@dailyuse/contracts/task';
import { ValueObject } from '@dailyuse/utils';

/**
 * CompletionRecord 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 可以自由复制和替换
 */
export class CompletionRecord extends ValueObject implements CompletionRecordServer {
  public readonly completedAt: number;
  public readonly note: string | null;
  public readonly rating: number | null;
  public readonly actualDuration: number | null;
  public readonly taskUuid: string;
  public readonly completionStatus: string; // e.g., 'completed', 'skipped'

  constructor(params: {
    completedAt: number;
    note?: string | null;
    rating?: number | null;
    actualDuration?: number | null;
    taskUuid: string;
    completionStatus: string;
  }) {
    super();

    // 验证
    if (params.rating !== undefined && params.rating !== null) {
      if (params.rating < 1 || params.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }
    }

    if (
      params.actualDuration !== undefined &&
      params.actualDuration !== null &&
      params.actualDuration < 0
    ) {
      throw new Error('Actual duration must be non-negative');
    }

    this.completedAt = params.completedAt;
    this.note = params.note ?? null;
    this.rating = params.rating ?? null;
    this.actualDuration = params.actualDuration ?? null;
    this.taskUuid = params.taskUuid;
    this.completionStatus = params.completionStatus;

    // 确保不可变
    Object.freeze(this);
  }

  /**
   * 创建修改后的新实例（值对象不可变，修改时创建新实例）
   */
  public with(
    changes: Partial<{
      completedAt: number;
      note: string | null;
      rating: number | null;
      actualDuration: number | null;
      completionStatus: string;
    }>,
  ): CompletionRecord {
    return new CompletionRecord({
      completedAt: changes.completedAt ?? this.completedAt,
      note: changes.note ?? this.note,
      rating: changes.rating ?? this.rating,
      actualDuration: changes.actualDuration ?? this.actualDuration,
      taskUuid: this.taskUuid, // taskUuid should not be changed with this method
      completionStatus: changes.completionStatus ?? this.completionStatus,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: CompletionRecord): boolean {
    if (!(other instanceof CompletionRecord)) {
      return false;
    }

    return (
      this.completedAt === other.completedAt &&
      this.note === other.note &&
      this.rating === other.rating &&
      this.actualDuration === other.actualDuration &&
      this.taskUuid === other.taskUuid &&
      this.completionStatus === other.completionStatus
    );
  }

  /**
   * DTO 转换
   */
  public toServerDTO(): CompletionRecordServerDTO {
    return {
      completedAt: this.completedAt,
      note: this.note,
      rating: this.rating,
      actualDuration: this.actualDuration,
    };
  }

  public toClientDTO(): CompletionRecordClientDTO {
    return {
      completedAt: this.completedAt,
      note: this.note,
      rating: this.rating,
      actualDuration: this.actualDuration,
      formattedCompletedAt: this.getFormattedCompletedAt(),
      durationText: this.getFormattedDuration(),
      hasNote: this.note !== null,
      hasRating: this.rating !== null,
      ratingStars: this.getRatingStars(),
    };
  }

  public toPersistenceDTO(): CompletionRecordPersistenceDTO {
    return {
      taskUuid: this.taskUuid,
      completedAt: this.completedAt,
      completionStatus: this.completionStatus,
      note: this.note,
      rating: this.rating,
      actualDuration: this.actualDuration,
    };
  }

  /**
   * 静态工厂方法
   */
  public static fromServerDTO(
    dto: CompletionRecordServerDTO,
    taskUuid: string,
    completionStatus = 'completed',
  ): CompletionRecord {
    return new CompletionRecord({
      completedAt: dto.completedAt,
      note: dto.note,
      rating: dto.rating,
      actualDuration: dto.actualDuration,
      taskUuid,
      completionStatus,
    });
  }

  public static fromPersistenceDTO(dto: CompletionRecordPersistenceDTO): CompletionRecord {
    return new CompletionRecord({
      taskUuid: dto.taskUuid,
      completedAt: dto.completedAt,
      completionStatus: dto.completionStatus,
      note: dto.note,
      rating: dto.rating,
      actualDuration: dto.actualDuration,
    });
  }

  /**
   * 辅助方法（用于 ClientDTO）
   */
  private getFormattedCompletedAt(): string {
    return new Date(this.completedAt).toLocaleString('zh-CN');
  }

  private getRatingStars(): string {
    if (this.rating === null) return '';
    return '⭐'.repeat(this.rating);
  }

  private getFormattedDuration(): string {
    if (this.actualDuration === null) return '未记录';

    const hours = Math.floor(this.actualDuration / 3600000);
    const minutes = Math.floor((this.actualDuration % 3600000) / 60000);

    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  }
}
