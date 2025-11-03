/**
 * RecurrenceConfig 值对象实现 ()
 */

import { ReminderContracts } from '@dailyuse/contracts';

type RecurrenceConfigDTO = ReminderContracts.RecurrenceConfigDTO;
type RecurrenceConfigServerDTO = ReminderContracts.RecurrenceConfigServerDTO;
type RecurrenceType = ReminderContracts.RecurrenceType;
type DailyRecurrence = ReminderContracts.DailyRecurrence;
type WeeklyRecurrence = ReminderContracts.WeeklyRecurrence;
type CustomDaysRecurrence = ReminderContracts.CustomDaysRecurrence;

export class RecurrenceConfig implements ReminderContracts.RecurrenceConfig {
  private readonly dto: RecurrenceConfigDTO;

  private constructor(dto: RecurrenceConfigDTO) {
    this.dto = dto;
  }

  // ===== Getters =====
  get type(): RecurrenceType { return this.dto.type; }
  get daily(): DailyRecurrence | null { return this.dto.daily ?? null; }
  get weekly(): WeeklyRecurrence | null { return this.dto.weekly ?? null; }
  get customDays(): CustomDaysRecurrence | null { return this.dto.customDays ?? null; }
  get displayText(): string { return this.dto.displayText; }

  // ===== 业务方法 =====
  public equals(other: ReminderContracts.RecurrenceConfig): boolean {
    return JSON.stringify(this.dto) === JSON.stringify((other as RecurrenceConfig).dto);
  }

  public toDTO(): RecurrenceConfigDTO {
    return this.dto;
  }

  public toServerDTO(): RecurrenceConfigServerDTO {
    return {
      type: this.dto.type,
      daily: this.dto.daily,
      weekly: this.dto.weekly,
      customDays: this.dto.customDays,
    };
  }

  // ===== 静态工厂方法 =====
  public static fromDTO(dto: RecurrenceConfigDTO): RecurrenceConfig {
    return new RecurrenceConfig(dto);
  }

  public static fromServerDTO(dto: RecurrenceConfigServerDTO): RecurrenceConfig {
    // 从 ServerDTO 转换为 DTO
    let displayText = '';
    if (dto.type === ReminderContracts.RecurrenceType.DAILY && dto.daily) {
      displayText = `每 ${dto.daily.interval || 1} 天`;
    } else if (dto.type === ReminderContracts.RecurrenceType.WEEKLY && dto.weekly) {
      displayText = `每周`;
    } else if (dto.type === ReminderContracts.RecurrenceType.CUSTOM_DAYS && dto.customDays) {
      displayText = `自定义`;
    }
    
    return new RecurrenceConfig({
      type: dto.type,
      daily: dto.daily,
      weekly: dto.weekly,
      customDays: dto.customDays,
      displayText,
    });
  }
}

