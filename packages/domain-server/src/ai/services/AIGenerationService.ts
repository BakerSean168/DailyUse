/**
 * AI Generation Domain Service
 * AI 生成领域服务
 *
 * DDD 领域服务职责：
 * - 验证 AI 生成输出的业务规则
 * - 领域实体的业务逻辑协调
 * - 不涉及基础设施（AI Adapter、配额检查、Prompt 模板等）
 * - 不涉及持久化（由 ApplicationService 负责）
 *
 * 注意：
 * - 不注入 BaseAIAdapter（基础设施细节）
 * - 不注入 QuotaEnforcementService（应用层职责）
 * - 只做纯领域验证和业务规则检查
 */

import { AIValidationError } from '../errors/AIErrors';

/**
 * AI 生成领域服务
 */
export class AIGenerationService {
  constructor() {
    // 领域服务不注入基础设施依赖
  }

  /**
   * 验证关键结果输出
   * 纯业务规则验证，不涉及基础设施
   */
  public validateKeyResultsOutput(keyResults: any[]): void {
    const errors: string[] = [];

    // 检查是否有 keyResults 数组
    if (!keyResults || !Array.isArray(keyResults)) {
      errors.push('Expected array of key results');
      throw new AIValidationError('Invalid AI output structure', errors);
    }

    // 检查数量（3-5个）
    if (keyResults.length < 3 || keyResults.length > 5) {
      errors.push(`Expected 3-5 key results, got ${keyResults.length}`);
    }

    // 检查每个 KR 的必需字段
    keyResults.forEach((kr: any, index: number) => {
      if (!kr.title || kr.title.trim().length === 0) {
        errors.push(`KR[${index}] missing title`);
      }
      if (kr.title && (kr.title.length < 5 || kr.title.length > 100)) {
        errors.push(`KR[${index}] title length must be 5-100 chars, got ${kr.title.length}`);
      }
      if (kr.targetValue === undefined || kr.targetValue === null || kr.targetValue <= 0) {
        errors.push(`KR[${index}] invalid targetValue`);
      }
      if (!kr.valueType) {
        errors.push(`KR[${index}] missing valueType`);
      }
      if (kr.weight === undefined || kr.weight === null || kr.weight < 0 || kr.weight > 100) {
        errors.push(`KR[${index}] invalid weight (must be 0-100)`);
      }
      if (!kr.aggregationMethod) {
        errors.push(`KR[${index}] missing aggregationMethod`);
      }
    });

    // 检查权重总和（应为 100±5）
    const totalWeight = keyResults.reduce((sum: number, kr: any) => sum + (kr.weight || 0), 0);
    if (Math.abs(totalWeight - 100) > 5) {
      errors.push(`Total weight should be 100±5, got ${totalWeight}`);
    }

    if (errors.length > 0) {
      throw new AIValidationError('Key Results validation failed', errors);
    }
  }

  /**
   * 验证任务模板输出
   * 纯业务规则验证
   */
  public validateTasksOutput(tasks: any[]): void {
    const errors: string[] = [];

    // 检查是否有 tasks 数组
    if (!tasks || !Array.isArray(tasks)) {
      errors.push('Expected array of tasks');
      throw new AIValidationError('Invalid AI output structure', errors);
    }

    // 检查数量（5-10个）
    if (tasks.length < 5 || tasks.length > 10) {
      errors.push(`Expected 5-10 tasks, got ${tasks.length}`);
    }

    // 检查每个任务的必需字段
    tasks.forEach((task: any, index: number) => {
      // 检查 title
      if (!task.title || task.title.trim().length === 0) {
        errors.push(`Task[${index}] missing title`);
      }
      if (task.title && task.title.length < 5) {
        errors.push(`Task[${index}] title too short (min 5 chars)`);
      }
      // 检查 title 是否以动词开头
      if (task.title && !/^[A-Z][a-z]+\s/.test(task.title)) {
        errors.push(`Task[${index}] title should start with a capitalized verb`);
      }

      // 检查 description（如果有，至少50字符）
      if (task.description && task.description.length < 50) {
        errors.push(`Task[${index}] description too short (min 50 chars)`);
      }

      // 检查 estimatedHours
      if (task.estimatedHours === undefined || task.estimatedHours === null) {
        errors.push(`Task[${index}] missing estimatedHours`);
      } else if (task.estimatedHours < 1 || task.estimatedHours > 40) {
        errors.push(`Task[${index}] estimatedHours must be 1-40, got ${task.estimatedHours}`);
      }

      // 检查 priority
      if (!task.priority) {
        errors.push(`Task[${index}] missing priority`);
      } else if (!['HIGH', 'MEDIUM', 'LOW'].includes(task.priority)) {
        errors.push(`Task[${index}] invalid priority: ${task.priority}`);
      }

      // 检查 dependencies 数组
      if (!Array.isArray(task.dependencies)) {
        errors.push(`Task[${index}] dependencies must be an array`);
      } else {
        task.dependencies.forEach((dep: any) => {
          if (typeof dep !== 'number' || dep < 0 || dep >= tasks.length) {
            errors.push(`Task[${index}] invalid dependency index: ${dep}`);
          }
        });
      }
    });

    if (errors.length > 0) {
      throw new AIValidationError('Task templates validation failed', errors);
    }
  }
}
