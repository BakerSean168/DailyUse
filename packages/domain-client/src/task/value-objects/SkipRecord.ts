/**
 * SkipRecord 值对象实现 (Client)
 */

import type { TaskContracts } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type ISkipRecordClient = TaskContracts.SkipRecordClient;
type SkipRecordClientDTO = TaskContracts.SkipRecordClientDTO;
type SkipRecordServerDTO = TaskContracts.SkipRecordServerDTO;

export class SkipRecordClient extends ValueObject implements ISkipRecordClient {
  private _skippedAt: number;
  private _reason: string | null;

  private constructor(params: { skippedAt: number; reason?: string | null }) {
    super();
    this._skippedAt = params.skippedAt;
    this._reason = params.reason ?? null;
  }

  // Getters
  public get skippedAt(): number {
    return this._skippedAt;
  }
  public get reason(): string | null {
    return this._reason;
  }

  // UI 辅助属性
  public get formattedSkippedAt(): string {
    return new Date(this._skippedAt).toLocaleString();
  }

  public get hasReason(): boolean {
    return this._reason !== null && this._reason.length > 0;
  }

  public get displayText(): string {
    if (this.hasReason) {
      return `已跳过 (${this._reason})`;
    }
    return '已跳过';
  }

  // 值对象方法
  public equals(other: ISkipRecordClient): boolean {
    return this._skippedAt === other.skippedAt && this._reason === other.reason;
  }

  // DTO 转换
  public toServerDTO(): SkipRecordServerDTO {
    return {
      skippedAt: this._skippedAt,
      reason: this._reason,
    };
  }

  public toClientDTO(): SkipRecordClientDTO {
    return {
      skippedAt: this._skippedAt,
      reason: this._reason,
      formattedSkippedAt: this.formattedSkippedAt,
      hasReason: this.hasReason,
      displayText: this.displayText,
    };
  }

  // 静态工厂方法
  public static fromClientDTO(dto: SkipRecordClientDTO): SkipRecordClient {
    return new SkipRecordClient({
      skippedAt: dto.skippedAt,
      reason: dto.reason,
    });
  }

  public static fromServerDTO(dto: SkipRecordServerDTO): SkipRecordClient {
    return new SkipRecordClient({
      skippedAt: dto.skippedAt,
      reason: dto.reason,
    });
  }
}
