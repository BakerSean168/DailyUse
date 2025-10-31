/**
 * UserSetting 聚合根实现
 * 实现 UserSettingServer 接口
 *
 * DDD 聚合根职责：
 * - 管理用户设置数据
 * - 执行设置相关的业务逻辑
 * - 确保聚合内的一致性
 * - 是事务边界
 */

import { AggregateRoot } from '@dailyuse/utils';
import { SettingContracts } from '@dailyuse/contracts';

// 类型别名（从命名空间导入）
type UserSettingServerDTO = SettingContracts.UserSettingServerDTO;
type UserSettingPersistenceDTO = SettingContracts.UserSettingPersistenceDTO;
type UserSettingClientDTO = SettingContracts.UserSettingClientDTO;
type UpdateUserSettingRequest = SettingContracts.UpdateUserSettingRequest;

/**
 * UserSetting 聚合根
 */
export class UserSetting extends AggregateRoot {
  // ===== 私有字段 =====
  private _accountUuid: string;

  // 外观设置
  private _appearanceTheme: 'AUTO' | 'LIGHT' | 'DARK';
  private _appearanceFontSize: 'SMALL' | 'MEDIUM' | 'LARGE';
  private _appearanceCompactMode: boolean;
  private _appearanceAccentColor: string;
  private _appearanceFontFamily: string | null;

  // 区域设置
  private _localeLanguage: string;
  private _localeTimezone: string;
  private _localeDateFormat: string;
  private _localeTimeFormat: string;
  private _localeWeekStartsOn: number;
  private _localeCurrency: string;

  // 通知偏好
  private _notificationEmail: boolean;
  private _notificationPush: boolean;
  private _notificationInApp: boolean;
  private _notificationSound: boolean;

  // 编辑器设置
  private _editorTheme: string;
  private _editorFontSize: number;
  private _editorTabSize: number;
  private _editorWordWrap: boolean;
  private _editorLineNumbers: boolean;
  private _editorMinimap: boolean;

  // 快捷键设置
  private _shortcutsEnabled: boolean;
  private _shortcutsCustom: Record<string, string>;

  // 工作流设置
  private _workflowAutoSave: boolean;
  private _workflowAutoSaveInterval: number;
  private _workflowConfirmBeforeDelete: boolean;
  private _workflowDefaultGoalView: string;
  private _workflowDefaultScheduleView: string;
  private _workflowDefaultTaskView: string;

  // 隐私设置
  private _privacyProfileVisibility: string;
  private _privacyShowOnlineStatus: boolean;
  private _privacyAllowSearchByEmail: boolean;
  private _privacyAllowSearchByPhone: boolean;
  private _privacyShareUsageData: boolean;

  // 实验性功能
  private _experimentalEnabled: boolean;
  private _experimentalFeatures: string[];

  // 其他偏好
  private _startPage: string;
  private _sidebarCollapsed: boolean;

