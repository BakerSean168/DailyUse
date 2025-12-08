/**
 * Sync Application Service
 * 
 * EPIC-005: Backend Sync Service - STORY-024/025/026
 * 
 * 同步业务逻辑层
 */

import { createLogger } from '@dailyuse/utils';
import { SyncRepository } from '../infrastructure/SyncRepository';
import type { SyncEventCreate, Device } from '../infrastructure/SyncRepository';
import type { PrismaClient } from '@prisma/client';

const logger = createLogger('SyncService');

// Push 请求参数
export interface PushRequest {
  deviceId: string;
  events: Array<{
    eventId: string;
    entityType: string;
    entityId: string;
    operation: 'create' | 'update' | 'delete';
    payload: unknown;
    baseVersion: number;
    clientTimestamp: number;
  }>;
}

// Push 响应
export interface PushResponse {
  success: boolean;
  accepted: number;
  conflicts: Array<{
    eventId: string;
    entityId: string;
    entityType: string;
    serverVersion: number;
    serverData: unknown;
    conflictId: string;
  }>;
  newVersion: number;
}

// Pull 请求参数
export interface PullRequest {
  deviceId: string;
  sinceVersion: number;
  limit?: number;
}

// Pull 响应
export interface PullResponse {
  events: Array<{
    eventId: string;
    entityType: string;
    entityId: string;
    operation: string;
    payload: unknown;
    version: number;
    timestamp: number;
  }>;
  hasMore: boolean;
  latestVersion: number;
}

// 设备注册请求
export interface RegisterDeviceRequest {
  deviceId: string;
  deviceName: string;
  platform: string;
  appVersion?: string;
}

export class SyncService {
  private static instance: SyncService | null = null;
  private repository: SyncRepository;

  constructor(prisma: PrismaClient) {
    this.repository = new SyncRepository(prisma);
  }

