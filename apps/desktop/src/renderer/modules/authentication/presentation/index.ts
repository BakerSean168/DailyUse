/**
 * Auth Presentation Layer - Index
 */

// Hooks - 导出 useAuth 和其类型
export { useAuth } from './hooks';
export type { AuthUser, AuthState, UseAuthReturn } from './hooks';

// Stores - 导出 store 相关类型 (排除 AuthState 避免冲突)
export {
  useAuthStore,
  type User as AuthStoreUser,
  type AuthActions,
} from './stores';

// Views
export * from './views';
