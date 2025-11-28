/**
 * KeyResultSnapshot 值对象
 * 关键成果快照 - 不可变值对象（用于复盘记录）
 */

import type { KeyResultSnapshotPersistenceDTO, KeyResultSnapshotServerDTO } from '@dailyuse/contracts/goal';
import { ValueObject } from '@dailyuse/utils';

// 类型别名

/**
 * KeyResultSnapshot 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 可以自由复制和替换
 */
export class KeyResultSnapshot extends ValueObject {
  public readonly keyResultUuid: string;
  public readonly title: string;
  public readonly targetValue: number;
  public readonly currentValue: number;
  public readonly progressPercentage: number;

  constructor(params: {
    keyResultUuid: string;
    title: string;
    targetValue: number;
    currentValue: number;
    progressPercentage: number;
  }) {
    super();

    this.keyResultUuid = params.keyResultUuid;
    this.title = params.title;
    this.targetValue = params.targetValue;
    this.currentValue = params.currentValue;
    this.progressPercentage = params.progressPercentage;

    // 确保不可变
    Object.freeze(this);
  }

  /**
   * 创建修改后的新实例（值对象不可变，修改时创建新实例）
   */
  public with(
    changes: Partial<{
      keyResultUuid: string;
      title: string;
      targetValue: number;
      currentValue: number;
      progressPercentage: number;
    }>,
  ): KeyResultSnapshot {
    return new KeyResultSnapshot({
      keyResultUuid: changes.keyResultUuid ?? this.keyResultUuid,
      title: changes.title ?? this.title,
      targetValue: changes.targetValue ?? this.targetValue,
      currentValue: changes.currentValue ?? this.currentValue,
      progressPercentage: changes.progressPercentage ?? this.progressPercentage,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof KeyResultSnapshot)) {
      return false;
    }

    return (
      this.keyResultUuid === other.keyResultUuid &&
      this.title === other.title &&
      this.targetValue === other.targetValue &&
      this.currentValue === other.currentValue &&
      this.progressPercentage === other.progressPercentage
    );
  }

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): KeyResultSnapshotServerDTO {
    return {
      keyResultUuid: this.keyResultUuid,
      title: this.title,
      targetValue: this.targetValue,
      currentValue: this.currentValue,
      progressPercentage: this.progressPercentage,
    };
  }

  /**
   * 从 Server DTO 创建值对象
   */
  public static fromServerDTO(dto: KeyResultSnapshotServerDTO): KeyResultSnapshot {
    return new KeyResultSnapshot(dto);
  }

  /**
   * 转换为 Persistence DTO
   */
  public toPersistenceDTO(): KeyResultSnapshotPersistenceDTO {
    return {
      keyResultUuid: this.keyResultUuid,
      title: this.title,
      targetValue: this.targetValue,
      currentValue: this.currentValue,
      progressPercentage: this.progressPercentage,
    };
  }

  /**
   * 从 Persistence DTO 创建值对象
   */
  public static fromPersistenceDTO(dto: KeyResultSnapshotPersistenceDTO): KeyResultSnapshot {
    return new KeyResultSnapshot({
      keyResultUuid: dto.keyResultUuid,
      title: dto.title,
      targetValue: dto.targetValue,
      currentValue: dto.currentValue,
      progressPercentage: dto.progressPercentage,
    });
  }
}
