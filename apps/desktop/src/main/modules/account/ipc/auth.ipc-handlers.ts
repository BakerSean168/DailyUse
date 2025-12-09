/**
 * Auth Module IPC Handlers
 *
 * Auth 模块 IPC 处理器
 * 复用 AuthDesktopApplicationService 中的逻辑
 */

import { ipcMain } from 'electron';
import { createLogger } from '@dailyuse/utils';

import { AuthDesktopApplicationService } from '../application/AuthDesktopApplicationService';

const logger = createLogger('AuthIpcHandlers');

// 惰性初始化的服务实例
let appService: AuthDesktopApplicationService | null = null;

function getAppService(): AuthDesktopApplicationService {
  if (!appService) {
    appService = new AuthDesktopApplicationService();
  }
  return appService;
}

// 所有 IPC channel 名称
const IPC_CHANNELS = [
  // Core Auth
  'auth:login',
  'auth:register',
  'auth:logout',
  'auth:refresh-token',
  'auth:verify-token',
  'auth:get-status',
  // 2FA
  'auth:2fa:enable',
  'auth:2fa:disable',
  'auth:2fa:verify',
  'auth:2fa:get-status',
  'auth:2fa:generate-backup-codes',
  // API Keys
  'auth:api-key:create',
  'auth:api-key:list',
  'auth:api-key:revoke',
  'auth:api-key:rotate',
  // Sessions
  'auth:session:list',
  'auth:session:get-current',
  'auth:session:revoke',
  'auth:session:revoke-all',
  // Devices
  'auth:device:list',
  'auth:device:get-current',
  'auth:device:revoke',
  'auth:device:rename',
] as const;

/**
 * 注册 Auth 模块的 IPC 处理器
 */
