// 导出响应系统类型定义
export * from './response';

// 导出共享的基础类型定义
export * as sharedContracts from './shared/index';
// 直接导出重要的枚举类型，方便其他包使用
export { ImportanceLevel } from './shared/importance';
export { UrgencyLevel } from './shared/urgency';

// 导出模块相关的类型定义（定义命名空间防止冲突）
export * as TaskContracts from './modules/task';
export * as GoalContracts from './modules/goal';
export * as ReminderContracts from './modules/reminder';
export * as EditorContracts from './modules/editor';
export * as RepositoryContracts from './modules/repository';
export * as AccountContracts from './modules/account';
export * as AuthenticationContracts from './modules/authentication';
export * as ScheduleContracts from './modules/schedule';
export * as SettingContracts from './modules/setting';
export * as NotificationContracts from './modules/notification';
export * as DocumentContracts from './document.contracts';

export {
  ScheduleTaskStatus,
  ExecutionStatus,
  TaskPriority,
  SourceModule,
  Timezone,
} from './modules/schedule/enums';

// 旧枚举的类型别名（向后兼容，待迁移）
// TODO: 逐步迁移使用旧枚举的代码到新枚举
export { TaskPriority as SchedulePriority } from './modules/schedule/enums';

// 导出 Goal 枚举（新的 DDD 架构）
export { GoalStatus, KeyResultValueType, ReviewType, FolderType } from './modules/goal/enums';

// 导出 Notification 枚举（新的 DDD 架构）
export {
  NotificationType,
  NotificationCategory,
  NotificationStatus,
  RelatedEntityType,
  NotificationChannelType,
  ChannelStatus,
  NotificationActionType,
  ContentType,
} from './modules/notification/enums';

// 导出 Repository 枚举
export {
  ResourceType,
  ResourceStatus,
  RepositoryStatus,
  RepositoryType,
  ReferenceType,
} from './modules/repository/enums';

// 导出 Setting 枚举（新的 DDD 架构）
export {
  SettingValueType,
  SettingScope,
  UIInputType,
  OperatorType,
  AppEnvironment,
  ThemeMode,
  FontSize,
  DateFormat,
  TimeFormat,
  TaskViewType,
  GoalViewType,
  ScheduleViewType,
  ProfileVisibility,
} from './modules/setting/enums';

// 旧的 Notification 枚举（已废弃，待迁移）
// export {
//   NotificationType,
//   NotificationStatus,
//   NotificationPriority,
//   NotificationChannel,
//   DeliveryStatus,
//   NotificationActionType, // 添加 NotificationActionType
// } from './modules/notification/enums';

// 导出 Task 枚举（常用的）
export {
  TaskTemplateStatus,
  TaskInstanceStatus,
  TaskType,
  TimeType,
  RecurrenceFrequency,
  DayOfWeek,
  ReminderType,
  ReminderTimeUnit,
} from './modules/task/enums';

// 导出所有模块的类型定义（向后兼容，待迁移）
export * from './modules/account';
export * from './modules/authentication';
export * from './modules/editor';
// export * from './modules/goal'; // Conflicting exports
// export * from './modules/notification';
// export * from './modules/reminder'; // Conflicting exports
export * from './modules/repository';
export * from './modules/schedule';
export * from './modules/setting';
// export * from './modules/task'; // Conflicting exports
