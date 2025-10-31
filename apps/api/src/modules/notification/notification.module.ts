/**
 * NotificationModule
 * 通知模块 - NestJS 模块定义
 */

import { Module } from '@nestjs/common';
import { PrismaNotificationRepository } from './infrastructure/PrismaNotificationRepository';
import { NotificationApplicationService } from './application/NotificationApplicationService';
import { NotificationController } from './presentation/NotificationController';
import { NotificationGateway } from './presentation/NotificationGateway';

const NOTIFICATION_REPOSITORY = 'NotificationRepository';

@Module({
  controllers: [NotificationController],
  providers: [
    // Repository
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: PrismaNotificationRepository,
    },
    // Application Service
    {
      provide: NotificationApplicationService,
      useFactory: (repository: any) => {
        return new NotificationApplicationService(repository);
      },
      inject: [NOTIFICATION_REPOSITORY],
    },
    // WebSocket Gateway
    NotificationGateway,
  ],
  exports: [NotificationApplicationService, NotificationGateway],
})
export class NotificationModule {}
