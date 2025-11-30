// @ts-nocheck
/**
 * NotificationGateway
 * WebSocket 网关 - 实时推送通知
 */

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import type { NotificationServerDTO, NotificationPreferenceServerDTO } from '@dailyuse/contracts/notification';


@WebSocketGateway({
  namespace: 'notifications',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private userSockets = new Map<string, Set<string>>(); // accountUuid -> Set<socketId>

  handleConnection(client: Socket) {
    const accountUuid = client.handshake.auth?.accountUuid;
    
    if (!accountUuid) {
      this.logger.warn(`Client ${client.id} connected without accountUuid`);
      client.disconnect();
      return;
    }

    // 记录用户的 socket 连接
    if (!this.userSockets.has(accountUuid)) {
      this.userSockets.set(accountUuid, new Set());
    }
    this.userSockets.get(accountUuid)!.add(client.id);

    // 加入用户专属房间
    client.join(`user:${accountUuid}`);

    this.logger.log(`Client ${client.id} connected for user ${accountUuid}`);
  }

  handleDisconnect(client: Socket) {
    const accountUuid = client.handshake.auth?.accountUuid;

    if (accountUuid) {
      const sockets = this.userSockets.get(accountUuid);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(accountUuid);
        }
      }
    }

    this.logger.log(`Client ${client.id} disconnected`);
  }

  /**
   * 推送新通知给用户
   */
  sendNotificationToUser(
    accountUuid: string,
    notification: NotificationClientDTO
  ) {
    this.server.to(`user:${accountUuid}`).emit('notification:new', notification);
    this.logger.debug(`Notification sent to user ${accountUuid}`);
  }

  /**
   * 通知用户某个通知已读
   */
  notifyNotificationRead(accountUuid: string, notificationUuid: string) {
    this.server.to(`user:${accountUuid}`).emit('notification:read', {
      uuid: notificationUuid,
    });
  }

  /**
   * 通知用户某个通知已删除
   */
  notifyNotificationDeleted(accountUuid: string, notificationUuid: string) {
    this.server.to(`user:${accountUuid}`).emit('notification:deleted', {
      uuid: notificationUuid,
    });
  }

  /**
   * 更新未读数量
   */
  updateUnreadCount(accountUuid: string, count: number) {
    this.server.to(`user:${accountUuid}`).emit('notification:unread-count', {
      count,
    });
  }
}

