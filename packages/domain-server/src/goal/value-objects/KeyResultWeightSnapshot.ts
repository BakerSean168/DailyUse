/**
 * KR 权重快照值对象
 *
 * 不可变对象，用于记录某个时间点的 KR 权重变更。
 * 包含权重变化的完整上下文信息（谁、什么时候、为什么、怎么变的）。
 */

import { GoalContracts } from '@dailyuse/contracts';
import { InvalidWeightError } from './KeyResultWeightSnapshotErrors';

type KeyResultWeightSnapshotServerDTO = GoalContracts.KeyResultWeightSnapshotServerDTO;
type SnapshotTrigger = GoalContracts.SnapshotTrigger;

export class KeyResultWeightSnapshot {
  constructor(
    public readonly uuid: string,
    public readonly goalUuid: string,
    public readonly keyResultUuid: string,
    public readonly oldWeight: number,
    public readonly newWeight: number,
    public readonly snapshotTime: number,
    public readonly trigger: SnapshotTrigger,
    public readonly operatorUuid: string,
    public readonly reason?: string,
    public readonly createdAt?: number,
  ) {
    this.validateWeights();
  }

  /**
   * 计算权重变化量
   * @returns 权重增量（可为负数）
   */
  get weightDelta(): number {
    return this.newWeight - this.oldWeight;
  }

  /**
   * 验证权重值范围
   * @throws {InvalidWeightError} 如果权重不在 0-100 范围内
   */
  private validateWeights(): void {
    if (this.oldWeight < 0 || this.oldWeight > 100) {
      throw new InvalidWeightError('oldWeight', this.oldWeight);
    }
    if (this.newWeight < 0 || this.newWeight > 100) {
      throw new InvalidWeightError('newWeight', this.newWeight);
    }
  }

  /**
   * 转换为 ServerDTO
   */
  public toServerDTO(): KeyResultWeightSnapshotServerDTO {
    return {
      uuid: this.uuid,
      goalUuid: this.goalUuid,
      keyResultUuid: this.keyResultUuid,
      oldWeight: this.oldWeight,
      newWeight: this.newWeight,
      weightDelta: this.weightDelta,
      snapshotTime: this.snapshotTime,
      trigger: this.trigger,
      reason: this.reason,
      operatorUuid: this.operatorUuid,
      createdAt: this.createdAt ?? Date.now(),
    };
  }

  /**
   * 从 ServerDTO 创建实例
   */
  public static fromServerDTO(dto: KeyResultWeightSnapshotServerDTO): KeyResultWeightSnapshot {
    return new KeyResultWeightSnapshot(
      dto.uuid,
      dto.goalUuid,
      dto.keyResultUuid,
      dto.oldWeight,
      dto.newWeight,
      dto.snapshotTime,
      dto.trigger,
      dto.operatorUuid,
      dto.reason ?? undefined,
      dto.createdAt,
    );
  }
}