  private _createdAt: number;
  private _updatedAt: number;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
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
  }) {
    super(params.uuid ?? AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
    this._appearanceTheme = params.appearanceTheme;
    this._appearanceFontSize = params.appearanceFontSize;
    this._appearanceCompactMode = params.appearanceCompactMode;
    this._appearanceAccentColor = params.appearanceAccentColor;
    this._appearanceFontFamily = params.appearanceFontFamily;
    this._localeLanguage = params.localeLanguage;
    this._localeTimezone = params.localeTimezone;
    this._localeDateFormat = params.localeDateFormat;
    this._localeTimeFormat = params.localeTimeFormat;
    this._localeWeekStartsOn = params.localeWeekStartsOn;
    this._localeCurrency = params.localeCurrency;
    this._notificationEmail = params.notificationEmail;
    this._notificationPush = params.notificationPush;
    this._notificationInApp = params.notificationInApp;
    this._notificationSound = params.notificationSound;
    this._editorTheme = params.editorTheme;
    this._editorFontSize = params.editorFontSize;
    this._editorTabSize = params.editorTabSize;
    this._editorWordWrap = params.editorWordWrap;
    this._editorLineNumbers = params.editorLineNumbers;
    this._editorMinimap = params.editorMinimap;
    this._shortcutsEnabled = params.shortcutsEnabled;
    this._shortcutsCustom = params.shortcutsCustom;
    this._workflowAutoSave = params.workflowAutoSave;
    this._workflowAutoSaveInterval = params.workflowAutoSaveInterval;
    this._workflowConfirmBeforeDelete = params.workflowConfirmBeforeDelete;
    this._workflowDefaultGoalView = params.workflowDefaultGoalView;
    this._workflowDefaultScheduleView = params.workflowDefaultScheduleView;
    this._workflowDefaultTaskView = params.workflowDefaultTaskView;
    this._privacyProfileVisibility = params.privacyProfileVisibility;
    this._privacyShowOnlineStatus = params.privacyShowOnlineStatus;
    this._privacyAllowSearchByEmail = params.privacyAllowSearchByEmail;
    this._privacyAllowSearchByPhone = params.privacyAllowSearchByPhone;
    this._privacyShareUsageData = params.privacyShareUsageData;
    this._experimentalEnabled = params.experimentalEnabled;
    this._experimentalFeatures = params.experimentalFeatures;
    this._startPage = params.startPage;
    this._sidebarCollapsed = params.sidebarCollapsed;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get accountUuid(): string {
    return this._accountUuid;
  }
  public get appearanceTheme(): 'AUTO' | 'LIGHT' | 'DARK' {
    return this._appearanceTheme;
  }
  public get appearanceFontSize(): 'SMALL' | 'MEDIUM' | 'LARGE' {
    return this._appearanceFontSize;
  }
  public get appearanceCompactMode(): boolean {
    return this._appearanceCompactMode;
  }
  public get appearanceAccentColor(): string {
    return this._appearanceAccentColor;
  }
  public get appearanceFontFamily(): string | null {
    return this._appearanceFontFamily;
  }
  public get localeLanguage(): string {
    return this._localeLanguage;
  }
  public get localeTimezone(): string {
    return this._localeTimezone;
  }
  public get localeDateFormat(): string {
    return this._localeDateFormat;
  }
  public get localeTimeFormat(): string {
    return this._localeTimeFormat;
  }
  public get localeWeekStartsOn(): number {
    return this._localeWeekStartsOn;
  }
  public get localeCurrency(): string {
    return this._localeCurrency;
  }
  public get notificationEmail(): boolean {
    return this._notificationEmail;
  }
  public get notificationPush(): boolean {
    return this._notificationPush;
  }
  public get notificationInApp(): boolean {
    return this._notificationInApp;
  }
  public get notificationSound(): boolean {
    return this._notificationSound;
  }
  public get editorTheme(): string {
    return this._editorTheme;
  }
  public get editorFontSize(): number {
    return this._editorFontSize;
  }
  public get editorTabSize(): number {
    return this._editorTabSize;
  }
  public get editorWordWrap(): boolean {
    return this._editorWordWrap;
  }
  public get editorLineNumbers(): boolean {
    return this._editorLineNumbers;
  }
  public get editorMinimap(): boolean {
    return this._editorMinimap;
  }
  public get shortcutsEnabled(): boolean {
    return this._shortcutsEnabled;
  }
  public get shortcutsCustom(): Record<string, string> {
    return this._shortcutsCustom;
  }
  public get workflowAutoSave(): boolean {
    return this._workflowAutoSave;
  }
  public get workflowAutoSaveInterval(): number {
    return this._workflowAutoSaveInterval;
  }
  public get workflowConfirmBeforeDelete(): boolean {
    return this._workflowConfirmBeforeDelete;
  }
  public get workflowDefaultGoalView(): string {
    return this._workflowDefaultGoalView;
  }
  public get workflowDefaultScheduleView(): string {
    return this._workflowDefaultScheduleView;
  }
  public get workflowDefaultTaskView(): string {
    return this._workflowDefaultTaskView;
  }
  public get privacyProfileVisibility(): string {
    return this._privacyProfileVisibility;
  }
  public get privacyShowOnlineStatus(): boolean {
    return this._privacyShowOnlineStatus;
  }
  public get privacyAllowSearchByEmail(): boolean {
    return this._privacyAllowSearchByEmail;
  }
  public get privacyAllowSearchByPhone(): boolean {
    return this._privacyAllowSearchByPhone;
  }
  public get privacyShareUsageData(): boolean {
    return this._privacyShareUsageData;
  }
  public get experimentalEnabled(): boolean {
    return this._experimentalEnabled;
  }
  public get experimentalFeatures(): string[] {
    return this._experimentalFeatures;
  }
  public get startPage(): string {
    return this._startPage;
  }
  public get sidebarCollapsed(): boolean {
    return this._sidebarCollapsed;
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number {
    return this._updatedAt;
  }

  // ===== 工厂方法 =====

  /**
   * 创建默认用户设置
   */
  public static createDefault(accountUuid: string): UserSetting {
    const now = Date.now();

    return new UserSetting({
      accountUuid,
      appearanceTheme: 'AUTO',
      appearanceFontSize: 'MEDIUM',
      appearanceCompactMode: false,
      appearanceAccentColor: '#3B82F6',
      appearanceFontFamily: null,
      localeLanguage: 'zh-CN',
      localeTimezone: 'Asia/Shanghai',
      localeDateFormat: 'YYYY-MM-DD',
      localeTimeFormat: '24H',
      localeWeekStartsOn: 1,
      localeCurrency: 'CNY',
      notificationEmail: true,
      notificationPush: true,
      notificationInApp: true,
      notificationSound: true,
      editorTheme: 'default',
      editorFontSize: 14,
      editorTabSize: 2,
      editorWordWrap: true,
      editorLineNumbers: true,
      editorMinimap: true,
      shortcutsEnabled: true,
      shortcutsCustom: {},
      workflowAutoSave: true,
      workflowAutoSaveInterval: 30000,
      workflowConfirmBeforeDelete: true,
      workflowDefaultGoalView: 'LIST',
      workflowDefaultScheduleView: 'WEEK',
      workflowDefaultTaskView: 'LIST',
      privacyProfileVisibility: 'PRIVATE',
      privacyShowOnlineStatus: true,
      privacyAllowSearchByEmail: true,
      privacyAllowSearchByPhone: false,
      privacyShareUsageData: false,
      experimentalEnabled: false,
      experimentalFeatures: [],
      startPage: 'dashboard',
      sidebarCollapsed: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 从持久化 DTO 重建聚合根
   */
  public static fromPersistenceDTO(dto: UserSettingPersistenceDTO): UserSetting {
    // Parse JSON strings back to objects/arrays
    const shortcutsCustom = typeof dto.shortcutsCustom === 'string' 
      ? JSON.parse(dto.shortcutsCustom) 
      : dto.shortcutsCustom;
    const experimentalFeatures = typeof dto.experimentalFeatures === 'string'
      ? JSON.parse(dto.experimentalFeatures)
      : dto.experimentalFeatures;

    return new UserSetting({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      appearanceTheme: dto.appearanceTheme as 'AUTO' | 'LIGHT' | 'DARK',
      appearanceFontSize: dto.appearanceFontSize as 'SMALL' | 'MEDIUM' | 'LARGE',
      appearanceCompactMode: dto.appearanceCompactMode,
      appearanceAccentColor: dto.appearanceAccentColor,
      appearanceFontFamily: dto.appearanceFontFamily,
      localeLanguage: dto.localeLanguage,
      localeTimezone: dto.localeTimezone,
      localeDateFormat: dto.localeDateFormat,
      localeTimeFormat: dto.localeTimeFormat,
      localeWeekStartsOn: dto.localeWeekStartsOn,
      localeCurrency: dto.localeCurrency,
      notificationEmail: true, // These fields removed from PersistenceDTO, use defaults
      notificationPush: true,
      notificationInApp: true,
      notificationSound: true,
      editorTheme: 'vs-dark', // These fields removed from PersistenceDTO, use defaults
      editorFontSize: 14,
      editorTabSize: 2,
      editorWordWrap: true,
      editorLineNumbers: true,
      editorMinimap: true,
      shortcutsEnabled: dto.shortcutsEnabled,
      shortcutsCustom: shortcutsCustom,
      workflowAutoSave: dto.workflowAutoSave,
      workflowAutoSaveInterval: dto.workflowAutoSaveInterval,
      workflowConfirmBeforeDelete: dto.workflowConfirmBeforeDelete,
      workflowDefaultGoalView: dto.workflowDefaultGoalView,
      workflowDefaultScheduleView: dto.workflowDefaultScheduleView,
      workflowDefaultTaskView: dto.workflowDefaultTaskView,
      privacyProfileVisibility: dto.privacyProfileVisibility,
      privacyShowOnlineStatus: dto.privacyShowOnlineStatus,
      privacyAllowSearchByEmail: dto.privacyAllowSearchByEmail,
      privacyAllowSearchByPhone: dto.privacyAllowSearchByPhone,
      privacyShareUsageData: dto.privacyShareUsageData,
      experimentalEnabled: dto.experimentalEnabled,
      experimentalFeatures: experimentalFeatures,
      startPage: 'dashboard', // These fields removed from PersistenceDTO, use defaults
      sidebarCollapsed: false,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  // ===== 业务方法 =====

  /**
   * 更新用户设置
   */
  public update(updates: UpdateUserSettingRequest): void {
    // Appearance updates
    if (updates.appearance) {
      if (updates.appearance.theme !== undefined) this._appearanceTheme = updates.appearance.theme;
      if (updates.appearance.fontSize !== undefined) this._appearanceFontSize = updates.appearance.fontSize;
      if (updates.appearance.compactMode !== undefined) this._appearanceCompactMode = updates.appearance.compactMode;
      if (updates.appearance.accentColor !== undefined) this._appearanceAccentColor = updates.appearance.accentColor;
      if (updates.appearance.fontFamily !== undefined) this._appearanceFontFamily = updates.appearance.fontFamily;
    }

    // Locale updates
    if (updates.locale) {
      if (updates.locale.language !== undefined) this._localeLanguage = updates.locale.language;
      if (updates.locale.timezone !== undefined) this._localeTimezone = updates.locale.timezone;
      if (updates.locale.dateFormat !== undefined) this._localeDateFormat = updates.locale.dateFormat;
      if (updates.locale.timeFormat !== undefined) this._localeTimeFormat = updates.locale.timeFormat;
      if (updates.locale.weekStartsOn !== undefined) this._localeWeekStartsOn = updates.locale.weekStartsOn;
      if (updates.locale.currency !== undefined) this._localeCurrency = updates.locale.currency;
    }

    // Workflow updates
    if (updates.workflow) {
      if (updates.workflow.autoSave !== undefined) this._workflowAutoSave = updates.workflow.autoSave;
      if (updates.workflow.autoSaveInterval !== undefined) this._workflowAutoSaveInterval = updates.workflow.autoSaveInterval;
      if (updates.workflow.confirmBeforeDelete !== undefined) this._workflowConfirmBeforeDelete = updates.workflow.confirmBeforeDelete;
      if (updates.workflow.defaultGoalView !== undefined) this._workflowDefaultGoalView = updates.workflow.defaultGoalView;
      if (updates.workflow.defaultScheduleView !== undefined) this._workflowDefaultScheduleView = updates.workflow.defaultScheduleView;
      if (updates.workflow.defaultTaskView !== undefined) this._workflowDefaultTaskView = updates.workflow.defaultTaskView;
    }

    // Shortcuts updates
    if (updates.shortcuts) {
      if (updates.shortcuts.enabled !== undefined) this._shortcutsEnabled = updates.shortcuts.enabled;
      if (updates.shortcuts.custom !== undefined) this._shortcutsCustom = updates.shortcuts.custom;
    }

    // Privacy updates
    if (updates.privacy) {
      if (updates.privacy.profileVisibility !== undefined) this._privacyProfileVisibility = updates.privacy.profileVisibility;
      if (updates.privacy.showOnlineStatus !== undefined) this._privacyShowOnlineStatus = updates.privacy.showOnlineStatus;
      if (updates.privacy.allowSearchByEmail !== undefined) this._privacyAllowSearchByEmail = updates.privacy.allowSearchByEmail;
      if (updates.privacy.allowSearchByPhone !== undefined) this._privacyAllowSearchByPhone = updates.privacy.allowSearchByPhone;
      if (updates.privacy.shareUsageData !== undefined) this._privacyShareUsageData = updates.privacy.shareUsageData;
    }

    // Experimental updates
    if (updates.experimental) {
      if (updates.experimental.enabled !== undefined) this._experimentalEnabled = updates.experimental.enabled;
      if (updates.experimental.features !== undefined) this._experimentalFeatures = updates.experimental.features;
    }

    this._updatedAt = Date.now();
  }

  /**
   * 重置为默认设置
   */
  public resetToDefaults(): void {
    const defaults = UserSetting.createDefault(this._accountUuid);

    this._appearanceTheme = defaults._appearanceTheme;
    this._appearanceFontSize = defaults._appearanceFontSize;
    this._appearanceCompactMode = defaults._appearanceCompactMode;
    this._appearanceAccentColor = defaults._appearanceAccentColor;
    this._appearanceFontFamily = defaults._appearanceFontFamily;
    this._localeLanguage = defaults._localeLanguage;
    this._localeTimezone = defaults._localeTimezone;
    this._localeDateFormat = defaults._localeDateFormat;
    this._localeTimeFormat = defaults._localeTimeFormat;
    this._localeWeekStartsOn = defaults._localeWeekStartsOn;
    this._localeCurrency = defaults._localeCurrency;
    this._notificationEmail = defaults._notificationEmail;
    this._notificationPush = defaults._notificationPush;
    this._notificationInApp = defaults._notificationInApp;
    this._notificationSound = defaults._notificationSound;
    this._editorTheme = defaults._editorTheme;
    this._editorFontSize = defaults._editorFontSize;
    this._editorTabSize = defaults._editorTabSize;
    this._editorWordWrap = defaults._editorWordWrap;
    this._editorLineNumbers = defaults._editorLineNumbers;
    this._editorMinimap = defaults._editorMinimap;
    this._shortcutsEnabled = defaults._shortcutsEnabled;
    this._shortcutsCustom = defaults._shortcutsCustom;
    this._workflowAutoSave = defaults._workflowAutoSave;
    this._workflowAutoSaveInterval = defaults._workflowAutoSaveInterval;
    this._workflowConfirmBeforeDelete = defaults._workflowConfirmBeforeDelete;
    this._workflowDefaultGoalView = defaults._workflowDefaultGoalView;
    this._workflowDefaultScheduleView = defaults._workflowDefaultScheduleView;
    this._workflowDefaultTaskView = defaults._workflowDefaultTaskView;
    this._privacyProfileVisibility = defaults._privacyProfileVisibility;
    this._privacyShowOnlineStatus = defaults._privacyShowOnlineStatus;
    this._privacyAllowSearchByEmail = defaults._privacyAllowSearchByEmail;
    this._privacyAllowSearchByPhone = defaults._privacyAllowSearchByPhone;
    this._privacyShareUsageData = defaults._privacyShareUsageData;
    this._experimentalEnabled = defaults._experimentalEnabled;
    this._experimentalFeatures = defaults._experimentalFeatures;
    this._startPage = defaults._startPage;
    this._sidebarCollapsed = defaults._sidebarCollapsed;

    this._updatedAt = Date.now();
  }

  // ===== DTO 转换方法 =====

  /**
   * 转换为客户端 DTO
   */
  public toClientDTO(): UserSettingClientDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      appearance: {
        theme: this._appearanceTheme,
        accentColor: this._appearanceAccentColor,
        fontSize: this._appearanceFontSize,
        fontFamily: this._appearanceFontFamily,
        compactMode: this._appearanceCompactMode,
      },
      locale: {
        language: this._localeLanguage,
        timezone: this._localeTimezone,
        dateFormat: this._localeDateFormat,
        timeFormat: this._localeTimeFormat,
        weekStartsOn: this._localeWeekStartsOn,
        currency: this._localeCurrency,
      },
      workflow: {
        defaultTaskView: this._workflowDefaultTaskView,
        defaultGoalView: this._workflowDefaultGoalView,
        defaultScheduleView: this._workflowDefaultScheduleView,
        autoSave: this._workflowAutoSave,
        autoSaveInterval: this._workflowAutoSaveInterval,
        confirmBeforeDelete: this._workflowConfirmBeforeDelete,
      },
      shortcuts: {
        enabled: this._shortcutsEnabled,
        custom: this._shortcutsCustom,
      },
      privacy: {
        profileVisibility: this._privacyProfileVisibility,
        showOnlineStatus: this._privacyShowOnlineStatus,
        allowSearchByEmail: this._privacyAllowSearchByEmail,
        allowSearchByPhone: this._privacyAllowSearchByPhone,
        shareUsageData: this._privacyShareUsageData,
      },
      experimental: {
        enabled: this._experimentalEnabled,
        features: this._experimentalFeatures,
      },
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      themeText: this._appearanceTheme,
      languageText: this._localeLanguage,
      experimentalFeatureCount: this._experimentalFeatures.length,
    };
  }

  /**
   * 转换为持久化 DTO
   */
  public toPersistenceDTO(): UserSettingPersistenceDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      appearanceTheme: this._appearanceTheme,
      appearanceFontSize: this._appearanceFontSize,
      appearanceCompactMode: this._appearanceCompactMode,
      appearanceAccentColor: this._appearanceAccentColor,
      appearanceFontFamily: this._appearanceFontFamily,
      localeLanguage: this._localeLanguage,
      localeTimezone: this._localeTimezone,
      localeDateFormat: this._localeDateFormat,
      localeTimeFormat: this._localeTimeFormat,
      localeWeekStartsOn: this._localeWeekStartsOn,
      localeCurrency: this._localeCurrency,
      workflowDefaultTaskView: this._workflowDefaultTaskView,
      workflowDefaultGoalView: this._workflowDefaultGoalView,
      workflowDefaultScheduleView: this._workflowDefaultScheduleView,
      workflowAutoSave: this._workflowAutoSave,
      workflowAutoSaveInterval: this._workflowAutoSaveInterval,
      workflowConfirmBeforeDelete: this._workflowConfirmBeforeDelete,
      shortcutsEnabled: this._shortcutsEnabled,
      shortcutsCustom: JSON.stringify(this._shortcutsCustom),
      privacyProfileVisibility: this._privacyProfileVisibility,
      privacyShowOnlineStatus: this._privacyShowOnlineStatus,
      privacyAllowSearchByEmail: this._privacyAllowSearchByEmail,
      privacyAllowSearchByPhone: this._privacyAllowSearchByPhone,
      privacyShareUsageData: this._privacyShareUsageData,
      experimentalEnabled: this._experimentalEnabled,
      experimentalFeatures: JSON.stringify(this._experimentalFeatures),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

}
