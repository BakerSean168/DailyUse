/**
 * ReminderStats 值对象实现 (Client)
 */

import { ReminderContracts } from '@dailyuse/contracts';

type ReminderStatsClientDTO = ReminderContracts.ReminderStatsClientDTO;
type ReminderStatsServerDTO = ReminderContracts.ReminderStatsServerDTO;

export class ReminderStatsClient implements ReminderContracts.ReminderStatsClient {
  private readonly dto: ReminderStatsClientDTO;

  private constructor(dto: ReminderStatsClientDTO) {
    this.dto = dto;
  }

  get totalTriggers(): number { return this.dto.totalTriggers; }
  get lastTriggeredAt(): number | null | undefined { return this.dto.lastTriggeredAt; }
  get totalTriggersText(): string { return this.dto.totalTriggersText; }
  get lastTriggeredText(): string | null | undefined { return this.dto.lastTriggeredText; }

  public equals(other: ReminderContracts.ReminderStatsClient): boolean {
    return JSON.stringify(this.dto) === JSON.stringify((other as ReminderStatsClient).dto);
  }

  public toClientDTO(): ReminderStatsClientDTO {
    return this.dto;
  }

  public toServerDTO(): ReminderStatsServerDTO {
    return {
      totalTriggers: this.dto.totalTriggers,
      lastTriggeredAt: this.dto.lastTriggeredAt,
    };
  }

  public static fromClientDTO(dto: ReminderStatsClientDTO): ReminderStatsClient {
    return new ReminderStatsClient(dto);
  }

  public static fromServerDTO(dto: ReminderStatsServerDTO): ReminderStatsClient {
    const clientDTO: ReminderStatsClientDTO = {
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
    return new ReminderStatsClient(clientDTO);
  }
}
