/**
 * Sync Services Unit Tests
 * 
 * EPIC-004: Offline Sync
 * STORY-019: Sync Infrastructure
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { DeviceService } from '../device.service';
import { SyncLogService, SYNC_LIMITS } from '../sync-log.service';
import { SyncStateService } from '../sync-state.service';
import { createSyncAwareRepository, type Repository, type SyncableEntity } from '../sync-aware-repository';

// 测试用内存数据库
let db: Database.Database;

/**
 * 创建内存数据库并初始化表结构
 */
function createTestDatabase(): Database.Database {
  const testDb = new Database(':memory:');
  
  // 创建必要的表
  testDb.exec(`
    CREATE TABLE IF NOT EXISTS app_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      device_name TEXT NOT NULL,
      platform TEXT NOT NULL,
      app_version TEXT,
      last_sync_at INTEGER,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_log (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
      payload TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      device_id TEXT NOT NULL,
      synced INTEGER DEFAULT 0,
      version INTEGER NOT NULL,
      sync_error TEXT,
      retry_count INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      current_state TEXT DEFAULT 'idle',
      pending_count INTEGER DEFAULT 0,
      last_sync_version INTEGER DEFAULT 0,
      last_sync_at INTEGER,
      last_error TEXT,
      updated_at INTEGER NOT NULL
    );

    INSERT INTO sync_state (id, current_state, pending_count, updated_at)
    VALUES (1, 'idle', 0, ${Date.now()});

    CREATE TABLE IF NOT EXISTS conflict_records (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      local_data TEXT NOT NULL,
      server_data TEXT NOT NULL,
      conflicting_fields TEXT NOT NULL,
      resolution TEXT,
      resolved_at INTEGER,
      resolved_by TEXT,
      created_at INTEGER NOT NULL
    );
  `);

  return testDb;
}

describe('DeviceService', () => {
  beforeEach(() => {
    db = createTestDatabase();
  });

  afterEach(() => {
    db.close();
  });

  it('should initialize and create device ID', () => {
    const service = new DeviceService(db);
    service.initialize();

    const deviceId = service.getDeviceId();
    expect(deviceId).toBeDefined();
    expect(typeof deviceId).toBe('string');
    expect(deviceId.length).toBeGreaterThan(0);
  });

  it('should persist device ID across instances', () => {
    const service1 = new DeviceService(db);
    service1.initialize();
    const deviceId1 = service1.getDeviceId();

    const service2 = new DeviceService(db);
    service2.initialize();
    const deviceId2 = service2.getDeviceId();

    expect(deviceId1).toBe(deviceId2);
  });

  it('should return device info', () => {
    const service = new DeviceService(db);
    service.initialize();

    const info = service.getDeviceInfo();
    expect(info.id).toBe(service.getDeviceId());
    expect(info.platform).toBeDefined();
    expect(info.createdAt).toBeGreaterThan(0);
  });

  it('should update device name', () => {
    const service = new DeviceService(db);
    service.initialize();

    service.updateDeviceName('Test Device');
    expect(service.getDeviceInfo().name).toBe('Test Device');
  });

  it('should update last sync time', () => {
    const service = new DeviceService(db);
    service.initialize();

    const timestamp = Date.now();
    service.updateLastSyncAt(timestamp);
    expect(service.getDeviceInfo().lastSyncAt).toBe(timestamp);
  });

  it('should throw if not initialized', () => {
    const service = new DeviceService(db);
    expect(() => service.getDeviceId()).toThrow('DeviceService not initialized');
  });
});

