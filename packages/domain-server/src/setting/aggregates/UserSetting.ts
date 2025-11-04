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
type IUserSettingServer = SettingContracts.UserSettingServer;
type UserSettingServerDTO = SettingContracts.UserSettingServerDTO;
type UserSettingPersistenceDTO = SettingContracts.UserSettingPersistenceDTO;
type UserSettingClientDTO = SettingContracts.UserSettingClientDTO;

/**
 * UserSetting 聚合根
 */
export class UserSetting extends AggregateRoot implements IUserSettingServer {
  // ===== 私有字段 =====
  private _accountUuid: string;
  private _appearance: IUserSettingServer['appearance'];
  private _locale: IUserSettingServer['locale'];
  private _workflow: IUserSettingServer['workflow'];
  private _shortcuts: IUserSettingServer['shortcuts'];
  private _privacy: IUserSettingServer['privacy'];
  private _experimental: IUserSettingServer['experimental'];
  private _createdAt: number;
  private _updatedAt: number;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    appearance: IUserSettingServer['appearance'];
    locale: IUserSettingServer['locale'];
    workflow: IUserSettingServer['workflow'];
    shortcuts: IUserSettingServer['shortcuts'];
    privacy: IUserSettingServer['privacy'];
    experimental: IUserSettingServer['experimental'];
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid ?? AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
    this._appearance = { ...params.appearance };
    this._locale = { ...params.locale };
    this._workflow = { ...params.workflow };
    this._shortcuts = { ...params.shortcuts };
    this._privacy = { ...params.privacy };
    this._experimental = { ...params.experimental };
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ===== Getter 属性 =====
  public get accountUuid(): string {
    return this._accountUuid;
  }

  public get appearance(): IUserSettingServer['appearance'] {
    return { ...this._appearance };
  }

  public get locale(): IUserSettingServer['locale'] {
    return { ...this._locale };
  }

  public get workflow(): IUserSettingServer['workflow'] {
    return { ...this._workflow };
  }

  public get shortcuts(): IUserSettingServer['shortcuts'] {
    return {
      enabled: this._shortcuts.enabled,
      custom: { ...this._shortcuts.custom },
    };
  }

  public get privacy(): IUserSettingServer['privacy'] {
    return { ...this._privacy };
  }

  public get experimental(): IUserSettingServer['experimental'] {
    return {
      enabled: this._experimental.enabled,
      features: [...this._experimental.features],
    };
  }

  public get createdAt(): number {
    return this._createdAt;
  }

  public get updatedAt(): number {
    return this._updatedAt;
  }

  // ===== 业务方法 =====
  public updateAppearance(appearance: Partial<IUserSettingServer['appearance']>): void {
    this._appearance = { ...this._appearance, ...appearance };
    this._updatedAt = Date.now();
  }

  public updateTheme(theme: 'LIGHT' | 'DARK' | 'AUTO'): void {
    this._appearance.theme = theme;
    this._updatedAt = Date.now();
  }

  public updateLocale(locale: Partial<IUserSettingServer['locale']>): void {
    this._locale = { ...this._locale, ...locale };
    this._updatedAt = Date.now();
  }

  public updateLanguage(language: string): void {
    this._locale.language = language;
    this._updatedAt = Date.now();
  }

  public updateTimezone(timezone: string): void {
    this._locale.timezone = timezone;
    this._updatedAt = Date.now();
  }

  public updateWorkflow(workflow: Partial<IUserSettingServer['workflow']>): void {
    this._workflow = { ...this._workflow, ...workflow };
    this._updatedAt = Date.now();
  }

  public updateShortcut(action: string, shortcut: string): void {
    this._shortcuts.custom[action] = shortcut;
    this._updatedAt = Date.now();
  }

  public removeShortcut(action: string): void {
    delete this._shortcuts.custom[action];
    this._updatedAt = Date.now();
  }

  public updatePrivacy(privacy: Partial<IUserSettingServer['privacy']>): void {
    this._privacy = { ...this._privacy, ...privacy };
    this._updatedAt = Date.now();
  }

