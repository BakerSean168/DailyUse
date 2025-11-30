/**
 * ValidationRule 值对象实现
 * 实现 ValidationRuleServer 接口
 */

import type {
  ValidationRuleClientDTO,
  ValidationRuleServer,
  ValidationRuleServerDTO,
} from '@dailyuse/contracts/setting';

/**
 * ValidationRule 值对象
 * 不可变的验证规则
 */
export class ValidationRule implements ValidationRuleServer {
  public readonly required: boolean;
  public readonly min?: number | null;
  public readonly max?: number | null;
  public readonly pattern?: string | null;
  public readonly enum?: unknown[] | null;
  public readonly custom?: string | null;

  private constructor(params: {
    required: boolean;
    min?: number | null;
    max?: number | null;
    pattern?: string | null;
    enum?: unknown[] | null;
    custom?: string | null;
  }) {
    this.required = params.required;
    this.min = params.min ?? null;
    this.max = params.max ?? null;
    this.pattern = params.pattern ?? null;
    this.enum = params.enum ?? null;
    this.custom = params.custom ?? null;
  }

  /**
   * 创建新的 ValidationRule
   */
  public static create(params: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    enum?: unknown[];
    custom?: string;
  }): ValidationRule {
    // 验证 min/max 范围
    if (params.min !== undefined && params.max !== undefined && params.min > params.max) {
      throw new Error('Min value cannot be greater than max value');
    }

    return new ValidationRule({
      required: params.required ?? false,
      min: params.min,
      max: params.max,
      pattern: params.pattern,
      enum: params.enum,
      custom: params.custom,
    });
  }

  /**
   * 从 ServerDTO 创建
   */
  public static fromServerDTO(dto: ValidationRuleServerDTO): ValidationRule {
    return new ValidationRule(dto);
  }

  /**
   * 验证值
   */
  public validate(value: unknown): { valid: boolean; error?: string } {
    // 必填验证
    if (this.required && (value === null || value === undefined || value === '')) {
      return { valid: false, error: 'Value is required' };
    }

    // 如果值为空且非必填，跳过其他验证
    if (value === null || value === undefined || value === '') {
      return { valid: true };
    }

    // 数值范围验证
    if (typeof value === 'number') {
      if (this.min !== null && this.min !== undefined && value < this.min) {
        return { valid: false, error: `Value must be at least ${this.min}` };
      }
      if (this.max !== null && this.max !== undefined && value > this.max) {
        return { valid: false, error: `Value must be at most ${this.max}` };
      }
    }

    // 字符串长度验证
    if (typeof value === 'string') {
      if (this.min !== null && this.min !== undefined && value.length < this.min) {
        return { valid: false, error: `Length must be at least ${this.min}` };
      }
      if (this.max !== null && this.max !== undefined && value.length > this.max) {
        return { valid: false, error: `Length must be at most ${this.max}` };
      }

      // 正则表达式验证
      if (this.pattern) {
        const regex = new RegExp(this.pattern);
        if (!regex.test(value)) {
          return { valid: false, error: 'Value does not match required pattern' };
        }
      }
    }

    // 枚举值验证
    if (this.enum && this.enum.length > 0) {
      if (!this.enum.includes(value)) {
        return { valid: false, error: 'Value is not in allowed values' };
      }
    }

    return { valid: true };
  }

  /**
   * 检查是否有最小值约束
   */
  public hasMinConstraint(): boolean {
    return this.min !== null && this.min !== undefined;
  }

  /**
   * 检查是否有最大值约束
   */
  public hasMaxConstraint(): boolean {
    return this.max !== null && this.max !== undefined;
  }

  /**
   * 转换为 ServerDTO
   */
  public toServerDTO(): ValidationRuleServerDTO {
    return {
      required: this.required,
      min: this.min,
      max: this.max,
      pattern: this.pattern,
      enum: this.enum,
      custom: this.custom,
    };
  }

  public toClientDTO(): ValidationRuleClientDTO {
    return {
      required: this.required,
      min: this.min,
      max: this.max,
      pattern: this.pattern,
      enum: this.enum,
      custom: this.custom,
    };
  }
}
