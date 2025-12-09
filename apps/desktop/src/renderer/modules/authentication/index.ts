/**
 * Authentication Module - Renderer
 *
 * 认证模块 - 渲染进程
 * 遵循 DDD 分层架构
 */

// ===== Application Layer =====
export { AuthApplicationService } from './application/services/AuthApplicationService';

// ===== Presentation Layer =====
// Hooks
export { useAuth, type AuthUser, type AuthState } from './presentation/hooks/useAuth';

// ===== Initialization =====
export {
  registerAuthenticationModule,
  registerAuthenticationModule as registerAuthModule,
  initializeAuthenticationModule,
  initializeAuthenticationModule as initializeAuthModule,
} from './initialization';
