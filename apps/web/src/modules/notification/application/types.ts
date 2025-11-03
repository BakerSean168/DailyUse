/**
 * Notification 模块类型定义
 * @description 定义通知系统的核心类型和接口
 */

/**
 * 通知类型枚举
 */
export enum NotificationType {
  REMINDER = 'reminder', // 提醒通知
  TASK = 'task', // 任务通知
  GOAL = 'goal', // 目标通知
  SYSTEM = 'system', // 系统通知
  WARNING = 'warning', // 警告通知
  ERROR = 'error', // 错误通知
  SUCCESS = 'success', // 成功通知
  INFO = 'info', // 信息通知
}

/**
 * 通知优先级
 */
export enum NotificationPriority {
  LOW = 'low', // 低优先级
  NORMAL = 'normal', // 普通优先级
  HIGH = 'high', // 高优先级
  URGENT = 'urgent', // 紧急优先级
}

/**
 * 通知方式
 */
export enum NotificationMethod {
  DESKTOP = 'desktop', // 桌面通知（系统级弹窗）
  SOUND = 'sound', // 声音提醒
  VIBRATION = 'vibration', // 振动（移动设备）
  EMAIL = 'email', // 邮件通知
  IN_APP = 'in_app', // 应用内通知
}

/**
 * 声音类型
 */
export enum SoundType {
  DEFAULT = 'default', // 默认提示音
  REMINDER = 'reminder', // 提醒音
  ALERT = 'alert', // 警告音
  SUCCESS = 'success', // 成功音
  ERROR = 'error', // 错误音
  NOTIFICATION = 'notification', // 通知音
  CUSTOM = 'custom', // 自定义音频
}

/**
 * 通知配置接口
 */
export interface NotificationConfig {
  id: string; // 通知唯一ID
  title: string; // 通知标题
  message: string; // 通知内容
  type: NotificationType; // 通知类型
  priority: NotificationPriority; // 优先级
  methods: NotificationMethod[]; // 通知方式
  persistent?: boolean; // 是否持久化显示
  autoClose?: number; // 自动关闭时间(毫秒)
  timestamp?: Date; // 通知时间
  sourceModule?: string; // 来源模块
  sourceId?: string; // 来源ID
  data?: Record<string, any>; // 附加数据
  actions?: NotificationAction[]; // 操作按钮
  sound?: SoundConfig; // 声音配置
  desktop?: DesktopNotificationConfig; // 桌面通知配置
}

/**
 * 通知操作按钮
 */
export interface NotificationAction {
  id: string; // 操作ID
  label: string; // 按钮文字
  action: string; // 操作类型
  icon?: string; // 图标
  primary?: boolean; // 是否主要按钮
  handler?: (notification: NotificationConfig) => void | Promise<void>; // 点击处理器
}

/**
 * 声音配置
 */
export interface SoundConfig {
  enabled: boolean; // 是否启用声音
  type: SoundType; // 声音类型
  volume?: number; // 音量 (0-1)
  loop?: boolean; // 是否循环播放
  duration?: number; // 播放时长(毫秒)
  customUrl?: string; // 自定义音频URL
}

/**
 * 桌面通知配置
 */
export interface DesktopNotificationConfig {
  icon?: string; // 图标URL
  badge?: string; // 徽章图标
  image?: string; // 大图片
  vibrate?: number[]; // 振动模式
  silent?: boolean; // 静默模式
  requireInteraction?: boolean; // 需要用户交互
  renotify?: boolean; // 重复通知
  tag?: string; // 通知标签
}

/**
 * 通知统计接口
 */
export interface NotificationStats {
  total: number; // 总通知数
  unread: number; // 未读通知数
  byType: Record<NotificationType, number>; // 按类型统计
  byPriority: Record<NotificationPriority, number>; // 按优先级统计
  todayCount: number; // 今日通知数
}

/**
 * 通知权限状态
 */
export enum NotificationPermission {
  GRANTED = 'granted', // 已授权
  DENIED = 'denied', // 已拒绝
  DEFAULT = 'default', // 默认（未询问）
}

/**
 * 通知服务配置
 */
