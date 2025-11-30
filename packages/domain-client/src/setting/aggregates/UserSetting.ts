/**
 * UserSetting Aggregate Root (Client)
 * 用户设置聚合根 - 客户端实现
 *
 * DDD 聚合根职责：
 * - 管理用户设置的所有属性
 * - 提供设置查询和计算方法
 * - 确保设置的一致性
 * - 是事务边界
 */

import { AggregateRoot } from '@dailyuse/utils';
import type {
  UserSettingClient,
  UserSettingServerDTO,
  UserSettingClientDTO,
} from '@dailyuse/contracts/setting';

/**
 * UserSetting 聚合根 (Client)
 */
export class UserSetting extends AggregateRoot implements UserSettingClient {
  private _accountUuid: string;
  private _appearance: {
    theme: string;
    accentColor: string;
    fontSize: string;
    fontFamily?: string | null;
    compactMode: boolean;
  };
  private _locale: {
    language: string;
    timezone: string;
    dateFormat: string;
    timeFormat: string;
    weekStartsOn: number;
    currency: string;
  };
  private _workflow: {
    defaultTaskView: string;
    defaultGoalView: string;
    defaultScheduleView: string;
    autoSave: boolean;
    autoSaveInterval: number;
    confirmBeforeDelete: boolean;
  };
  private _shortcuts: {
    enabled: boolean;
    custom: Record<string, string>;
  };
  private _privacy: {
    profileVisibility: string;
    showOnlineStatus: boolean;
    allowSearchByEmail: boolean;
    allowSearchByPhone: boolean;
    shareUsageData: boolean;
  };
  private _experimental: {
    enabled: boolean;
    features: string[];
  };
  private _createdAt: number;
  private _updatedAt: number;

  // ===== 构造函数 =====

