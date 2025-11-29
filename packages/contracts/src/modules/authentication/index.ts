/**
 * Authentication Module Exports
 * 认证模块 - 显式导出
 */

// ============ Enums ============
export {
  CredentialType,
  CredentialStatus,
  PasswordAlgorithm,
  TwoFactorMethod,
  BiometricType,
  ApiKeyStatus,
  RememberMeTokenStatus,
  DeviceType,
  SessionStatus,
} from './enums';

// ============ Aggregates ============
export type {
  AuthCredentialServerDTO,
  AuthCredentialPersistenceDTO,
  AuthCredentialServer,
  AuthCredentialServerStatic,
} from './aggregates/AuthCredentialServer';

export type {
  AuthCredentialClientDTO,
  AuthCredentialClient,
  AuthCredentialClientStatic,
} from './aggregates/AuthCredentialClient';

export type {
  AuthSessionServerDTO,
  AuthSessionPersistenceDTO,
  AuthSessionServer,
  AuthSessionServerStatic,
} from './aggregates/AuthSessionServer';

export type {
  AuthSessionClientDTO,
  AuthSessionClient,
  AuthSessionClientStatic,
} from './aggregates/AuthSessionClient';

// ============ Entities ============
export type {
  PasswordCredentialServerDTO,
  PasswordCredentialPersistenceDTO,
  PasswordCredentialServer,
  PasswordCredentialServerStatic,
} from './entities/PasswordCredentialServer';

export type {
  PasswordCredentialClientDTO,
  PasswordCredentialClient,
  PasswordCredentialClientStatic,
} from './entities/PasswordCredentialClient';

export type {
  ApiKeyCredentialServerDTO,
  ApiKeyCredentialPersistenceDTO,
  ApiKeyCredentialServer,
  ApiKeyCredentialServerStatic,
} from './entities/ApiKeyCredentialServer';

export type {
  ApiKeyCredentialClientDTO,
  ApiKeyCredentialClient,
  ApiKeyCredentialClientStatic,
} from './entities/ApiKeyCredentialClient';

export type {
  RememberMeTokenServerDTO,
  RememberMeTokenPersistenceDTO,
  RememberMeTokenServer,
  RememberMeTokenServerStatic,
} from './entities/RememberMeTokenServer';

export type {
  RememberMeTokenClientDTO,
  RememberMeTokenClient,
  RememberMeTokenClientStatic,
} from './entities/RememberMeTokenClient';

export type {
  CredentialHistoryServerDTO,
  CredentialHistoryPersistenceDTO,
  CredentialHistoryServer,
  CredentialHistoryServerStatic,
} from './entities/CredentialHistoryServer';

export type {
  CredentialHistoryClientDTO,
  CredentialHistoryClient,
  CredentialHistoryClientStatic,
} from './entities/CredentialHistoryClient';

export type {
  RefreshTokenServerDTO,
  RefreshTokenPersistenceDTO,
  RefreshTokenServer,
  RefreshTokenServerStatic,
} from './entities/RefreshTokenServer';

export type {
  RefreshTokenClientDTO,
  RefreshTokenClient,
  RefreshTokenClientStatic,
} from './entities/RefreshTokenClient';

export type {
  SessionHistoryServerDTO,
  SessionHistoryPersistenceDTO,
  SessionHistoryServer,
  SessionHistoryServerStatic,
} from './entities/SessionHistoryServer';

export type {
  SessionHistoryClientDTO,
  SessionHistoryClient,
  SessionHistoryClientStatic,
} from './entities/SessionHistoryClient';

// ============ Value Objects ============
export type {
  DeviceInfoServerDTO,
  DeviceInfoServer,
  DeviceInfoServerStatic,
} from './value-objects/DeviceInfoServer';

export type {
  DeviceInfoClientDTO,
  DeviceInfoClient,
  DeviceInfoClientStatic,
} from './value-objects/DeviceInfoClient';

// ============ API Requests/Responses ============
export type {
  AuthTokens,
  LoginRequest,
  LoginResponseDTO,
  RegisterRequest,
  RefreshTokenRequest,
  RefreshTokenResponseDTO,
  LogoutRequest,
  ChangePasswordRequest,
  ResetPasswordRequest,
  ForgotPasswordRequest,
  Enable2FARequest,
  Enable2FAResponseDTO,
  Verify2FARequest,
  Disable2FARequest,
  CreateApiKeyRequest,
  CreateApiKeyResponseDTO,
  RevokeApiKeyRequest,
  ApiKeyListResponseDTO,
  GetActiveSessionsRequest,
  ActiveSessionsResponseDTO,
  RevokeSessionRequest,
  RevokeAllSessionsRequest,
  TrustDeviceRequest,
  RevokeTrustedDeviceRequest,
  TrustedDevicesResponseDTO,
  SessionQueryParams,
  CredentialQueryParams,
} from './api-requests';

// ============ DTO Aliases (for backward compatibility) ============
// Web 应用使用 *RequestDTO 命名，提供别名兼容
export type { LoginRequest as LoginRequestDTO } from './api-requests';
export type { RegisterRequest as RegisterRequestDTO } from './api-requests';
export type { LogoutRequest as LogoutRequestDTO } from './api-requests';
export type { ChangePasswordRequest as ChangePasswordRequestDTO } from './api-requests';
export type { ResetPasswordRequest as ResetPasswordRequestDTO } from './api-requests';
export type { ForgotPasswordRequest as ForgotPasswordRequestDTO } from './api-requests';
export type { Enable2FARequest as Enable2FARequestDTO } from './api-requests';
export type { Verify2FARequest as Verify2FARequestDTO } from './api-requests';
export type { Disable2FARequest as Disable2FARequestDTO } from './api-requests';
export type { CreateApiKeyRequest as CreateApiKeyRequestDTO } from './api-requests';
export type { RevokeApiKeyRequest as RevokeApiKeyRequestDTO } from './api-requests';
export type { GetActiveSessionsRequest as GetActiveSessionsRequestDTO } from './api-requests';
export type { RevokeSessionRequest as RevokeSessionRequestDTO } from './api-requests';
export type { RevokeAllSessionsRequest as RevokeAllSessionsRequestDTO } from './api-requests';
export type { TrustDeviceRequest as TrustDeviceRequestDTO } from './api-requests';
export type { RevokeTrustedDeviceRequest as RevokeTrustedDeviceRequestDTO } from './api-requests';
