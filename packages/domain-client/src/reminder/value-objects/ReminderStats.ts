/**
 * ReminderStats 值对象实现 ()
 */

import { ReminderContracts } from '@dailyuse/contracts';

type ReminderStatsDTO = ReminderContracts.ReminderStatsDTO;
type ReminderStatsServerDTO = ReminderContracts.ReminderStatsServerDTO;

export class ReminderStats implements ReminderContracts.ReminderStats {
  private readonly dto: ReminderStatsDTO;

  private constructor(dto: ReminderStatsDTO) {
    this.dto = dto;
  }

  get totalTriggers(): number { return this.dto.totalTriggers; }
  get lastTriggeredAt(): number | null | undefined { return this.dto.lastTriggeredAt; }
  get totalTriggersText(): string { return this.dto.totalTriggersText; }
  get lastTriggeredText(): string | null | undefined { return this.dto.lastTriggeredText; }

  public equals(other: ReminderContracts.ReminderStats): boolean {
    return JSON.stringify(this.dto) === JSON.stringify((other as ReminderStats).dto);
  }

  public toDTO(): ReminderStatsDTO {
    return this.dto;
  }

  public toServerDTO(): ReminderStatsServerDTO {
    return {
      totalTriggers: this.dto.totalTriggers,
      lastTriggeredAt: this.dto.lastTriggeredAt,
    };
  }

  public static fromDTO(dto: ReminderStatsDTO): ReminderStats {
    return new ReminderStats(dto);
  }

  public static fromServerDTO(dto: ReminderStatsServerDTO): ReminderStats {
    const clientDTO: ReminderStatsDTO = {
      totalTriggers: dto.totalTriggers,
      lastTriggeredAt: dto.lastTriggeredAt,
      totalTriggersText: dto.totalTriggers > 0 ? `已触发 ${dto.totalTriggers} 次` : '未触发',
      lastTriggeredText: dto.lastTriggeredAt ? (() => {
        const diff = Date.now() - dto.lastTriggeredAt;
        if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
        return `${Math.floor(diff / 86400000)} 天前`;
      })() : null,
    };
    return new ReminderStats(clientDTO);
  }
}
