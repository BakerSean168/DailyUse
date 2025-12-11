// @ts-nocheck
/**
 * NotificationController
 * 通知控制器 - 处理 HTTP 请求
 * 标准 Express 路由工厂模式 - 移除了 NestJS 装饰器
 */

import { Router, Request, Response } from 'express';
import { NotificationApplicationService } from '../application/NotificationApplicationService';
import type { NotificationServerDTO, NotificationPreferenceServerDTO } from '@dailyuse/contracts/notification';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * 创建通知路由
 */
export function createNotificationRouter(
  notificationService: NotificationApplicationService
): Router {
  const router = Router();

  /**
   * 创建通知
   * POST /api/v1/notifications
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const accountUuid = (req as any).user.accountUuid;
      const body = req.body as CreateNotificationRequest;
      const result = await notificationService.createNotification(accountUuid, body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  });

  /**
   * 查询通知列表
   * GET /api/v1/notifications
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const accountUuid = (req as any).user.accountUuid;
      const query = req.query as unknown as QueryNotificationsRequest;
      const result = await notificationService.findNotifications(accountUuid, query);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  });

  /**
   * 获取未读数量
   * GET /api/v1/notifications/unread-count
   */
  router.get('/unread-count', async (req: Request, res: Response) => {
    try {
      const accountUuid = (req as any).user.accountUuid;
      const result = await notificationService.getUnreadCount(accountUuid);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  });

  /**
   * 标记所有通知为已读
   * PATCH /api/v1/notifications/read-all
   */
  router.patch('/read-all', async (req: Request, res: Response) => {
    try {
      const accountUuid = (req as any).user.accountUuid;
      const result = await notificationService.markAllAsRead(accountUuid);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  });

  /**
   * 根据 UUID 查询通知
   * GET /api/v1/notifications/:uuid
   */
  router.get('/:uuid', async (req: Request, res: Response) => {
    try {
      const accountUuid = (req as any).user.accountUuid;
      const uuid = req.params.uuid;
      const result = await notificationService.findNotificationByUuid(uuid, accountUuid);
      res.status(200).json(result);
    } catch (error: any) {
      if (error.name === 'NotFoundException') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(400).json({ error: String(error) });
      }
    }
  });

  /**
   * 标记通知为已读
   * PATCH /api/v1/notifications/:uuid/read
   */
  router.patch('/:uuid/read', async (req: Request, res: Response) => {
    try {
      const accountUuid = (req as any).user.accountUuid;
      const uuid = req.params.uuid;
      const result = await notificationService.markAsRead(uuid, accountUuid);
      res.status(200).json(result);
    } catch (error: any) {
      if (error.name === 'NotFoundException') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(400).json({ error: String(error) });
      }
    }
  });

  /**
   * 删除通知
   * DELETE /api/v1/notifications/:uuid
   */
  router.delete('/:uuid', async (req: Request, res: Response) => {
    try {
      const accountUuid = (req as any).user.accountUuid;
      const uuid = req.params.uuid;
      const result = await notificationService.deleteNotification(uuid, accountUuid);
      res.status(200).json(result);
    } catch (error: any) {
      if (error.name === 'NotFoundException') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(400).json({ error: String(error) });
      }
    }
  });

  /**
   * 批量删除通知
   * DELETE /api/v1/notifications
   */
  router.delete('/', async (req: Request, res: Response) => {
    try {
      const accountUuid = (req as any).user.accountUuid;
      const body = req.body as BatchDeleteNotificationsRequest;
      const result = await notificationService.batchDeleteNotifications(body.uuids, accountUuid);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  });

  return router;
}

// 为了向后兼容，导出一个默认的控制器类
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationApplicationService
  ) {}

  async createNotification(req: Request, body: CreateNotificationRequest) {
    const accountUuid = (req as any).user.accountUuid;
    return this.notificationService.createNotification(accountUuid, body);
  }

  async findNotifications(req: Request, query: QueryNotificationsRequest) {
    const accountUuid = (req as any).user.accountUuid;
    return this.notificationService.findNotifications(accountUuid, query);
  }

  async getUnreadCount(req: Request) {
    const accountUuid = (req as any).user.accountUuid;
    return this.notificationService.getUnreadCount(accountUuid);
  }

  async markAllAsRead(req: Request) {
    const accountUuid = (req as any).user.accountUuid;
    return this.notificationService.markAllAsRead(accountUuid);
  }

  async findNotificationByUuid(req: Request, uuid: string) {
    const accountUuid = (req as any).user.accountUuid;
    return this.notificationService.findNotificationByUuid(uuid, accountUuid);
  }

  async markAsRead(req: Request, uuid: string) {
    const accountUuid = (req as any).user.accountUuid;
    return this.notificationService.markAsRead(uuid, accountUuid);
  }

  async deleteNotification(req: Request, uuid: string) {
    const accountUuid = (req as any).user.accountUuid;
    return this.notificationService.deleteNotification(uuid, accountUuid);
  }

  async batchDeleteNotifications(req: Request, body: BatchDeleteNotificationsRequest) {
    const accountUuid = (req as any).user.accountUuid;
    return this.notificationService.batchDeleteNotifications(body.uuids, accountUuid);
  }
}

