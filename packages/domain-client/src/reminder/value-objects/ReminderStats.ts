/**
 * ReminderStats 值对象实现 (Client)
 */

import { ReminderContracts } from '@dailyuse/contracts';

type ReminderStatsClientDTO = ReminderContracts.ReminderStatsClientDTO;
type ReminderStatsServerDTO = ReminderContracts.ReminderStatsServerDTO;

export class ReminderStats implements ReminderContracts.ReminderStatsClient {
  private readonly _totalTriggers: number;
  private readonly _lastTriggeredAt: number | null | undefined;
  private readonly _totalTriggersText: string;
  private readonly _lastTriggeredText: string | null | undefined;

  private constructor(params: {
    totalTriggers: number;
    lastTriggeredAt?: number | null;
    totalTriggersText: string;
    lastTriggeredText?: string | null;
  }) {
    this._totalTriggers = params.totalTriggers;
    this._lastTriggeredAt = params.lastTriggeredAt;
    this._totalTriggersText = params.totalTriggersText;
    this._lastTriggeredText = params.lastTriggeredText;
  }

  // ===== Getters =====
  get totalTriggers(): number {
    return this._totalTriggers;
  }

  get lastTriggeredAt(): number | null | undefined {
    return this._lastTriggeredAt;
  }

  get totalTriggersText(): string {
    return this._totalTriggersText;
  }

  get lastTriggeredText(): string | null | undefined {
    return this._lastTriggeredText;
  }

  // ===== 业务方法 =====
  public equals(other: ReminderContracts.ReminderStatsClient): boolean {
    return (
      this._totalTriggers === other.totalTriggers &&
      this._lastTriggeredAt === other.lastTriggeredAt
    );
  }

  // ===== DTO 转换方法 =====
  public toClientDTO(): ReminderStatsClientDTO {
    return {
      totalTriggers: this._totalTriggers,
      lastTriggeredAt: this._lastTriggeredAt,
      totalTriggersText: this._totalTriggersText,
      lastTriggeredText: this._lastTriggeredText,
    };
  }

  public toServerDTO(): ReminderStatsServerDTO {
    return {
      totalTriggers: this._totalTriggers,
      lastTriggeredAt: this._lastTriggeredAt,
    };
  }

  // ===== 静态工厂方法 =====
  public static fromClientDTO(dto: ReminderStatsClientDTO): ReminderStats {
    return new ReminderStats({
      totalTriggers: dto.totalTriggers,
      lastTriggeredAt: dto.lastTriggeredAt,
      totalTriggersText: dto.totalTriggersText,
      lastTriggeredText: dto.lastTriggeredText,
    });
  }

  public static fromServerDTO(dto: ReminderStatsServerDTO): ReminderStats {
    // 生成 UI 文本
    const totalTriggersText = dto.totalTriggers > 0 ? `已触发 ${dto.totalTriggers} 次` : '未触发';

    let lastTriggeredText: string | null = null;
    if (dto.lastTriggeredAt) {
      const diff = Date.now() - dto.lastTriggeredAt;
      if (diff < 60000) {
        lastTriggeredText = '刚刚';
      } else if (diff < 3600000) {
        lastTriggeredText = `${Math.floor(diff / 60000)} 分钟前`;
      } else if (diff < 86400000) {
        lastTriggeredText = `${Math.floor(diff / 3600000)} 小时前`;
      } else {
        lastTriggeredText = `${Math.floor(diff / 86400000)} 天前`;
      }
    }

    return new ReminderStats({
      totalTriggers: dto.totalTriggers,
      lastTriggeredAt: dto.lastTriggeredAt,
      totalTriggersText,
      lastTriggeredText,
    });
  }
}
