/**
 * RateLimit 值对象实现 (Client)
 */

import type {
  RateLimitClient as IRateLimitClient,
  RateLimitClientDTO,
  RateLimitServerDTO,
} from '@dailyuse/contracts/notification';

export class RateLimitClient implements IRateLimitClient {
  private readonly dto: RateLimitClientDTO;

  private constructor(dto: RateLimitClientDTO) {
    this.dto = dto;
  }

  get enabled(): boolean { return this.dto.enabled; }
  get maxPerHour(): number { return this.dto.maxPerHour; }
  get maxPerDay(): number { return this.dto.maxPerDay; }
  get limitText(): string { return this.dto.limitText; }

  public equals(other: RateLimitClient): boolean {
    return JSON.stringify(this.dto) === JSON.stringify((other as RateLimitClient).dto);
  }

  public toClientDTO(): RateLimitClientDTO {
    return this.dto;
  }

  public toServerDTO(): RateLimitServerDTO {
    return {
      enabled: this.dto.enabled,
      maxPerHour: this.dto.maxPerHour,
      maxPerDay: this.dto.maxPerDay,
    };
  }

  public static fromClientDTO(dto: RateLimitClientDTO): RateLimitClient {
    return new RateLimitClient(dto);
  }

  public static fromServerDTO(dto: RateLimitServerDTO): RateLimitClient {
    const clientDTO: RateLimitClientDTO = {
      ...dto,
      limitText: dto.enabled 
        ? `每小时最多 ${dto.maxPerHour} 次，每天最多 ${dto.maxPerDay} 次`
        : '无限制',
    };
    return new RateLimitClient(clientDTO);
  }
}
