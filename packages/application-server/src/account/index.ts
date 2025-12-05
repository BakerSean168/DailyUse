/**
 * Account Application Module (Server)
 *
 * 提供 Account 模块的所有 Services
 */

// ===== Container (from infrastructure-server) =====
export { AccountContainer } from '@dailyuse/infrastructure-server';

// ===== Services =====
export * from './services';

// Legacy placeholder (to be removed)
export const ACCOUNT_MODULE_PLACEHOLDER = 'account-module';
