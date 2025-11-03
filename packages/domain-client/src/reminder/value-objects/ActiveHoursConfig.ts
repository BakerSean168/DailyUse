/**
 * ActiveHoursConfig 值对象实现 ()
 */

import { ReminderContracts } from '@dailyuse/contracts';

type ActiveHoursConfigDTO = ReminderContracts.ActiveHoursConfigDTO;
type ActiveHoursConfigServerDTO = ReminderContracts.ActiveHoursConfigServerDTO;

export class ActiveHoursConfig implements ReminderContracts.ActiveHoursConfig {
  private readonly dto: ActiveHoursConfigDTO;

  private constructor(dto: ActiveHoursConfigDTO) {
    this.dto = dto;
  }

  get enabled(): boolean { return this.dto.enabled; }
  get startHour(): number { return this.dto.startHour; }
  get endHour(): number { return this.dto.endHour; }
  get displayText(): string { return this.dto.displayText; }

  public equals(other: ReminderContracts.ActiveHoursConfig): boolean {
    return JSON.stringify(this.dto) === JSON.stringify((other as ActiveHoursConfig).dto);
  }

  public toServerDTO(): ActiveHoursConfigServerDTO {
    return {
      enabled: this.dto.enabled,
      startHour: this.dto.startHour,
      endHour: this.dto.endHour,
    };
  }

  public toDTO(): ActiveHoursConfigDTO {
    return this.dto;
  }

  public static fromDTO(dto: ActiveHoursConfigDTO): ActiveHoursConfig {
    return new ActiveHoursConfig(dto);
  }

  public static fromServerDTO(dto: ActiveHoursConfigServerDTO): ActiveHoursConfig {
    const clientDTO: ActiveHoursConfigDTO = {
      ...dto,
      displayText: dto.enabled 
        ? `活跃时间：${dto.startHour}:00 - ${dto.endHour}:00`
        : '全天活跃',
    };
    return new ActiveHoursConfig(clientDTO);
  }

  public static toDTO(instance: ActiveHoursConfig): ActiveHoursConfigDTO {
    return instance.dto;
  }
}
