/**
 * ActiveHoursConfig 值对象实现 (Client)
 */

import { ReminderContracts } from '@dailyuse/contracts';

type ActiveHoursConfigClientDTO = ReminderContracts.ActiveHoursConfigClientDTO;
type ActiveHoursConfigServerDTO = ReminderContracts.ActiveHoursConfigServerDTO;

export class ActiveHoursConfigClient implements ReminderContracts.ActiveHoursConfigClient {
  private readonly dto: ActiveHoursConfigClientDTO;

  private constructor(dto: ActiveHoursConfigClientDTO) {
    this.dto = dto;
  }

  get enabled(): boolean { return this.dto.enabled; }
  get startHour(): number { return this.dto.startHour; }
  get endHour(): number { return this.dto.endHour; }
  get displayText(): string { return this.dto.displayText; }

  public equals(other: ReminderContracts.ActiveHoursConfigClient): boolean {
    return JSON.stringify(this.dto) === JSON.stringify((other as ActiveHoursConfigClient).dto);
  }

  public toServerDTO(): ActiveHoursConfigServerDTO {
    return {
      enabled: this.dto.enabled,
      startHour: this.dto.startHour,
      endHour: this.dto.endHour,
    };
  }

  public toClientDTO(): ActiveHoursConfigClientDTO {
    return this.dto;
  }

  public static fromClientDTO(dto: ActiveHoursConfigClientDTO): ActiveHoursConfigClient {
    return new ActiveHoursConfigClient(dto);
  }

  public static fromServerDTO(dto: ActiveHoursConfigServerDTO): ActiveHoursConfigClient {
    const clientDTO: ActiveHoursConfigClientDTO = {
      ...dto,
      displayText: dto.enabled 
        ? `活跃时间：${dto.startHour}:00 - ${dto.endHour}:00`
        : '全天活跃',
    };
    return new ActiveHoursConfigClient(clientDTO);
  }

  public static toClientDTO(instance: ActiveHoursConfigClient): ActiveHoursConfigClientDTO {
    return instance.dto;
  }
}