describe('SyncLogService', () => {
  beforeEach(() => {
    db = createTestDatabase();
  });

  afterEach(() => {
    db.close();
  });

  it('should log a change', () => {
    const service = new SyncLogService(db);

    const entry = service.logChange({
      entityType: 'goal',
      entityId: 'goal-123',
      operation: 'create',
      data: { title: 'Test Goal' },
      deviceId: 'device-1',
      version: 1,
    });

    expect(entry.id).toBeDefined();
    expect(entry.entityType).toBe('goal');
    expect(entry.entityId).toBe('goal-123');
    expect(entry.operation).toBe('create');
    expect(entry.synced).toBe(false);
    expect(entry.version).toBe(1);
  });

  it('should get pending changes', () => {
    const service = new SyncLogService(db);

    service.logChange({
      entityType: 'goal',
      entityId: 'goal-1',
      operation: 'create',
      data: { title: 'Goal 1' },
      deviceId: 'device-1',
      version: 1,
    });

    service.logChange({
      entityType: 'goal',
      entityId: 'goal-2',
      operation: 'create',
      data: { title: 'Goal 2' },
      deviceId: 'device-1',
      version: 1,
    });

    const pending = service.getPendingChanges();
    expect(pending).toHaveLength(2);
  });

  it('should return pending count', () => {
    const service = new SyncLogService(db);

    expect(service.getPendingCount()).toBe(0);

    service.logChange({
      entityType: 'goal',
      entityId: 'goal-1',
      operation: 'create',
      data: {},
      deviceId: 'device-1',
      version: 1,
    });

    expect(service.getPendingCount()).toBe(1);
  });

  it('should mark changes as synced', () => {
    const service = new SyncLogService(db);

    const entry = service.logChange({
      entityType: 'goal',
      entityId: 'goal-1',
      operation: 'create',
      data: {},
      deviceId: 'device-1',
      version: 1,
    });

    service.markAsSynced([entry.id]);

    expect(service.getPendingCount()).toBe(0);
    expect(service.getStats().synced).toBe(1);
  });

  it('should mark changes as failed with retry increment', () => {
    const service = new SyncLogService(db);

    const entry = service.logChange({
      entityType: 'goal',
      entityId: 'goal-1',
      operation: 'create',
      data: {},
      deviceId: 'device-1',
      version: 1,
    });

    service.markAsFailed([entry.id], 'Network error');

    const logs = service.getLogsForEntity('goal', 'goal-1');
    expect(logs[0].retryCount).toBe(1);
    expect(logs[0].syncError).toBe('Network error');
  });

  it('should respect MAX_RETRIES limit', () => {
    const service = new SyncLogService(db);

    const entry = service.logChange({
      entityType: 'goal',
      entityId: 'goal-1',
      operation: 'create',
      data: {},
      deviceId: 'device-1',
      version: 1,
    });

    // 模拟多次失败
    for (let i = 0; i < SYNC_LIMITS.MAX_RETRIES; i++) {
      service.markAsFailed([entry.id]);
    }

    // 应该不再出现在待同步列表中
    expect(service.getPendingCount()).toBe(0);
    expect(service.getStats().failed).toBe(1);
  });

  it('should reset failed logs', () => {
    const service = new SyncLogService(db);

    const entry = service.logChange({
      entityType: 'goal',
      entityId: 'goal-1',
      operation: 'create',
      data: {},
      deviceId: 'device-1',
      version: 1,
    });

    for (let i = 0; i < SYNC_LIMITS.MAX_RETRIES; i++) {
      service.markAsFailed([entry.id]);
    }

    expect(service.getStats().failed).toBe(1);

    service.resetFailedLogs();

    expect(service.getStats().failed).toBe(0);
    expect(service.getPendingCount()).toBe(1);
  });

  it('should get latest version for entity', () => {
    const service = new SyncLogService(db);

    service.logChange({
      entityType: 'goal',
      entityId: 'goal-1',
      operation: 'create',
      data: {},
      deviceId: 'device-1',
      version: 1,
    });

    service.logChange({
      entityType: 'goal',
      entityId: 'goal-1',
      operation: 'update',
      data: {},
      deviceId: 'device-1',
      version: 2,
    });

    expect(service.getLatestVersion('goal', 'goal-1')).toBe(2);
    expect(service.getLatestVersion('goal', 'nonexistent')).toBe(0);
  });

  it('should cleanup old synced logs', () => {
    const service = new SyncLogService(db);

    const entry = service.logChange({
      entityType: 'goal',
      entityId: 'goal-1',
      operation: 'create',
      data: {},
      deviceId: 'device-1',
      version: 1,
    });

    service.markAsSynced([entry.id]);

    // 手动更新 updated_at 为 8 天前
    const oldTimestamp = Date.now() - 8 * 24 * 60 * 60 * 1000;
    db.prepare('UPDATE sync_log SET updated_at = ? WHERE id = ?').run(oldTimestamp, entry.id);

    const cleaned = service.cleanupSyncedLogs(7);
    expect(cleaned).toBe(1);
  });
});

