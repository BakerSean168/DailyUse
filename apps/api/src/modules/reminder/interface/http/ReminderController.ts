import type { Request, Response } from 'express';
import { ReminderApplicationService } from '../../application/services/ReminderApplicationService';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ReminderController');

/**
 * Reminder 控制器
 * 负责处理 HTTP 请求和响应，协调应用服务
 *
 * 职责：
 * - 解析 HTTP 请求参数
 * - 调用应用服务处理业务逻辑
 * - 格式化响应（统一使用 ResponseBuilder）
 * - 异常处理和错误响应
 */
export class ReminderController {
  private static reminderService: ReminderApplicationService | null = null;
  private static responseBuilder = createResponseBuilder();

  /**
   * 初始化应用服务（延迟加载）
   */
  private static async getReminderService(): Promise<ReminderApplicationService> {
    if (!ReminderController.reminderService) {
      ReminderController.reminderService = await ReminderApplicationService.getInstance();
    }
    return ReminderController.reminderService;
  }

  /**
   * 创建提醒模板
   * @route POST /api/reminders/templates
   */
  static async createReminderTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const service = await ReminderController.getReminderService();
      logger.info('Creating reminder template', { accountUuid: req.body.accountUuid });

      const template = await service.createReminderTemplate(req.body);

      logger.info('Reminder template created successfully', { templateUuid: template.uuid });
      return ReminderController.responseBuilder.sendSuccess(
        res,
        template,
        'Reminder template created successfully',
        201,
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error creating reminder template', { error: error.message });
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return ReminderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取提醒模板详情
   * @route GET /api/reminders/templates/:uuid
   */
  static async getReminderTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;

      const service = await ReminderController.getReminderService();
      const template = await service.getReminderTemplate(uuid);

      if (!template) {
        logger.warn('Reminder template not found', { uuid });
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Reminder template not found',
        });
      }

      return ReminderController.responseBuilder.sendSuccess(
        res,
        template,
        'Reminder template retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error retrieving reminder template', { error: error.message });
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return ReminderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取用户的所有提醒模板
   * @route GET /api/reminders/templates/user/:accountUuid
   */
  static async getUserReminderTemplates(req: Request, res: Response): Promise<Response> {
    try {
      const { accountUuid } = req.params;

      const service = await ReminderController.getReminderService();
      const templates = await service.getUserReminderTemplates(accountUuid);

      return ReminderController.responseBuilder.sendSuccess(
        res,
        templates,
        'Reminder templates retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error retrieving user reminder templates', { error: error.message });
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return ReminderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 更新提醒模板
   * @route PATCH /api/reminders/templates/:uuid
   */
  static async updateReminderTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const service = await ReminderController.getReminderService();

      logger.info('Updating reminder template', { uuid });
      const template = await service.updateReminderTemplate(uuid, req.body);

      logger.info('Reminder template updated successfully', { uuid });
      return ReminderController.responseBuilder.sendSuccess(
        res,
        template,
        'Reminder template updated successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error updating reminder template', { error: error.message });
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return ReminderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 删除提醒模板
   * @route DELETE /api/reminders/templates/:uuid
   */
  static async deleteReminderTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;

      const service = await ReminderController.getReminderService();
      await service.deleteReminderTemplate(uuid);

      logger.info('Reminder template deleted successfully', { uuid });
      return ReminderController.responseBuilder.sendSuccess(
        res,
        null,
        'Reminder template deleted successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error deleting reminder template', { error: error.message });
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return ReminderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 切换提醒模板启用状态
   * @route POST /api/reminders/templates/:uuid/toggle
   */
  static async toggleReminderTemplateStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;

      const service = await ReminderController.getReminderService();
      const template = await service.toggleReminderTemplateStatus(uuid);

      logger.info('Reminder template status toggled', { uuid });
      return ReminderController.responseBuilder.sendSuccess(
        res,
        template,
        'Reminder template status toggled successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error toggling reminder template status', { error: error.message });
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return ReminderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 搜索提醒模板
   * @route GET /api/reminders/templates/search
   */
  static async searchReminderTemplates(req: Request, res: Response): Promise<Response> {
    try {
      const { accountUuid, query } = req.query;

      if (!accountUuid || !query) {
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'Missing required query params: accountUuid, query',
        });
      }

      const service = await ReminderController.getReminderService();
      const templates = await service.searchReminderTemplates(
        accountUuid as string,
        query as string,
      );

      return ReminderController.responseBuilder.sendSuccess(
        res,
        templates,
        'Reminder templates searched successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error searching reminder templates', { error: error.message });
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return ReminderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取提醒统计
   * @route GET /api/reminders/statistics/:accountUuid
   */
  static async getReminderStatistics(req: Request, res: Response): Promise<Response> {
    try {
      const { accountUuid } = req.params;

      const service = await ReminderController.getReminderService();
      const statistics = await service.getReminderStatistics(accountUuid);

      return ReminderController.responseBuilder.sendSuccess(
        res,
        statistics,
        'Reminder statistics retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error retrieving reminder statistics', { error: error.message });
        return ReminderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return ReminderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }
}
