/**
 * NotificationPreference Aggregate Root - Server Interface
 * 通知偏好聚合根 - 服务端接口
 */

import type { NotificationCategory } from '../enums';
import type {
  CategoryPreferenceServerDTO,
  DoNotDisturbConfigServerDTO,
  RateLimitServerDTO,
} from '../value-objects';

// ============ 辅助类型 ============

/**
 * 渠道配置
 */
export interface ChannelPreferences {
  inApp: boolean;
  email: boolean;
  push: boolean;
  sms: boolean;
}

/**
 * 分类偏好配置
 */
export interface CategoryPreferences {
  task: CategoryPreferenceServerDTO;
  goal: CategoryPreferenceServerDTO;
  schedule: CategoryPreferenceServerDTO;
  reminder: CategoryPreferenceServerDTO;
  account: CategoryPreferenceServerDTO;
  system: CategoryPreferenceServerDTO;
}

// ============ DTO 定义 ============

/**
 * NotificationPreference Server DTO
 */
export interface NotificationPreferenceServerDTO {
  uuid: string;
  accountUuid: string;
  enabled: boolean;
  channels: ChannelPreferences;
  categories: CategoryPreferences;
  doNotDisturb?: DoNotDisturbConfigServerDTO | null;
  rateLimit?: RateLimitServerDTO | null;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}

/**
 * NotificationPreference Persistence DTO (数据库映射)
 */
export interface NotificationPreferencePersistenceDTO {
  uuid: string;
  accountUuid: string;
  enabled: boolean;
  channels: string; // JSON string
  categories: string; // JSON string
  doNotDisturb?: string | null; // JSON string
  rateLimit?: string | null; // JSON string
  createdAt: number;
  updatedAt: number;
}

// ============ 领域事件 ============

/**
 * 偏好创建事件
 */
export interface NotificationPreferenceCreatedEvent {
  type: 'notification.preference.created';
  aggregateId: string; // preferenceUuid
  timestamp: number; // epoch ms
  payload: {
    preference: NotificationPreferenceServerDTO;
  };
}

/**
 * 偏好更新事件
 */
export interface NotificationPreferenceUpdatedEvent {
  type: 'notification.preference.updated';
  aggregateId: string;
  timestamp: number;
  payload: {
    preference: NotificationPreferenceServerDTO;
    changes: string[];
  };
}

/**
 * NotificationPreference 领域事件联合类型
 */
export type NotificationPreferenceDomainEvent =
  | NotificationPreferenceCreatedEvent
  | NotificationPreferenceUpdatedEvent;

// ============ 实体接口 ============

/**
 * NotificationPreference 聚合根 - Server 接口（实例方法）
 */
export interface NotificationPreferenceServer {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  enabled: boolean;

  // ===== 渠道开关 =====
  channels: ChannelPreferences;

  // ===== 分类偏好 =====
  categories: CategoryPreferences;

  // ===== 免打扰设置（值对象） =====
  doNotDisturb?: DoNotDisturbConfigServerDTO | null;

  // ===== 频率限制（值对象） =====
  rateLimit?: RateLimitServerDTO | null;

  // ===== 时间戳 (统一使用 number epoch ms) =====
  createdAt: number;
  updatedAt: number;

  // ===== 业务方法 =====

  // 全局管理
  enableAll(): void;
  disableAll(): void;

  // 渠道管理
  enableChannel(channel: 'inApp' | 'email' | 'push' | 'sms'): void;
  disableChannel(channel: 'inApp' | 'email' | 'push' | 'sms'): void;

  // 分类管理
  updateCategoryPreference(
    category: NotificationCategory,
    preference: Partial<CategoryPreferenceServerDTO>,
  ): void;

  // 免打扰
  enableDoNotDisturb(startTime: string, endTime: string, daysOfWeek: number[]): void;
  disableDoNotDisturb(): void;
  isInDoNotDisturbPeriod(): boolean;

  // 频率限制
  checkRateLimit(): boolean;

  // 查询
  shouldSendNotification(category: string, type: string, channel: string): boolean;

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO
   */
  toServerDTO(): NotificationPreferenceServerDTO;

  /**
   * 转换为 Persistence DTO (数据库)
   */
  toPersistenceDTO(): NotificationPreferencePersistenceDTO;
}

/**
 * NotificationPreference 静态工厂方法接口
 */
export interface NotificationPreferenceServerStatic {
  /**
   * 创建新的 NotificationPreference 聚合根（静态工厂方法）
   */
  create(params: {
    accountUuid: string;
    enabled?: boolean;
    channels?: Partial<ChannelPreferences>;
    categories?: Partial<CategoryPreferences>;
  }): NotificationPreferenceServer;

  /**
   * 从 Server DTO 创建实体
   */
  fromServerDTO(dto: NotificationPreferenceServerDTO): NotificationPreferenceServer;

  /**
   * 从 Persistence DTO 创建实体
   */
  fromPersistenceDTO(dto: NotificationPreferencePersistenceDTO): NotificationPreferenceServer;
}
