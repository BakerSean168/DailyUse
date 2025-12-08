/**
 * @fileoverview 通用云同步适配器接口
 * @module @dailyuse/application-client/sync/interfaces
 */

import type {
  AdapterConfig,
  AdapterCredentials,
  BatchPushResult,
  ConflictInfo,
  ConflictResolution,
  EncryptedSyncData,
  ExportData,
  HealthStatus,
  ImportOptions,
  PullResult,
  PushResult,
  QuotaInfo,
  RemoteVersionInfo,
  SyncCursor,
} from '../types';

/**
 * 通用同步适配器接口
 * 
 * 所有云平台适配器都应实现此接口，以提供统一的 API
 * 
 * **设计原则**:
 * - 异步操作：所有方法返回 Promise
 * - 明确的错误处理：使用特定的错误类型
 * - 幂等性：操作可安全重试
 * - 无状态：每次调用不依赖前一次状态
 * 
 * **支持的提供商**:
 * - GitHub (私有仓库)
 * - 坚果云 (WebDAV)
 * - Dropbox (OAuth2)
 * - 自有服务器
 * 
 * @example
 * ```typescript
 * // 创建适配器
 * const adapter = SyncAdapterFactory.create('github', {
 *   provider: 'github',
 *   token: process.env.GITHUB_TOKEN,
 *   repoPath: 'user/daily-use-sync',
 *   encryptionKey: userPassword,
 * });
 * 
 * // 推送数据
 * const result = await adapter.push('goal', goal.id, encryptedData, 1);
 * 
 * // 拉取增量数据
 * const pullResult = await adapter.pull('goal', lastSyncTime);
 * ```
 */
export interface ISyncAdapter {
  // ========== 连接与认证 ==========
  
  /**
   * 初始化适配器并验证连接
   * 
   * 此方法应：
   * 1. 验证凭据的有效性
   * 2. 建立与云平台的连接
   * 3. 检查必要的权限
   * 4. 初始化加密服务
   * 
   * @param credentials - 云平台认证信息
   * @throws {AuthenticationError} 认证失败
   * @throws {NetworkError} 网络连接失败
   * 
   * @example
   * ```typescript
   * await adapter.authenticate({
   *   provider: 'github',
   *   token: process.env.GITHUB_TOKEN,
   *   repoPath: 'user/daily-use-sync',
   *   encryptionKey: userPassword,
   * });
   * ```
   */
  authenticate(credentials: AdapterCredentials): Promise<void>;
  
  /**
   * 检查适配器健康状态
   * 
   * 用于诊断和监控，返回当前连接状态、认证状态、配额等信息
   * 
   * @returns 健康状态信息
   * 
   * @example
   * ```typescript
   * const health = await adapter.checkHealth();
   * if (!health.connected) {
   *   console.error('Network disconnected:', health.errorMessage);
   * }
   * if (health.quotaExceeded) {
   *   console.warn('Storage quota exceeded!');
   * }
   * ```
   */
  checkHealth(): Promise<HealthStatus>;

  // ========== 核心同步操作 ==========
  
  /**
   * 推送数据到云平台
   * 
   * 支持的场景:
   * - 新增实体 (version = 0)
   * - 更新实体 (version > 0)
   * - 批量操作 (使用 batchPush)
   * 
   * **幂等性**: 相同版本号的重复推送应返回相同结果
   * 
   * **冲突检测**: 如果服务端版本号 > 本地版本号，应返回冲突信息
   * 
   * @param entityType - 实体类型 (e.g., 'goal', 'task', 'reminder')
   * @param entityId - 实体唯一 ID (UUID)
   * @param data - 加密的同步数据
   * @param version - 当前版本号 (用于乐观锁)
   * 
   * @returns 推送结果，包括服务端版本号
   * 
   * @throws {NetworkError} 网络错误
   * @throws {ConflictError} 版本冲突
   * @throws {QuotaExceededError} 存储配额超限
   * 
   * @example
   * ```typescript
   * const result = await adapter.push('goal', goal.id, encryptedData, 1);
   * if (result.conflictDetected) {
   *   // 处理冲突
   *   await resolveConflict(result.conflict);
   * } else {
   *   console.log(`Pushed successfully, new version: ${result.version}`);
   * }
   * ```
   */
  push(
    entityType: string,
    entityId: string,
    data: EncryptedSyncData,
    version: number
  ): Promise<PushResult>;

