/**
 * RateLimit Value Object (Server)
 * ��P6<�a - ��
 */

// ============ ��I ============

/**
 * ��P6 - Server ��
 */
export interface IRateLimitServer {
  enabled: boolean;
  maxPerHour: number;
  maxPerDay: number;

  // <�a��
  equals(other: IRateLimitServer): boolean;
  with(
    updates: Partial<
      Omit<IRateLimitServer, 'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'>
    >,
  ): IRateLimitServer;

  // DTO lb��
  toServerDTO(): RateLimitServerDTO;
  toClientDTO(): RateLimitClientDTO;
  toPersistenceDTO(): RateLimitPersistenceDTO;
}

// ============ DTO �I ============

/**
 * RateLimit Server DTO
 */
export interface RateLimitServerDTO {
  enabled: boolean;
  maxPerHour: number;
  maxPerDay: number;
}

/**
 * RateLimit Client DTO ((� Server -> Client lb)
 */
export interface RateLimitClientDTO {
  enabled: boolean;
  maxPerHour: number;
  maxPerDay: number;
  limitText: string;
}

/**
 * RateLimit Persistence DTO
 */
export interface RateLimitPersistenceDTO {
  enabled: boolean;
  max_per_hour: number;
  max_per_day: number;
}

// ============ {��� ============

export type RateLimitServer = IRateLimitServer;