  private constructor(params: {
    uuid: string;
    accountUuid: string;
    appearance: UserSetting['_appearance'];
    locale: UserSetting['_locale'];
    workflow: UserSetting['_workflow'];
    shortcuts: UserSetting['_shortcuts'];
    privacy: UserSetting['_privacy'];
    experimental: UserSetting['_experimental'];
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid);
    this._accountUuid = params.accountUuid;
    this._appearance = params.appearance;
    this._locale = params.locale;
    this._workflow = params.workflow;
    this._shortcuts = params.shortcuts;
    this._privacy = params.privacy;
    this._experimental = params.experimental;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ===== Getters =====

  get accountUuid(): string {
    return this._accountUuid;
  }

  get appearance() {
    return { ...this._appearance };
  }

  get locale() {
    return { ...this._locale };
  }

  get workflow() {
    return { ...this._workflow };
  }

  get shortcuts() {
    return {
      enabled: this._shortcuts.enabled,
      custom: { ...this._shortcuts.custom },
    };
  }

  get privacy() {
    return { ...this._privacy };
  }

  get experimental() {
    return {
      enabled: this._experimental.enabled,
      features: [...this._experimental.features],
    };
  }

  get createdAt(): number {
    return this._createdAt;
  }

  get updatedAt(): number {
    return this._updatedAt;
  }

  // ===== 计算属性 =====

  /**
   * 获取主题文本
   */
  get themeText(): string {
    return this.getThemeText();
  }

  /**
   * 获取语言文本
   */
  get languageText(): string {
    return this.getLanguageText();
  }

  /**
   * 获取启用的实验性功能数量
   */
  get experimentalFeatureCount(): number {
    return this._experimental.features.length;
  }

  // ===== 业务方法 =====

  /**
   * 获取主题文本
   */
  public getThemeText(): string {
    const themeMap: Record<string, string> = {
      LIGHT: '浅色',
      DARK: '深色',
      AUTO: '自动',
      light: '浅色',
      dark: '深色',
      auto: '自动',
    };
    return themeMap[this._appearance.theme] || this._appearance.theme;
  }

  /**
   * 获取语言文本
   */
  public getLanguageText(): string {
    const languageMap: Record<string, string> = {
      'zh-CN': '简体中文',
      'zh-TW': '繁體中文',
      'en-US': 'English',
      'ja-JP': '日本語',
      'ko-KR': '한국어',
    };
    return languageMap[this._locale.language] || this._locale.language;
  }

  /**
   * 获取快捷键文本
   */
  public getShortcutText(action: string): string {
    const shortcut = this._shortcuts.custom[action];
    return shortcut || '未设置';
  }

  /**
   * 获取快捷键
   */
  public getShortcut(action: string): string | null {
    return this._shortcuts.custom[action] || null;
  }

  /**
   * 检查是否有快捷键
   */
  public hasShortcut(action: string): boolean {
    return action in this._shortcuts.custom;
  }

  /**
   * 检查是否启用了实验性功能
   */
  public hasExperimentalFeature(feature: string): boolean {
    return this._experimental.features.includes(feature);
  }

  // ===== DTO 转换方法 =====

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): UserSettingServerDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      appearance: {
        theme: this._appearance.theme as 'LIGHT' | 'DARK' | 'AUTO',
        accentColor: this._appearance.accentColor,
        fontSize: this._appearance.fontSize as 'SMALL' | 'MEDIUM' | 'LARGE',
        fontFamily: this._appearance.fontFamily,
        compactMode: this._appearance.compactMode,
      },
      locale: {
        language: this._locale.language,
        timezone: this._locale.timezone,
        dateFormat: this._locale.dateFormat as 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY',
        timeFormat: this._locale.timeFormat as '12H' | '24H',
        weekStartsOn: this._locale.weekStartsOn as 0 | 1 | 2 | 3 | 4 | 5 | 6,
        currency: this._locale.currency,
      },
      workflow: {
        defaultTaskView: this._workflow.defaultTaskView as 'LIST' | 'KANBAN' | 'CALENDAR',
        defaultGoalView: this._workflow.defaultGoalView as 'LIST' | 'TREE' | 'TIMELINE',
        defaultScheduleView: this._workflow.defaultScheduleView as 'DAY' | 'WEEK' | 'MONTH',
        autoSave: this._workflow.autoSave,
        autoSaveInterval: this._workflow.autoSaveInterval,
        confirmBeforeDelete: this._workflow.confirmBeforeDelete,
      },
      shortcuts: {
        enabled: this._shortcuts.enabled,
        custom: { ...this._shortcuts.custom },
      },
      privacy: {
        profileVisibility: this._privacy.profileVisibility as 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY',
        showOnlineStatus: this._privacy.showOnlineStatus,
        allowSearchByEmail: this._privacy.allowSearchByEmail,
        allowSearchByPhone: this._privacy.allowSearchByPhone,
        shareUsageData: this._privacy.shareUsageData,
      },
      experimental: {
        enabled: this._experimental.enabled,
        features: [...this._experimental.features],
      },
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): UserSettingClientDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      appearance: { ...this._appearance },
      locale: { ...this._locale },
      workflow: { ...this._workflow },
      shortcuts: {
        enabled: this._shortcuts.enabled,
        custom: { ...this._shortcuts.custom },
      },
      privacy: { ...this._privacy },
      experimental: {
        enabled: this._experimental.enabled,
        features: [...this._experimental.features],
      },
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      themeText: this.getThemeText(),
      languageText: this.getLanguageText(),
      experimentalFeatureCount: this.experimentalFeatureCount,
    };
  }

  // ===== 静态工厂方法 =====

  /**
   * 创建新的用户设置
   */
  public static create(params: {
    accountUuid: string;
    appearance?: Partial<UserSetting['_appearance']>;
    locale?: Partial<UserSetting['_locale']>;
    workflow?: Partial<UserSetting['_workflow']>;
    shortcuts?: Partial<UserSetting['_shortcuts']>;
    privacy?: Partial<UserSetting['_privacy']>;
    experimental?: Partial<UserSetting['_experimental']>;
  }): UserSetting {
    const now = Date.now();

    return new UserSetting({
      uuid: '', // Will be generated by backend
      accountUuid: params.accountUuid,
      appearance: {
        theme: params.appearance?.theme || 'LIGHT',
        accentColor: params.appearance?.accentColor || '#1976d2',
        fontSize: params.appearance?.fontSize || 'MEDIUM',
        fontFamily: params.appearance?.fontFamily || null,
        compactMode: params.appearance?.compactMode ?? false,
      },
      locale: {
        language: params.locale?.language || 'zh-CN',
        timezone: params.locale?.timezone || 'Asia/Shanghai',
        dateFormat: params.locale?.dateFormat || 'YYYY-MM-DD',
        timeFormat: params.locale?.timeFormat || '24H',
        weekStartsOn: params.locale?.weekStartsOn ?? 1,
        currency: params.locale?.currency || 'CNY',
      },
      workflow: {
        defaultTaskView: params.workflow?.defaultTaskView || 'LIST',
        defaultGoalView: params.workflow?.defaultGoalView || 'LIST',
        defaultScheduleView: params.workflow?.defaultScheduleView || 'WEEK',
        autoSave: params.workflow?.autoSave ?? true,
        autoSaveInterval: params.workflow?.autoSaveInterval || 30000,
        confirmBeforeDelete: params.workflow?.confirmBeforeDelete ?? true,
      },
      shortcuts: {
        enabled: params.shortcuts?.enabled ?? true,
        custom: params.shortcuts?.custom || {},
      },
      privacy: {
        profileVisibility: params.privacy?.profileVisibility || 'PRIVATE',
        showOnlineStatus: params.privacy?.showOnlineStatus ?? false,
        allowSearchByEmail: params.privacy?.allowSearchByEmail ?? false,
        allowSearchByPhone: params.privacy?.allowSearchByPhone ?? false,
        shareUsageData: params.privacy?.shareUsageData ?? false,
      },
      experimental: {
        enabled: params.experimental?.enabled ?? false,
        features: params.experimental?.features || [],
      },
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 从 Server DTO 创建实体
   */
  public static fromServerDTO(dto: UserSettingServerDTO): UserSetting {
    return new UserSetting({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      appearance: {
        theme: dto.appearance.theme,
        accentColor: dto.appearance.accentColor,
        fontSize: dto.appearance.fontSize,
        fontFamily: dto.appearance.fontFamily,
        compactMode: dto.appearance.compactMode,
      },
      locale: {
        language: dto.locale.language,
        timezone: dto.locale.timezone,
        dateFormat: dto.locale.dateFormat,
        timeFormat: dto.locale.timeFormat,
        weekStartsOn: dto.locale.weekStartsOn,
        currency: dto.locale.currency,
      },
      workflow: {
        defaultTaskView: dto.workflow.defaultTaskView,
        defaultGoalView: dto.workflow.defaultGoalView,
        defaultScheduleView: dto.workflow.defaultScheduleView,
        autoSave: dto.workflow.autoSave,
        autoSaveInterval: dto.workflow.autoSaveInterval,
        confirmBeforeDelete: dto.workflow.confirmBeforeDelete,
      },
      shortcuts: {
        enabled: dto.shortcuts.enabled,
        custom: { ...dto.shortcuts.custom },
      },
      privacy: {
        profileVisibility: dto.privacy.profileVisibility,
        showOnlineStatus: dto.privacy.showOnlineStatus,
        allowSearchByEmail: dto.privacy.allowSearchByEmail,
        allowSearchByPhone: dto.privacy.allowSearchByPhone,
        shareUsageData: dto.privacy.shareUsageData,
      },
      experimental: {
        enabled: dto.experimental.enabled,
        features: [...dto.experimental.features],
      },
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  /**
   * 从 Client DTO 创建实体
   */
  public static fromClientDTO(dto: UserSettingClientDTO): UserSetting {
    return new UserSetting({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      appearance: {
        theme: dto.appearance.theme,
        accentColor: dto.appearance.accentColor,
        fontSize: dto.appearance.fontSize,
        fontFamily: dto.appearance.fontFamily,
        compactMode: dto.appearance.compactMode,
      },
      locale: {
        language: dto.locale.language,
        timezone: dto.locale.timezone,
        dateFormat: dto.locale.dateFormat,
        timeFormat: dto.locale.timeFormat,
        weekStartsOn: dto.locale.weekStartsOn,
        currency: dto.locale.currency,
      },
      workflow: {
        defaultTaskView: dto.workflow.defaultTaskView,
        defaultGoalView: dto.workflow.defaultGoalView,
        defaultScheduleView: dto.workflow.defaultScheduleView,
        autoSave: dto.workflow.autoSave,
        autoSaveInterval: dto.workflow.autoSaveInterval,
        confirmBeforeDelete: dto.workflow.confirmBeforeDelete,
      },
      shortcuts: {
        enabled: dto.shortcuts.enabled,
        custom: { ...dto.shortcuts.custom },
      },
      privacy: {
        profileVisibility: dto.privacy.profileVisibility,
        showOnlineStatus: dto.privacy.showOnlineStatus,
        allowSearchByEmail: dto.privacy.allowSearchByEmail,
        allowSearchByPhone: dto.privacy.allowSearchByPhone,
        shareUsageData: dto.privacy.shareUsageData,
      },
      experimental: {
        enabled: dto.experimental.enabled,
        features: [...dto.experimental.features],
      },
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }
}
