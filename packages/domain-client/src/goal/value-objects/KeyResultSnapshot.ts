/**
 * KeyResultSnapshot 值对象实现 (Client)
 */

import type { IKeyResultSnapshotClient, KeyResultSnapshotClientDTO, KeyResultSnapshotServerDTO } from '@dailyuse/contracts/goal';
import { ValueObject } from '@dailyuse/utils';

export class KeyResultSnapshot extends ValueObject implements KeyResultSnapshot {
  private _keyResultUuid: string;
  private _title: string;
  private _targetValue: number;
  private _currentValue: number;
  private _progressPercentage: number;

  private constructor(params: {
    keyResultUuid: string;
    title: string;
    targetValue: number;
    currentValue: number;
    progressPercentage: number;
  }) {
    super();
    this._keyResultUuid = params.keyResultUuid;
    this._title = params.title;
    this._targetValue = params.targetValue;
    this._currentValue = params.currentValue;
    this._progressPercentage = params.progressPercentage;
  }

  // Getters
  public get keyResultUuid(): string {
    return this._keyResultUuid;
  }
  public get title(): string {
    return this._title;
  }
  public get targetValue(): number {
    return this._targetValue;
  }
  public get currentValue(): number {
    return this._currentValue;
  }
  public get progressPercentage(): number {
    return this._progressPercentage;
  }

  // UI 辅助属性
  public get progressText(): string {
    return `${this._currentValue}/${this._targetValue} (${this._progressPercentage}%)`;
  }

  public get progressBarColor(): string {
    if (this._progressPercentage >= 100) return 'green';
    if (this._progressPercentage >= 70) return 'blue';
    if (this._progressPercentage >= 40) return 'amber';
    return 'red';
  }

  public get displayTitle(): string {
    const maxLength = 30;
    if (this._title.length <= maxLength) return this._title;
    return `${this._title.substring(0, maxLength)}...`;
  }

  // 值对象方法
  public equals(other: IKeyResultSnapshot): boolean {
    return (
      this._keyResultUuid === other.keyResultUuid &&
      this._title === other.title &&
      this._targetValue === other.targetValue &&
      this._currentValue === other.currentValue &&
      this._progressPercentage === other.progressPercentage
    );
  }

  // DTO 转换
  public toServerDTO(): KeyResultSnapshotServerDTO {
    return {
      keyResultUuid: this._keyResultUuid,
      title: this._title,
      targetValue: this._targetValue,
      currentValue: this._currentValue,
      progressPercentage: this._progressPercentage,
    };
  }

  public toClientDTO(): KeyResultSnapshotDTO {
    return {
      keyResultUuid: this._keyResultUuid,
      title: this._title,
      targetValue: this._targetValue,
      currentValue: this._currentValue,
      progressPercentage: this._progressPercentage,
      progressText: this.progressText,
      progressBarColor: this.progressBarColor,
      displayTitle: this.displayTitle,
    };
  }

  // 静态工厂方法
  public static fromClientDTO(dto: KeyResultSnapshotDTO): KeyResultSnapshot {
    return new KeyResultSnapshot({
      keyResultUuid: dto.keyResultUuid,
      title: dto.title,
      targetValue: dto.targetValue,
      currentValue: dto.currentValue,
      progressPercentage: dto.progressPercentage,
    });
  }

  public static fromServerDTO(dto: KeyResultSnapshotServerDTO): KeyResultSnapshot {
    return new KeyResultSnapshot({
      keyResultUuid: dto.keyResultUuid,
      title: dto.title,
      targetValue: dto.targetValue,
      currentValue: dto.currentValue,
      progressPercentage: dto.progressPercentage,
    });
  }

  public static create(
    keyResultUuid: string,
    title: string,
    targetValue: number,
    currentValue: number,
    progressPercentage: number,
  ): KeyResultSnapshot {
    return new KeyResultSnapshot({
      keyResultUuid,
      title,
      targetValue,
      currentValue,
      progressPercentage,
    });
  }
}
