/**
 * TaskGoalBinding 值对象 (Server)
 * 任务目标绑定 - 不可变值对象
 */

import type {
  TaskGoalBindingClientDTO,
  TaskGoalBindingPersistenceDTO,
  TaskGoalBindingServer,
  TaskGoalBindingServerDTO,
} from '@dailyuse/contracts/task';
import { ValueObject } from '@dailyuse/utils';

/**
 * TaskGoalBinding 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 可以自由复制和替换
 */
export class TaskGoalBinding extends ValueObject implements TaskGoalBindingServer {
  public readonly goalUuid: string;
  public readonly keyResultUuid: string;
  public readonly incrementValue: number;

  constructor(params: { goalUuid: string; keyResultUuid: string; incrementValue: number }) {
    super();

    // 验证
    if (params.incrementValue < 0) {
      throw new Error('Increment value must be non-negative');
    }

    this.goalUuid = params.goalUuid;
    this.keyResultUuid = params.keyResultUuid;
    this.incrementValue = params.incrementValue;

    // 确保不可变
    Object.freeze(this);
  }

  /**
   * 创建修改后的新实例（值对象不可变，修改时创建新实例）
   */
  public with(
    changes: Partial<{
      goalUuid: string;
      keyResultUuid: string;
      incrementValue: number;
    }>,
  ): TaskGoalBinding {
    return new TaskGoalBinding({
      goalUuid: changes.goalUuid ?? this.goalUuid,
      keyResultUuid: changes.keyResultUuid ?? this.keyResultUuid,
      incrementValue: changes.incrementValue ?? this.incrementValue,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: TaskGoalBinding): boolean {
    if (!(other instanceof TaskGoalBinding)) {
      return false;
    }

    return (
      this.goalUuid === other.goalUuid &&
      this.keyResultUuid === other.keyResultUuid &&
      this.incrementValue === other.incrementValue
    );
  }

  /**
   * DTO 转换
   */
  public toServerDTO(): TaskGoalBindingServerDTO {
    return {
      goalUuid: this.goalUuid,
      keyResultUuid: this.keyResultUuid,
      incrementValue: this.incrementValue,
    };
  }

  public toClientDTO(): TaskGoalBindingClientDTO {
    return {
      goalUuid: this.goalUuid,
      keyResultUuid: this.keyResultUuid,
      incrementValue: this.incrementValue,
      displayText: this.getDisplayText(),
      hasPositiveIncrement: this.incrementValue > 0,
    };
  }

  public toPersistenceDTO(): TaskGoalBindingPersistenceDTO {
    return {
      goalUuid: this.goalUuid,
      keyResultUuid: this.keyResultUuid,
      incrementValue: this.incrementValue,
    };
  }

  /**
   * 静态工厂方法
   */
  public static fromServerDTO(dto: TaskGoalBindingServerDTO): TaskGoalBinding {
    return new TaskGoalBinding({
      goalUuid: dto.goalUuid,
      keyResultUuid: dto.keyResultUuid,
      incrementValue: dto.incrementValue,
    });
  }

  public static fromPersistenceDTO(dto: TaskGoalBindingPersistenceDTO): TaskGoalBinding {
    return new TaskGoalBinding({
      goalUuid: dto.goalUuid,
      keyResultUuid: dto.keyResultUuid,
      incrementValue: dto.incrementValue,
    });
  }

  /**
   * 辅助方法（用于 ClientDTO）
   */
  private getDisplayText(): string {
    return `关联目标 (增量: +${this.incrementValue})`;
  }
}
