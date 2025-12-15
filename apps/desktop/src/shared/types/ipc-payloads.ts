/**
 * IPC Payload Types - IPC 请求/响应载荷类型定义
 * 
 * @module shared/types/ipc-payloads
 */

// ============ Common Types ============

/**
 * 分页请求参数
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  offset?: number;
  limit?: number;
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 日期范围参数
 */
export interface DateRangeParams {
  startDate: number; // Unix timestamp
  endDate: number;   // Unix timestamp
}

/**
 * 排序参数
 */
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 过滤参数
 */
export interface FilterParams {
  [key: string]: unknown;
}

// ============ Task Payloads ============

export namespace TaskPayloads {
  // Template
  export interface ListRequest extends PaginationParams, SortParams {
    accountUuid: string;
    folderId?: string;
    archived?: boolean;
    search?: string;
  }

  export interface GetRequest {
    uuid: string;
  }

  export interface CreateRequest {
    accountUuid: string;
    title: string;
    description?: string;
    priority?: number;
    dueDate?: number;
    tags?: string[];
    folderId?: string;
    goalUuid?: string;
  }

  export interface UpdateRequest {
    uuid: string;
    title?: string;
    description?: string;
    priority?: number;
    dueDate?: number;
    tags?: string[];
    folderId?: string;
    goalUuid?: string;
  }

  export interface DeleteRequest {
    uuid: string;
  }

  export interface MoveToFolderRequest {
    uuid: string;
    folderId: string | null;
  }

  // Instance
  export interface InstanceListRequest extends DateRangeParams {
    accountUuid: string;
    templateUuid?: string;
    completed?: boolean;
  }

  export interface InstanceCompleteRequest {
    uuid: string;
    completedAt?: number;
  }

  export interface InstanceSkipRequest {
    uuid: string;
    reason?: string;
  }

  export interface InstancePostponeRequest {
    uuid: string;
    newDueDate: number;
  }

  // Statistics
  export interface StatisticsRequest extends DateRangeParams {
    accountUuid: string;
  }

  // Folder
  export interface FolderListRequest {
    accountUuid: string;
  }

  export interface FolderCreateRequest {
    accountUuid: string;
    name: string;
    color?: string;
    icon?: string;
    parentId?: string;
  }

  export interface FolderUpdateRequest {
    uuid: string;
    name?: string;
    color?: string;
    icon?: string;
  }

  export interface FolderDeleteRequest {
    uuid: string;
  }
}

// ============ Goal Payloads ============

export namespace GoalPayloads {
  export interface ListRequest extends PaginationParams {
    accountUuid: string;
    folderId?: string;
    archived?: boolean;
    status?: string;
  }

  export interface GetRequest {
    uuid: string;
  }

  export interface CreateRequest {
    accountUuid: string;
    title: string;
    description?: string;
    targetDate?: number;
    priority?: number;
    folderId?: string;
    parentGoalUuid?: string;
  }

  export interface UpdateRequest {
    uuid: string;
    title?: string;
    description?: string;
    targetDate?: number;
    priority?: number;
    status?: string;
    progress?: number;
  }

  export interface DeleteRequest {
    uuid: string;
  }

  export interface UpdateProgressRequest {
    uuid: string;
    progress: number;
  }

  export interface MoveToFolderRequest {
    uuid: string;
    folderId: string | null;
  }

  // Focus
  export interface FocusStartRequest {
    goalUuid: string;
    duration?: number; // minutes
  }

  export interface FocusStatusResponse {
    isActive: boolean;
    goalUuid?: string;
    startedAt?: number;
    duration?: number;
    elapsed?: number;
    isPaused?: boolean;
  }

  export interface FocusHistoryRequest extends DateRangeParams {
    goalUuid?: string;
  }
}

// ============ Schedule Payloads ============

export namespace SchedulePayloads {
  export interface ListRequest extends DateRangeParams {
    accountUuid: string;
  }

  export interface GetRequest {
    uuid: string;
  }

  export interface CreateRequest {
    accountUuid: string;
    title: string;
    description?: string;
    startTime: number;
    endTime: number;
    allDay?: boolean;
    location?: string;
    color?: string;
    recurrence?: RecurrenceConfig;
  }

  export interface UpdateRequest {
    uuid: string;
    title?: string;
    description?: string;
    startTime?: number;
    endTime?: number;
    allDay?: boolean;
    location?: string;
    color?: string;
  }

  export interface DeleteRequest {
    uuid: string;
  }

  export interface RescheduleRequest {
    uuid: string;
    startTime: number;
    endTime: number;
  }

  export interface RecurrenceConfig {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval?: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
    endDate?: number;
    occurrences?: number;
  }
}

// ============ Reminder Payloads ============

export namespace ReminderPayloads {
  export interface TemplateListRequest {
    accountUuid: string;
    groupId?: string;
    enabled?: boolean;
  }

