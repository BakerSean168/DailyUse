/**
 * Account Module - Renderer
 *
 * 账户模块 - 渲染进程
 * 遵循 DDD 分层架构
 */

// ===== Application Layer =====
export { AccountApplicationService } from './application/services/AccountApplicationService';

// ===== Presentation Layer =====
// Hooks
export { useAccount, type UseAccountReturn, type AccountState } from './presentation/hooks/useAccount';
export { useAccountProfile } from './presentation/hooks/useAccountProfile';

// Views (按需导出)
// export { AccountProfileView } from './presentation/views/AccountProfileView';

// ===== Initialization =====
export { registerAccountModule, initializeAccountModule } from './initialization';
