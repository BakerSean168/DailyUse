/**
 * Sync Repository
 * 
 * EPIC-005: Backend Sync Service - STORY-024
 * 
 * 同步数据持久化层
 */

import type { PrismaClient } from '@prisma/client';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('SyncRepository');

// 同步事件类型
export interface SyncEventCreate {
  eventId: string;
  accountUuid: string;
  deviceId: string;
  entityType: string;
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  payload: unknown;
  baseVersion: bigint;
  newVersion: bigint;
  clientTimestamp: number;
}

export interface SyncEvent {
  id: bigint;
  eventId: string;
  accountUuid: string;
  deviceId: string;
  entityType: string;
  entityId: string;
  operation: string;
  payload: unknown;
  baseVersion: bigint;
  newVersion: bigint;
  clientTimestamp: bigint;
  serverTimestamp: Date;
}

// 设备类型
export interface DeviceCreate {
  accountUuid: string;
  deviceId: string;
  deviceName: string;
  platform: string;
  appVersion?: string;
}

export interface Device {
  id: string;
  accountUuid: string;
  deviceId: string;
  deviceName: string;
  platform: string;
  appVersion: string | null;
  lastSyncVersion: bigint;
  lastSyncAt: Date | null;
  lastSeenAt: Date;
  pushToken: string | null;
  isActive: boolean;
  createdAt: Date;
}

// 实体版本类型
export interface EntityVersionData {
  accountUuid: string;
  entityType: string;
  entityId: string;
  currentVersion: bigint;
  currentData: unknown;
  lastModifiedBy?: string;
}

export class SyncRepository {
  constructor(private prisma: PrismaClient) {}

  // ========== Sync Events ==========

  /**
   * 创建同步事件
   */
  async createSyncEvent(event: SyncEventCreate): Promise<SyncEvent> {
    const result = await this.prisma.syncEvent.create({
      data: {
        eventId: event.eventId,
        accountUuid: event.accountUuid,
        deviceId: event.deviceId,
        entityType: event.entityType,
        entityId: event.entityId,
        operation: event.operation,
        payload: event.payload as object,
        baseVersion: event.baseVersion,
        newVersion: event.newVersion,
        clientTimestamp: BigInt(event.clientTimestamp),
      },
    });
    return result as SyncEvent;
  }

  /**
   * 批量创建同步事件
   */
  async createSyncEvents(events: SyncEventCreate[]): Promise<number> {
    const result = await this.prisma.syncEvent.createMany({
      data: events.map(e => ({
        eventId: e.eventId,
        accountUuid: e.accountUuid,
        deviceId: e.deviceId,
        entityType: e.entityType,
        entityId: e.entityId,
        operation: e.operation,
        payload: e.payload as object,
        baseVersion: e.baseVersion,
        newVersion: e.newVersion,
        clientTimestamp: BigInt(e.clientTimestamp),
      })),
    });
    return result.count;
  }

  /**
   * 获取用户的同步事件（用于 pull）
   */
  async getEventsSinceVersion(
    accountUuid: string,
    sinceVersion: bigint,
    limit: number = 100
  ): Promise<SyncEvent[]> {
    const results = await this.prisma.syncEvent.findMany({
      where: {
        accountUuid,
        newVersion: { gt: sinceVersion },
      },
      orderBy: { newVersion: 'asc' },
      take: limit,
    });
    return results as SyncEvent[];
  }

  /**
   * 获取用户当前最大版本号
   */
  async getMaxVersion(accountUuid: string): Promise<bigint> {
    const result = await this.prisma.syncEvent.aggregate({
      where: { accountUuid },
      _max: { newVersion: true },
    });
    return result._max.newVersion ?? BigInt(0);
  }

  /**
   * 获取下一个版本号
   */
  async getNextVersion(accountUuid: string): Promise<bigint> {
    const maxVersion = await this.getMaxVersion(accountUuid);
    return maxVersion + BigInt(1);
  }

  // ========== Entity Versions ==========

  /**
   * 获取或创建实体版本
   */
  async upsertEntityVersion(data: EntityVersionData): Promise<void> {
    await this.prisma.entityVersion.upsert({
      where: {
        accountUuid_entityType_entityId: {
          accountUuid: data.accountUuid,
          entityType: data.entityType,
          entityId: data.entityId,
        },
      },
      create: {
        accountUuid: data.accountUuid,
        entityType: data.entityType,
        entityId: data.entityId,
        currentVersion: data.currentVersion,
        currentData: data.currentData as object,
        lastModifiedBy: data.lastModifiedBy,
      },
      update: {
        currentVersion: data.currentVersion,
        currentData: data.currentData as object,
        lastModifiedBy: data.lastModifiedBy,
        lastModifiedAt: new Date(),
      },
    });
  }

  /**
   * 获取实体当前版本
   */
  async getEntityVersion(
    accountUuid: string,
    entityType: string,
    entityId: string
  ): Promise<{ currentVersion: bigint; currentData: unknown } | null> {
    const result = await this.prisma.entityVersion.findUnique({
      where: {
        accountUuid_entityType_entityId: {
          accountUuid,
          entityType,
          entityId,
        },
      },
      select: {
        currentVersion: true,
        currentData: true,
      },
    });
    return result;
  }