  /**
   * 从云平台拉取数据
   * 
   * 支持增量同步:
   * - **首次同步**: since = 0 拉取所有数据
   * - **增量同步**: since = lastSyncTime 仅拉取 since 之后的变更
   * 
   * **分页**: 如果 hasMore = true，使用返回的 cursor 继续拉取
   * 
   * @param entityType - 实体类型
   * @param since - 仅获取此时间戳后的变更 (毫秒时间戳，0 表示全量同步)
   * @param version - 本地当前版本 (可选，用于冲突检测)
   * 
   * @returns 拉取结果，包括数据和游标
   * 
   * @throws {NetworkError} 网络错误
   * @throws {AuthenticationError} 认证失败
   * 
   * @example
   * ```typescript
   * // 首次全量同步
   * const result = await adapter.pull('goal', 0);
   * 
   * // 增量同步
   * const result2 = await adapter.pull('goal', lastSyncTime);
   * for (const item of result2.items) {
   *   await syncManager.mergeRemoteData(item);
   * }
   * 
   * // 分页拉取
   * if (result2.hasMore) {
   *   const nextPage = await adapter.pull(
   *     'goal',
   *     result2.cursor.lastSyncTimestamp
   *   );
   * }
   * ```
   */
  pull(
    entityType: string,
    since: number,
    version?: number
  ): Promise<PullResult>;

  /**
   * 批量推送数据
   * 
   * 优化批量操作的性能，减少网络往返次数
   * 
   * **事务性**: 尽可能保证原子性，但某些提供商可能只支持部分成功
   * 
   * @param items - 待推送的数据项数组
   * @returns 批量推送结果
   * 
   * @example
   * ```typescript
   * const results = await adapter.batchPush([
   *   { entityType: 'goal', entityId: '1', data: encrypted1, version: 0 },
   *   { entityType: 'task', entityId: '2', data: encrypted2, version: 1 },
   *   { entityType: 'reminder', entityId: '3', data: encrypted3, version: 2 },
   * ]);
   * 
   * console.log(`Succeeded: ${results.succeeded}, Failed: ${results.failed}`);
   * if (results.conflicts > 0) {
   *   // 处理冲突项
   *   for (const result of results.results) {
   *     if (result.conflictDetected) {
   *       await handleConflict(result);
   *     }
   *   }
   * }
   * ```
   */
  batchPush(
    items: Array<{
      entityType: string;
      entityId: string;
      data: EncryptedSyncData;
      version: number;
    }>
  ): Promise<BatchPushResult>;

  // ========== 冲突处理 ==========
  
  /**
   * 获取服务端版本信息
   * 
   * 用于冲突检测: 比较本地版本和服务端版本
   * 
   * @param entityType - 实体类型
   * @param entityId - 实体 ID
   * 
   * @returns 服务端版本信息
   * 
   * @throws {NetworkError} 网络错误
   * @throws {NotFoundError} 实体不存在
   * 
   * @example
   * ```typescript
   * const remoteInfo = await adapter.getRemoteVersion('goal', goal.id);
   * if (remoteInfo.exists && remoteInfo.version > localVersion) {
   *   console.warn('Remote data is newer, conflict possible');
   * }
   * ```
   */
  getRemoteVersion(
    entityType: string,
    entityId: string
  ): Promise<RemoteVersionInfo>;

  /**
   * 解决版本冲突
   * 
   * **冲突解决策略**:
   * - `local`: 使用本地版本覆盖服务端
   * - `remote`: 使用服务端版本覆盖本地
   * - `manual`: 使用用户手动合并的结果
   * - `merge`: 使用智能合并结果 (字段级别)
   * 
   * @param conflict - 冲突信息
   * @param resolution - 解决方案
   * 
   * @throws {NetworkError} 网络错误
   * @throws {ConflictError} 冲突解决失败
   * 
   * @example
   * ```typescript
   * // 使用本地版本
   * await adapter.resolveConflict(conflict, {
   *   strategy: 'local',
   * });
   * 
   * // 手动合并
   * await adapter.resolveConflict(conflict, {
   *   strategy: 'manual',
   *   resolvedData: mergedEncryptedData,
   * });
   * 
   * // 字段级别合并
   * await adapter.resolveConflict(conflict, {
   *   strategy: 'merge',
   *   fieldSelections: {
   *     title: 'local',
   *     description: 'remote',
   *     dueDate: 'local',
   *   },
   * });
   * ```
   */
  resolveConflict(
    conflict: ConflictInfo,
    resolution: ConflictResolution
  ): Promise<void>;

  // ========== 游标与增量同步 ==========
  
