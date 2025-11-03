/**
 * CompletionRecord 值对象实现 (Client)
 */

import type { TaskContracts } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type ICompletionRecordClient = TaskContracts.CompletionRecordClient;
type CompletionRecordClientDTO = TaskContracts.CompletionRecordClientDTO;
type CompletionRecordServerDTO = TaskContracts.CompletionRecordServerDTO;

export class CompletionRecordClient extends ValueObject implements ICompletionRecordClient {
  private _completedAt: number;
  private _actualDuration: number | null;
  private _note: string | null;
  private _rating: number | null;

  private constructor(params: {
    completedAt: number;
    actualDuration?: number | null;
    note?: string | null;
    rating?: number | null;
  }) {
    super();
    this._completedAt = params.completedAt;
    this._actualDuration = params.actualDuration ?? null;
    this._note = params.note ?? null;
    this._rating = params.rating ?? null;
  }

  // Getters
  public get completedAt(): number {
    return this._completedAt;
  }
  public get actualDuration(): number | null {
    return this._actualDuration;
  }
  public get note(): string | null {
    return this._note;
  }
  public get rating(): number | null {
    return this._rating;
  }

  // UI 辅助属性
  public get formattedCompletedAt(): string {
    return new Date(this._completedAt).toLocaleString();
  }

  public get durationText(): string {
    if (!this._actualDuration) return '未记录时长';
    const hours = Math.floor(this._actualDuration / 3600000);
    const minutes = Math.floor((this._actualDuration % 3600000) / 60000);
    if (hours > 0) {
      return `${hours}小时${minutes > 0 ? `${minutes}分钟` : ''}`;
    }
    return `${minutes}分钟`;
  }

  public get hasNote(): boolean {
    return this._note !== null && this._note.length > 0;
  }

  public get hasRating(): boolean {
    return this._rating !== null;
  }

  public get ratingStars(): string {
    if (!this._rating) return '';
    return '★'.repeat(this._rating) + '☆'.repeat(5 - this._rating);
  }

  // 值对象方法
  public equals(other: ICompletionRecordClient): boolean {
    return (
      this._completedAt === other.completedAt &&
      this._actualDuration === other.actualDuration &&
      this._note === other.note &&
      this._rating === other.rating
    );
  }

  // DTO 转换
  public toServerDTO(): CompletionRecordServerDTO {
    return {
      completedAt: this._completedAt,
      actualDuration: this._actualDuration,
      note: this._note,
      rating: this._rating,
    };
  }

  public toClientDTO(): CompletionRecordClientDTO {
    return {
      completedAt: this._completedAt,
      actualDuration: this._actualDuration,
      note: this._note,
      rating: this._rating,
      formattedCompletedAt: this.formattedCompletedAt,
      durationText: this.durationText,
      hasNote: this.hasNote,
      hasRating: this.hasRating,
      ratingStars: this.ratingStars,
    };
  }

  // 静态工厂方法
  public static fromClientDTO(dto: CompletionRecordClientDTO): CompletionRecordClient {
    return new CompletionRecordClient({
      completedAt: dto.completedAt,
      actualDuration: dto.actualDuration,
      note: dto.note,
      rating: dto.rating,
    });
  }

  public static fromServerDTO(dto: CompletionRecordServerDTO): CompletionRecordClient {
    return new CompletionRecordClient({
      completedAt: dto.completedAt,
      actualDuration: dto.actualDuration,
      note: dto.note,
      rating: dto.rating,
    });
  }
}
