/**
 * Authentication 验证器
 * 提供认证相关的业务规则验证
 */

/**
 * 验证结果
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 密码强度级别
 */
export enum PasswordStrength {
  WEAK = 'WEAK',
  MEDIUM = 'MEDIUM',
  STRONG = 'STRONG',
  VERY_STRONG = 'VERY_STRONG',
}

/**
 * 密码强度结果
 */
export interface PasswordStrengthResult extends ValidationResult {
  strength: PasswordStrength;
  score: number; // 0-100
  suggestions: string[];
}

/**
 * 密码验证器
 */
export class PasswordValidator {
  private static readonly MIN_LENGTH = 8;
  private static readonly MAX_LENGTH = 128;
  private static readonly COMMON_PASSWORDS = [
    'password',
    '12345678',
    'qwerty',
    'abc123',
    'password123',
    'admin',
    'letmein',
    'welcome',
    'monkey',
    'dragon',
  ];

  /**
   * 验证密码基本要求
   */
  static validate(password: string): ValidationResult {
    const errors: string[] = [];

    if (!password) {
      errors.push('密码不能为空');
      return { isValid: false, errors };
    }

    if (password.length < this.MIN_LENGTH) {
      errors.push(`密码长度至少为 ${this.MIN_LENGTH} 个字符`);
    }

    if (password.length > this.MAX_LENGTH) {
      errors.push(`密码长度不能超过 ${this.MAX_LENGTH} 个字符`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 检查密码强度
   */
  static checkStrength(password: string): PasswordStrengthResult {
    const errors: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // 基本验证
    const basicValidation = this.validate(password);
    if (!basicValidation.isValid) {
      return {
        isValid: false,
        errors: basicValidation.errors,
        strength: PasswordStrength.WEAK,
        score: 0,
        suggestions: ['请输入有效的密码'],
      };
    }

    // 长度评分 (最多30分)
    if (password.length >= 8) score += 10;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    // 包含小写字母 (15分)
    if (/[a-z]/.test(password)) {
      score += 15;
    } else {
      suggestions.push('添加小写字母');
    }

    // 包含大写字母 (15分)
    if (/[A-Z]/.test(password)) {
      score += 15;
    } else {
      suggestions.push('添加大写字母');
    }

    // 包含数字 (15分)
    if (/\d/.test(password)) {
      score += 15;
    } else {
      suggestions.push('添加数字');
    }

    // 包含特殊字符 (15分)
    if (/[^a-zA-Z0-9]/.test(password)) {
      score += 15;
    } else {
      suggestions.push('添加特殊字符（如 !@#$%^&*）');
    }

    // 字符种类多样性 (10分)
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.5) {
      score += 10;
    }

    // 检查常见密码
    if (this.COMMON_PASSWORDS.some((common) => password.toLowerCase().includes(common))) {
      score -= 30;
      errors.push('密码过于常见');
      suggestions.push('避免使用常见密码');
    }

    // 检查重复字符
    if (/(.)\1{2,}/.test(password)) {
      score -= 10;
      suggestions.push('避免连续重复字符');
    }

    // 检查连续字符序列
    if (this.hasSequentialChars(password)) {
      score -= 10;
      suggestions.push('避免连续的字符序列（如 abc, 123）');
    }

    // 确保分数在 0-100 之间
    score = Math.max(0, Math.min(100, score));

    // 确定强度级别
    let strength: PasswordStrength;
    if (score >= 80) {
      strength = PasswordStrength.VERY_STRONG;
    } else if (score >= 60) {
      strength = PasswordStrength.STRONG;
    } else if (score >= 40) {
      strength = PasswordStrength.MEDIUM;
    } else {
      strength = PasswordStrength.WEAK;
      if (errors.length === 0) {
        errors.push('密码强度不足');
      }
    }

    return {
      isValid: errors.length === 0 && score >= 40,
      errors,
      strength,
      score,
      suggestions,
    };
  }

  /**
   * 检查是否包含连续字符
   */
  private static hasSequentialChars(password: string): boolean {
    const sequences = [
      'abcdefghijklmnopqrstuvwxyz',
      '0123456789',
      'qwertyuiop',
      'asdfghjkl',
      'zxcvbnm',
    ];

    const lowerPassword = password.toLowerCase();

    for (const seq of sequences) {
      for (let i = 0; i < seq.length - 2; i++) {
        const substring = seq.substring(i, i + 3);
        if (lowerPassword.includes(substring)) {
          return true;
        }
        // 也检查反向
        const reversed = substring.split('').reverse().join('');
        if (lowerPassword.includes(reversed)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 验证密码确认
   */
  static validateConfirmation(password: string, confirmPassword: string): ValidationResult {
    const errors: string[] = [];

    if (!confirmPassword) {
      errors.push('请确认密码');
      return { isValid: false, errors };
    }

    if (password !== confirmPassword) {
      errors.push('两次输入的密码不一致');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 检查密码是否与用户信息相似
   */
  static checkSimilarityWithUserInfo(
    password: string,
    userInfo: {
      username?: string;
      email?: string;
      displayName?: string;
    },
  ): ValidationResult {
    const errors: string[] = [];
    const lowerPassword = password.toLowerCase();

    // 检查用户名
    if (userInfo.username && lowerPassword.includes(userInfo.username.toLowerCase())) {
      errors.push('密码不能包含用户名');
    }

    // 检查邮箱前缀
    if (userInfo.email) {
      const emailPrefix = userInfo.email.split('@')[0].toLowerCase();
      if (emailPrefix && lowerPassword.includes(emailPrefix)) {
        errors.push('密码不能包含邮箱地址');
      }
    }

    // 检查显示名称
    if (userInfo.displayName && lowerPassword.includes(userInfo.displayName.toLowerCase())) {
      errors.push('密码不能包含显示名称');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * API Key 验证器
 */
export class ApiKeyValidator {
  private static readonly MIN_LENGTH = 32;
  private static readonly MAX_LENGTH = 128;

  /**
   * 验证 API Key 格式
   */
  static validate(apiKey: string): ValidationResult {
    const errors: string[] = [];

    if (!apiKey || apiKey.trim().length === 0) {
      errors.push('API Key 不能为空');
      return { isValid: false, errors };
    }

    if (apiKey.length < this.MIN_LENGTH) {
      errors.push(`API Key 长度至少为 ${this.MIN_LENGTH} 个字符`);
    }

    if (apiKey.length > this.MAX_LENGTH) {
      errors.push(`API Key 长度不能超过 ${this.MAX_LENGTH} 个字符`);
    }

    // 检查是否包含不安全字符
    if (!/^[a-zA-Z0-9_-]+$/.test(apiKey)) {
      errors.push('API Key 只能包含字母、数字、下划线和连字符');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 验证 API Key 名称
   */
  static validateName(name: string): ValidationResult {
    const errors: string[] = [];

    if (!name || name.trim().length === 0) {
      errors.push('API Key 名称不能为空');
      return { isValid: false, errors };
    }

    if (name.length > 100) {
      errors.push('API Key 名称长度不能超过 100 个字符');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * 令牌验证器
 */
export class TokenValidator {
  /**
   * 验证令牌是否过期
   */
  static isExpired(expiresAt: number): boolean {
    return Date.now() >= expiresAt;
  }

  /**
   * 验证令牌有效期
   */
  static validateExpiry(expiresAt: number): ValidationResult {
    const errors: string[] = [];

    if (this.isExpired(expiresAt)) {
      errors.push('令牌已过期');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 获取令牌剩余时间（秒）
   */
  static getRemainingTime(expiresAt: number): number {
    const remaining = Math.floor((expiresAt - Date.now()) / 1000);
    return Math.max(0, remaining);
  }

  /**
   * 检查令牌是否即将过期
   */
  static isExpiringSoon(expiresAt: number, thresholdSeconds: number = 300): boolean {
    const remaining = this.getRemainingTime(expiresAt);
    return remaining > 0 && remaining < thresholdSeconds;
  }
}

/**
 * 两步验证码验证器
 */
export class TwoFactorCodeValidator {
  private static readonly CODE_LENGTH = 6;

  /**
   * 验证两步验证码格式（TOTP）
   */
  static validateTOTP(code: string): ValidationResult {
    const errors: string[] = [];

    if (!code || code.trim().length === 0) {
      errors.push('验证码不能为空');
      return { isValid: false, errors };
    }

    if (!/^\d+$/.test(code)) {
      errors.push('验证码只能包含数字');
    }

    if (code.length !== this.CODE_LENGTH) {
      errors.push(`验证码必须是 ${this.CODE_LENGTH} 位数字`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 验证备份码格式
   */
  static validateBackupCode(code: string): ValidationResult {
    const errors: string[] = [];

    if (!code || code.trim().length === 0) {
      errors.push('备份码不能为空');
      return { isValid: false, errors };
    }

    // 备份码通常是 8-16 位字母数字组合
    if (!/^[a-zA-Z0-9]{8,16}$/.test(code)) {
      errors.push('备份码格式不正确');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * 设备指纹验证器
 */
export class DeviceValidator {
  /**
   * 验证设备 ID
   */
  static validateDeviceId(deviceId: string): ValidationResult {
    const errors: string[] = [];

    if (!deviceId || deviceId.trim().length === 0) {
      errors.push('设备 ID 不能为空');
      return { isValid: false, errors };
    }

    if (deviceId.length > 255) {
      errors.push('设备 ID 长度不能超过 255 个字符');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 验证 IP 地址格式
   */
  static validateIPAddress(ip: string): ValidationResult {
    const errors: string[] = [];

    if (!ip || ip.trim().length === 0) {
      errors.push('IP 地址不能为空');
      return { isValid: false, errors };
    }

    // 简单的 IPv4 验证
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    // 简单的 IPv6 验证
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

    if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
      errors.push('IP 地址格式不正确');
    }

    // 验证 IPv4 每个部分不超过 255
    if (ipv4Regex.test(ip)) {
      const parts = ip.split('.');
      for (const part of parts) {
        const num = parseInt(part, 10);
        if (num > 255) {
          errors.push('IPv4 地址的每个部分不能超过 255');
          break;
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
