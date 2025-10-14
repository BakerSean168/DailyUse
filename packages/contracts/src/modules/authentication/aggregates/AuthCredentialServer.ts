/**
 * AuthCredential Entity - Server Interface
 * 认证凭证实体 - 服务端接口
 */

import type { PasswordCredentialServer } from '../entities/PasswordCredentialServer';
import type { ApiKeyCredentialServer } from '../entities/ApiKeyCredentialServer';
import type { RememberMeTokenServer } from '../entities/RememberMeTokenServer';
import type { CredentialHistoryServer } from '../entities/CredentialHistoryServer';

// ============ DTO 定义 ============

/**
 * AuthCredential Server DTO
 */
export interface AuthCredentialServerDTO {
  uuid: string;
  accountUuid: string;
  type: 'PASSWORD' | 'API_KEY' | 'BIOMETRIC' | 'MAGIC_LINK' | 'HARDWARE_KEY';
  passwordCredential?: PasswordCredentialServer | null;
  apiKeyCredentials: ApiKeyCredentialServer[];
  rememberMeTokens: RememberMeTokenServer[];
  twoFactor?: {
    enabled: boolean;
    secret?: string | null;
    backupCodes: string[];
    method: 'TOTP' | 'SMS' | 'EMAIL' | 'AUTHENTICATOR_APP';
    verifiedAt?: number | null;
  } | null;
  biometric?: {
    enabled: boolean;
    type: 'FINGERPRINT' | 'FACE_ID' | 'TOUCH_ID';
    deviceId?: string | null;
    enrolledAt?: number | null;
  } | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED';
  security: {
    requirePasswordChange: boolean;
    passwordExpiresAt?: number | null;
    failedLoginAttempts: number;
    lastFailedLoginAt?: number | null;
    lockedUntil?: number | null;
    lastPasswordChangeAt?: number | null;
  };
  history: CredentialHistoryServer[];
  createdAt: number;
  updatedAt: number;
}

/**
 * AuthCredential Persistence DTO
 */
export interface AuthCredentialPersistenceDTO {
  uuid: string;
  account_uuid: string;
  type: 'PASSWORD' | 'API_KEY' | 'BIOMETRIC' | 'MAGIC_LINK' | 'HARDWARE_KEY';
  password_credential?: string | null; // JSON
  api_key_credentials: string; // JSON
  remember_me_tokens: string; // JSON
  two_factor?: string | null; // JSON
  biometric?: string | null; // JSON
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED';
  security: string; // JSON
  history: string; // JSON
  created_at: number;
  updated_at: number;
}

// ============ 实体接口 ============

export interface AuthCredentialServer {
  uuid: string;
  accountUuid: string;
  type: 'PASSWORD' | 'API_KEY' | 'BIOMETRIC' | 'MAGIC_LINK' | 'HARDWARE_KEY';
  passwordCredential?: PasswordCredentialServer | null;
  apiKeyCredentials: ApiKeyCredentialServer[];
  rememberMeTokens: RememberMeTokenServer[];
  twoFactor?: {
    enabled: boolean;
    secret?: string | null;
    backupCodes: string[];
    method: 'TOTP' | 'SMS' | 'EMAIL' | 'AUTHENTICATOR_APP';
    verifiedAt?: number | null;
  } | null;
  biometric?: {
    enabled: boolean;
    type: 'FINGERPRINT' | 'FACE_ID' | 'TOUCH_ID';
    deviceId?: string | null;
    enrolledAt?: number | null;
  } | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED';
  security: {
    requirePasswordChange: boolean;
    passwordExpiresAt?: number | null;
    failedLoginAttempts: number;
    lastFailedLoginAt?: number | null;
    lockedUntil?: number | null;
    lastPasswordChangeAt?: number | null;
  };
  history: CredentialHistoryServer[];
  createdAt: number;
  updatedAt: number;

  // Password methods
  setPassword(hashedPassword: string): void;
  verifyPassword(hashedPassword: string): boolean;
  requirePasswordChange(): void;

  // Remember-Me Token methods
  generateRememberMeToken(deviceInfo: any, expiresInDays?: number): RememberMeTokenServer;
  verifyRememberMeToken(token: string, deviceFingerprint: string): RememberMeTokenServer | null;
  refreshRememberMeToken(oldToken: string, deviceFingerprint: string): RememberMeTokenServer | null;
  revokeRememberMeToken(tokenUuid: string): void;
  revokeAllRememberMeTokens(): void;
  revokeRememberMeTokensByDevice(deviceId: string): void;
  cleanupExpiredRememberMeTokens(): void;

  // API Key methods
  generateApiKey(name: string, expiresInDays?: number): ApiKeyCredentialServer;
  revokeApiKey(keyUuid: string): void;

  // Two-Factor methods
  enableTwoFactor(method: 'TOTP' | 'SMS' | 'EMAIL' | 'AUTHENTICATOR_APP'): string;
  disableTwoFactor(): void;
  verifyTwoFactorCode(code: string): boolean;
  generateBackupCodes(): string[];
  useBackupCode(code: string): boolean;

  // Biometric methods
  enrollBiometric(type: 'FINGERPRINT' | 'FACE_ID' | 'TOUCH_ID', deviceId: string): void;
  revokeBiometric(): void;

  // Security methods
  recordFailedLogin(): void;
  resetFailedAttempts(): void;
  isLocked(): boolean;
  suspend(): void;
  activate(): void;
  revoke(): void;

  toServerDTO(): AuthCredentialServerDTO;
  toPersistenceDTO(): AuthCredentialPersistenceDTO;
}

export interface AuthCredentialServerStatic {
  create(params: {
    accountUuid: string;
    type: 'PASSWORD' | 'API_KEY' | 'BIOMETRIC' | 'MAGIC_LINK' | 'HARDWARE_KEY';
    hashedPassword?: string;
  }): AuthCredentialServer;
  fromServerDTO(dto: AuthCredentialServerDTO): AuthCredentialServer;
  fromPersistenceDTO(dto: AuthCredentialPersistenceDTO): AuthCredentialServer;
}