  /**
   * 获取同步游标
   * 
   * 游标用于跟踪增量同步的位置，支持分页和断点续传
   * 
   * @param entityType - 实体类型
   * 
   * @returns 当前游标状态
   * 
   * @example
   * ```typescript
   * const cursor = await adapter.getCursor('goal');
   * console.log(`Last sync: ${new Date(cursor.lastSyncTimestamp)}`);
   * ```
   */
  getCursor(entityType: string): Promise<SyncCursor>;

  /**
   * 更新同步游标
   * 
   * 在成功同步后调用，用于下次增量同步
   * 
   * @param entityType - 实体类型
   * @param cursor - 新的游标值
   * 
   * @example
   * ```typescript
   * // 同步完成后更新游标
   * await adapter.updateCursor('goal', {
   *   entityType: 'goal',
   *   lastSyncTimestamp: Date.now(),
   *   lastSyncVersion: latestVersion,
   *   createdAt: Date.now(),
   * });
   * ```
   */
  updateCursor(entityType: string, cursor: SyncCursor): Promise<void>;

  // ========== 配置与配额 ==========
  
  /**
   * 获取使用配额信息
   * 
   * 用于监控存储空间和 API 限流
   * 
   * @returns 配额信息 (存储、API 调用等)
   * 
   * @example
   * ```typescript
   * const quota = await adapter.getQuota();
   * console.log(`Storage: ${quota.used} / ${quota.total} bytes`);
   * console.log(`Usage: ${quota.usagePercent}%`);
   * 
   * if (quota.usagePercent > 90) {
   *   console.warn('Storage quota nearly full!');
   * }
   * ```
   */
  getQuota(): Promise<QuotaInfo>;

  /**
   * 设置适配器配置
   * 
   * 支持运行时更新配置，如重试次数、超时时间等
   * 
   * @param config - 配置对象 (部分更新)
   * 
   * @example
   * ```typescript
   * await adapter.setConfig({
   *   retryCount: 5,
   *   retryDelay: 2000,
   *   timeout: 30000,
   * });
   * ```
   */
  setConfig(config: Partial<AdapterConfig>): Promise<void>;

  /**
   * 获取当前配置
   * 
   * @returns 当前完整配置
   * 
   * @example
   * ```typescript
   * const config = await adapter.getConfig();
   * console.log(`Retry count: ${config.retryCount}`);
   * ```
   */
  getConfig(): Promise<AdapterConfig>;

  // ========== 数据导出与导入 ==========
  
  /**
   * 导出全量数据
   * 
   * 用于备份或迁移到其他平台
   * 
   * **注意**: 导出的数据仍然是加密的
   * 
   * @returns 导出的数据包
   * 
   * @throws {NetworkError} 网络错误
   * 
   * @example
   * ```typescript
   * const exportData = await adapter.exportAll();
   * 
   * // 保存到本地文件
   * fs.writeFileSync(
   *   'backup.json',
   *   JSON.stringify(exportData, null, 2)
   * );
   * ```
   */
  exportAll(): Promise<ExportData>;

  /**
   * 导入数据
   * 
   * 用于从备份恢复或从其他平台迁移
   * 
   * **注意**: 导入的数据必须是相同格式的加密数据
   * 
   * @param data - 待导入的数据包
   * @param options - 导入选项 (是否覆盖、冲突策略等)
   * 
   * @throws {NetworkError} 网络错误
   * @throws {ValidationError} 数据格式错误或校验和不匹配
   * 
   * @example
   * ```typescript
   * const backupData = JSON.parse(fs.readFileSync('backup.json', 'utf-8'));
   * 
   * await adapter.importData(backupData, {
   *   overwrite: false,
   *   conflictStrategy: 'skip',
   *   validateChecksum: true,
   * });
   * ```
   */
  importData(
    data: ExportData,
    options?: ImportOptions
  ): Promise<void>;

  // ========== 清理与销毁 ==========
  
  /**
   * 清空本地缓存
   * 
   * 用于释放内存或强制重新拉取数据
   * 
   * @example
   * ```typescript
   * await adapter.clearCache();
   * ```
   */
  clearCache(): Promise<void>;

  /**
   * 关闭适配器并释放资源
   * 
   * 调用后适配器不可再使用，必须重新 authenticate
   * 
   * @example
   * ```typescript
   * await adapter.disconnect();
   * ```
   */
  disconnect(): Promise<void>;
}

/**
 * 适配器构造函数类型
 * 
 * 用于工厂模式注册
 */
export type SyncAdapterConstructor = new (
  credentials: AdapterCredentials
) => ISyncAdapter;
