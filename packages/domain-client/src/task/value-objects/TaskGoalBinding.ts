/**
 * TaskGoalBinding 值对象实现 (Client)
 */

import type { TaskContracts } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type ITaskGoalBinding = TaskContracts.TaskGoalBindingClient;
type TaskGoalBindingDTO = TaskContracts.TaskGoalBindingClientDTO;
type TaskGoalBindingServerDTO = TaskContracts.TaskGoalBindingServerDTO;

export class TaskGoalBinding extends ValueObject implements ITaskGoalBinding {
  private _goalUuid: string;
  private _keyResultUuid: string;
  private _incrementValue: number;

  private constructor(params: { goalUuid: string; keyResultUuid: string; incrementValue: number }) {
    super();
    this._goalUuid = params.goalUuid;
    this._keyResultUuid = params.keyResultUuid;
    this._incrementValue = params.incrementValue;
  }

  // Getters
  public get goalUuid(): string {
    return this._goalUuid;
  }
  public get keyResultUuid(): string {
    return this._keyResultUuid;
  }
  public get incrementValue(): number {
    return this._incrementValue;
  }

  // UI 辅助属性
  public get displayText(): string {
    return `目标关联: 完成增加${this._incrementValue}点进度`;
  }

  public get hasPositiveIncrement(): boolean {
    return this._incrementValue > 0;
  }

  // 值对象方法
  public equals(other: ITaskGoalBinding): boolean {
    return (
      this._goalUuid === other.goalUuid &&
      this._keyResultUuid === other.keyResultUuid &&
      this._incrementValue === other.incrementValue
    );
  }

  // DTO 转换
  public toServerDTO(): TaskGoalBindingServerDTO {
    return {
      goalUuid: this._goalUuid,
      keyResultUuid: this._keyResultUuid,
      incrementValue: this._incrementValue,
    };
  }

  public toClientDTO(): TaskGoalBindingDTO {
    return {
      goalUuid: this._goalUuid,
      keyResultUuid: this._keyResultUuid,
      incrementValue: this._incrementValue,
      displayText: this.displayText,
      hasPositiveIncrement: this.hasPositiveIncrement,
    };
  }

  // 静态工厂方法
  public static fromClientDTO(dto: TaskGoalBindingDTO): TaskGoalBinding {
    return new TaskGoalBinding({
      goalUuid: dto.goalUuid,
      keyResultUuid: dto.keyResultUuid,
      incrementValue: dto.incrementValue,
    });
  }

  public static fromServerDTO(dto: TaskGoalBindingServerDTO): TaskGoalBinding {
    return new TaskGoalBinding({
      goalUuid: dto.goalUuid,
      keyResultUuid: dto.keyResultUuid,
      incrementValue: dto.incrementValue,
    });
  }
}
