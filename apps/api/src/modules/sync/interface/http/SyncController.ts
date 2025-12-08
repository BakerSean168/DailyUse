/**
 * Sync Controller
 * 
 * EPIC-005: Backend Sync Service - STORY-025/026
 * 
 * HTTP 接口层
 */

import type { Response } from 'express';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';
import { SyncService } from '../../application/SyncService';
import type { PushRequest, PullRequest, RegisterDeviceRequest } from '../../application/SyncService';
import type { AuthenticatedRequest } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { prisma } from '@/shared/infrastructure/config/prisma';

const logger = createLogger('SyncController');
const responseBuilder = createResponseBuilder();

/**
 * 同步控制器
 */
export class SyncController {
  private static syncService: SyncService | null = null;

  private static getService(): SyncService {
    if (!SyncController.syncService) {
      SyncController.syncService = SyncService.getInstance(prisma);
    }
    return SyncController.syncService;
  }

  // ========== Device Endpoints ==========

  /**
   * POST /sync/device/register
   * 注册设备
   */
  static async registerDevice(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const accountUuid = req.user?.accountUuid;
      if (!accountUuid) {
        res.status(401).json(
          responseBuilder.error(ResponseCode.UNAUTHORIZED, 'Not authenticated')
        );
        return;
      }

      const request: RegisterDeviceRequest = req.body;
      const device = await SyncController.getService().registerDevice(accountUuid, request);

      res.json(responseBuilder.success({
        id: device.id,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        platform: device.platform,
        appVersion: device.appVersion,
        lastSyncVersion: Number(device.lastSyncVersion),
        lastSyncAt: device.lastSyncAt?.toISOString() ?? null,
        createdAt: device.createdAt.toISOString(),
      }));
    } catch (error) {
      logger.error('Failed to register device', error);
      res.status(500).json(
        responseBuilder.error(ResponseCode.INTERNAL_ERROR, 'Failed to register device')
      );
    }
  }

  /**
   * GET /sync/devices
   * 获取用户的所有设备
   */
  static async getDevices(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const accountUuid = req.user?.accountUuid;
      if (!accountUuid) {
        res.status(401).json(
          responseBuilder.error(ResponseCode.UNAUTHORIZED, 'Not authenticated')
        );
        return;
      }

      const devices = await SyncController.getService().getDevices(accountUuid);

      res.json(responseBuilder.success(devices.map(d => ({
        id: d.id,
        deviceId: d.deviceId,
        deviceName: d.deviceName,
        platform: d.platform,
        appVersion: d.appVersion,
        lastSyncVersion: Number(d.lastSyncVersion),
        lastSyncAt: d.lastSyncAt?.toISOString() ?? null,
        lastSeenAt: d.lastSeenAt.toISOString(),
        isActive: d.isActive,
        createdAt: d.createdAt.toISOString(),
      }))));
    } catch (error) {
      logger.error('Failed to get devices', error);
      res.status(500).json(
        responseBuilder.error(ResponseCode.INTERNAL_ERROR, 'Failed to get devices')
      );
    }
  }

  /**
   * PATCH /sync/device/:deviceId
   * 更新设备名称
   */
  static async updateDevice(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const accountUuid = req.user?.accountUuid;
      if (!accountUuid) {
        res.status(401).json(
          responseBuilder.error(ResponseCode.UNAUTHORIZED, 'Not authenticated')
        );
        return;
      }

      const { deviceId } = req.params;
      const { deviceName } = req.body;

      // 验证设备属于当前用户
      const device = await SyncController.getService().getDevice(deviceId);
      if (!device || device.accountUuid !== accountUuid) {
        res.status(404).json(
          responseBuilder.error(ResponseCode.NOT_FOUND, 'Device not found')
        );
        return;
      }

      await SyncController.getService().updateDeviceName(deviceId, deviceName);

      res.json(responseBuilder.success({ success: true }));
    } catch (error) {
      logger.error('Failed to update device', error);
      res.status(500).json(
        responseBuilder.error(ResponseCode.INTERNAL_ERROR, 'Failed to update device')
      );
    }
  }

  /**
   * DELETE /sync/device/:deviceId
   * 禁用设备（远程登出）
   */
  static async deactivateDevice(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const accountUuid = req.user?.accountUuid;
      if (!accountUuid) {
        res.status(401).json(
          responseBuilder.error(ResponseCode.UNAUTHORIZED, 'Not authenticated')
        );
        return;
      }

      const { deviceId } = req.params;

      // 验证设备属于当前用户
      const device = await SyncController.getService().getDevice(deviceId);
      if (!device || device.accountUuid !== accountUuid) {
        res.status(404).json(
          responseBuilder.error(ResponseCode.NOT_FOUND, 'Device not found')
        );
        return;
      }

      await SyncController.getService().deactivateDevice(deviceId);

      res.json(responseBuilder.success({ success: true }));
    } catch (error) {
      logger.error('Failed to deactivate device', error);
      res.status(500).json(
        responseBuilder.error(ResponseCode.INTERNAL_ERROR, 'Failed to deactivate device')
      );
    }
  }

  // ========== Sync Endpoints ==========

  /**
   * POST /sync/push
   * 客户端推送变更
   */
  static async push(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const accountUuid = req.user?.accountUuid;
      if (!accountUuid) {
        res.status(401).json(
          responseBuilder.error(ResponseCode.UNAUTHORIZED, 'Not authenticated')
        );
        return;
      }

      const request: PushRequest = req.body;
      
      // 验证设备
      const device = await SyncController.getService().getDevice(request.deviceId);
      if (!device || device.accountUuid !== accountUuid) {
        res.status(403).json(
          responseBuilder.error(ResponseCode.FORBIDDEN, 'Device not registered to this account')
        );
        return;
      }

      const result = await SyncController.getService().push(accountUuid, request);

      res.json(responseBuilder.success(result));
    } catch (error) {
      logger.error('Push failed', error);
      res.status(500).json(
        responseBuilder.error(ResponseCode.INTERNAL_ERROR, 'Push failed')
      );
    }
  }

  /**
   * POST /sync/pull
   * 客户端拉取变更
   */
  static async pull(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const accountUuid = req.user?.accountUuid;
      if (!accountUuid) {
        res.status(401).json(
          responseBuilder.error(ResponseCode.UNAUTHORIZED, 'Not authenticated')
        );
        return;
      }

      const request: PullRequest = req.body;
      
      // 验证设备
      const device = await SyncController.getService().getDevice(request.deviceId);
      if (!device || device.accountUuid !== accountUuid) {
        res.status(403).json(
          responseBuilder.error(ResponseCode.FORBIDDEN, 'Device not registered to this account')
        );
        return;
      }

      const result = await SyncController.getService().pull(accountUuid, request);

      res.json(responseBuilder.success(result));
    } catch (error) {
      logger.error('Pull failed', error);
      res.status(500).json(
        responseBuilder.error(ResponseCode.INTERNAL_ERROR, 'Pull failed')
      );
    }
  }

  // ========== Conflict Endpoints ==========

  /**
   * GET /sync/conflicts
   * 获取未解决的冲突
   */
  static async getConflicts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const accountUuid = req.user?.accountUuid;
      if (!accountUuid) {
        res.status(401).json(
          responseBuilder.error(ResponseCode.UNAUTHORIZED, 'Not authenticated')
        );
        return;
      }

      const { entityType } = req.query;
      const conflicts = await SyncController.getService().getUnresolvedConflicts(
        accountUuid, 
        entityType as string | undefined
      );

      res.json(responseBuilder.success(conflicts.map(c => ({
        id: c.id,
        entityType: c.entityType,
        entityId: c.entityId,
        localData: c.localData,
        serverData: c.serverData,
        conflictingFields: c.conflictingFields,
        createdAt: c.createdAt.toISOString(),
      }))));
    } catch (error) {
      logger.error('Failed to get conflicts', error);
      res.status(500).json(
        responseBuilder.error(ResponseCode.INTERNAL_ERROR, 'Failed to get conflicts')
      );
    }
  }

  /**
   * POST /sync/conflicts/:conflictId/resolve
   * 解决冲突
   */
  static async resolveConflict(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const accountUuid = req.user?.accountUuid;
      if (!accountUuid) {
        res.status(401).json(
          responseBuilder.error(ResponseCode.UNAUTHORIZED, 'Not authenticated')
        );
        return;
      }

      const { conflictId } = req.params;
      const { strategy, resolvedData, deviceId } = req.body;

      await SyncController.getService().resolveConflict(
        conflictId,
        strategy,
        resolvedData,
        deviceId
      );

      res.json(responseBuilder.success({ success: true }));
    } catch (error) {
      logger.error('Failed to resolve conflict', error);
      res.status(500).json(
        responseBuilder.error(ResponseCode.INTERNAL_ERROR, 'Failed to resolve conflict')
      );
    }
  }
}
