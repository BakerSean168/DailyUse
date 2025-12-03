// @ts-nocheck
import type { Request, Response } from 'express';
import { SettingApplicationService } from '../../application/services/SettingApplicationService';
import { SettingCloudSyncService } from '../../application/services/SettingCloudSyncService';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';
import type { AuthenticatedRequest } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';

const logger = createLogger('SettingController');

/**
 * Setting 控制器
 * 负责处理 HTTP 请求和响应，协调应用服务
 *
 * 职责：
 * - 解析 HTTP 请求参数
 * - 调用应用服务处理业务逻辑
 * - 格式化响应（统一使用 ResponseBuilder）
 * - 异常处理和错误响应
 */
export class SettingController {
  private static settingService: SettingApplicationService | null = null;
  private static syncService: SettingCloudSyncService | null = null;
  private static responseBuilder = createResponseBuilder();

  /**
   * 初始化应用服务（延迟加载）
   */
  private static async getSettingService(): Promise<SettingApplicationService> {
    if (!SettingController.settingService) {
      SettingController.settingService = await SettingApplicationService.getInstance();
    }
    return SettingController.settingService;
  }

  /**
   * 初始化云同步服务（延迟加载）
   */
  private static getSyncService(): SettingCloudSyncService {
    if (!SettingController.syncService) {
      SettingController.syncService = new SettingCloudSyncService();
    }
    return SettingController.syncService;
  }