export interface NotificationServiceConfig {
  maxConcurrentNotifications: number; // 最大并发通知数
  defaultAutoClose: number; // 默认自动关闭时间
  enablePersistence: boolean; // 启用持久化
  soundEnabled: boolean; // 启用声音
  vibrationEnabled: boolean; // 启用振动
  desktopEnabled: boolean; // 启用桌面通知
  globalVolume: number; // 全局音量
  doNotDisturbEnabled: boolean; // 勿扰模式
  doNotDisturbSchedule?: {
    // 勿扰时间段
    start: string; // 开始时间 (HH:mm)
    end: string; // 结束时间 (HH:mm)
  };
}

/**
 * 通知事件类型
 */
export const NOTIFICATION_EVENTS = {
  // 通知生命周期
  CREATED: 'notification:created',
  SHOWN: 'notification:shown',
  CLICKED: 'notification:clicked',
  CLOSED: 'notification:closed',
  DISMISSED: 'notification:dismissed',

  // 权限相关
  PERMISSION_REQUESTED: 'notification:permission-requested',
  PERMISSION_GRANTED: 'notification:permission-granted',
  PERMISSION_DENIED: 'notification:permission-denied',

  // 配置相关
  CONFIG_UPDATED: 'notification:config-updated',
  DND_ENABLED: 'notification:dnd-enabled',
  DND_DISABLED: 'notification:dnd-disabled',

  // 系统事件
  QUEUE_FULL: 'notification:queue-full',
  ERROR: 'notification:error',
} as const;

/**
 * 通知事件载荷
 */
export interface NotificationEventPayload {
  notification: NotificationConfig;
  timestamp: Date;
  source?: string;
  error?: Error;
}

/**
 * 通知历史记录
 */
export interface NotificationHistory {
  id: string;
  notification: NotificationConfig;
  createdAt: Date;
  shownAt?: Date;
  clickedAt?: Date;
  closedAt?: Date;
  status: 'pending' | 'shown' | 'clicked' | 'closed' | 'dismissed';
  userAgent?: string;
}

/**
 * 通知过滤器
 */
export interface NotificationFilter {
  types?: NotificationType[];
  priorities?: NotificationPriority[];
  dateFrom?: Date;
  dateTo?: Date;
  sourceModule?: string;
  status?: string[];
  limit?: number;
  offset?: number;
}

/**
 * 通知搜索结果
 */
export interface NotificationSearchResult {
  items: NotificationHistory[];
  total: number;
  hasMore: boolean;
}

/**
 * 提醒触发事件载荷（来自Schedule模块）
 */
export interface ReminderTriggeredPayload {
  reminderId: string; // 提醒ID
  sourceType: 'task' | 'goal' | 'reminder' | 'custom'; // 来源类型
  sourceId: string; // 来源ID
  title: string; // 标题
  message: string; // 消息内容
  priority: NotificationPriority; // 优先级
  methods: NotificationMethod[]; // 通知方式
  scheduledTime: Date; // 预定时间
  actualTime: Date; // 实际触发时间
  metadata?: Record<string, any>; // 元数据
}

/**
 * 通知服务接口
 */
export interface INotificationService {
  // 基础通知方法
  show(config: NotificationConfig): Promise<string>;
  dismiss(id: string): Promise<void>;
  dismissAll(): Promise<void>;

  // 快捷方法
  showInfo(message: string, options?: Partial<NotificationConfig>): Promise<string>;
  showSuccess(message: string, options?: Partial<NotificationConfig>): Promise<string>;
  showWarning(message: string, options?: Partial<NotificationConfig>): Promise<string>;
  showError(message: string, options?: Partial<NotificationConfig>): Promise<string>;

  // 权限管理
  requestPermission(): Promise<NotificationPermission>;
  getPermission(): NotificationPermission;

  // 配置管理
  updateConfig(config: Partial<NotificationServiceConfig>): void;
  getConfig(): NotificationServiceConfig;

  // 统计和历史
  getStats(): NotificationStats;
  getHistory(filter?: NotificationFilter): Promise<NotificationSearchResult>;
  clearHistory(): Promise<void>;
}
