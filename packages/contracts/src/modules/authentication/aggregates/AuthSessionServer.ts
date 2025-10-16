/**
 * AuthSession Entity - Server Interface
 * 会话实体 - 服务端接口
 */

import type { RefreshTokenServer } from '../entities/RefreshTokenServer';
import type { DeviceInfoServer } from '../value-objects/DeviceInfoServer';
import type { SessionHistoryServer } from '../entities/SessionHistoryServer';
import type { AuthSessionClientDTO } from './AuthSessionClient';

// ============ DTO 定义 ============

/**
 * AuthSession Server DTO
 */
export interface AuthSessionServerDTO {
  uuid: string;
  accountUuid: string;
  accessToken: string;
  accessTokenExpiresAt: number;
  refreshToken: RefreshTokenServer;
  device: DeviceInfoServer;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'LOCKED';
  ipAddress: string;
  location?: {
    country?: string | null;
    region?: string | null;
    city?: string | null;
    timezone?: string | null;
  } | null;
  lastActivityAt: number;
  lastActivityType?: string | null;
  history: SessionHistoryServer[];
  createdAt: number;
  expiresAt: number;
  revokedAt?: number | null;
}

/**
 * AuthSession Persistence DTO
 */
export interface AuthSessionPersistenceDTO {
  uuid: string;
  account_uuid: string;
  access_token: string;
  access_token_expires_at: number;
  refresh_token: string; // JSON
  device: string; // JSON
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'LOCKED';
  ip_address: string;
  location?: string | null; // JSON
  last_activity_at: number;
  last_activity_type?: string | null;
  history: string; // JSON
  created_at: number;
  expires_at: number;
  revoked_at?: number | null;
}

// ============ 实体接口 ============

export interface AuthSessionServer {
  uuid: string;
  accountUuid: string;
  accessToken: string;
  accessTokenExpiresAt: number;
  refreshToken: RefreshTokenServer;
  device: DeviceInfoServer;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'LOCKED';
  ipAddress: string;
  location?: {
    country?: string | null;
    region?: string | null;
    city?: string | null;
    timezone?: string | null;
  } | null;
  lastActivityAt: number;
  lastActivityType?: string | null;
  history: SessionHistoryServer[];
  createdAt: number;
  expiresAt: number;
  revokedAt?: number | null;

  refreshAccessToken(newToken: string, expiresInMinutes: number): void;
  refreshRefreshToken(): void;
  isAccessTokenExpired(): boolean;
  isRefreshTokenExpired(): boolean;
  isValid(): boolean;
  recordActivity(activityType: string): void;
  updateDeviceInfo(device: Partial<DeviceInfoServer>): void;
  revoke(): void;
  lock(): void;
  activate(): void;
  extend(hours: number): void;

  toServerDTO(): AuthSessionServerDTO;
  toClientDTO(): AuthSessionClientDTO;
  toPersistenceDTO(): AuthSessionPersistenceDTO;
}

export interface AuthSessionServerStatic {
  create(params: {
    accountUuid: string;
    accessToken: string;
    refreshToken: string;
    device: DeviceInfoServer;
    ipAddress: string;
    location?: {
      country?: string;
      region?: string;
      city?: string;
      timezone?: string;
    };
  }): AuthSessionServer;
  fromServerDTO(dto: AuthSessionServerDTO): AuthSessionServer;
  fromPersistenceDTO(dto: AuthSessionPersistenceDTO): AuthSessionServer;
}