  export interface TemplateCreateRequest {
    accountUuid: string;
    title: string;
    message?: string;
    triggerTime: number;
    repeatConfig?: RepeatConfig;
    groupId?: string;
    priority?: number;
  }

  export interface TemplateUpdateRequest {
    uuid: string;
    title?: string;
    message?: string;
    triggerTime?: number;
    repeatConfig?: RepeatConfig;
    priority?: number;
  }

  export interface SnoozeRequest {
    uuid: string;
    minutes: number;
  }

  export interface DismissRequest {
    uuid: string;
  }

  export interface RepeatConfig {
    type: 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';
    interval?: number;
    daysOfWeek?: number[];
    endDate?: number;
  }

  // Group
  export interface GroupCreateRequest {
    accountUuid: string;
    name: string;
    color?: string;
    icon?: string;
  }

  export interface GroupUpdateRequest {
    uuid: string;
    name?: string;
    color?: string;
    icon?: string;
  }
}

// ============ AI Payloads ============

export namespace AIPayloads {
  export interface ChatRequest {
    conversationId?: string;
    content: string;
    context?: ChatContext;
  }

  export interface ChatResponse {
    conversationId: string;
    messageId: string;
    content: string;
    timestamp: number;
  }

  export interface ChatContext {
    currentGoal?: string;
    currentTask?: string;
    recentActivity?: string[];
  }

  export interface ConversationListRequest {
    limit?: number;
  }

  export interface AnalyzeTaskRequest {
    taskUuid: string;
    includeSubtasks?: boolean;
  }

  export interface SuggestBreakdownRequest {
    title: string;
    description?: string;
    estimatedDuration?: number;
  }

  export interface SuggestScheduleRequest {
    tasks: { uuid: string; priority: number; duration: number }[];
    availableSlots: { start: number; end: number }[];
  }
}

// ============ Auth Payloads ============

export namespace AuthPayloads {
  export interface LoginRequest {
    email: string;
    password: string;
    rememberMe?: boolean;
  }

  export interface LoginResponse {
    user: UserInfo;
    token: string;
    refreshToken?: string;
    expiresAt: number;
  }

  export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
    acceptTerms: boolean;
  }

  export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
  }

  export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
  }

  export interface UserInfo {
    uuid: string;
    email: string;
    name: string;
    avatar?: string;
    createdAt: number;
  }
}

// ============ Account Payloads ============

export namespace AccountPayloads {
  export interface UpdateProfileRequest {
    name?: string;
    bio?: string;
    timezone?: string;
    locale?: string;
  }

  export interface UpdateAvatarRequest {
    avatar: string; // base64 or URL
  }

  export interface PreferencesUpdateRequest {
    theme?: string;
    notifications?: boolean;
    emailDigest?: boolean;
    weekStartsOn?: number;
  }
}

// ============ Notification Payloads ============

export namespace NotificationPayloads {
  export interface ListRequest extends PaginationParams {
    unreadOnly?: boolean;
    category?: string;
  }

  export interface ShowRequest {
    title: string;
    body: string;
    icon?: string;
    actions?: { id: string; label: string }[];
    data?: Record<string, unknown>;
  }

  export interface SettingsUpdateRequest {
    enabled?: boolean;
    sound?: boolean;
    desktop?: boolean;
    email?: boolean;
    categories?: Record<string, boolean>;
  }
}

// ============ Setting Payloads ============

export namespace SettingPayloads {
  export interface GetRequest {
    key: string;
  }

  export interface UpdateRequest {
    key: string;
    value: unknown;
  }

  export interface ShortcutSetRequest {
    id: string;
    keys: string[];
  }

  export interface ThemeSetRequest {
    theme: 'light' | 'dark' | 'system';
  }

  export interface LanguageSetRequest {
    language: string;
  }

  export interface BackupCreateRequest {
    includeSettings?: boolean;
    includeData?: boolean;
    encrypt?: boolean;
  }

  export interface BackupRestoreRequest {
    backupId: string;
    password?: string;
  }
}

// ============ Repository Payloads ============

export namespace RepositoryPayloads {
  export interface ListRequest {
    accountUuid: string;
  }

  export interface CreateRequest {
    accountUuid: string;
    name: string;
    description?: string;
    type?: string;
  }

  export interface ResourceListRequest {
    repositoryId: string;
    folderId?: string;
    search?: string;
  }

  export interface ResourceCreateRequest {
    repositoryId: string;
    folderId?: string;
    title: string;
    content?: string;
    type: string;
    metadata?: Record<string, unknown>;
  }

  export interface SearchRequest {
    query: string;
    repositoryId?: string;
    type?: string;
    limit?: number;
  }

  export interface ImportRequest {
    repositoryId: string;
    source: string;
    format: string;
    data: unknown;
  }

  export interface ExportRequest {
    repositoryId: string;
    format: string;
    resourceIds?: string[];
  }
}
