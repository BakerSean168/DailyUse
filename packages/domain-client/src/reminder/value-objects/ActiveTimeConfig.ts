/**
 * ActiveTimeConfig 值对象实现 ()
 */

import { ReminderContracts } from '@dailyuse/contracts';

type ActiveTimeConfigDTO = ReminderContracts.ActiveTimeConfigDTO;
type ActiveTimeConfigServerDTO = ReminderContracts.ActiveTimeConfigServerDTO;

export class ActiveTimeConfig implements ReminderContracts.ActiveTimeConfig {
  private readonly dto: ActiveTimeConfigDTO;

  private constructor(dto: ActiveTimeConfigDTO) {
    this.dto = dto;
  }

  get startDate(): number { return this.dto.startDate; }
  get endDate(): number | null { return this.dto.endDate ?? null; }
  get displayText(): string { return this.dto.displayText; }
  get isActive(): boolean { return this.dto.isActive; }

  public equals(other: ReminderContracts.ActiveTimeConfig): boolean {
    return JSON.stringify(this.dto) === JSON.stringify((other as ActiveTimeConfig).dto);
  }

  public toDTO(): ActiveTimeConfigDTO {
    return this.dto;
  }

  public toServerDTO(): ActiveTimeConfigServerDTO {
    return {
      startDate: this.dto.startDate,
      endDate: this.dto.endDate,
    };
  }

  public static fromDTO(dto: ActiveTimeConfigDTO): ActiveTimeConfig {
    return new ActiveTimeConfig(dto);
  }

  public static fromServerDTO(dto: ActiveTimeConfigServerDTO): ActiveTimeConfig {
    const now = Date.now();
    const isActive = dto.startDate <= now && (!dto.endDate || dto.endDate >= now);
    return new ActiveTimeConfig({
      startDate: dto.startDate,
      endDate: dto.endDate,
      displayText: isActive ? '生效中' : '未生效',
      isActive,
    });
  }
}
