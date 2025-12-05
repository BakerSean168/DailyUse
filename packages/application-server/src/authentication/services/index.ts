/**
 * Authentication Module - Services Index
 */

// ============ Login & Session ============
export { Login, login, type LoginInput, type LoginOutput } from './login';
export { Logout, logout, type LogoutInput } from './logout';
export { Register, register, type RegisterInput, type RegisterOutput } from './register';
export { RefreshToken, refreshToken, type RefreshTokenInput, type RefreshTokenOutput } from './refresh-token';

// ============ Password ============
export { ChangePassword, changePassword, type ChangePasswordInput } from './change-password';
export { ForgotPassword, forgotPassword, type ForgotPasswordInput } from './forgot-password';
export { ResetPassword, resetPassword, type ResetPasswordInput } from './reset-password';

// ============ 2FA ============
export { Enable2FA, enable2FA, type Enable2FAInput, type Enable2FAOutput } from './enable-2fa';
export { Verify2FA, verify2FA, type Verify2FAInput } from './verify-2fa';
export { Disable2FA, disable2FA, type Disable2FAInput } from './disable-2fa';

// ============ Session Management ============
export { GetActiveSessions, getActiveSessions, type GetActiveSessionsInput, type GetActiveSessionsOutput } from './get-active-sessions';
export { RevokeSession, revokeSession, type RevokeSessionInput } from './revoke-session';
export { RevokeAllSessions, revokeAllSessions, type RevokeAllSessionsInput } from './revoke-all-sessions';

// ============ API Keys ============
export { CreateApiKey, createApiKey, type CreateApiKeyInput, type CreateApiKeyOutput } from './create-api-key';
export { ListApiKeys, listApiKeys, type ListApiKeysInput, type ListApiKeysOutput } from './list-api-keys';
export { RevokeApiKey, revokeApiKey, type RevokeApiKeyInput } from './revoke-api-key';