  public enableExperimentalFeature(feature: string): void {
    if (!this._experimental.features.includes(feature)) {
      this._experimental.features.push(feature);
      this._updatedAt = Date.now();
    }
  }

  public disableExperimentalFeature(feature: string): void {
    const index = this._experimental.features.indexOf(feature);
    if (index !== -1) {
      this._experimental.features.splice(index, 1);
      this._updatedAt = Date.now();
    }
  }

  // ===== DTO 转换方法 =====
  public toServerDTO(): UserSettingServerDTO {
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
    };
  }

  public toClientDTO(): UserSettingClientDTO {
    return this.toServerDTO() as any as UserSettingClientDTO;
  }

  public toPersistenceDTO(): UserSettingPersistenceDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      // Appearance - 扁平化
      appearanceTheme: this._appearance.theme,
      appearanceAccentColor: this._appearance.accentColor,
      appearanceFontSize: this._appearance.fontSize,
      appearanceFontFamily: this._appearance.fontFamily ?? null,
      appearanceCompactMode: this._appearance.compactMode,
      // Locale - 扁平化
      localeLanguage: this._locale.language,
      localeTimezone: this._locale.timezone,
      localeDateFormat: this._locale.dateFormat,
      localeTimeFormat: this._locale.timeFormat,
      localeWeekStartsOn: this._locale.weekStartsOn,
      localeCurrency: this._locale.currency,
      // Workflow - 扁平化
      workflowDefaultTaskView: this._workflow.defaultTaskView,
      workflowDefaultGoalView: this._workflow.defaultGoalView,
      workflowDefaultScheduleView: this._workflow.defaultScheduleView,
      workflowAutoSave: this._workflow.autoSave,
      workflowAutoSaveInterval: this._workflow.autoSaveInterval,
      workflowConfirmBeforeDelete: this._workflow.confirmBeforeDelete,
      // Shortcuts - JSON 字符串（动态键值对）
      shortcutsEnabled: this._shortcuts.enabled,
      shortcutsCustom: JSON.stringify(this._shortcuts.custom),
      // Privacy - 扁平化
      privacyProfileVisibility: this._privacy.profileVisibility,
      privacyShowOnlineStatus: this._privacy.showOnlineStatus,
      privacyAllowSearchByEmail: this._privacy.allowSearchByEmail,
      privacyAllowSearchByPhone: this._privacy.allowSearchByPhone,
      privacyShareUsageData: this._privacy.shareUsageData,
      // Experimental - 扁平化 + JSON 字符串
      experimentalEnabled: this._experimental.enabled,
      experimentalFeatures: JSON.stringify(this._experimental.features),
      // Timestamps
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  // ===== 静态工厂方法 =====
  public static create(params: {
    accountUuid: string;
    appearance?: Partial<IUserSettingServer['appearance']>;
    locale?: Partial<IUserSettingServer['locale']>;
    workflow?: Partial<IUserSettingServer['workflow']>;
    shortcuts?: Partial<IUserSettingServer['shortcuts']>;
    privacy?: Partial<IUserSettingServer['privacy']>;
    experimental?: Partial<IUserSettingServer['experimental']>;
  }): UserSetting {
    const now = Date.now();

    const defaultAppearance: IUserSettingServer['appearance'] = {
      theme: 'AUTO',
      accentColor: '#3B82F6',
      fontSize: 'MEDIUM',
      fontFamily: null,
      compactMode: false,
      ...params.appearance,
    };

    const defaultLocale: IUserSettingServer['locale'] = {
      language: 'zh-CN',
      timezone: 'Asia/Shanghai',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24H',
      weekStartsOn: 1,
      currency: 'CNY',
      ...params.locale,
    };

    const defaultWorkflow: IUserSettingServer['workflow'] = {
      defaultTaskView: 'LIST',
      defaultGoalView: 'LIST',
      defaultScheduleView: 'WEEK',
      autoSave: true,
      autoSaveInterval: 30000,
      confirmBeforeDelete: true,
      ...params.workflow,
    };

    const defaultShortcuts: IUserSettingServer['shortcuts'] = {
      enabled: true,
      custom: {},
      ...params.shortcuts,
    };

    const defaultPrivacy: IUserSettingServer['privacy'] = {
      profileVisibility: 'PRIVATE',
      showOnlineStatus: false,
      allowSearchByEmail: false,
      allowSearchByPhone: false,
      shareUsageData: false,
      ...params.privacy,
    };

    const defaultExperimental: IUserSettingServer['experimental'] = {
      enabled: false,
      features: [],
      ...params.experimental,
    };

    return new UserSetting({
      accountUuid: params.accountUuid,
      appearance: defaultAppearance,
      locale: defaultLocale,
      workflow: defaultWorkflow,
      shortcuts: defaultShortcuts,
      privacy: defaultPrivacy,
      experimental: defaultExperimental,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static fromServerDTO(dto: UserSettingServerDTO): UserSetting {
    return new UserSetting({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      appearance: dto.appearance,
      locale: dto.locale,
      workflow: dto.workflow,
      shortcuts: dto.shortcuts,
      privacy: dto.privacy,
      experimental: dto.experimental,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  public static fromPersistenceDTO(dto: UserSettingPersistenceDTO): UserSetting {
    return new UserSetting({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      // Appearance - 从扁平化还原
      appearance: {
        theme: dto.appearanceTheme as 'LIGHT' | 'DARK' | 'AUTO',
        accentColor: dto.appearanceAccentColor,
        fontSize: dto.appearanceFontSize as 'SMALL' | 'MEDIUM' | 'LARGE',
        fontFamily: dto.appearanceFontFamily,
        compactMode: dto.appearanceCompactMode,
      },
      // Locale - 从扁平化还原
      locale: {
        language: dto.localeLanguage,
        timezone: dto.localeTimezone,
        dateFormat: dto.localeDateFormat as
          | 'YYYY-MM-DD'
          | 'DD/MM/YYYY'
          | 'MM/DD/YYYY',
        timeFormat: dto.localeTimeFormat as '12H' | '24H',
        weekStartsOn: dto.localeWeekStartsOn as 0 | 1 | 2 | 3 | 4 | 5 | 6,
        currency: dto.localeCurrency,
      },
      // Workflow - 从扁平化还原
      workflow: {
        defaultTaskView: dto.workflowDefaultTaskView as
          | 'LIST'
          | 'KANBAN'
          | 'CALENDAR',
        defaultGoalView: dto.workflowDefaultGoalView as
          | 'LIST'
          | 'TREE'
          | 'TIMELINE',
        defaultScheduleView: dto.workflowDefaultScheduleView as
          | 'DAY'
          | 'WEEK'
          | 'MONTH',
        autoSave: dto.workflowAutoSave,
        autoSaveInterval: dto.workflowAutoSaveInterval,
        confirmBeforeDelete: dto.workflowConfirmBeforeDelete,
      },
      // Shortcuts - 从 JSON 字符串解析
      shortcuts: {
        enabled: dto.shortcutsEnabled,
        custom: JSON.parse(dto.shortcutsCustom) as Record<string, string>,
      },
      // Privacy - 从扁平化还原
      privacy: {
        profileVisibility: dto.privacyProfileVisibility as
          | 'PUBLIC'
          | 'PRIVATE'
          | 'FRIENDS_ONLY',
        showOnlineStatus: dto.privacyShowOnlineStatus,
        allowSearchByEmail: dto.privacyAllowSearchByEmail,
        allowSearchByPhone: dto.privacyAllowSearchByPhone,
        shareUsageData: dto.privacyShareUsageData,
      },
      // Experimental - 从 JSON 字符串解析
      experimental: {
        enabled: dto.experimentalEnabled,
        features: JSON.parse(dto.experimentalFeatures) as string[],
      },
      // Timestamps
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }
}
