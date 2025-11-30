import type { Request, Response } from 'express';
import { NotificationApplicationService } from '../../application/services/NotificationApplicationService';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('NotificationController');

/**
 * Notification 控制器
 */
export class NotificationController {
  private static notificationService: NotificationApplicationService | null = null;
  private static responseBuilder = createResponseBuilder();

  private static async getNotificationService(): Promise<NotificationApplicationService> {
    if (!NotificationController.notificationService) {
      NotificationController.notificationService =
        await NotificationApplicationService.getInstance();
    }
    return NotificationController.notificationService;
  }

  /**
   * 创建通知
   * @route POST /api/notifications
   */
  static async createNotification(req: Request, res: Response): Promise<Response> {
    try {
      const service = await NotificationController.getNotificationService();
      const notification = await service.createNotification(req.body);
      logger.info('Notification created successfully', { uuid: notification.uuid });
      return NotificationController.responseBuilder.sendSuccess(
        res,
        notification,
        'Notification created successfully',
        201,
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error creating notification', { error: error.message });
        return NotificationController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return NotificationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 从模板创建通知
   * @route POST /api/notifications/from-template
   */
  static async createFromTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const service = await NotificationController.getNotificationService();
      const notification = await service.createNotificationFromTemplate(req.body);
      return NotificationController.responseBuilder.sendSuccess(
        res,
        notification,
        'Notification created from template',
        201,
      );
    } catch (error) {
      if (error instanceof Error) {
        return NotificationController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return NotificationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 批量发送通知
   * @route POST /api/notifications/bulk
   */
  static async sendBulk(req: Request, res: Response): Promise<Response> {
    try {
      const service = await NotificationController.getNotificationService();
      const notifications = await service.sendBulkNotifications(req.body.notifications);
      return NotificationController.responseBuilder.sendSuccess(
        res,
        notifications,
        `${notifications.length} notifications sent`,
        201,
      );
    } catch (error) {
      if (error instanceof Error) {
        return NotificationController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return NotificationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取通知详情
   * @route GET /api/notifications/:uuid
   */
  static async getNotification(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const includeChildren = req.query.includeChildren === 'true';
      const service = await NotificationController.getNotificationService();
      const notification = await service.getNotification(uuid, { includeChildren });

      if (!notification) {
        return NotificationController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Notification not found',
        });
      }

      return NotificationController.responseBuilder.sendSuccess(
        res,
        notification,
        'Notification retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        return NotificationController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return NotificationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取用户的通知列表
   * @route GET /api/notifications/user/:accountUuid
   */
  static async getUserNotifications(req: Request, res: Response): Promise<Response> {
    try {
      const { accountUuid } = req.params;
      const { includeRead, limit, offset } = req.query;
      const service = await NotificationController.getNotificationService();
      const notifications = await service.getUserNotifications(accountUuid, {
        includeRead: includeRead === 'true',
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });
      return NotificationController.responseBuilder.sendSuccess(
        res,
        notifications,
        'Notifications retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        return NotificationController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return NotificationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取未读通知
   * @route GET /api/notifications/user/:accountUuid/unread
   */
  static async getUnreadNotifications(req: Request, res: Response): Promise<Response> {
    try {
      const { accountUuid } = req.params;
      const { limit } = req.query;
      const service = await NotificationController.getNotificationService();
      const notifications = await service.getUnreadNotifications(accountUuid, {
        limit: limit ? parseInt(limit as string) : undefined,
      });
      return NotificationController.responseBuilder.sendSuccess(
        res,
        notifications,
        'Unread notifications retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        return NotificationController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return NotificationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取未读通知数量
   * @route GET /api/notifications/user/:accountUuid/unread-count
   */
  static async getUnreadCount(req: Request, res: Response): Promise<Response> {
    try {
      const { accountUuid } = req.params;
      const service = await NotificationController.getNotificationService();
      const count = await service.getUnreadCount(accountUuid);
      return NotificationController.responseBuilder.sendSuccess(
        res,
        { count },
        'Unread count retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        return NotificationController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return NotificationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取分类统计
   * @route GET /api/notifications/user/:accountUuid/stats
   */
  static async getCategoryStats(req: Request, res: Response): Promise<Response> {
    try {
      const { accountUuid } = req.params;
      const service = await NotificationController.getNotificationService();
      const stats = await service.getCategoryStats(accountUuid);
      return NotificationController.responseBuilder.sendSuccess(
        res,
        stats,
        'Category stats retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        return NotificationController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return NotificationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 标记通知为已读
   * @route PATCH /api/notifications/:uuid/read
   */
  static async markAsRead(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const service = await NotificationController.getNotificationService();
      await service.markAsRead(uuid);
      return NotificationController.responseBuilder.sendSuccess(
        res,
        null,
        'Notification marked as read',
      );
    } catch (error) {
      if (error instanceof Error) {
        return NotificationController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return NotificationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 批量标记为已读
   * @route PATCH /api/notifications/read/many
   */
  static async markManyAsRead(req: Request, res: Response): Promise<Response> {
    try {
      const { uuids } = req.body;
      const service = await NotificationController.getNotificationService();
      await service.markManyAsRead(uuids);
      return NotificationController.responseBuilder.sendSuccess(
        res,
        null,
        'Notifications marked as read',
      );
    } catch (error) {
      if (error instanceof Error) {
        return NotificationController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return NotificationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 标记所有通知为已读
   * @route PATCH /api/notifications/user/:accountUuid/read-all
   */
  static async markAllAsRead(req: Request, res: Response): Promise<Response> {
    try {
      const { accountUuid } = req.params;
      const service = await NotificationController.getNotificationService();
      await service.markAllAsRead(accountUuid);
      return NotificationController.responseBuilder.sendSuccess(
        res,
        null,
        'All notifications marked as read',
      );
    } catch (error) {
      if (error instanceof Error) {
        return NotificationController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return NotificationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 删除通知
   * @route DELETE /api/notifications/:uuid
   */
  static async deleteNotification(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const soft = req.query.soft !== 'false';
      const service = await NotificationController.getNotificationService();
      await service.deleteNotification(uuid, soft);
      return NotificationController.responseBuilder.sendSuccess(
        res,
        null,
        'Notification deleted successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        return NotificationController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return NotificationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 批量删除通知
   * @route DELETE /api/notifications/many
   */
  static async deleteManyNotifications(req: Request, res: Response): Promise<Response> {
    try {
      const { uuids } = req.body;
      const soft = req.query.soft !== 'false';
      const service = await NotificationController.getNotificationService();
      await service.deleteManyNotifications(uuids, soft);
      return NotificationController.responseBuilder.sendSuccess(
        res,
        null,
        'Notifications deleted successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        return NotificationController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return NotificationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取用户偏好设置
   * @route GET /api/notifications/preferences/:accountUuid
   */
  static async getPreference(req: Request, res: Response): Promise<Response> {
    try {
      const { accountUuid } = req.params;
      const service = await NotificationController.getNotificationService();
      const preference = await service.getOrCreatePreference(accountUuid);
      return NotificationController.responseBuilder.sendSuccess(
        res,
        preference,
        'Preference retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        return NotificationController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return NotificationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 更新用户偏好设置
   * @route PUT /api/notifications/preferences/:accountUuid
   */
  static async updatePreference(req: Request, res: Response): Promise<Response> {
    try {
      const { accountUuid } = req.params;
      const service = await NotificationController.getNotificationService();
      const preference = await service.updatePreference(accountUuid, req.body);
      return NotificationController.responseBuilder.sendSuccess(
        res,
        preference,
        'Preference updated successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        return NotificationController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return NotificationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }
}