  /**
   * 标记实体为已删除
   */
  async markEntityDeleted(
    accountUuid: string,
    entityType: string,
    entityId: string,
    version: bigint,
    deviceId: string
  ): Promise<void> {
    await this.prisma.entityVersion.update({
      where: {
        accountUuid_entityType_entityId: {
          accountUuid,
          entityType,
          entityId,
        },
      },
      data: {
        isDeleted: true,
        currentVersion: version,
        lastModifiedBy: deviceId,
        lastModifiedAt: new Date(),
      },
    });
  }

  // ========== Devices ==========

  /**
   * 注册或更新设备
   */
  async upsertDevice(device: DeviceCreate): Promise<Device> {
    const result = await this.prisma.syncDevice.upsert({
      where: { deviceId: device.deviceId },
      create: {
        accountUuid: device.accountUuid,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        platform: device.platform,
        appVersion: device.appVersion,
      },
      update: {
        deviceName: device.deviceName,
        appVersion: device.appVersion,
        lastSeenAt: new Date(),
      },
    });
    return result as Device;
  }

  /**
   * 获取用户的所有设备
   */
  async getDevices(accountUuid: string): Promise<Device[]> {
    const results = await this.prisma.syncDevice.findMany({
      where: { accountUuid, isActive: true },
      orderBy: { lastSeenAt: 'desc' },
    });
    return results as Device[];
  }

  /**
   * 获取设备信息
   */
  async getDevice(deviceId: string): Promise<Device | null> {
    const result = await this.prisma.syncDevice.findUnique({
      where: { deviceId },
    });
    return result as Device | null;
  }

  /**
   * 更新设备同步版本
   */
  async updateDeviceSyncVersion(
    deviceId: string,
    version: bigint
  ): Promise<void> {
    await this.prisma.syncDevice.update({
      where: { deviceId },
      data: {
        lastSyncVersion: version,
        lastSyncAt: new Date(),
        lastSeenAt: new Date(),
      },
    });
  }

  /**
   * 更新设备名称
   */
  async updateDeviceName(deviceId: string, newName: string): Promise<void> {
    await this.prisma.syncDevice.update({
      where: { deviceId },
      data: { deviceName: newName },
    });
  }

  /**
   * 禁用设备
   */
  async deactivateDevice(deviceId: string): Promise<void> {
    await this.prisma.syncDevice.update({
      where: { deviceId },
      data: { isActive: false },
    });
  }

  // ========== Sync Cursors ==========

  /**
   * 获取设备同步游标
   */
  async getSyncCursor(
    accountUuid: string,
    deviceId: string
  ): Promise<{ lastSyncedEventId: bigint; lastSyncedAt: Date } | null> {
    const result = await this.prisma.syncCursor.findUnique({
      where: {
        accountUuid_deviceId: { accountUuid, deviceId },
      },
      select: {
        lastSyncedEventId: true,
        lastSyncedAt: true,
      },
    });
    return result;
  }

  /**
   * 更新同步游标
   */
  async updateSyncCursor(
    accountUuid: string,
    deviceId: string,
    lastSyncedEventId: bigint
  ): Promise<void> {
    await this.prisma.syncCursor.upsert({
      where: {
        accountUuid_deviceId: { accountUuid, deviceId },
      },
      create: {
        accountUuid,
        deviceId,
        lastSyncedEventId,
      },
      update: {
        lastSyncedEventId,
        lastSyncedAt: new Date(),
      },
    });
  }

  // ========== Sync Conflicts ==========

  /**
   * 创建冲突记录
   */
  async createConflict(data: {
    accountUuid: string;
    entityType: string;
    entityId: string;
    localEventId: string;
    serverVersion: bigint;
    localData: unknown;
    serverData: unknown;
    conflictingFields: string[];
  }): Promise<string> {
    const result = await this.prisma.syncConflict.create({
      data: {
        accountUuid: data.accountUuid,
        entityType: data.entityType,
        entityId: data.entityId,
        localEventId: data.localEventId,
        serverVersion: data.serverVersion,
        localData: data.localData as object,
        serverData: data.serverData as object,
        conflictingFields: data.conflictingFields,
      },
    });
    return result.id;
  }

  /**
   * 获取用户的未解决冲突
   */
  async getUnresolvedConflicts(
    accountUuid: string,
    entityType?: string
  ): Promise<Array<{
    id: string;
    entityType: string;
    entityId: string;
    localData: unknown;
    serverData: unknown;
    conflictingFields: string[];
    createdAt: Date;
  }>> {
    const where: { accountUuid: string; resolvedAt: null; entityType?: string } = {
      accountUuid,
      resolvedAt: null,
    };
    if (entityType) {
      where.entityType = entityType;
    }

    return this.prisma.syncConflict.findMany({
      where,
      select: {
        id: true,
        entityType: true,
        entityId: true,
        localData: true,
        serverData: true,
        conflictingFields: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 解决冲突
   */
  async resolveConflict(
    conflictId: string,
    resolution: {
      strategy: string;
      resolvedData: unknown;
      resolvedByDevice: string;
    }
  ): Promise<void> {
    await this.prisma.syncConflict.update({
      where: { id: conflictId },
      data: {
        resolutionStrategy: resolution.strategy,
        resolvedData: resolution.resolvedData as object,
        resolvedByDevice: resolution.resolvedByDevice,
        resolvedAt: new Date(),
      },
    });
  }
}