export function registerAuthIpcHandlers(): void {
  logger.info('Registering Auth IPC handlers...');

  // ============================================
  // Core Auth Handlers
  // ============================================

  ipcMain.handle('auth:login', async (_, request: { email: string; password: string }) => {
    try {
      return await getAppService().login(request);
    } catch (error) {
      logger.error('Failed to login', error);
      throw error;
    }
  });

  ipcMain.handle('auth:register', async (_, request: { email: string; password: string; username?: string }) => {
    try {
      return await getAppService().register(request);
    } catch (error) {
      logger.error('Failed to register', error);
      throw error;
    }
  });

  ipcMain.handle('auth:logout', async () => {
    try {
      return await getAppService().logout();
    } catch (error) {
      logger.error('Failed to logout', error);
      throw error;
    }
  });

  ipcMain.handle('auth:refresh-token', async () => {
    try {
      return await getAppService().refreshToken();
    } catch (error) {
      logger.error('Failed to refresh token', error);
      throw error;
    }
  });

  ipcMain.handle('auth:verify-token', async (_, token: string) => {
    try {
      return await getAppService().verifyToken(token);
    } catch (error) {
      logger.error('Failed to verify token', error);
      throw error;
    }
  });

  ipcMain.handle('auth:get-status', async () => {
    try {
      return await getAppService().getStatus();
    } catch (error) {
      logger.error('Failed to get auth status', error);
      throw error;
    }
  });

  // ============================================
  // 2FA Handlers
  // ============================================

  ipcMain.handle('auth:2fa:enable', async (_, method: string = 'totp') => {
    try {
      return await getAppService().enable2FA(method);
    } catch (error) {
      logger.error('Failed to enable 2FA', error);
      throw error;
    }
  });

  ipcMain.handle('auth:2fa:disable', async () => {
    try {
      return await getAppService().disable2FA();
    } catch (error) {
      logger.error('Failed to disable 2FA', error);
      throw error;
    }
  });

  ipcMain.handle('auth:2fa:verify', async (_, code: string) => {
    try {
      return await getAppService().verify2FA(code);
    } catch (error) {
      logger.error('Failed to verify 2FA', error);
      throw error;
    }
  });

  ipcMain.handle('auth:2fa:get-status', async () => {
    try {
      return await getAppService().get2FAStatus();
    } catch (error) {
      logger.error('Failed to get 2FA status', error);
      throw error;
    }
  });

  ipcMain.handle('auth:2fa:generate-backup-codes', async () => {
    try {
      return await getAppService().generateBackupCodes();
    } catch (error) {
      logger.error('Failed to generate backup codes', error);
      throw error;
    }
  });

  // ============================================
  // API Key Handlers
  // ============================================

  ipcMain.handle('auth:api-key:create', async (_, request: { name: string; permissions?: string[] }) => {
    try {
      return await getAppService().createApiKey(request);
    } catch (error) {
      logger.error('Failed to create API key', error);
      throw error;
    }
  });

  ipcMain.handle('auth:api-key:list', async () => {
    try {
      return await getAppService().listApiKeys();
    } catch (error) {
      logger.error('Failed to list API keys', error);
      throw error;
    }
  });

  ipcMain.handle('auth:api-key:revoke', async (_, keyId: string) => {
    try {
      return await getAppService().revokeApiKey(keyId);
    } catch (error) {
      logger.error('Failed to revoke API key', error);
      throw error;
    }
  });

  ipcMain.handle('auth:api-key:rotate', async (_, keyId: string) => {
    try {
      return await getAppService().rotateApiKey(keyId);
    } catch (error) {
      logger.error('Failed to rotate API key', error);
      throw error;
    }
  });

  // ============================================
  // Session Handlers
  // ============================================

  ipcMain.handle('auth:session:list', async () => {
    try {
      return await getAppService().listSessions();
    } catch (error) {
      logger.error('Failed to list sessions', error);
      throw error;
    }
  });

  ipcMain.handle('auth:session:get-current', async () => {
    try {
      return await getAppService().getCurrentSession();
    } catch (error) {
      logger.error('Failed to get current session', error);
      throw error;
    }
  });

  ipcMain.handle('auth:session:revoke', async (_, sessionId: string) => {
    try {
      return await getAppService().revokeSession(sessionId);
    } catch (error) {
      logger.error('Failed to revoke session', error);
      throw error;
    }
  });

  ipcMain.handle('auth:session:revoke-all', async () => {
    try {
      return await getAppService().revokeAllSessions();
    } catch (error) {
      logger.error('Failed to revoke all sessions', error);
      throw error;
    }
  });

  // ============================================
  // Device Handlers
  // ============================================

  ipcMain.handle('auth:device:list', async () => {
    try {
      return await getAppService().listDevices();
    } catch (error) {
      logger.error('Failed to list devices', error);
      throw error;
    }
  });

  ipcMain.handle('auth:device:get-current', async () => {
    try {
      return await getAppService().getCurrentDevice();
    } catch (error) {
      logger.error('Failed to get current device', error);
      throw error;
    }
  });

  ipcMain.handle('auth:device:revoke', async (_, deviceId: string) => {
    try {
      return await getAppService().revokeDevice(deviceId);
    } catch (error) {
      logger.error('Failed to revoke device', error);
      throw error;
    }
  });

  ipcMain.handle('auth:device:rename', async (_, deviceId: string, name: string) => {
    try {
      return await getAppService().renameDevice(deviceId, name);
    } catch (error) {
      logger.error('Failed to rename device', error);
      throw error;
    }
  });

  logger.info(`Auth IPC handlers registered (${IPC_CHANNELS.length} channels)`);
}

/**
 * 注销 Auth 模块的 IPC 处理器
 */
export function unregisterAuthIpcHandlers(): void {
  logger.info('Unregistering Auth IPC handlers...');

  for (const channel of IPC_CHANNELS) {
    ipcMain.removeHandler(channel);
  }

  // Reset service instance
  appService = null;

  logger.info('Auth IPC handlers unregistered');
}
