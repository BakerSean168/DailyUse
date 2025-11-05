import type { Request, Response } from 'express';
import { ReminderApplicationService } from '../../application/services/ReminderApplicationService';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';
import type { AuthenticatedRequest } from '../../../../shared/middlewares/authMiddleware';

const logger = createLogger('ReminderGroupController');

/**
 * ReminderGroup 控制器
 * 负责处理提醒分组相关的 HTTP 请求
 *
 * 职责：
 * - 解析 HTTP 请求参数
 * - 调用应用服务处理业务逻辑
 * - 格式化响应（统一使用 ResponseBuilder）
 * - 异常处理和错误响应
 */
export class ReminderGroupController {
  private static reminderService: ReminderApplicationService | null = null;
  private static responseBuilder = createResponseBuilder();

  /**
   * 初始化应用服务（延迟加载）
   */
  private static async getReminderService(): Promise<ReminderApplicationService> {
    if (!ReminderGroupController.reminderService) {
      ReminderGroupController.reminderService = await ReminderApplicationService.getInstance();
    }
    return ReminderGroupController.reminderService;
  }

  /**
   * 创建提醒分组
   * @route POST /api/reminders/groups
   */
  static async createReminderGroup(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = (req as AuthenticatedRequest).accountUuid;

      if (!accountUuid) {
        return ReminderGroupController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'User not authenticated',
        });
      }

      const service = await ReminderGroupController.getReminderService();
      logger.info('Creating reminder group', { accountUuid });

      const group = await service.createReminderGroup({
        ...req.body,
        accountUuid,
      });

      logger.info('Reminder group created successfully', { groupUuid: group.uuid });
      return ReminderGroupController.responseBuilder.sendSuccess(
        res,
        group,
        'Reminder group created successfully',
        201,
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error creating reminder group', { error: error.message });
        return ReminderGroupController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return ReminderGroupController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取分组详情
   * @route GET /api/reminders/groups/:uuid
   */
  static async getReminderGroup(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;

      const service = await ReminderGroupController.getReminderService();
      const group = await service.getReminderGroup(uuid);

      if (!group) {
        logger.warn('Reminder group not found', { uuid });
        return ReminderGroupController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Reminder group not found',
        });
      }

      return ReminderGroupController.responseBuilder.sendSuccess(
        res,
        group,
        'Reminder group retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error retrieving reminder group', { error: error.message });
        return ReminderGroupController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return ReminderGroupController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取当前用户的所有分组（从 token 中提取 accountUuid）
   * @route GET /api/reminders/groups
   */
  static async getUserReminderGroupsByToken(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = (req as AuthenticatedRequest).accountUuid;

      if (!accountUuid) {
        return ReminderGroupController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'User not authenticated',
        });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;

      const service = await ReminderGroupController.getReminderService();
      const groups = await service.getUserReminderGroups(accountUuid);

      logger.info('Retrieved reminder groups for user', {
        accountUuid,
        count: groups.length,
      });

      // 实现简单的分页
      const total = groups.length;
      const paginatedGroups = limit ? groups.slice((page - 1) * limit, page * limit) : groups;

      return ReminderGroupController.responseBuilder.sendSuccess(
        res,
        {
          groups: paginatedGroups,
          total,
          page,
          pageSize: limit || total,
          hasMore: limit ? page * limit < total : false,
        },
        'Reminder groups retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error retrieving user reminder groups by token', {
          error: error.message,
        });
        return ReminderGroupController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return ReminderGroupController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取用户的所有分组（通过路径参数）
   * @route GET /api/reminders/groups/user/:accountUuid
   */
  static async getUserReminderGroups(req: Request, res: Response): Promise<Response> {
    try {
      const { accountUuid } = req.params;

      const service = await ReminderGroupController.getReminderService();
      const groups = await service.getUserReminderGroups(accountUuid);

      return ReminderGroupController.responseBuilder.sendSuccess(
        res,
        groups,
        'Reminder groups retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error retrieving user reminder groups', { error: error.message });
        return ReminderGroupController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return ReminderGroupController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 更新分组
   * @route PATCH /api/reminders/groups/:uuid
   */
  static async updateReminderGroup(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const service = await ReminderGroupController.getReminderService();

      logger.info('Updating reminder group', { uuid });
      const group = await service.updateReminderGroup(uuid, req.body);

      logger.info('Reminder group updated successfully', { uuid });
      return ReminderGroupController.responseBuilder.sendSuccess(
        res,
        group,
        'Reminder group updated successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error updating reminder group', { error: error.message });
        return ReminderGroupController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return ReminderGroupController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 删除分组
   * @route DELETE /api/reminders/groups/:uuid
   */
  static async deleteReminderGroup(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;

      const service = await ReminderGroupController.getReminderService();
      await service.deleteReminderGroup(uuid);

      logger.info('Reminder group deleted successfully', { uuid });
      return ReminderGroupController.responseBuilder.sendSuccess(
        res,
        null,
        'Reminder group deleted successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error deleting reminder group', { error: error.message });
        return ReminderGroupController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return ReminderGroupController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 切换分组启用状态
   * @route POST /api/reminders/groups/:uuid/toggle-status
   */
  static async toggleReminderGroupStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;

      const service = await ReminderGroupController.getReminderService();
      logger.info('Toggling reminder group status', { uuid });

      const group = await service.toggleReminderGroupStatus(uuid);

      logger.info('Reminder group status toggled successfully', { 
        uuid, 
        newStatus: group.enabled 
      });
      return ReminderGroupController.responseBuilder.sendSuccess(
        res,
        group,
        `Reminder group ${group.enabled ? 'enabled' : 'disabled'} successfully`,
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error toggling reminder group status', { error: error.message });
        return ReminderGroupController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return ReminderGroupController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 切换分组控制模式
   * @route POST /api/reminders/groups/:uuid/toggle-control-mode
   */
  static async toggleReminderGroupControlMode(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;

      const service = await ReminderGroupController.getReminderService();
      logger.info('Toggling reminder group control mode', { uuid });

      const group = await service.toggleReminderGroupControlMode(uuid);

      logger.info('Reminder group control mode toggled successfully', { 
        uuid, 
        newMode: group.controlMode 
      });
      return ReminderGroupController.responseBuilder.sendSuccess(
        res,
        group,
        `Switched to ${group.controlMode === 'GROUP' ? 'group' : 'individual'} control mode`,
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error toggling reminder group control mode', { error: error.message });
        return ReminderGroupController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return ReminderGroupController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }
}
