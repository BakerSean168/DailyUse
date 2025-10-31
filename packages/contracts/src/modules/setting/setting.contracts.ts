/**
 * Setting Module - Contracts (DTOs)
 * 用户设置模块的数据传输对象定义
 */

export namespace SettingContracts {
  // ==================== 查询 DTO ====================
  
  /**
   * 用户设置完整 DTO
   */
  export interface UserSettingDTO {
    uuid: string;
    accountUuid: string;
    
    // 外观设置
    appearanceTheme: 'AUTO' | 'LIGHT' | 'DARK';
    appearanceFontSize: 'SMALL' | 'MEDIUM' | 'LARGE';
    appearanceCompactMode: boolean;
    appearanceAccentColor: string;
    appearanceFontFamily: string | null;
    
    // 区域设置
    localeLanguage: string;
    localeTimezone: string;
    localeDateFormat: string;
    localeTimeFormat: string;
    localeWeekStartsOn: number;
    localeCurrency: string;
    
    // 通知偏好
    notificationEmail: boolean;
    notificationPush: boolean;
    notificationInApp: boolean;
    notificationSound: boolean;
    
    // 编辑器设置
    editorTheme: string;
    editorFontSize: number;
    editorTabSize: number;
    editorWordWrap: boolean;
    editorLineNumbers: boolean;
    editorMinimap: boolean;
    
    // 快捷键设置
    shortcutsEnabled: boolean;
    shortcutsCustom: Record<string, string>;
    
    // 工作流设置
    workflowAutoSave: boolean;
    workflowAutoSaveInterval: number;
    workflowConfirmBeforeDelete: boolean;
    workflowDefaultGoalView: string;
    workflowDefaultScheduleView: string;
    workflowDefaultTaskView: string;
    
    // 隐私设置
    privacyProfileVisibility: string;
    privacyShowOnlineStatus: boolean;
    privacyAllowSearchByEmail: boolean;
    privacyAllowSearchByPhone: boolean;
    privacyShareUsageData: boolean;
    
    // 实验性功能
    experimentalEnabled: boolean;
    experimentalFeatures: string[];
    
    // 其他偏好
    startPage: string;
    sidebarCollapsed: boolean;
    
    createdAt: string;
    updatedAt: string;
  }
  
  // ==================== 更新 DTO ====================
  
  /**
   * 更新用户设置 DTO（所有字段可选）
   */
  export interface UpdateUserSettingDTO {
    // 外观设置
    appearanceTheme?: 'AUTO' | 'LIGHT' | 'DARK';
    appearanceFontSize?: 'SMALL' | 'MEDIUM' | 'LARGE';
    appearanceCompactMode?: boolean;
    appearanceAccentColor?: string;
    appearanceFontFamily?: string | null;
    
    // 区域设置
    localeLanguage?: string;
    localeTimezone?: string;
    localeDateFormat?: string;
    localeTimeFormat?: string;
    localeWeekStartsOn?: number;
    localeCurrency?: string;
    
    // 通知偏好
    notificationEmail?: boolean;
    notificationPush?: boolean;
    notificationInApp?: boolean;
    notificationSound?: boolean;
    
    // 编辑器设置
    editorTheme?: string;
    editorFontSize?: number;
    editorTabSize?: number;
    editorWordWrap?: boolean;
    editorLineNumbers?: boolean;
    editorMinimap?: boolean;
    
    // 快捷键设置
    shortcutsEnabled?: boolean;
    shortcutsCustom?: Record<string, string>;
    
    // 工作流设置
    workflowAutoSave?: boolean;
    workflowAutoSaveInterval?: number;
    workflowConfirmBeforeDelete?: boolean;
    workflowDefaultGoalView?: string;
    workflowDefaultScheduleView?: string;
    workflowDefaultTaskView?: string;
    
    // 隐私设置
    privacyProfileVisibility?: string;
    privacyShowOnlineStatus?: boolean;
    privacyAllowSearchByEmail?: boolean;
    privacyAllowSearchByPhone?: boolean;
    privacyShareUsageData?: boolean;
    
    // 实验性功能
    experimentalEnabled?: boolean;
    experimentalFeatures?: string[];
    
    // 其他偏好
    startPage?: string;
    sidebarCollapsed?: boolean;
  }
  
  // ==================== 默认设置 DTO ====================
  
  /**
   * 默认设置 DTO
   */
  export interface DefaultSettingsDTO {
    appearanceTheme: string;
    appearanceFontSize: string;
    appearanceCompactMode: boolean;
    appearanceAccentColor: string;
    localeLanguage: string;
    localeTimezone: string;
    localeDateFormat: string;
    localeTimeFormat: string;
    notificationEmail: boolean;
    notificationPush: boolean;
    notificationInApp: boolean;
    notificationSound: boolean;
    editorTheme: string;
    editorFontSize: number;
    editorTabSize: number;
    editorWordWrap: boolean;
    workflowAutoSave: boolean;
    workflowAutoSaveInterval: number;
    workflowConfirmBeforeDelete: boolean;
    startPage: string;
    sidebarCollapsed: boolean;
  }

  // ==================== 持久化 DTO ====================

  /**
   * 用户设置持久化 DTO（用于 Domain ↔ Database 转换）
   */
  export interface UserSettingPersistenceDTO {
    uuid: string;
    accountUuid: string;
    appearanceTheme: 'AUTO' | 'LIGHT' | 'DARK';
    appearanceFontSize: 'SMALL' | 'MEDIUM' | 'LARGE';
    appearanceCompactMode: boolean;
    appearanceAccentColor: string;
    appearanceFontFamily: string | null;
    localeLanguage: string;
    localeTimezone: string;
    localeDateFormat: string;
    localeTimeFormat: string;
    localeWeekStartsOn: number;
    localeCurrency: string;
    notificationEmail: boolean;
    notificationPush: boolean;
    notificationInApp: boolean;
    notificationSound: boolean;
    editorTheme: string;
    editorFontSize: number;
    editorTabSize: number;
    editorWordWrap: boolean;
    editorLineNumbers: boolean;
    editorMinimap: boolean;
    shortcutsEnabled: boolean;
    shortcutsCustom: Record<string, string>;
    workflowAutoSave: boolean;
    workflowAutoSaveInterval: number;
    workflowConfirmBeforeDelete: boolean;
    workflowDefaultGoalView: string;
    workflowDefaultScheduleView: string;
    workflowDefaultTaskView: string;
    privacyProfileVisibility: string;
    privacyShowOnlineStatus: boolean;
    privacyAllowSearchByEmail: boolean;
    privacyAllowSearchByPhone: boolean;
    privacyShareUsageData: boolean;
    experimentalEnabled: boolean;
    experimentalFeatures: string[];
    startPage: string;
    sidebarCollapsed: boolean;
    createdAt: number;
    updatedAt: number;
  }

  /**
   * 用户设置服务端 DTO（Domain Layer 使用）
   */
  export interface UserSettingServerDTO extends UserSettingPersistenceDTO {}
}
