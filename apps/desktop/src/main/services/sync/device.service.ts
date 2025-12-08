/**
 * Device Service
 * 
 * EPIC-004: Offline Sync - 设备注册与管理
 * 
 * 职责：
 * - 生成和管理唯一设备 ID
 * - 存储设备信息（平台、主机名）
 * - 提供设备标识给同步服务
 */

import Database from 'better-sqlite3';
import os from 'os';
import { v4 as uuid } from 'uuid';

export interface DeviceInfo {
  id: string;
  name: string;
  platform: NodeJS.Platform;
  appVersion?: string;
  lastSyncAt?: number;
  createdAt: number;
}

export class DeviceService {
  private deviceId: string | null = null;
  private deviceInfo: DeviceInfo | null = null;

  constructor(private db: Database.Database) {}

  /**
   * 初始化设备服务
   * 获取或创建设备 ID
   */
  initialize(): void {
    this.deviceId = this.getOrCreateDeviceId();
    this.deviceInfo = this.loadOrCreateDeviceInfo();
    console.log(`[DeviceService] Initialized with device ID: ${this.deviceId}`);
  }

  /**
   * 获取或创建设备 ID
   * 优先尝试使用 node-machine-id，失败则使用 UUID
   */
  private getOrCreateDeviceId(): string {
    // 先检查数据库中是否有存储的设备 ID
    const stored = this.db.prepare(
      'SELECT value FROM app_config WHERE key = ?'
    ).get('device_id') as { value: string } | undefined;

    if (stored) {
      return stored.value;
    }

    // 尝试使用 node-machine-id
    let newId: string;
    try {
      // 动态导入以避免打包问题
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { machineIdSync } = require('node-machine-id');
      newId = machineIdSync();
      console.log('[DeviceService] Using machine ID');
    } catch {
      // 回退到 UUID
      newId = uuid();
      console.log('[DeviceService] Using UUID (machine-id not available)');
    }

    // 存储到数据库
    const now = Date.now();
    this.db.prepare(`
      INSERT INTO app_config (key, value, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `).run('device_id', newId, now, now);

    return newId;
  }

  /**
 * 加载或创建设备信息
 */
private loadOrCreateDeviceInfo(): DeviceInfo {
  const existing = this.db.prepare(
    'SELECT * FROM devices WHERE id = ?'
  ).get(this.deviceId) as {
    id: string;
    device_name: string;
    platform: string;
    app_version: string | null;
    last_sync_at: number | null;
    created_at: number;
  } | undefined;

  if (existing) {
    return {
      id: existing.id,
      name: existing.device_name,
      platform: existing.platform as NodeJS.Platform,
      appVersion: existing.app_version || undefined,
      lastSyncAt: existing.last_sync_at || undefined,
      createdAt: existing.created_at,
    };
  }

  // 创建新设备记录
  const now = Date.now();
  const deviceInfo: DeviceInfo = {
    id: this.deviceId!,
    name: os.hostname(),
    platform: process.platform,
    appVersion: process.env.npm_package_version,
    createdAt: now,
  };

  this.db.prepare(`
    INSERT INTO devices (id, device_name, platform, app_version, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    deviceInfo.id,
    deviceInfo.name,
    deviceInfo.platform,
    deviceInfo.appVersion || null,
    deviceInfo.createdAt
  );

  return deviceInfo;
}

  /**
   * 获取设备 ID
   */
  getDeviceId(): string {
    if (!this.deviceId) {
      throw new Error('DeviceService not initialized');
    }
    return this.deviceId;
  }

  /**
   * 获取完整设备信息
   */
  getDeviceInfo(): DeviceInfo {
    if (!this.deviceInfo) {
      throw new Error('DeviceService not initialized');
    }
    return { ...this.deviceInfo };
  }

  /**
   * 更新设备名称
   */
  updateDeviceName(name: string): void {
    this.db.prepare(
      'UPDATE devices SET device_name = ? WHERE id = ?'
    ).run(name, this.deviceId);
    
    if (this.deviceInfo) {
      this.deviceInfo.name = name;
    }
  }

  /**
   * 更新最后同步时间
   */
  updateLastSyncAt(timestamp: number = Date.now()): void {
    this.db.prepare(
      'UPDATE devices SET last_sync_at = ? WHERE id = ?'
    ).run(timestamp, this.deviceId);
    
    if (this.deviceInfo) {
      this.deviceInfo.lastSyncAt = timestamp;
    }
  }
}
