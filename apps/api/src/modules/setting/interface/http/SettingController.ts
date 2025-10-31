// @ts-nocheck
import type { Request, Response } from 'express';
import { SettingApplicationService } from '../../application/services/SettingApplicationService';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';
import type { AuthenticatedRequest } from '../../../../shared/middlewares/authMiddleware';

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

      logger.info('Updating user settings', { accountUuid });

      const settings = await service.updateUserSetting(accountUuid, req.body);

      logger.info('User settings updated successfully', { accountUuid });
      return SettingController.responseBuilder.sendSuccess(res, settings);
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
}
