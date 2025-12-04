/**
 * Authentication Module - Application Services
 */

// ============ Events ============
export { AUTH_EVENTS, type AuthEvent } from './auth-events';

// ============ Individual Use Cases ============

// Login Use Cases
export { Login, login, type LoginInput } from './login';
export { Logout, logout, type LogoutInput } from './logout';
export { RefreshToken, refreshToken, type RefreshTokenInput } from './refresh-token';

// Registration Use Cases
export { Register, register, type RegisterInput } from './register';

// Password Use Cases
export { ForgotPassword, forgotPassword, type ForgotPasswordInput } from './forgot-password';
export { ResetPassword, resetPassword, type ResetPasswordInput } from './reset-password';
export { ChangePassword, changePassword, type ChangePasswordInput } from './change-password';

// 2FA Use Cases
export { Enable2FA, enable2FA, type Enable2FAInput } from './enable-2fa';
export { Disable2FA, disable2FA, type Disable2FAInput } from './disable-2fa';
export { Verify2FA, verify2FA, type Verify2FAInput } from './verify-2fa';

// Session Use Cases
export { GetActiveSessions, getActiveSessions, type GetActiveSessionsInput } from './get-active-sessions';
export { RevokeSession, revokeSession, type RevokeSessionInput } from './revoke-session';
export { RevokeAllSessions, revokeAllSessions, type RevokeAllSessionsInput } from './revoke-all-sessions';

// Device Use Cases
export { GetTrustedDevices, getTrustedDevices } from './get-trusted-devices';
export { TrustDevice, trustDevice, type TrustDeviceInput } from './trust-device';
export { RevokeTrustedDevice, revokeTrustedDevice, type RevokeTrustedDeviceInput } from './revoke-trusted-device';

// API Key Use Cases
export { CreateApiKey, createApiKey, type CreateApiKeyInput } from './create-api-key';
export { ListApiKeys, listApiKeys } from './list-api-keys';
export { RevokeApiKey, revokeApiKey, type RevokeApiKeyInput } from './revoke-api-key';

// ============ Legacy Application Services (for backward compatibility) ============

// Login & Authentication
export { LoginApplicationService, createLoginApplicationService } from './LoginApplicationService';

// Registration
export {
  RegistrationApplicationService,
  createRegistrationApplicationService,
} from './RegistrationApplicationService';

// Password & 2FA
export {
  PasswordApplicationService,
  createPasswordApplicationService,
} from './PasswordApplicationService';

// Session & Device Management
export {
  SessionApplicationService,
  createSessionApplicationService,
} from './SessionApplicationService';

// API Key Management
export { ApiKeyApplicationService, createApiKeyApplicationService } from './ApiKeyApplicationService';
