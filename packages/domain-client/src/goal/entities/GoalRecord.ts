/**
 * GoalRecord 实体实现 (Client)
 */

import type { GoalContracts } from '@dailyuse/contracts';
import { Entity } from '@dailyuse/utils';

type IGoalRecord = GoalContracts.GoalRecord;
type GoalRecordDTO = GoalContracts.GoalRecordDTO;
type GoalRecordServerDTO = GoalContracts.GoalRecordServerDTO;

export class GoalRecord extends Entity implements IGoalRecord {
  private _keyResultUuid: string;
  private _goalUuid: string;
  private _previousValue: number;
  private _newValue: number;
  private _changeAmount: number;
  private _note?: string | null;
  private _recordedAt: number;
  private _createdAt: number;

  private constructor(params: {
    uuid?: string;
    keyResultUuid: string;
    goalUuid: string;
    previousValue: number;
    newValue: number;
    changeAmount: number;
    note?: string | null;
    recordedAt: number;
    createdAt: number;
  }) {
    super(params.uuid || Entity.generateUUID());
    this._keyResultUuid = params.keyResultUuid;
    this._goalUuid = params.goalUuid;
    this._previousValue = params.previousValue;
    this._newValue = params.newValue;
    this._changeAmount = params.changeAmount;
    this._note = params.note;
    this._recordedAt = params.recordedAt;
    this._createdAt = params.createdAt;
  }

  // Getters
  public override get uuid(): string {
    return this._uuid;
  }
  public get keyResultUuid(): string {
    return this._keyResultUuid;
  }
  public get goalUuid(): string {
    return this._goalUuid;
  }
  public get previousValue(): number {
    return this._previousValue;
  }
  public get newValue(): number {
    return this._newValue;
  }
  public get changeAmount(): number {
    return this._changeAmount;
  }
  public get note(): string | null | undefined {
    return this._note;
  }
  public get recordedAt(): number {
    return this._recordedAt;
  }
  public get createdAt(): number {
    return this._createdAt;
  }

  // UI 辅助属性
  public get changePercentage(): number {
    if (this._previousValue === 0) return 0;
    return Math.round((this._changeAmount / this._previousValue) * 100);
  }

  public get isPositiveChange(): boolean {
    return this._changeAmount > 0;
  }

  public get changeText(): string {
    const sign = this.isPositiveChange ? '+' : '';
    return `${sign}${this._changeAmount}`;
  }

  public get formattedRecordedAt(): string {
    return new Date(this._recordedAt).toLocaleString('zh-CN');
  }

  public get formattedCreatedAt(): string {
    return new Date(this._createdAt).toLocaleString('zh-CN');
  }

  public get changeIcon(): string {
    if (this._changeAmount > 0) return '↑';
    if (this._changeAmount < 0) return '↓';
    return '→';
  }

  public get changeColor(): string {
    if (this._changeAmount > 0) return 'green';
    if (this._changeAmount < 0) return 'red';
    return 'gray';
  }

  // 实体方法
  public getDisplayText(): string {
    return `${this._previousValue} → ${this._newValue} (${this.changeText})`;
  }

  public getSummary(): string {
    const base = `${this.changeIcon} ${this.getDisplayText()}`;
    if (this.hasNote()) {
      const notePreview =
        this._note!.length > 20 ? `${this._note!.substring(0, 20)}...` : this._note!;
      return `${base} - ${notePreview}`;
    }
    return base;
  }

  public hasNote(): boolean {
    return !!this._note && this._note.trim().length > 0;
  }

  // DTO 转换
  public toClientDTO(): GoalRecordDTO {
    return {
      uuid: this.uuid,
      keyResultUuid: this._keyResultUuid,
      goalUuid: this._goalUuid,
      previousValue: this._previousValue,
      newValue: this._newValue,
      changeAmount: this._changeAmount,
      note: this._note,
      recordedAt: this._recordedAt,
      createdAt: this._createdAt,
      changePercentage: this.changePercentage,
      isPositiveChange: this.isPositiveChange,
      changeText: this.changeText,
      formattedRecordedAt: this.formattedRecordedAt,
      formattedCreatedAt: this.formattedCreatedAt,
      changeIcon: this.changeIcon,
      changeColor: this.changeColor,
    };
  }

  public toServerDTO(): GoalRecordServerDTO {
    return {
      uuid: this.uuid,
      keyResultUuid: this._keyResultUuid,
      goalUuid: this._goalUuid,
      previousValue: this._previousValue,
      newValue: this._newValue,
      changeAmount: this._changeAmount,
      note: this._note,
      recordedAt: this._recordedAt,
      createdAt: this._createdAt,
    };
  }

  // 静态工厂方法
  public static fromClientDTO(dto: GoalRecordDTO): GoalRecord {
    return new GoalRecord({
      uuid: dto.uuid,
      keyResultUuid: dto.keyResultUuid,
      goalUuid: dto.goalUuid,
      previousValue: dto.previousValue,
      newValue: dto.newValue,
      changeAmount: dto.changeAmount,
      note: dto.note,
      recordedAt: dto.recordedAt,
      createdAt: dto.createdAt,
    });
  }

  public static fromServerDTO(dto: GoalRecordServerDTO): GoalRecord {
    return new GoalRecord({
      uuid: dto.uuid,
      keyResultUuid: dto.keyResultUuid,
      goalUuid: dto.goalUuid,
      previousValue: dto.previousValue,
      newValue: dto.newValue,
      changeAmount: dto.changeAmount,
      note: dto.note,
      recordedAt: dto.recordedAt,
      createdAt: dto.createdAt,
    });
  }

  public clone(): GoalRecord {
    return GoalRecord.fromClientDTO(this.toClientDTO());
  }
}