describe('SyncStateService', () => {
  beforeEach(() => {
    db = createTestDatabase();
  });

  afterEach(() => {
    db.close();
  });

  it('should initialize with default state', () => {
    const service = new SyncStateService(db);
    service.initialize();

    const state = service.getState();
    expect(state.currentState).toBe('idle');
    expect(state.pendingCount).toBe(0);
    expect(state.isOnline).toBe(true);
    expect(state.isSyncing).toBe(false);
  });

  it('should start sync', () => {
    const service = new SyncStateService(db);
    service.initialize();

    service.startSync();

    const state = service.getState();
    expect(state.currentState).toBe('syncing');
    expect(state.isSyncing).toBe(true);
  });

  it('should complete sync', () => {
    const service = new SyncStateService(db);
    service.initialize();

    service.startSync();
    service.completeSync(5);

    const state = service.getState();
    expect(state.currentState).toBe('idle');
    expect(state.lastSyncVersion).toBe(5);
    expect(state.lastSyncAt).toBeGreaterThan(0);
  });

  it('should fail sync', () => {
    const service = new SyncStateService(db);
    service.initialize();

    service.startSync();
    service.failSync('Network error');

    const state = service.getState();
    expect(state.currentState).toBe('error');
    expect(state.lastError).toBe('Network error');
    expect(state.hasError).toBe(true);
  });

  it('should update pending count', () => {
    const service = new SyncStateService(db);
    service.initialize();

    service.updatePendingCount(10);
    expect(service.getState().pendingCount).toBe(10);

    service.incrementPendingCount();
    expect(service.getState().pendingCount).toBe(11);

    service.decrementPendingCount(5);
    expect(service.getState().pendingCount).toBe(6);
  });

  it('should notify listeners on state change', () => {
    const service = new SyncStateService(db);
    service.initialize();

    const listener = vi.fn();
    service.subscribe(listener);

    // 订阅时立即调用一次
    expect(listener).toHaveBeenCalledTimes(1);

    service.startSync();
    expect(listener).toHaveBeenCalledTimes(2);

    const lastCall = listener.mock.calls[1][0];
    expect(lastCall.currentState).toBe('syncing');
  });

  it('should unsubscribe listener', () => {
    const service = new SyncStateService(db);
    service.initialize();

    const listener = vi.fn();
    const unsubscribe = service.subscribe(listener);

    unsubscribe();
    service.startSync();

    // 只有订阅时的一次调用
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should check if can start sync', () => {
    const service = new SyncStateService(db);
    service.initialize();

    expect(service.canStartSync()).toBe(true);

    service.startSync();
    expect(service.canStartSync()).toBe(false);

    service.completeSync(1);
    expect(service.canStartSync()).toBe(true);
  });

  it('should set offline state', () => {
    const service = new SyncStateService(db);
    service.initialize();

    service.setOffline();

    const state = service.getState();
    expect(state.currentState).toBe('offline');
    expect(state.isOnline).toBe(false);
  });
});

