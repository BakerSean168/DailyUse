/**
 * Account IPC Client - Account 模块 IPC 客户端
 * 
 * @module renderer/modules/account/infrastructure/ipc
 */

import { BaseIPCClient, ipcClient } from '@/renderer/shared/infrastructure/ipc';
import { AccountChannels } from '@/shared/types/ipc-channels';

// ============ Types ============

export interface AccountDTO {
  uuid: string;
  email: string;
  name: string;
  avatar?: string;
  type: AccountType;
  status: AccountStatus;
  subscription?: SubscriptionDTO;
  preferences: AccountPreferencesDTO;
  createdAt: number;
  updatedAt: number;
  lastLoginAt?: number;
}

export type AccountType = 'free' | 'pro' | 'team' | 'enterprise';
export type AccountStatus = 'active' | 'inactive' | 'suspended' | 'deleted';

export interface SubscriptionDTO {
  planId: string;
  planName: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  expiresAt: number;
  features: string[];
}

export interface AccountPreferencesDTO {
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  weekStartsOn: number;
  notifications: NotificationPreferencesDTO;
}

export interface NotificationPreferencesDTO {
  email: boolean;
  push: boolean;
  desktop: boolean;
  sound: boolean;
  reminderLeadTime: number;
}

export interface AccountStatisticsDTO {
  totalTasks: number;
  completedTasks: number;
  totalGoals: number;
  achievedGoals: number;
  totalFocusMinutes: number;
  currentStreak: number;
  longestStreak: number;
  memberSince: number;
}

export interface UsageDTO {
  storageUsed: number;
  storageLimit: number;
  apiCallsUsed: number;
  apiCallsLimit: number;
  aiCreditsUsed: number;
  aiCreditsLimit: number;
}

export interface CreateAccountRequest {
  email: string;
  name: string;
  avatar?: string;
}

export interface UpdateAccountRequest {
  uuid: string;
  name?: string;
  email?: string;
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