  /**
   * 获取当前用户设置
   * @route GET /api/settings/me
   */
  static async getCurrentSettings(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const service = await SettingController.getSettingService();

      const accountUuid = req.user?.accountUuid;
      if (!accountUuid) {
        return SettingController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      logger.info('Getting user settings', { accountUuid });

      const settings = await service.getUserSetting(accountUuid);

      logger.info('User settings retrieved successfully', { accountUuid });
      return SettingController.responseBuilder.sendSuccess(res, settings);
    } catch (error: any) {
      logger.error('Failed to get user settings', { error: error.message });
      return SettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error.message || 'Failed to get user settings',
      });
    }
  }

  /**
   * 更新当前用户设置
   * @route PUT /api/settings/me
   * 
   * 📝 最佳实践：返回轻量级响应（只返回 success + updatedAt）
   * - 减少网络传输
   * - 前端使用乐观更新，只需要知道成功/失败
   */
  static async updateSettings(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const service = await SettingController.getSettingService();

      const accountUuid = req.user?.accountUuid;
      if (!accountUuid) {
        return SettingController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      logger.info('Updating user settings', { accountUuid, updates: req.body });

      const settings = await service.updateUserSetting(accountUuid, req.body);

      logger.info('User settings updated successfully', { accountUuid });

      // 【轻量级响应】只返回必要信息
      const lightweightResponse = {
        success: true,
        updatedAt: settings.updatedAt,
        // 可选：返回被更新的字段，用于前端验证
        updated: req.body,
      };

      return SettingController.responseBuilder.sendSuccess(res, lightweightResponse);
    } catch (error: any) {
      logger.error('Failed to update user settings', { error: error.message });
      return SettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error.message || 'Failed to update user settings',
      });
    }
  }

  /**
   * 重置用户设置为默认值
   * @route POST /api/settings/reset
   */
  static async resetSettings(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const service = await SettingController.getSettingService();

      const accountUuid = req.user?.accountUuid;
      if (!accountUuid) {
        return SettingController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      logger.info('Resetting user settings', { accountUuid });

      const settings = await service.resetUserSetting(accountUuid);

      logger.info('User settings reset successfully', { accountUuid });
      return SettingController.responseBuilder.sendSuccess(res, settings);
    } catch (error: any) {
      logger.error('Failed to reset user settings', { error: error.message });
      return SettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error.message || 'Failed to reset user settings',
      });
    }
  }

  /**
   * 获取默认设置
   * @route GET /api/settings/defaults
   */
  static async getDefaultSettings(req: Request, res: Response): Promise<Response> {
    try {
      const service = await SettingController.getSettingService();

      logger.info('Getting default settings');

      const defaults = await service.getDefaultSettings();

      logger.info('Default settings retrieved successfully');
      return SettingController.responseBuilder.sendSuccess(res, defaults);
    } catch (error: any) {
      logger.error('Failed to get default settings', { error: error.message });
      return SettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error.message || 'Failed to get default settings',
      });
    }
  }

  /**
   * 导出用户设置为 JSON
   * @route GET /api/settings/export
   */
  static async exportSettings(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const service = await SettingController.getSettingService();

      const accountUuid = req.user?.accountUuid;
      if (!accountUuid) {
        return SettingController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      logger.info('Exporting user settings', { accountUuid });

      const exportData = await service.exportSettings(accountUuid);

      logger.info('User settings exported successfully', { accountUuid });

      // 设置响应头，提示浏览器下载文件
      const filename = `dailyuse-settings-${new Date().toISOString().split('T')[0]}.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      return res.status(200).json(exportData);
    } catch (error: any) {
      logger.error('Failed to export user settings', { error: error.message });
      return SettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error.message || 'Failed to export user settings',
      });
    }
  }

  /**
   * 导入用户设置
   * @route POST /api/settings/import
   */
  static async importSettings(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const service = await SettingController.getSettingService();

      const accountUuid = req.user?.accountUuid;
      if (!accountUuid) {
        return SettingController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      const { data, options } = req.body;

      if (!data) {
        return SettingController.responseBuilder.sendError(res, {
          code: ResponseCode.BAD_REQUEST,
          message: 'Import data is required',
        });
      }

      logger.info('Importing user settings', { accountUuid, merge: options?.merge });

      const settings = await service.importSettings(accountUuid, data, options);

      logger.info('User settings imported successfully', { accountUuid });
      return SettingController.responseBuilder.sendSuccess(res, settings);
    } catch (error: any) {
      logger.error('Failed to import user settings', { 
        accountUuid: req.user?.accountUuid,
        error: error.message 
      });
      return SettingController.responseBuilder.sendError(res, {
        code: ResponseCode.BAD_REQUEST,
        message: error.message || 'Failed to import user settings',
      });
    }
  }

  /**
   * 保存设置版本快照
   * @route POST /api/settings/sync/save-version
   */
  static async saveSettingVersion(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const syncService = SettingController.getSyncService();
      const accountUuid = req.user?.accountUuid;
      if (!accountUuid) {
        return SettingController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      const { deviceId, deviceName, snapshot } = req.body;
      logger.info('Saving setting version', { accountUuid, deviceId });

      const version = await syncService.saveSettingVersion(
        accountUuid,
        deviceId,
        deviceName,
        snapshot
      );

      logger.info('Setting version saved successfully', { accountUuid });
      return SettingController.responseBuilder.sendSuccess(res, version);
    } catch (error: any) {
      logger.error('Failed to save setting version', { error: error.message });
      return SettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error.message || 'Failed to save setting version',
      });
    }
  }

  /**
   * 获取设置版本历史
   * @route GET /api/settings/sync/history
   */
  static async getSettingHistory(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const syncService = SettingController.getSyncService();
      const accountUuid = req.user?.accountUuid;
      if (!accountUuid) {
        return SettingController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      const limit = parseInt(req.query.limit as string) || 10;
      logger.info('Getting setting history', { accountUuid, limit });

      const history = await syncService.getSettingHistory(accountUuid, limit);

      logger.info('Setting history retrieved successfully', { accountUuid });
      return SettingController.responseBuilder.sendSuccess(res, history);
    } catch (error: any) {
      logger.error('Failed to get setting history', { error: error.message });
      return SettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error.message || 'Failed to get setting history',
      });
    }
  }

  /**
   * 恢复设置版本
   * @route POST /api/settings/sync/restore
   */
  static async restoreSettingVersion(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const syncService = SettingController.getSyncService();
      const service = await SettingController.getSettingService();
      const accountUuid = req.user?.accountUuid;
      if (!accountUuid) {
        return SettingController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      const { versionUuid } = req.body;
      logger.info('Restoring setting version', { accountUuid, versionUuid });

      const restored = await syncService.restoreSettingVersion(accountUuid, versionUuid);
      // Also update the current settings
      if (restored) {
        await service.updateUserSetting(accountUuid, restored.settingSnapshot);
      }

      logger.info('Setting version restored successfully', { accountUuid });
      return SettingController.responseBuilder.sendSuccess(res, restored);
    } catch (error: any) {
      logger.error('Failed to restore setting version', { error: error.message });
      return SettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error.message || 'Failed to restore setting version',
      });
    }
  }

  /**
   * 解决设置冲突
   * @route POST /api/settings/sync/resolve-conflict
   */
  static async resolveConflict(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const syncService = SettingController.getSyncService();
      const accountUuid = req.user?.accountUuid;
      if (!accountUuid) {
        return SettingController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      const { local, remote, strategy } = req.body;
      logger.info('Resolving setting conflict', { accountUuid, strategy });

      const resolved = await syncService.resolveConflict(
        accountUuid,
        local,
        remote,
        strategy
      );

      logger.info('Setting conflict resolved successfully', { accountUuid });
      return SettingController.responseBuilder.sendSuccess(res, resolved);
    } catch (error: any) {
      logger.error('Failed to resolve conflict', { error: error.message });
      return SettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error.message || 'Failed to resolve conflict',
      });
    }
  }

  /**
   * 获取同步状态
   * @route GET /api/settings/sync/status
   */
  static async getSyncStatus(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const syncService = SettingController.getSyncService();
      const accountUuid = req.user?.accountUuid;
      if (!accountUuid) {
        return SettingController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      logger.info('Getting sync status', { accountUuid });

      const status = await syncService.getSyncStatus(accountUuid);

      logger.info('Sync status retrieved successfully', { accountUuid });
      return SettingController.responseBuilder.sendSuccess(res, status);
    } catch (error: any) {
      logger.error('Failed to get sync status', { error: error.message });
      return SettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error.message || 'Failed to get sync status',
      });
    }
  }

  /**
   * 清理旧版本
   * @route DELETE /api/settings/sync/cleanup
   */
  static async cleanupVersions(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const syncService = SettingController.getSyncService();
      const accountUuid = req.user?.accountUuid;
      if (!accountUuid) {
        return SettingController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      const keepCount = parseInt(req.query.keepCount as string) || 10;
      logger.info('Cleaning up versions', { accountUuid, keepCount });

      const result = await syncService.cleanupOldVersions(accountUuid, keepCount);

      logger.info('Versions cleaned up successfully', { accountUuid });
      return SettingController.responseBuilder.sendSuccess(res, result);
    } catch (error: any) {
      logger.error('Failed to cleanup versions', { error: error.message });
      return SettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error.message || 'Failed to cleanup versions',
      });
    }
  }
}