describe('createSyncAwareRepository', () => {
  interface TestEntity extends SyncableEntity {
    uuid: string;
    name: string;
  }

  let mockRepo: Repository<TestEntity>;
  let deviceService: DeviceService;
  let syncLogService: SyncLogService;
  let syncStateService: SyncStateService;

  beforeEach(() => {
    db = createTestDatabase();

    // Mock repository
    const entities = new Map<string, TestEntity>();
    mockRepo = {
      create: vi.fn((entity: TestEntity) => {
        entities.set(entity.uuid, entity);
        return entity;
      }),
      update: vi.fn((entity: TestEntity) => {
        entities.set(entity.uuid, entity);
        return entity;
      }),
      delete: vi.fn((id: string) => {
        entities.delete(id);
      }),
      findById: vi.fn((id: string) => entities.get(id)),
      findAll: vi.fn(() => Array.from(entities.values())),
    };

    deviceService = new DeviceService(db);
    deviceService.initialize();

    syncLogService = new SyncLogService(db);
    syncStateService = new SyncStateService(db);
    syncStateService.initialize();
  });

  afterEach(() => {
    db.close();
  });

  it('should wrap create and log change', () => {
    const syncAwareRepo = createSyncAwareRepository(mockRepo, {
      entityType: 'test',
      syncLogService,
      syncStateService,
      deviceService,
    });

    const entity: TestEntity = { uuid: 'test-1', name: 'Test' };
    syncAwareRepo.create(entity);

    expect(mockRepo.create).toHaveBeenCalledWith(entity);
    expect(syncLogService.getPendingCount()).toBe(1);

    const logs = syncLogService.getLogsForEntity('test', 'test-1');
    expect(logs).toHaveLength(1);
    expect(logs[0].operation).toBe('create');
  });

  it('should wrap update and log change with previous data', () => {
    const syncAwareRepo = createSyncAwareRepository(mockRepo, {
      entityType: 'test',
      syncLogService,
      syncStateService,
      deviceService,
    });

    const entity: TestEntity = { uuid: 'test-1', name: 'Test' };
    syncAwareRepo.create(entity);

    const updatedEntity: TestEntity = { uuid: 'test-1', name: 'Updated Test' };
    syncAwareRepo.update(updatedEntity);

    expect(mockRepo.update).toHaveBeenCalledWith(updatedEntity);
    expect(syncLogService.getPendingCount()).toBe(2);

    const logs = syncLogService.getLogsForEntity('test', 'test-1');
    expect(logs).toHaveLength(2);
    expect(logs[0].operation).toBe('update');
    expect(logs[0].previousData).toEqual(entity);
  });

  it('should wrap delete and log change', () => {
    const syncAwareRepo = createSyncAwareRepository(mockRepo, {
      entityType: 'test',
      syncLogService,
      syncStateService,
      deviceService,
    });

    const entity: TestEntity = { uuid: 'test-1', name: 'Test' };
    syncAwareRepo.create(entity);
    syncAwareRepo.delete('test-1');

    expect(mockRepo.delete).toHaveBeenCalledWith('test-1');

    const logs = syncLogService.getLogsForEntity('test', 'test-1');
    expect(logs).toHaveLength(2);
    expect(logs[0].operation).toBe('delete');
  });

  it('should increment version for each change', () => {
    const syncAwareRepo = createSyncAwareRepository(mockRepo, {
      entityType: 'test',
      syncLogService,
      syncStateService,
      deviceService,
    });

    const entity: TestEntity = { uuid: 'test-1', name: 'Test' };
    syncAwareRepo.create(entity);
    syncAwareRepo.update({ ...entity, name: 'Update 1' });
    syncAwareRepo.update({ ...entity, name: 'Update 2' });

    const logs = syncLogService.getLogsForEntity('test', 'test-1');
    // 按时间倒序，所以第一个是最新的
    expect(logs[0].version).toBe(3);
    expect(logs[1].version).toBe(2);
    expect(logs[2].version).toBe(1);
  });

  it('should update pending count in sync state', () => {
    const syncAwareRepo = createSyncAwareRepository(mockRepo, {
      entityType: 'test',
      syncLogService,
      syncStateService,
      deviceService,
    });

    expect(syncStateService.getState().pendingCount).toBe(0);

    syncAwareRepo.create({ uuid: 'test-1', name: 'Test 1' });
    expect(syncStateService.getState().pendingCount).toBe(1);

    syncAwareRepo.create({ uuid: 'test-2', name: 'Test 2' });
    expect(syncStateService.getState().pendingCount).toBe(2);
  });
});
