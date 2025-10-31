/**
 * NotificationController
 * 通知控制器 - 处理 HTTP 请求
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { NotificationApplicationService } from '../application/NotificationApplicationService';
import type { NotificationContracts } from '@dailyuse/contracts';

type CreateNotificationRequest = NotificationContracts.CreateNotificationRequest;
type QueryNotificationsRequest = NotificationContracts.QueryNotificationsRequest;
type BatchDeleteNotificationsRequest = NotificationContracts.BatchDeleteNotificationsRequest;

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('api/v1/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationApplicationService
  ) {}

  /**
   * 创建通知
   * POST /api/v1/notifications
   */
  @Post()
  @ApiOperation({ summary: '创建通知' })
  @ApiResponse({ status: 201, description: '通知创建成功' })
  async createNotification(
    @Req() req: any,
    @Body() body: CreateNotificationRequest
  ) {
    const accountUuid = req.user.accountUuid;
    return this.notificationService.createNotification(accountUuid, body);
  }

  /**
   * 查询通知列表
   * GET /api/v1/notifications
   */
  @Get()
  @ApiOperation({ summary: '查询通知列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findNotifications(
    @Req() req: any,
    @Query() query: QueryNotificationsRequest
  ) {
    const accountUuid = req.user.accountUuid;
    return this.notificationService.findNotifications(accountUuid, query);
  }

  /**
   * 获取未读数量
   * GET /api/v1/notifications/unread-count
   */
  @Get('unread-count')
  @ApiOperation({ summary: '获取未读数量' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getUnreadCount(@Req() req: any) {
    const accountUuid = req.user.accountUuid;
    return this.notificationService.getUnreadCount(accountUuid);
  }

  /**
   * 标记所有通知为已读
   * PATCH /api/v1/notifications/read-all
   */
  @Patch('read-all')
  @ApiOperation({ summary: '标记所有通知为已读' })
  @ApiResponse({ status: 200, description: '操作成功' })
  async markAllAsRead(@Req() req: any) {
    const accountUuid = req.user.accountUuid;
    return this.notificationService.markAllAsRead(accountUuid);
  }

  /**
   * 根据 UUID 查询通知
   * GET /api/v1/notifications/:uuid
   */
  @Get(':uuid')
  @ApiOperation({ summary: '根据 UUID 查询通知' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '通知不存在' })
  async findNotificationByUuid(
    @Req() req: any,
    @Param('uuid') uuid: string
  ) {
    const accountUuid = req.user.accountUuid;
    return this.notificationService.findNotificationByUuid(uuid, accountUuid);
  }

  /**
   * 标记通知为已读
   * PATCH /api/v1/notifications/:uuid/read
   */
  @Patch(':uuid/read')
  @ApiOperation({ summary: '标记通知为已读' })
  @ApiResponse({ status: 200, description: '操作成功' })
  @ApiResponse({ status: 404, description: '通知不存在' })
  async markAsRead(
    @Req() req: any,
    @Param('uuid') uuid: string
  ) {
    const accountUuid = req.user.accountUuid;
    return this.notificationService.markAsRead(uuid, accountUuid);
  }

  /**
   * 删除通知
   * DELETE /api/v1/notifications/:uuid
   */
  @Delete(':uuid')
  @ApiOperation({ summary: '删除通知' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '通知不存在' })
  async deleteNotification(
    @Req() req: any,
    @Param('uuid') uuid: string
  ) {
    const accountUuid = req.user.accountUuid;
    return this.notificationService.deleteNotification(uuid, accountUuid);
  }

  /**
   * 批量删除通知
   * DELETE /api/v1/notifications
   */
  @Delete()
  @ApiOperation({ summary: '批量删除通知' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async batchDeleteNotifications(
    @Req() req: any,
    @Body() body: BatchDeleteNotificationsRequest
  ) {
    const accountUuid = req.user.accountUuid;
    return this.notificationService.batchDeleteNotifications(body.uuids, accountUuid);
  }
}
