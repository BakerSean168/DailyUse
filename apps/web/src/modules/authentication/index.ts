/**
 * Authentication Web Module
 * 认证 Web 模块导出
 */

// 应用层服务
export * from './application/services';

// 应用层事件
export {
  AUTH_EVENTS,
  publishUserLoggedInEvent,
  publishUserLoggedOutEvent,
  publishAuthStateChangedEvent,
  publishTokenRefreshedEvent,
  type UserLoggedInEventPayload,
  type UserLoggedOutEventPayload,
  type AuthStateChangedEventPayload,
  type TokenRefreshedEventPayload,
} from './application/events/authEvents';

// 基础设施层 API 客户端
export * from './infrastructure/api';

// 展示层
export { useAuthStore } from './presentation/stores/authStore';
export { useAuth } from './presentation/composables/useAuth';

// 初始化
export { registerAuthenticationInitializationTasks } from './initialization/authenticationInitialization';

