/**
 * CategoryPreference Value Object (Server)
 * {O}<�a - ��
 */

import type { ImportanceLevel } from '../enums';

// ============ q�{��I ============

/**
 *  SO}�n
 */
export interface ChannelPreference {
  inApp: boolean;
  email: boolean;
  push: boolean;
  sms: boolean;
}

// ============ ��I ============

/**
 * {O} - Server ��
 */
export interface ICategoryPreferenceServer {
  enabled: boolean;
  channels: ChannelPreference;
  importance: ImportanceLevel[]; // �6�́'�+��

  // <�a��
  equals(other: ICategoryPreferenceServer): boolean;
  with(
    updates: Partial<
      Omit<
        ICategoryPreferenceServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): ICategoryPreferenceServer;

  // DTO lb��
  toServerDTO(): CategoryPreferenceServerDTO;
  toClientDTO(): CategoryPreferenceClientDTO;
  toPersistenceDTO(): CategoryPreferencePersistenceDTO;
}

// ============ DTO �I ============

/**
 * CategoryPreference Server DTO
 */
export interface CategoryPreferenceServerDTO {
  enabled: boolean;
  channels: ChannelPreference;
  importance: ImportanceLevel[];
}

/**
 * CategoryPreference Client DTO ((� Server -> Client lb)
 */
export interface CategoryPreferenceClientDTO {
  enabled: boolean;
  channels: ChannelPreference;
  importance: ImportanceLevel[];
  enabledChannelsCount: number;
  enabledChannelsList: string[];
  importanceText: string;
}

/**
 * CategoryPreference Persistence DTO
 */
export interface CategoryPreferencePersistenceDTO {
  enabled: boolean;
  channels: string; // JSON.stringify(ChannelPreference)
  importance: string; // JSON.stringify(ImportanceLevel[])
}

// ============ {��� ============

export type CategoryPreferenceServer = ICategoryPreferenceServer;
