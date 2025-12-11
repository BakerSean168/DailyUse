/**
 * NotificationModule Factory
 * 通知模块 - 标准服务工厂模式（Express 项目）
 * 不依赖 NestJS，使用纯 TypeScript 服务注入
 */

import { PrismaNotificationRepository } from './infrastructure/PrismaNotificationRepository';
import { NotificationApplicationService } from './application/NotificationApplicationService';
import { NotificationController } from './presentation/NotificationController';
import { NotificationGateway } from './presentation/NotificationGateway';

/**
 * 初始化通知模块
 * 返回模块的所有依赖和导出
 */
export function initializeNotificationModule(prisma: any) {
  // Repository
  const notificationRepository = new PrismaNotificationRepository(prisma);

  // Application Service
  const notificationApplicationService = new NotificationApplicationService(
    notificationRepository
  );

  // WebSocket Gateway
  const notificationGateway = new NotificationGateway();

  return {
    notificationRepository,
    notificationApplicationService,
    notificationGateway,
    NotificationController,
  };
}

// 导出类和工厂函数供其他模块使用
export {
  NotificationApplicationService,
  NotificationController,
  NotificationGateway,
  PrismaNotificationRepository,
};
