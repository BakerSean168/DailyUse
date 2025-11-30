/**
 * Notification Module Enums
 * 通知模块枚举定义
 *
 * 注意：枚举定义放在独立文件中，因为枚举通常是通用的，
 * 可以在 Server、Client、Persistence 层之间共享
 *
 * ImportanceLevel 和 UrgencyLevel 从 @dailyuse/contracts/shared 导入
 */

// ============ 通知相关枚举 ============

/**
 * 通知类型枚举
 */
export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  REMINDER = 'REMINDER',
  SYSTEM = 'SYSTEM',
  SOCIAL = 'SOCIAL',
}

/**
 * 通知分类枚举
 */
export enum NotificationCategory {
  TASK = 'TASK',
  GOAL = 'GOAL',
  SCHEDULE = 'SCHEDULE',
  REMINDER = 'REMINDER',
  ACCOUNT = 'ACCOUNT',
  SYSTEM = 'SYSTEM',
  OTHER = 'OTHER',
}

/**
 * 通知状态枚举
 */
export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/**
 * 关联实体类型枚举
 */
export enum RelatedEntityType {
  TASK = 'TASK',
  GOAL = 'GOAL',
  SCHEDULE = 'SCHEDULE',
  REMINDER = 'REMINDER',
}

// ============ 通知渠道相关枚举 ============

/**
 * 通知渠道类型枚举
 */
export enum NotificationChannelType {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  SMS = 'SMS',
  WEBHOOK = 'WEBHOOK',
}

/**
 * 渠道状态枚举
 */
export enum ChannelStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

// ============ 通知操作相关枚举 ============

/**
 * 通知操作类型枚举
 */
export enum NotificationActionType {
  NAVIGATE = 'NAVIGATE',
  API_CALL = 'API_CALL',
  DISMISS = 'DISMISS',
  CUSTOM = 'CUSTOM',
}

// ============ 通知内容相关枚举 ============

/**
 * 内容类型枚举（用于 LinkedContent）
 */
export enum ContentType {
  ARTICLE = 'ARTICLE',
  VIDEO = 'VIDEO',
  IMAGE = 'IMAGE',
  DOCUMENT = 'DOCUMENT',
  OTHER = 'OTHER',
}
