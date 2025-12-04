/**
 * Authentication Events
 *
 * 认证模块事件常量
 */

/**
 * Authentication Events
 */
export const AUTH_EVENTS = {
  // Login Events
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_LOGIN_FAILED: 'auth:login:failed',

  // Session Events
  SESSION_REFRESH: 'auth:session:refresh',
  SESSION_EXPIRED: 'auth:session:expired',
  SESSION_REVOKED: 'auth:session:revoked',
  ALL_SESSIONS_REVOKED: 'auth:session:all-revoked',

  // Registration Events
  AUTH_REGISTER: 'auth:register',
  AUTH_REGISTER_FAILED: 'auth:register:failed',

  // Password Events
  PASSWORD_FORGOT: 'auth:password:forgot',
  PASSWORD_RESET: 'auth:password:reset',
  PASSWORD_CHANGED: 'auth:password:changed',

  // 2FA Events
  TWO_FA_ENABLED: 'auth:2fa:enabled',
  TWO_FA_DISABLED: 'auth:2fa:disabled',
  TWO_FA_VERIFIED: 'auth:2fa:verified',

  // Device Events
  DEVICE_TRUSTED: 'auth:device:trusted',
  DEVICE_REVOKED: 'auth:device:revoked',

  // API Key Events
  API_KEY_CREATED: 'auth:api-key:created',
  API_KEY_REVOKED: 'auth:api-key:revoked',
} as const;

export type AuthEvent = (typeof AUTH_EVENTS)[keyof typeof AUTH_EVENTS];
