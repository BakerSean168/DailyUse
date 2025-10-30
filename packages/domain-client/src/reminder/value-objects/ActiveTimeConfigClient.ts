/**
 * ActiveTimeConfig 值对象实现 (Client)
 */

import { ReminderContracts } from '@dailyuse/contracts';

type ActiveTimeConfigClientDTO = ReminderContracts.ActiveTimeConfigClientDTO;
type ActiveTimeConfigServerDTO = ReminderContracts.ActiveTimeConfigServerDTO;

export class ActiveTimeConfigClient implements ReminderContracts.ActiveTimeConfigClient {
  private readonly dto: ActiveTimeConfigClientDTO;

  private constructor(dto: ActiveTimeConfigClientDTO) {
    this.dto = dto;
  }

  get startDate(): number { return this.dto.startDate; }
  get endDate(): number | null { return this.dto.endDate ?? null; }
  get displayText(): string { return this.dto.displayText; }
  get isActive(): boolean { return this.dto.isActive; }

  public equals(other: ReminderContracts.ActiveTimeConfigClient): boolean {
    return JSON.stringify(this.dto) === JSON.stringify((other as ActiveTimeConfigClient).dto);
  }

  public toClientDTO(): ActiveTimeConfigClientDTO {
    return this.dto;
  }

  public toServerDTO(): ActiveTimeConfigServerDTO {
    return {
      startDate: this.dto.startDate,
      endDate: this.dto.endDate,
    };
  }

  public static fromClientDTO(dto: ActiveTimeConfigClientDTO): ActiveTimeConfigClient {
    return new ActiveTimeConfigClient(dto);
  }

  public static fromServerDTO(dto: ActiveTimeConfigServerDTO): ActiveTimeConfigClient {
    const now = Date.now();
    const isActive = dto.startDate <= now && (!dto.endDate || dto.endDate >= now);
    return new ActiveTimeConfigClient({
      startDate: dto.startDate,
      endDate: dto.endDate,
      displayText: isActive ? '生效中' : '未生效',
      isActive,
    });
  }
}
