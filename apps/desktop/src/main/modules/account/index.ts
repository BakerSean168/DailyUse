/**
 * Account Module - Desktop Main Process
 *
 * 账户与认证模块 - 注册 IPC handlers 和生命周期管理
 *
 * @module account
 */

import { InitializationManager, InitializationPhase, createLogger } from '@dailyuse/utils';
import {
  registerAccountIpcHandlers,
  unregisterAccountIpcHandlers,
} from './ipc/account.ipc-handlers';
import {
  registerAuthIpcHandlers,
  unregisterAuthIpcHandlers,
} from './ipc/auth.ipc-handlers';

const logger = createLogger('AccountModule');

/**
 * 注册 Account 模块到初始化管理器
 *
 * Priority: 130 (after AI module)
 * Dependencies: infrastructure (10), database (20)
 */
export function registerAccountModule(): void {
  logger.info('Registering Account module...');

  InitializationManager.getInstance().registerTask({
    name: 'account-module',
    phase: InitializationPhase.APP_STARTUP,
    priority: 130, // After AI module (120)

    async initialize() {
      logger.info('Initializing Account module...');

      try {
        // Register IPC handlers
        registerAccountIpcHandlers();
        registerAuthIpcHandlers();

        logger.info('Account module initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize Account module', error);
        throw error;
      }
    },

    async cleanup() {
      logger.info('Cleaning up Account module...');

      try {
        // Unregister IPC handlers
        unregisterAccountIpcHandlers();
        unregisterAuthIpcHandlers();

        logger.info('Account module cleaned up successfully');
      } catch (error) {
        logger.error('Failed to cleanup Account module', error);
      }
    },
  });

  logger.info('Account module registered');
}

// Re-export application services
export { AccountDesktopApplicationService } from './application/AccountDesktopApplicationService';
export { AuthDesktopApplicationService } from './application/AuthDesktopApplicationService';

// Re-export IPC handlers for direct use if needed
export {
  registerAccountIpcHandlers,
  unregisterAccountIpcHandlers,
} from './ipc/account.ipc-handlers';
export {
  registerAuthIpcHandlers,
  unregisterAuthIpcHandlers,
} from './ipc/auth.ipc-handlers';
