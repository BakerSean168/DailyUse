/**
 * Sync-Aware Repository Decorator
 * 
 * EPIC-004: Offline Sync - 自动变更记录
 * 
 * 职责：
 * - 包装现有 Repository，自动记录 CRUD 操作到 sync_log
 * - 为每个变更分配递增的版本号
 * - 提供透明的同步支持
 */

import { SyncLogService } from './sync-log.service';
import type { SyncOperation } from './sync-log.service';
import { SyncStateService } from './sync-state.service';
import { DeviceService } from './device.service';

/**
 * 基础实体接口
 */
export interface SyncableEntity {
  uuid: string;
  [key: string]: unknown;
}

/**
 * Repository 接口
 */
export interface Repository<T extends SyncableEntity> {
  create(entity: T): T;
  update(entity: T): T;
  delete(id: string): void;
  findById(id: string): T | undefined;
  findAll(): T[];
}

/**
 * 同步感知 Repository 配置
 */
export interface SyncAwareRepositoryConfig {
  entityType: string;
  syncLogService: SyncLogService;
  syncStateService: SyncStateService;
  deviceService: DeviceService;
}

/**
 * 创建同步感知的 Repository 包装器
 * 
 * @example
 * ```typescript
 * const goalRepo = new GoalRepository(db);
 * const syncAwareGoalRepo = createSyncAwareRepository(goalRepo, {
 *   entityType: 'goal',
 *   syncLogService,
 *   syncStateService,
 *   deviceService,
 * });
 * 
 * // 使用包装后的 repo，CRUD 操作会自动记录到 sync_log
 * syncAwareGoalRepo.create(newGoal);
 * ```
 */
export function createSyncAwareRepository<T extends SyncableEntity>(
  repository: Repository<T>,
  config: SyncAwareRepositoryConfig
): Repository<T> {
  const { entityType, syncLogService, syncStateService, deviceService } = config;

  /**
   * 获取下一个版本号
   */
  function getNextVersion(entityId: string): number {
    return syncLogService.getLatestVersion(entityType, entityId) + 1;
  }

  /**
   * 记录变更
   */
  function logChange(
    operation: SyncOperation,
    entityId: string,
    data: unknown,
    previousData?: unknown
  ): void {
    const version = getNextVersion(entityId);
    
    syncLogService.logChange({
      entityType,
      entityId,
      operation,
      data,
      previousData,
      deviceId: deviceService.getDeviceId(),
      version,
    });

    // 更新待同步数量
    syncStateService.incrementPendingCount();
  }

  return {
    create(entity: T): T {
      const result = repository.create(entity);
      logChange('create', entity.uuid, result);
      return result;
    },

    update(entity: T): T {
      // 获取更新前的数据用于冲突检测
      const previousData = repository.findById(entity.uuid);
      const result = repository.update(entity);
      logChange('update', entity.uuid, result, previousData);
      return result;
    },

    delete(id: string): void {
      // 获取删除前的数据
      const previousData = repository.findById(id);
      repository.delete(id);
      logChange('delete', id, null, previousData);
    },

    findById(id: string): T | undefined {
      return repository.findById(id);
    },

    findAll(): T[] {
      return repository.findAll();
    },
  };
}

/**
 * 同步感知 Repository 类装饰器
 * 
 * 用于类继承场景
 */
export abstract class SyncAwareRepositoryBase<T extends SyncableEntity> {
  constructor(
    protected readonly entityType: string,
    protected readonly syncLogService: SyncLogService,
    protected readonly syncStateService: SyncStateService,
    protected readonly deviceService: DeviceService
  ) {}

  /**
   * 子类必须实现的原始 CRUD 方法
   */
  protected abstract doCreate(entity: T): T;
  protected abstract doUpdate(entity: T): T;
  protected abstract doDelete(id: string): void;
  abstract findById(id: string): T | undefined;
  abstract findAll(): T[];

  /**
   * 获取下一个版本号
   */
  private getNextVersion(entityId: string): number {
    return this.syncLogService.getLatestVersion(this.entityType, entityId) + 1;
  }

  /**
   * 记录变更
   */
  private logChange(
    operation: SyncOperation,
    entityId: string,
    data: unknown,
    previousData?: unknown
  ): void {
    const version = this.getNextVersion(entityId);
    
    this.syncLogService.logChange({
      entityType: this.entityType,
      entityId,
      operation,
      data,
      previousData,
      deviceId: this.deviceService.getDeviceId(),
      version,
    });

    this.syncStateService.incrementPendingCount();
  }

  /**
   * 创建实体（带同步记录）
   */
  create(entity: T): T {
    const result = this.doCreate(entity);
    this.logChange('create', entity.uuid, result);
    return result;
  }

  /**
   * 更新实体（带同步记录）
   */
  update(entity: T): T {
    const previousData = this.findById(entity.uuid);
    const result = this.doUpdate(entity);
    this.logChange('update', entity.uuid, result, previousData);
    return result;
  }

  /**
   * 删除实体（带同步记录）
   */
  delete(id: string): void {
    const previousData = this.findById(id);
    this.doDelete(id);
    this.logChange('delete', id, null, previousData);
  }
}

/**
 * 批量操作的同步感知包装器
 */
export class SyncAwareBatchOperations<T extends SyncableEntity> {
  constructor(
    private readonly entityType: string,
    private readonly syncLogService: SyncLogService,
    private readonly syncStateService: SyncStateService,
    private readonly deviceService: DeviceService
  ) {}

  /**
   * 批量创建（带同步记录）
   */
  batchCreate(
    entities: T[],
    createFn: (entities: T[]) => T[]
  ): T[] {
    const results = createFn(entities);
    
    for (const entity of results) {
      const version = this.syncLogService.getLatestVersion(this.entityType, entity.uuid) + 1;
      this.syncLogService.logChange({
        entityType: this.entityType,
        entityId: entity.uuid,
        operation: 'create',
        data: entity,
        deviceId: this.deviceService.getDeviceId(),
        version,
      });
    }

    this.syncStateService.updatePendingCount(
      this.syncStateService.getState().pendingCount + results.length
    );

    return results;
  }

  /**
   * 批量删除（带同步记录）
   */
  batchDelete(
    ids: string[],
    getPreviousDataFn: (id: string) => T | undefined,
    deleteFn: (ids: string[]) => void
  ): void {
    // 先获取所有要删除的数据
    const previousDataMap = new Map<string, T | undefined>();
    for (const id of ids) {
      previousDataMap.set(id, getPreviousDataFn(id));
    }

    // 执行删除
    deleteFn(ids);

    // 记录到 sync_log
    for (const id of ids) {
      const previousData = previousDataMap.get(id);
      const version = this.syncLogService.getLatestVersion(this.entityType, id) + 1;
      this.syncLogService.logChange({
        entityType: this.entityType,
        entityId: id,
        operation: 'delete',
        data: null,
        previousData,
        deviceId: this.deviceService.getDeviceId(),
        version,
      });
    }

    this.syncStateService.updatePendingCount(
      this.syncStateService.getState().pendingCount + ids.length
    );
  }
}