  static getInstance(prisma: PrismaClient): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService(prisma);
    }
    return SyncService.instance;
  }

  // ========== Device Management (STORY-024) ==========

  /**
   * 注册设备
   */
  async registerDevice(
    accountUuid: string,
    request: RegisterDeviceRequest
  ): Promise<Device> {
    logger.info('Registering device', { accountUuid, deviceId: request.deviceId });
    
    const device = await this.repository.upsertDevice({
      accountUuid,
      deviceId: request.deviceId,
      deviceName: request.deviceName,
      platform: request.platform,
      appVersion: request.appVersion,
    });

    logger.info('Device registered', { deviceId: device.deviceId });
    return device;
  }

  /**
   * 获取用户的所有设备
   */
  async getDevices(accountUuid: string): Promise<Device[]> {
    return this.repository.getDevices(accountUuid);
  }

  /**
   * 获取设备信息
   */
  async getDevice(deviceId: string): Promise<Device | null> {
    return this.repository.getDevice(deviceId);
  }

  /**
   * 更新设备名称
   */
  async updateDeviceName(deviceId: string, newName: string): Promise<void> {
    await this.repository.updateDeviceName(deviceId, newName);
  }

  /**
   * 禁用设备（远程登出）
   */
  async deactivateDevice(deviceId: string): Promise<void> {
    await this.repository.deactivateDevice(deviceId);
    logger.info('Device deactivated', { deviceId });
  }

  // ========== Push API (STORY-025) ==========

  /**
   * 处理客户端 Push 请求
   * 接收客户端的变更并存储到服务端
   */
  async push(accountUuid: string, request: PushRequest): Promise<PushResponse> {
    logger.info('Processing push', { 
      accountUuid, 
      deviceId: request.deviceId,
      eventCount: request.events.length 
    });

    const conflicts: PushResponse['conflicts'] = [];
    const acceptedEvents: SyncEventCreate[] = [];

    // 逐个处理事件
    for (const event of request.events) {
      // 检查版本冲突
      const entityVersion = await this.repository.getEntityVersion(
        accountUuid,
        event.entityType,
        event.entityId
      );

      if (entityVersion) {
        const serverVersion = Number(entityVersion.currentVersion);
        
        // 版本冲突：客户端基于的版本 < 服务器当前版本
        if (event.baseVersion < serverVersion) {
          // 创建冲突记录
          const conflictId = await this.repository.createConflict({
            accountUuid,
            entityType: event.entityType,
            entityId: event.entityId,
            localEventId: event.eventId,
            serverVersion: BigInt(serverVersion),
            localData: event.payload,
            serverData: entityVersion.currentData,
            conflictingFields: this.detectConflictingFields(
              event.payload as Record<string, unknown>,
              entityVersion.currentData as Record<string, unknown>
            ),
          });

          conflicts.push({
            eventId: event.eventId,
            entityId: event.entityId,
            entityType: event.entityType,
            serverVersion,
            serverData: entityVersion.currentData,
            conflictId,
          });
          continue;
        }
      }

      // 获取新版本号
      const newVersion = await this.repository.getNextVersion(accountUuid);

      // 添加到待处理列表
      acceptedEvents.push({
        eventId: event.eventId,
        accountUuid,
        deviceId: request.deviceId,
        entityType: event.entityType,
        entityId: event.entityId,
        operation: event.operation,
        payload: event.payload,
        baseVersion: BigInt(event.baseVersion),
        newVersion,
        clientTimestamp: event.clientTimestamp,
      });

      // 更新实体版本
      if (event.operation === 'delete') {
        await this.repository.markEntityDeleted(
          accountUuid,
          event.entityType,
          event.entityId,
          newVersion,
          request.deviceId
        );
      } else {
        await this.repository.upsertEntityVersion({
          accountUuid,
          entityType: event.entityType,
          entityId: event.entityId,
          currentVersion: newVersion,
          currentData: event.payload,
          lastModifiedBy: request.deviceId,
        });
      }
    }

    // 批量保存事件
    if (acceptedEvents.length > 0) {
      await this.repository.createSyncEvents(acceptedEvents);
    }

    // 更新设备同步版本
    const latestVersion = await this.repository.getMaxVersion(accountUuid);
    await this.repository.updateDeviceSyncVersion(request.deviceId, latestVersion);

    logger.info('Push completed', {
      accepted: acceptedEvents.length,
      conflicts: conflicts.length,
    });

    return {
      success: conflicts.length === 0,
      accepted: acceptedEvents.length,
      conflicts,
      newVersion: Number(latestVersion),
    };
  }

  // ========== Pull API (STORY-026) ==========

  /**
   * 处理客户端 Pull 请求
   * 返回客户端缺失的变更
   */
  async pull(accountUuid: string, request: PullRequest): Promise<PullResponse> {
    logger.info('Processing pull', {
      accountUuid,
      deviceId: request.deviceId,
      sinceVersion: request.sinceVersion,
    });

    const limit = request.limit ?? 100;
    const events = await this.repository.getEventsSinceVersion(
      accountUuid,
      BigInt(request.sinceVersion),
      limit + 1 // 多取一条用于判断是否还有更多
    );

    const hasMore = events.length > limit;
    const returnEvents = hasMore ? events.slice(0, limit) : events;

    // 更新设备活跃时间
    const device = await this.repository.getDevice(request.deviceId);
    if (device) {
      const lastEventVersion = returnEvents.length > 0 
        ? returnEvents[returnEvents.length - 1].newVersion 
        : BigInt(request.sinceVersion);
      await this.repository.updateDeviceSyncVersion(request.deviceId, lastEventVersion);
    }

    // 获取最新版本号
    const latestVersion = await this.repository.getMaxVersion(accountUuid);

    return {
      events: returnEvents.map(e => ({
        eventId: e.eventId,
        entityType: e.entityType,
        entityId: e.entityId,
        operation: e.operation,
        payload: e.payload,
        version: Number(e.newVersion),
        timestamp: Number(e.clientTimestamp),
      })),
      hasMore,
      latestVersion: Number(latestVersion),
    };
  }

  // ========== Conflict Management ==========

  /**
   * 获取未解决的冲突
   */
  async getUnresolvedConflicts(accountUuid: string, entityType?: string) {
    return this.repository.getUnresolvedConflicts(accountUuid, entityType);
  }

  /**
   * 解决冲突
   */
  async resolveConflict(
    conflictId: string,
    strategy: string,
    resolvedData: unknown,
    deviceId: string
  ): Promise<void> {
    await this.repository.resolveConflict(conflictId, {
      strategy,
      resolvedData,
      resolvedByDevice: deviceId,
    });
    logger.info('Conflict resolved', { conflictId, strategy });
  }

  // ========== Helpers ==========

  /**
   * 检测冲突字段
   */
  private detectConflictingFields(
    localData: Record<string, unknown>,
    serverData: Record<string, unknown>
  ): string[] {
    const conflictingFields: string[] = [];
    const allKeys = new Set([...Object.keys(localData), ...Object.keys(serverData)]);

    for (const key of allKeys) {
      // 忽略系统字段
      if (['version', 'updatedAt', 'updated_at', 'createdAt', 'created_at'].includes(key)) {
        continue;
      }

      const localValue = JSON.stringify(localData[key]);
      const serverValue = JSON.stringify(serverData[key]);

      if (localValue !== serverValue) {
        conflictingFields.push(key);
      }
    }

    return conflictingFields;
  }
}
