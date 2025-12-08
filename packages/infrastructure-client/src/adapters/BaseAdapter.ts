/**
 * @fileoverview 基础同步适配器 - 提供加密集成
 * @module @dailyuse/infrastructure-client/adapters
 */

import type {
  ISyncAdapter,
  AdapterCredentials,
  EncryptedSyncData,
  HealthStatus,
  PushResult,
  PullResult,
  BatchPushResult,
  ConflictInfo,
  ConflictResolution,
  RemoteVersionInfo,
  SyncCursor,
  QuotaInfo,
  AdapterConfig,
  ExportData,
  ImportOptions,
} from '@dailyuse/application-client/sync';

import { EncryptionService } from '../encryption/EncryptionService';
import type { EncryptedData } from '../encryption/types';

/**
 * 基础适配器 - 提供加密集成
 * 
 * 所有具体适配器（GitHub、Nutstore、Dropbox等）都应继承此类
 * 
 * **职责**:
 * - 管理加密服务生命周期
 * - 提供加密/解密辅助方法
 * - 定义公共的清理逻辑
 * 
 * **子类需要实现**:
 * - 所有 ISyncAdapter 接口方法
 * - cleanup() 方法 (适配器特定的清理逻辑)
 * 
 * @example
 * ```typescript
 * export class GitHubSyncAdapter extends BaseAdapter {
 *   private octokit: Octokit;
 * 
 *   async authenticate(credentials: AdapterCredentials) {
 *     await super.authenticate(credentials); // 初始化加密
 *     this.octokit = new Octokit({ auth: credentials.token });
 *   }
 * 
 *   async push(entityType, entityId, data, version) {
 *     // data 已经是加密的，直接上传到 GitHub
 *     await this.octokit.repos.createOrUpdateFileContents({
 *       // ...
 *     });
 *   }
 * 
 *   protected async cleanup() {
 *     // GitHub 特定的清理逻辑
 *     this.octokit = null;
 *   }
 * }
 * ```
 */
export abstract class BaseAdapter implements ISyncAdapter {
  protected encryptionService: EncryptionService;
  protected credentials: AdapterCredentials;
  protected initialized: boolean = false;
  
  /**
   * 构造函数
   * 
   * @param credentials - 云平台认证凭据
   */
  constructor(credentials: AdapterCredentials) {
    this.credentials = credentials;
    
    // 初始化加密服务
    // 密钥派生使用用户提供的加密密钥（通常是密码）
    this.encryptionService = new EncryptionService(credentials.encryptionKey);
  }
  
  // ===== 加密辅助方法 =====
  
  /**
   * 加密数据
   * 
   * 将明文数据转换为 ISyncAdapter 兼容的 EncryptedSyncData 格式
   * 
   * @param plaintext - 明文数据 (通常是 JSON 字符串)
   * @returns 加密后的数据
   * 
   * @protected
   * 
   * @example
   * ```typescript
   * const goal = { id: '1', title: 'Learn TypeScript' };
   * const encryptedData = await this.encryptData(JSON.stringify(goal));
   * // 现在可以安全地上传到云平台
   * ```
   */
  protected async encryptData(plaintext: string | Buffer): Promise<EncryptedSyncData> {
    const encrypted: EncryptedData = this.encryptionService.encrypt(plaintext);
    
    // 转换为 ISyncAdapter 兼容格式
    return {
      encryptedPayload: encrypted.encryptedPayload,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      algorithm: encrypted.algorithm,
      metadata: encrypted.metadata,
    };
  }
  
  /**
   * 解密数据
   * 
   * 将 EncryptedSyncData 解密为明文
   * 
   * @param encryptedData - 加密的数据
   * @returns 明文数据
   * 
   * @protected
   * 
   * @example
   * ```typescript
   * const encrypted = await this.pull('goal', lastSyncTime);
   * for (const item of encrypted.items) {
   *   const plaintext = await this.decryptData(item.data);
   *   const goal = JSON.parse(plaintext);
   *   console.log(goal.title);
   * }
   * ```
   */
  protected async decryptData(encryptedData: EncryptedSyncData): Promise<string> {
    // 转换为 EncryptionService 格式
    const encrypted: EncryptedData = {
      encryptedPayload: encryptedData.encryptedPayload,
      iv: encryptedData.iv,
      authTag: encryptedData.authTag,
      algorithm: encryptedData.algorithm,
      keyVersion: 1, // 默认使用版本 1，子类可以覆盖
      metadata: encryptedData.metadata,
    };
    
    return this.encryptionService.decrypt(encrypted);
  }
  
  // ===== ISyncAdapter 接口方法 (子类必须实现) =====
  
  abstract authenticate(credentials: AdapterCredentials): Promise<void>;
  abstract checkHealth(): Promise<HealthStatus>;
  abstract push(
    entityType: string,
    entityId: string,
    data: EncryptedSyncData,
    version: number
  ): Promise<PushResult>;
  abstract pull(
    entityType: string,
    since: number,
    version?: number
  ): Promise<PullResult>;
  abstract batchPush(
    items: Array<{
      entityType: string;
      entityId: string;
      data: EncryptedSyncData;
      version: number;
    }>
  ): Promise<BatchPushResult>;
  abstract getRemoteVersion(
    entityType: string,
    entityId: string
  ): Promise<RemoteVersionInfo>;
  abstract resolveConflict(
    conflict: ConflictInfo,
    resolution: ConflictResolution
  ): Promise<void>;
  abstract getCursor(entityType: string): Promise<SyncCursor>;
  abstract updateCursor(entityType: string, cursor: SyncCursor): Promise<void>;
  abstract getQuota(): Promise<QuotaInfo>;
  abstract setConfig(config: Partial<AdapterConfig>): Promise<void>;
  abstract getConfig(): Promise<AdapterConfig>;
  abstract exportAll(): Promise<ExportData>;
  abstract importData(data: ExportData, options?: ImportOptions): Promise<void>;
  abstract clearCache(): Promise<void>;
  
  /**
   * 断开连接并清理资源
   * 
   * **清理流程**:
   * 1. 调用子类的 cleanup() 方法
   * 2. 销毁加密服务 (清理密钥)
   * 3. 标记为未初始化
   * 
   * @example
   * ```typescript
   * // 应用关闭时
   * await adapter.disconnect();
   * ```
   */
  async disconnect(): Promise<void> {
    // 调用子类特定的清理逻辑
    await this.cleanup();
    
    // 销毁加密服务 (清理密钥)
    this.encryptionService.destroy();
    
    // 标记为未初始化
    this.initialized = false;
  }
  
  /**
   * 适配器特定的清理逻辑
   * 
   * 子类应该实现此方法来清理适配器特定的资源
   * 例如：关闭网络连接、清理缓存等
   * 
   * @protected
   * @abstract
   * 
   * @example
   * ```typescript
   * protected async cleanup() {
   *   // 关闭 HTTP 客户端
   *   this.httpClient = null;
   *   
   *   // 清理本地缓存
   *   this.cache.clear();
   * }
   * ```
   */
  protected abstract cleanup(): Promise<void>;
}
