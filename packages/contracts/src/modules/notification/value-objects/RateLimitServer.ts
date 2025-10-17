/**
 * RateLimit Value Object (Server)
 * ��P6<�a - 
��
 */

import type { RateLimitClientDTO } from './RateLimitClient.ts';
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
 * RateLimit Persistence DTO
 */
export interface RateLimitPersistenceDTO {
  enabled: boolean;
  maxPerHour: number;
  maxPerDay: number;
}

// ============ {��� ============

export type RateLimitServer = IRateLimitServer;
