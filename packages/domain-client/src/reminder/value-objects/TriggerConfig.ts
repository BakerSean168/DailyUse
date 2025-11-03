/**
 * TriggerConfig 值对象实现 ()
 */

import { ReminderContracts } from '@dailyuse/contracts';

type TriggerConfigDTO = ReminderContracts.TriggerConfigDTO;
type TriggerConfigServerDTO = ReminderContracts.TriggerConfigServerDTO;

export class TriggerConfig implements ReminderContracts.TriggerConfig {
  private readonly dto: TriggerConfigDTO;

  private constructor(dto: TriggerConfigDTO) {
    this.dto = dto;
  }

  // ===== Getters =====
  get type(): ReminderContracts.TriggerType { return this.dto.type; }
  get fixedTime(): ReminderContracts.FixedTimeTrigger | null { return this.dto.fixedTime ?? null; }
  get interval(): ReminderContracts.IntervalTrigger | null { return this.dto.interval ?? null; }
  get displayText(): string { return this.dto.displayText; }

  // ===== 业务方法 =====
  public equals(other: ReminderContracts.TriggerConfig): boolean {
    return JSON.stringify(this.dto) === JSON.stringify((other as TriggerConfig).dto);
  }

  public toDTO(): TriggerConfigDTO {
    return this.dto;
  }

  public toServerDTO(): TriggerConfigServerDTO {
    return {
      type: this.dto.type,
      fixedTime: this.dto.fixedTime,
      interval: this.dto.interval,
    };
  }

  // ===== 静态工厂方法 =====
  public static fromDTO(dto: TriggerConfigDTO): TriggerConfig {
    return new TriggerConfig(dto);
  }

  public static fromServerDTO(dto: TriggerConfigServerDTO): TriggerConfig {
    // 从 ServerDTO 转换，添加 displayText
    return new TriggerConfig({
      type: dto.type,
      fixedTime: dto.fixedTime,
      interval: dto.interval,
      displayText: dto.fixedTime 
        ? `每天 ${dto.fixedTime.time}` 
        : dto.interval 
        ? `每 ${dto.interval.minutes} 分钟` 
        : '未设置',
    });
  }
}
