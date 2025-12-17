/**
 * Account IPC Client - Account 模块 IPC 客户端
 * 
 * @module renderer/modules/account/infrastructure/ipc
 */

import { BaseIPCClient, ipcClient } from '@/renderer/shared/infrastructure/ipc';
import { AccountChannels } from '@/shared/types/ipc-channels';

// ============ Types from contracts ============
// Re-export from contracts for convenience
export type {
  AccountClientDTO,
  AccountServerDTO,
  SubscriptionClientDTO,
  SubscriptionServerDTO,
  AccountHistoryClientDTO,
  AccountHistoryServerDTO,
} from '@dailyuse/contracts/account';

export {
  AccountStatus,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@dailyuse/contracts/account';

// Import types for internal use
import type {
  AccountClientDTO,
  AccountServerDTO,
  SubscriptionClientDTO,
  AccountHistoryClientDTO,
  AccountStatsResponseDTO,
  CreateAccountRequest,
  UpdateAccountProfileRequest,
  UpdateAccountPreferencesRequest,
} from '@dailyuse/contracts/account';

// ============ Local Types (for IPC-specific operations) ============

/**
 * AccountDTO 别名 - 用于 IPC 传输
 * 客户端使用 AccountClientDTO，但为了向后兼容保留 AccountDTO 别名
 */
export type AccountDTO = AccountClientDTO;

/**
 * SubscriptionDTO 别名
 */
export type SubscriptionDTO = SubscriptionClientDTO;

/**
 * AccountHistoryDTO 别名
 */
export type AccountHistoryDTO = AccountHistoryClientDTO;

/**
 * AccountStatisticsDTO 别名
 */
export type AccountStatisticsDTO = AccountStatsResponseDTO;

/**
 * AccountPreferencesDTO 别名 - 从 AccountClientDTO 中提取
 */
export type AccountPreferencesDTO = AccountClientDTO['preferences'];

/**
 * UpdateAccountRequest 别名
 */
export type UpdateAccountRequest = UpdateAccountProfileRequest;

/**
 * Usage DTO for storage/API limits
 */
export interface UsageDTO {
  storageUsed: number;
  storageLimit: number;
  apiCallsUsed: number;
  apiCallsLimit: number;
  aiCreditsUsed: number;
  aiCreditsLimit: number;
}

// ============ Account IPC Client ============

/**
 * Account IPC Client
 */
export class AccountIPCClient {
  private client: BaseIPCClient;

  constructor(client: BaseIPCClient = ipcClient) {
    this.client = client;
  }

  // ============ Account CRUD ============

  /**
   * 获取当前账户
   */
  async getCurrent(): Promise<AccountDTO | null> {
    return this.client.invoke<AccountDTO | null>(
      AccountChannels.GET_CURRENT,
      {}
    );
  }

  /**
   * 获取当前账户 (alias for getCurrent)
   */
  async getCurrentAccount(): Promise<AccountDTO | null> {
    return this.getCurrent();
  }

  /**
   * 获取账户列表
   */
  async list(): Promise<AccountDTO[]> {
    return this.client.invoke<AccountDTO[]>(
      AccountChannels.LIST,
      {}
    );
  }

  /**
   * 获取单个账户
   */
  async get(uuid: string): Promise<AccountDTO> {
    return this.client.invoke<AccountDTO>(
      AccountChannels.GET,
      { uuid }
    );
  }

  /**
   * 创建账户
   */
  async create(params: CreateAccountRequest): Promise<AccountDTO> {
    return this.client.invoke<AccountDTO>(
      AccountChannels.CREATE,
      params
    );
  }

  /**
   * 更新账户
   */
  async update(params: UpdateAccountRequest): Promise<AccountDTO> {
    return this.client.invoke<AccountDTO>(
      AccountChannels.UPDATE,
      params
    );
  }

  /**
   * 删除账户
   */
  async delete(uuid: string): Promise<void> {
    return this.client.invoke<void>(
      AccountChannels.DELETE,
      { uuid }
    );
  }

  // ============ Account Operations ============

  /**
   * 切换当前账户
   */
  async switchAccount(uuid: string): Promise<AccountDTO> {
    return this.client.invoke<AccountDTO>(
      AccountChannels.SWITCH,
      { uuid }
    );
  }

  /**
   * 更新头像
   */
  async updateAvatar(uuid: string, avatarPath: string): Promise<AccountDTO> {
    return this.client.invoke<AccountDTO>(
      AccountChannels.UPDATE_AVATAR,
      { uuid, avatarPath }
    );
  }

  // ============ Preferences ============

  /**
   * 获取偏好设置
   */
  async getPreferences(uuid: string): Promise<AccountPreferencesDTO> {
    return this.client.invoke<AccountPreferencesDTO>(
      AccountChannels.PREFERENCES_GET,
      { uuid }
    );
  }

  /**
   * 更新偏好设置
   */
  async updatePreferences(
    uuid: string,
    preferences: Partial<AccountPreferencesDTO>
  ): Promise<AccountPreferencesDTO> {
    return this.client.invoke<AccountPreferencesDTO>(
      AccountChannels.PREFERENCES_UPDATE,
      { uuid, preferences }
    );
  }

  // ============ Subscription ============

  /**
   * 获取订阅信息
   */
  async getSubscription(uuid: string): Promise<SubscriptionDTO | null> {
    return this.client.invoke<SubscriptionDTO | null>(
      AccountChannels.GET_SUBSCRIPTION,
      { uuid }
    );
  }

  /**
   * 更新订阅
   */
  async updateSubscription(uuid: string, planId: string): Promise<SubscriptionDTO> {
    return this.client.invoke<SubscriptionDTO>(
      AccountChannels.UPDATE_SUBSCRIPTION,
      { uuid, planId }
    );
  }

  /**
   * 取消订阅
   */
  async cancelSubscription(uuid: string): Promise<SubscriptionDTO> {
    return this.client.invoke<SubscriptionDTO>(
      AccountChannels.CANCEL_SUBSCRIPTION,
      { uuid }
    );
  }

  // ============ Statistics & Usage ============

  /**
   * 获取账户统计
   */
  async getStatistics(uuid: string): Promise<AccountStatisticsDTO> {
    return this.client.invoke<AccountStatisticsDTO>(
      AccountChannels.GET_STATS,
      { uuid }
    );
  }

  /**
   * 获取账户统计 (alias for getStatistics)
   */
  async getStats(uuid: string): Promise<AccountStatisticsDTO> {
    return this.getStatistics(uuid);
  }

  /**
   * 获取账户历史
   */
  async getHistory(uuid: string): Promise<AccountHistoryDTO[]> {
    return this.client.invoke<AccountHistoryDTO[]>(
      AccountChannels.GET_HISTORY,
      { uuid }
    );
  }

  /**
   * 获取使用量
   */
  async getUsage(uuid: string): Promise<UsageDTO> {
    return this.client.invoke<UsageDTO>(
      AccountChannels.GET_USAGE,
      { uuid }
    );
  }

  // ============ Sync ============

  /**
   * 开始同步账户数据
   */
  async startSync(uuid: string): Promise<void> {
    return this.client.invoke<void>(
      AccountChannels.SYNC_START,
      { uuid }
    );
  }

  /**
   * 停止同步
   */
  async stopSync(uuid: string): Promise<void> {
    return this.client.invoke<void>(
      AccountChannels.SYNC_STOP,
      { uuid }
    );
  }

  /**
   * 获取同步状态
   */
  async getSyncStatus(uuid: string): Promise<{
    lastSyncAt?: number;
    status: 'idle' | 'syncing' | 'error';
    error?: string;
  }> {
    return this.client.invoke<{
      lastSyncAt?: number;
      status: 'idle' | 'syncing' | 'error';
      error?: string;
    }>(
      AccountChannels.SYNC_STATUS,
      { uuid }
    );
  }

  /**
   * 获取同步历史
   */
  async getSyncHistory(uuid: string): Promise<Array<{
    syncedAt: number;
    status: string;
    itemsSynced: number;
  }>> {
    return this.client.invoke(
      AccountChannels.SYNC_HISTORY,
      { uuid }
    );
  }
}

// ============ Singleton Export ============

export const accountIPCClient = new AccountIPCClient();
