/**
 * Account 聚合根实现 (Client)
 * 兼容 AccountClient 接口
 */

import { AccountContracts, AccountStatus, ThemeType, ProfileVisibility, StorageQuotaType } from '@dailyuse/contracts';
import { AggregateRoot } from '@dailyuse/utils';
import { Subscription } from '../entities/Subscription';
import { AccountHistory } from '../entities/AccountHistory';
import {
  EmailValidator,
  PhoneNumberValidator,
  UsernameValidator,
  DisplayNameValidator,
  StorageQuotaValidator,
  AgeValidator,
  TimezoneValidator,
  LanguageValidator,
  type ValidationResult,
} from '../validators/AccountValidators';

type IAccountClient = AccountContracts.AccountClient;
type AccountClientDTO = AccountContracts.AccountClientDTO;
type AccountServerDTO = AccountContracts.AccountServerDTO;
type Gender = AccountContracts.Gender;

/**
 * Account 聚合根 (Client)
 *
 * DDD 聚合根职责：
 * - 管理账户信息和状态
 * - 管理子实体（订阅、历史记录）
 * - 提供账户相关的业务逻辑
 */
export class Account extends AggregateRoot implements IAccountClient {
  // ===== 私有字段 =====
  private _username: string;
  private _email: string;
  private _emailVerified: boolean;
  private _phoneNumber: string | null;
  private _phoneVerified: boolean;
  private _status: AccountStatus;
  private _profile: {
    displayName: string;
    avatar?: string | null;
    bio?: string | null;
    location?: string | null;
    timezone: string;
    language: string;
    dateOfBirth?: number | null;
    gender?: Gender | null;
  };
  private _preferences: {
    theme: ThemeType;
    accentColor?: string | null;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
      inApp: boolean;
    };
    privacy: {
      profileVisibility: ProfileVisibility;
      showOnlineStatus: boolean;
      allowSearchByEmail: boolean;
    };
  };
  private _subscription: Subscription | null;
  private _storage: {
    used: number;
    quota: number;
    quotaType: StorageQuotaType;
  };
  private _security: {
    twoFactorEnabled: boolean;
    lastPasswordChange?: number | null;
    loginAttempts: number;
    lockedUntil?: number | null;
  };
  private _history: AccountHistory[];
  private _stats: {
    totalGoals: number;
    totalTasks: number;
    totalSchedules: number;
    totalReminders: number;
    lastLoginAt?: number | null;
    loginCount: number;
  };
  private _createdAt: number;
  private _updatedAt: number;
  private _lastActiveAt: number | null;
  private _deletedAt: number | null;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    username: string;
    email: string;
    emailVerified: boolean;
    phoneNumber?: string | null;
    phoneVerified: boolean;
    status: AccountStatus;
    profile: {
      displayName: string;
      avatar?: string | null;
      bio?: string | null;
      location?: string | null;
      timezone: string;
      language: string;
      dateOfBirth?: number | null;
      gender?: Gender | null;
    };
    preferences: {
      theme: ThemeType;
      accentColor?: string | null;
      notifications: {
        email: boolean;
        push: boolean;
        sms: boolean;
        inApp: boolean;
      };
      privacy: {
        profileVisibility: ProfileVisibility;
        showOnlineStatus: boolean;
        allowSearchByEmail: boolean;
      };
    };
    subscription?: Subscription | null;
    storage: {
      used: number;
      quota: number;
      quotaType: StorageQuotaType;
    };
    security: {
      twoFactorEnabled: boolean;
      lastPasswordChange?: number | null;
      loginAttempts: number;
      lockedUntil?: number | null;
    };
    history: AccountHistory[];
    stats: {
      totalGoals: number;
      totalTasks: number;
      totalSchedules: number;
      totalReminders: number;
      lastLoginAt?: number | null;
      loginCount: number;
    };
    createdAt: number;
    updatedAt: number;
    lastActiveAt?: number | null;
    deletedAt?: number | null;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    this._username = params.username;
    this._email = params.email;
    this._emailVerified = params.emailVerified;
    this._phoneNumber = params.phoneNumber ?? null;
    this._phoneVerified = params.phoneVerified;
    this._status = params.status;
    this._profile = params.profile;
    this._preferences = params.preferences;
    this._subscription = params.subscription ?? null;
    this._storage = params.storage;
    this._security = params.security;
    this._history = params.history;
    this._stats = params.stats;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._lastActiveAt = params.lastActiveAt ?? null;
    this._deletedAt = params.deletedAt ?? null;
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get username(): string {
    return this._username;
  }
  public get email(): string {
    return this._email;
  }
  public get emailVerified(): boolean {
    return this._emailVerified;
  }
  public get phoneNumber(): string | null {
    return this._phoneNumber;
  }
  public get phoneVerified(): boolean {
    return this._phoneVerified;
  }
  public get status(): AccountStatus {
    return this._status;
  }
  public get profile(): Account['_profile'] {
    return { ...this._profile };
  }
  public get preferences(): Account['_preferences'] {
    return JSON.parse(JSON.stringify(this._preferences));
  }
  public get subscription(): Subscription | null {
    return this._subscription;
  }
  public get storage(): Account['_storage'] {
    return { ...this._storage };
  }
  public get security(): Account['_security'] {
    return { ...this._security };
  }
  public get history(): AccountHistory[] {
    return [...this._history];
  }
  public get stats(): Account['_stats'] {
    return { ...this._stats };
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number {
    return this._updatedAt;
  }
  public get lastActiveAt(): number | null {
    return this._lastActiveAt;
  }
  public get deletedAt(): number | null {
    return this._deletedAt;
  }

  // ===== 工厂方法 =====

  /**
   * 创建新账户
   */
  public static create(params: {
    username: string;
    email: string;
    displayName: string;
    timezone?: string;
    language?: string;
  }): Account {
    const uuid = AggregateRoot.generateUUID();
    const now = Date.now();

    return new Account({
      uuid,
      username: params.username,
      email: params.email,
      emailVerified: false,
      phoneVerified: false,
      status: AccountStatus.ACTIVE,
      profile: {
        displayName: params.displayName,
        timezone: params.timezone || 'Asia/Shanghai',
        language: params.language || 'zh-CN',
      },
      preferences: {
        theme: ThemeType.AUTO,
        notifications: {
          email: true,
          push: true,
          sms: false,
          inApp: true,
        },
        privacy: {
          profileVisibility: ProfileVisibility.PUBLIC,
          showOnlineStatus: true,
          allowSearchByEmail: true,
        },
      },
      storage: {
        used: 0,
        quota: 1024 * 1024 * 1024, // 1GB for free tier
        quotaType: StorageQuotaType.FREE,
      },
      security: {
        twoFactorEnabled: false,
        loginAttempts: 0,
      },
      history: [],
      stats: {
        totalGoals: 0,
        totalTasks: 0,
        totalSchedules: 0,
        totalReminders: 0,
        loginCount: 0,
      },
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 克隆当前对象（深拷贝）
   */
  public clone(): Account {
    return Account.fromClientDTO(this.toClientDTO());
  }

  // ===== 业务方法 =====

  /**
   * 更新用户资料
   * @throws Error 如果资料数据无效
   */
  public updateProfile(profile: Partial<Account['_profile']>): void {
    // 验证显示名称（如果提供）
    if (profile.displayName !== undefined) {
      const validation = DisplayNameValidator.validate(profile.displayName);
      if (!validation.isValid) {
        throw new Error(`无法更新资料：${validation.errors.join(', ')}`);
      }
    }

    // 验证出生日期（如果提供）
    if (profile.dateOfBirth !== undefined && profile.dateOfBirth !== null) {
      const validation = AgeValidator.validateByBirthDate(profile.dateOfBirth);
      if (!validation.isValid) {
        throw new Error(`无法更新资料：${validation.errors.join(', ')}`);
      }
    }

    // 验证时区（如果提供）
    if (profile.timezone !== undefined) {
      const validation = TimezoneValidator.validate(profile.timezone);
      if (!validation.isValid) {
        throw new Error(`无法更新资料：${validation.errors.join(', ')}`);
      }
    }

    // 验证语言（如果提供）
    if (profile.language !== undefined) {
      const validation = LanguageValidator.validate(profile.language);
      if (!validation.isValid) {
        throw new Error(`无法更新资料：${validation.errors.join(', ')}`);
      }
    }

    this._profile = {
      ...this._profile,
      ...profile,
    };
    this._updatedAt = Date.now();
  }

  /**
   * 更新用户偏好设置
   */
  public updatePreferences(preferences: Partial<Account['_preferences']>): void {
    this._preferences = {
      ...this._preferences,
      ...preferences,
      notifications: {
        ...this._preferences.notifications,
        ...(preferences.notifications || {}),
      },
      privacy: {
        ...this._preferences.privacy,
        ...(preferences.privacy || {}),
      },
    };
    this._updatedAt = Date.now();
  }

  /**
   * 验证邮箱
   */
  public verifyEmail(): void {
    this._emailVerified = true;
    this._updatedAt = Date.now();
  }

  /**
   * 验证手机号
   */
  public verifyPhone(): void {
    this._phoneVerified = true;
    this._updatedAt = Date.now();
  }

  /**
   * 更新邮箱
   * @throws Error 如果邮箱格式无效或与当前邮箱相同
   */
  public updateEmail(email: string): void {
    // 验证邮箱
    const validation = this.canUpdateEmail(email);
    if (!validation.isValid) {
      throw new Error(`无法更新邮箱：${validation.errors.join(', ')}`);
    }

    this._email = email;
    this._emailVerified = false; // 新邮箱需要重新验证
    this._updatedAt = Date.now();
  }

  /**
   * 更新手机号
   * @throws Error 如果手机号格式无效或与当前手机号相同
   */
  public updatePhone(phoneNumber: string): void {
    // 验证手机号
    const validation = this.canUpdatePhoneNumber(phoneNumber);
    if (!validation.isValid) {
      throw new Error(`无法更新手机号：${validation.errors.join(', ')}`);
    }

    this._phoneNumber = phoneNumber;
    this._phoneVerified = false; // 新手机号需要重新验证
    this._updatedAt = Date.now();
  }

  /**
   * 激活账户
   */
  public activate(): void {
    this._status = AccountStatus.ACTIVE;
    this._updatedAt = Date.now();
  }

  /**
   * 停用账户
   */
  public deactivate(): void {
    this._status = AccountStatus.INACTIVE;
    this._updatedAt = Date.now();
  }

  /**
   * 暂停账户
   */
  public suspend(): void {
    this._status = AccountStatus.SUSPENDED;
    this._updatedAt = Date.now();
  }

  /**
   * 软删除账户
   */
  public softDelete(): void {
    this._status = AccountStatus.DELETED;
    this._deletedAt = Date.now();
    this._updatedAt = Date.now();
  }

  /**
   * 恢复账户
   */
  public restore(): void {
    if (this._status === AccountStatus.DELETED) {
      this._status = AccountStatus.INACTIVE;
      this._deletedAt = null;
      this._updatedAt = Date.now();
    }
  }

  /**
   * 启用两步验证
   */
  public enableTwoFactor(): void {
    this._security.twoFactorEnabled = true;
    this._updatedAt = Date.now();
  }

  /**
   * 禁用两步验证
   */
  public disableTwoFactor(): void {
    this._security.twoFactorEnabled = false;
    this._updatedAt = Date.now();
  }

  /**
   * 记录密码更改
   */
  public recordPasswordChange(): void {
    this._security.lastPasswordChange = Date.now();
    this._security.loginAttempts = 0; // 重置登录尝试次数
    this._updatedAt = Date.now();
  }

  /**
   * 增加登录失败尝试次数
   */
  public incrementLoginAttempts(): void {
    this._security.loginAttempts += 1;
    this._updatedAt = Date.now();
  }

  /**
   * 重置登录尝试次数
   */
  public resetLoginAttempts(): void {
    this._security.loginAttempts = 0;
    this._updatedAt = Date.now();
  }

  /**
   * 锁定账户
   */
  public lockAccount(durationMinutes: number): void {
    const now = Date.now();
    this._security.lockedUntil = now + durationMinutes * 60 * 1000;
    this._updatedAt = now;
  }

  /**
   * 解锁账户
   */
  public unlockAccount(): void {
    this._security.lockedUntil = null;
    this._security.loginAttempts = 0;
    this._updatedAt = Date.now();
  }

  /**
   * 检查账户是否被锁定
   */
  public isLocked(): boolean {
    if (!this._security.lockedUntil) return false;
    return Date.now() < this._security.lockedUntil;
  }

  /**
   * 更新订阅
   */
  public updateSubscription(subscription: Subscription): void {
    this._subscription = subscription;
    this._updatedAt = Date.now();
  }

  /**
   * 取消订阅
   */
  public cancelSubscription(): void {
    this._subscription = null;
    this._updatedAt = Date.now();
  }

  /**
   * 检查存储配额
   * @throws Error 如果存储空间不足
   */
  public checkStorageQuota(requiredBytes: number): boolean {
    const validation = StorageQuotaValidator.checkAvailableSpace(
      this._storage.used,
      this._storage.quota,
      requiredBytes,
    );
    
    if (!validation.isValid) {
      // 返回 false 而不是抛出异常，让调用方决定如何处理
      return false;
    }
    
    return true;
  }

  /**
   * 更新存储使用量
   * @throws Error 如果使用量超过配额
   */
  public updateStorageUsage(bytesUsed: number): void {
    // 验证存储使用量
    const validation = StorageQuotaValidator.validateUsage(bytesUsed, this._storage.quota);
    if (!validation.isValid) {
      throw new Error(`无法更新存储使用量：${validation.errors.join(', ')}`);
    }

    this._storage.used = bytesUsed;
    this._updatedAt = Date.now();
  }

  /**
   * 增加存储使用量
   * @throws Error 如果超过配额
   */
  public increaseStorageUsage(bytesAdded: number): void {
    const newUsage = this._storage.used + bytesAdded;
    this.updateStorageUsage(newUsage);
  }

  /**
   * 减少存储使用量
   */
  public decreaseStorageUsage(bytesRemoved: number): void {
    const newUsage = Math.max(0, this._storage.used - bytesRemoved);
    this._storage.used = newUsage;
    this._updatedAt = Date.now();
  }

  /**
   * 添加历史记录
   */
  public addHistory(history: AccountHistory): void {
    this._history.push(history);
    this._updatedAt = Date.now();
  }

  /**
   * 更新统计信息
   */
  public updateStats(stats: Partial<Account['_stats']>): void {
    this._stats = {
      ...this._stats,
      ...stats,
    };
    this._updatedAt = Date.now();
  }

  /**
   * 记录登录
   */
  public recordLogin(): void {
    const now = Date.now();
    this._stats.lastLoginAt = now;
    this._stats.loginCount += 1;
    this._lastActiveAt = now;
    this._updatedAt = now;
  }

  /**
   * 记录活动
   */
  public recordActivity(): void {
    this._lastActiveAt = Date.now();
    this._updatedAt = Date.now();
  }

  /**
   * 检查账户是否激活
   */
  public isActive(): boolean {
    return this._status === AccountStatus.ACTIVE;
  }

  /**
   * 检查账户是否已删除
   */
  public isDeleted(): boolean {
    return this._status === AccountStatus.DELETED;
  }

  // ===== DTO 转换方法 =====

  public toClientDTO(): AccountClientDTO {
    return {
      uuid: this._uuid,
      username: this._username,
      email: this._email,
      emailVerified: this._emailVerified,
      phoneNumber: this._phoneNumber,
      phoneVerified: this._phoneVerified,
      status: this._status,
      profile: { ...this._profile },
      preferences: JSON.parse(JSON.stringify(this._preferences)),
      subscription: this._subscription?.toClientDTO() || null,
      storage: { ...this._storage },
      security: { ...this._security },
      history: this._history.map((h) => h.toClientDTO()),
      stats: { ...this._stats },
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      lastActiveAt: this._lastActiveAt,
      deletedAt: this._deletedAt,
    };
  }

  public static fromClientDTO(dto: AccountClientDTO): Account {
    return new Account({
      uuid: dto.uuid,
      username: dto.username,
      email: dto.email,
      emailVerified: dto.emailVerified,
      phoneNumber: dto.phoneNumber,
      phoneVerified: dto.phoneVerified,
      status: dto.status as AccountStatus,
      profile: {
        ...dto.profile,
        gender: dto.profile.gender as Gender | undefined,
      },
      preferences: {
        ...dto.preferences,
        theme: dto.preferences.theme as ThemeType,
        privacy: {
          ...dto.preferences.privacy,
          profileVisibility: dto.preferences.privacy.profileVisibility as ProfileVisibility,
        },
      },
      subscription: dto.subscription ? Subscription.fromClientDTO(dto.subscription) : null,
      storage: {
        ...dto.storage,
        quotaType: dto.storage.quotaType as StorageQuotaType,
      },
      security: { ...dto.security },
      history: dto.history.map((h) => AccountHistory.fromClientDTO(h)),
      stats: { ...dto.stats },
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      lastActiveAt: dto.lastActiveAt,
      deletedAt: dto.deletedAt,
    });
  }

  public static fromServerDTO(dto: AccountServerDTO): Account {
    return new Account({
      uuid: dto.uuid,
      username: dto.username,
      email: dto.email,
      emailVerified: dto.emailVerified,
      phoneNumber: dto.phoneNumber,
      phoneVerified: dto.phoneVerified,
      status: dto.status as AccountStatus,
      profile: {
        ...dto.profile,
        gender: dto.profile.gender as Gender | undefined,
      },
      preferences: {
        ...dto.preferences,
        theme: dto.preferences.theme as ThemeType,
        privacy: {
          ...dto.preferences.privacy,
          profileVisibility: dto.preferences.privacy.profileVisibility as ProfileVisibility,
        },
      },
      subscription: dto.subscription ? Subscription.fromClientDTO(dto.subscription) : null,
      storage: {
        ...dto.storage,
        quotaType: dto.storage.quotaType as StorageQuotaType,
      },
      security: { ...dto.security },
      history: dto.history.map((h) => AccountHistory.fromClientDTO(h)),
      stats: { ...dto.stats },
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      lastActiveAt: dto.lastActiveAt,
      deletedAt: dto.deletedAt,
    });
  }

  // ===== 验证方法 =====

  /**
   * 验证邮箱格式
   */
  validateEmail(email?: string): ValidationResult {
    const emailToValidate = email ?? this._email;
    return EmailValidator.validate(emailToValidate);
  }

  /**
   * 验证手机号格式
   */
  validatePhoneNumber(phoneNumber?: string): ValidationResult {
    const phoneToValidate = phoneNumber ?? this._phoneNumber;
    if (!phoneToValidate) {
      return {
        isValid: true,
        errors: [],
      };
    }
    return PhoneNumberValidator.validate(phoneToValidate);
  }

  /**
   * 验证用户名
   */
  static validateUsername(username: string): ValidationResult {
    return UsernameValidator.validate(username);
  }

  /**
   * 验证显示名称
   */
  validateDisplayName(displayName?: string): ValidationResult {
    const nameToValidate = displayName ?? this._profile.displayName;
    return DisplayNameValidator.validate(nameToValidate);
  }

  /**
   * 验证存储配额
   */
  validateStorageQuota(): ValidationResult {
    return StorageQuotaValidator.validateUsage(this._storage.used, this._storage.quota);
  }

  /**
   * 验证年龄（如果有出生日期）
   */
  validateAge(): ValidationResult {
    if (!this._profile.dateOfBirth) {
      return {
        isValid: true,
        errors: [],
      };
    }
    return AgeValidator.validateByBirthDate(this._profile.dateOfBirth);
  }

  /**
   * 验证时区
   */
  validateTimezone(timezone?: string): ValidationResult {
    const timezoneToValidate = timezone ?? this._profile.timezone;
    return TimezoneValidator.validate(timezoneToValidate);
  }

  /**
   * 验证语言代码
   */
  validateLanguage(language?: string): ValidationResult {
    const languageToValidate = language ?? this._profile.language;
    return LanguageValidator.validate(languageToValidate);
  }

  /**
   * 验证账户的完整性
   * 返回所有验证错误的汇总
   */
  validateAccount(): ValidationResult {
    const allErrors: string[] = [];

    // 验证邮箱
    const emailResult = this.validateEmail();
    if (!emailResult.isValid) {
      allErrors.push(...emailResult.errors.map((e) => `邮箱：${e}`));
    }

    // 验证手机号
    const phoneResult = this.validatePhoneNumber();
    if (!phoneResult.isValid) {
      allErrors.push(...phoneResult.errors.map((e) => `手机号：${e}`));
    }

    // 验证显示名称
    const displayNameResult = this.validateDisplayName();
    if (!displayNameResult.isValid) {
      allErrors.push(...displayNameResult.errors.map((e) => `显示名称：${e}`));
    }

    // 验证存储配额
    const storageResult = this.validateStorageQuota();
    if (!storageResult.isValid) {
      allErrors.push(...storageResult.errors.map((e) => `存储：${e}`));
    }

    // 验证年龄
    const ageResult = this.validateAge();
    if (!ageResult.isValid) {
      allErrors.push(...ageResult.errors.map((e) => `年龄：${e}`));
    }

    // 验证时区
    const timezoneResult = this.validateTimezone();
    if (!timezoneResult.isValid) {
      allErrors.push(...timezoneResult.errors.map((e) => `时区：${e}`));
    }

    // 验证语言
    const languageResult = this.validateLanguage();
    if (!languageResult.isValid) {
      allErrors.push(...languageResult.errors.map((e) => `语言：${e}`));
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  }

  /**
   * 验证是否可以更新邮箱
   */
  canUpdateEmail(newEmail: string): ValidationResult {
    const errors: string[] = [];

    // 验证新邮箱格式
    const emailResult = EmailValidator.validate(newEmail);
    if (!emailResult.isValid) {
      errors.push(...emailResult.errors);
    }

    // 检查是否与当前邮箱相同
    if (newEmail === this._email) {
      errors.push('新邮箱与当前邮箱相同');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 验证是否可以更新手机号
   */
  canUpdatePhoneNumber(newPhoneNumber: string): ValidationResult {
    const errors: string[] = [];

    // 验证新手机号格式
    const phoneResult = PhoneNumberValidator.validate(newPhoneNumber);
    if (!phoneResult.isValid) {
      errors.push(...phoneResult.errors);
    }

    // 检查是否与当前手机号相同
    if (newPhoneNumber === this._phoneNumber) {
      errors.push('新手机号与当前手机号相同');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
