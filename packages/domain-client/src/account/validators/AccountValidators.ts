/**
 * Account 验证器
 * 提供账户相关的业务规则验证
 */

/**
 * 验证结果
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 邮箱验证器
 */
export class EmailValidator {
  private static readonly EMAIL_REGEX =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  /**
   * 验证邮箱格式
   */
  static validate(email: string): ValidationResult {
    const errors: string[] = [];

    if (!email || email.trim().length === 0) {
      errors.push('邮箱不能为空');
      return { isValid: false, errors };
    }

    if (email.length > 254) {
      errors.push('邮箱长度不能超过 254 个字符');
    }

    if (!this.EMAIL_REGEX.test(email)) {
      errors.push('邮箱格式不正确');
    }

    // 检查本地部分（@之前）长度
    const [localPart] = email.split('@');
    if (localPart && localPart.length > 64) {
      errors.push('邮箱本地部分长度不能超过 64 个字符');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 验证邮箱域名
   */
  static validateDomain(email: string, allowedDomains?: string[]): ValidationResult {
    const errors: string[] = [];

    if (!allowedDomains || allowedDomains.length === 0) {
      return { isValid: true, errors: [] };
    }

    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) {
      errors.push('无效的邮箱格式');
      return { isValid: false, errors };
    }

    const isAllowed = allowedDomains.some((allowed) => domain === allowed.toLowerCase());
    if (!isAllowed) {
      errors.push(`邮箱域名必须是以下之一：${allowedDomains.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * 手机号验证器
 */
export class PhoneNumberValidator {
  // 中国大陆手机号正则
  private static readonly CN_MOBILE_REGEX = /^1[3-9]\d{9}$/;
  // 国际手机号正则（简化版）
  private static readonly INTERNATIONAL_REGEX = /^\+?[1-9]\d{1,14}$/;

  /**
   * 验证中国大陆手机号
   */
  static validateCN(phoneNumber: string): ValidationResult {
    const errors: string[] = [];

    if (!phoneNumber || phoneNumber.trim().length === 0) {
      errors.push('手机号不能为空');
      return { isValid: false, errors };
    }

    // 移除空格和连字符
    const cleaned = phoneNumber.replace(/[\s-]/g, '');

    if (!this.CN_MOBILE_REGEX.test(cleaned)) {
      errors.push('手机号格式不正确（应为11位数字，以1开头）');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 验证国际手机号
   */
  static validateInternational(phoneNumber: string): ValidationResult {
    const errors: string[] = [];

    if (!phoneNumber || phoneNumber.trim().length === 0) {
      errors.push('手机号不能为空');
      return { isValid: false, errors };
    }

    // 移除空格和连字符
    const cleaned = phoneNumber.replace(/[\s-]/g, '');

    if (!this.INTERNATIONAL_REGEX.test(cleaned)) {
      errors.push('手机号格式不正确');
    }

    if (cleaned.length > 15) {
      errors.push('手机号长度不能超过15位（不含国家代码的+号）');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 自动检测并验证手机号
   */
  static validate(phoneNumber: string): ValidationResult {
    if (!phoneNumber || phoneNumber.trim().length === 0) {
      return {
        isValid: false,
        errors: ['手机号不能为空'],
      };
    }

    const cleaned = phoneNumber.replace(/[\s-]/g, '');

    // 如果是以 +86 或 86 开头，或者11位数字以1开头，认为是中国号码
    if (cleaned.startsWith('+86') || cleaned.startsWith('86') || this.CN_MOBILE_REGEX.test(cleaned)) {
      // 移除 +86 或 86 前缀
      const cnNumber = cleaned.replace(/^\+?86/, '');
      return this.validateCN(cnNumber);
    }

    // 否则按国际号码验证
    return this.validateInternational(cleaned);
  }
}

/**
 * 用户名验证器
 */
export class UsernameValidator {
  private static readonly USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;
  private static readonly MIN_LENGTH = 3;
  private static readonly MAX_LENGTH = 32;

  /**
   * 验证用户名
   */
  static validate(username: string): ValidationResult {
    const errors: string[] = [];

    if (!username || username.trim().length === 0) {
      errors.push('用户名不能为空');
      return { isValid: false, errors };
    }

    if (username.length < this.MIN_LENGTH) {
      errors.push(`用户名长度不能少于 ${this.MIN_LENGTH} 个字符`);
    }

    if (username.length > this.MAX_LENGTH) {
      errors.push(`用户名长度不能超过 ${this.MAX_LENGTH} 个字符`);
    }

    if (!this.USERNAME_REGEX.test(username)) {
      errors.push('用户名只能包含字母、数字、下划线和连字符');
    }

    // 不能以连字符或下划线开头/结尾
    if (/^[-_]|[-_]$/.test(username)) {
      errors.push('用户名不能以连字符或下划线开头或结尾');
    }

    // 不能包含连续的特殊字符
    if (/[-_]{2,}/.test(username)) {
      errors.push('用户名不能包含连续的连字符或下划线');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 检查用户名是否包含敏感词
   */
  static checkSensitiveWords(username: string, sensitiveWords: string[]): ValidationResult {
    const errors: string[] = [];
    const lowerUsername = username.toLowerCase();

    for (const word of sensitiveWords) {
      if (lowerUsername.includes(word.toLowerCase())) {
        errors.push('用户名包含敏感词');
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * 显示名称验证器
 */
export class DisplayNameValidator {
  private static readonly MIN_LENGTH = 1;
  private static readonly MAX_LENGTH = 50;

  /**
   * 验证显示名称
   */
  static validate(displayName: string): ValidationResult {
    const errors: string[] = [];

    if (!displayName || displayName.trim().length === 0) {
      errors.push('显示名称不能为空');
      return { isValid: false, errors };
    }

    const trimmed = displayName.trim();

    if (trimmed.length < this.MIN_LENGTH) {
      errors.push(`显示名称长度不能少于 ${this.MIN_LENGTH} 个字符`);
    }

    if (trimmed.length > this.MAX_LENGTH) {
      errors.push(`显示名称长度不能超过 ${this.MAX_LENGTH} 个字符`);
    }

    // 检查是否包含特殊控制字符
    if (/[\x00-\x1F\x7F-\x9F]/.test(displayName)) {
      errors.push('显示名称不能包含控制字符');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * 存储配额验证器
 */
export class StorageQuotaValidator {
  /**
   * 验证存储使用量
   */
  static validateUsage(used: number, quota: number): ValidationResult {
    const errors: string[] = [];

    if (used < 0) {
      errors.push('存储使用量不能为负数');
    }

    if (quota <= 0) {
      errors.push('存储配额必须大于 0');
    }

    if (used > quota) {
      errors.push(`存储使用量（${used} bytes）超过配额（${quota} bytes）`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 检查是否有足够空间
   */
  static checkAvailableSpace(used: number, quota: number, required: number): ValidationResult {
    const errors: string[] = [];
    const available = quota - used;

    if (required < 0) {
      errors.push('所需空间不能为负数');
    }

    if (required > available) {
      errors.push(
        `存储空间不足。需要 ${required} bytes，可用 ${available} bytes（已使用 ${used}/${quota} bytes）`,
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * 年龄验证器
 */
export class AgeValidator {
  private static readonly MIN_AGE = 13; // 最小年龄（例如 COPPA 要求）
  private static readonly MAX_AGE = 150; // 最大合理年龄

  /**
   * 根据出生日期验证年龄
   */
  static validateByBirthDate(birthDateTimestamp: number): ValidationResult {
    const errors: string[] = [];
    const now = Date.now();
    const birthDate = new Date(birthDateTimestamp);
    const age = Math.floor((now - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    if (birthDateTimestamp > now) {
      errors.push('出生日期不能是未来时间');
    }

    if (age < this.MIN_AGE) {
      errors.push(`年龄必须至少 ${this.MIN_AGE} 岁`);
    }

    if (age > this.MAX_AGE) {
      errors.push(`年龄不能超过 ${this.MAX_AGE} 岁`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * 时区验证器
 */
export class TimezoneValidator {
  /**
   * 验证时区字符串
   * 使用 IANA 时区数据库格式（如 'Asia/Shanghai', 'America/New_York'）
   */
  static validate(timezone: string): ValidationResult {
    const errors: string[] = [];

    if (!timezone || timezone.trim().length === 0) {
      errors.push('时区不能为空');
      return { isValid: false, errors };
    }

    // 简单验证格式（区域/城市）
    if (!/^[A-Z][a-zA-Z]*\/[A-Z][a-zA-Z_]*$/.test(timezone)) {
      errors.push('时区格式不正确（应为 Region/City 格式，如 Asia/Shanghai）');
    }

    // 可以进一步验证是否是有效的 IANA 时区
    // 这里简化处理，实际应该检查 Intl.supportedValuesOf('timeZone')
    try {
      // 尝试使用该时区创建一个日期格式化器
      new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    } catch {
      errors.push(`无效的时区：${timezone}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * 语言代码验证器
 */
export class LanguageValidator {
  // 常见的 ISO 639-1 语言代码
  private static readonly COMMON_LANGUAGE_CODES = [
    'zh', 'en', 'es', 'hi', 'ar', 'pt', 'bn', 'ru', 'ja', 'pa',
    'de', 'jv', 'ko', 'fr', 'te', 'mr', 'tr', 'ta', 'vi', 'ur',
    'it', 'th', 'gu', 'fa', 'pl', 'uk', 'ml', 'kn', 'or', 'my',
  ];

  /**
   * 验证语言代码（ISO 639-1 或带区域的格式如 zh-CN）
   */
  static validate(language: string): ValidationResult {
    const errors: string[] = [];

    if (!language || language.trim().length === 0) {
      errors.push('语言代码不能为空');
      return { isValid: false, errors };
    }

    // 支持 'zh' 或 'zh-CN' 格式
    const languageCodeRegex = /^[a-z]{2}(-[A-Z]{2})?$/;
    if (!languageCodeRegex.test(language)) {
      errors.push('语言代码格式不正确（应为 ISO 639-1 格式，如 en 或 zh-CN）');
    }

    // 检查是否是常见语言代码
    const baseCode = language.split('-')[0];
    if (baseCode && !this.COMMON_LANGUAGE_CODES.includes(baseCode)) {
      // 警告但不阻止
      console.warn(`使用了不常见的语言代码：${language}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
