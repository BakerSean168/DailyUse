/**
 * AI Generation Validation Service
 * 纯领域验证服务：负责验证 AI 输出的业务规则。
 * 不处理基础设施、配额、对话或适配器调用。
 */

import { AIValidationError } from '../errors/AIErrors';

export class AIGenerationValidationService {
  constructor() {}

  /**
   * 验证关键结果输出
   */
  validateKeyResultsOutput(keyResults: any[]): void {
    const errors: string[] = [];
    if (!keyResults || !Array.isArray(keyResults)) {
      errors.push('Expected array of key results');
      throw new AIValidationError('Invalid AI output structure', errors);
    }
    if (keyResults.length < 3 || keyResults.length > 5) {
      errors.push(`Expected 3-5 key results, got ${keyResults.length}`);
    }
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
   */
  validateTasksOutput(tasks: any[]): void {
    const errors: string[] = [];
    if (!tasks || !Array.isArray(tasks)) {
      errors.push('Expected array of tasks');
      throw new AIValidationError('Invalid AI output structure', errors);
    }
    if (tasks.length < 5 || tasks.length > 10) {
      errors.push(`Expected 5-10 tasks, got ${tasks.length}`);
    }
    tasks.forEach((task: any, index: number) => {
      if (!task.title || task.title.trim().length === 0) {
        errors.push(`Task[${index}] missing title`);
      }
      if (task.title && task.title.length < 5) {
        errors.push(`Task[${index}] title too short (min 5 chars)`);
      }
      if (task.title && !/^[A-Z][a-z]+\s/.test(task.title)) {
        errors.push(`Task[${index}] title should start with a capitalized verb`);
      }
      if (task.description && task.description.length < 50) {
        errors.push(`Task[${index}] description too short (min 50 chars)`);
      }
      if (task.estimatedHours === undefined || task.estimatedHours === null) {
        errors.push(`Task[${index}] missing estimatedHours`);
      } else if (task.estimatedHours < 1 || task.estimatedHours > 40) {
        errors.push(`Task[${index}] estimatedHours must be 1-40, got ${task.estimatedHours}`);
      }
      if (!task.priority) {
        errors.push(`Task[${index}] missing priority`);
      } else if (!['HIGH', 'MEDIUM', 'LOW'].includes(task.priority)) {
        errors.push(`Task[${index}] invalid priority: ${task.priority}`);
      }
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

  /**
   * 验证摘要输出 (Story 4.1)
   */
  validateSummaryOutput(summary: any, includeActions = true): void {
    const errors: string[] = [];
    if (!summary || typeof summary !== 'object') {
      errors.push('Summary must be an object');
      throw new AIValidationError('Invalid summary structure', errors);
    }
    const { core, keyPoints, actionItems } = summary;
    if (!core || typeof core !== 'string') {
      errors.push('core missing or not string');
    } else {
      const wordCount = core.trim().split(/\s+/).length;
      if (wordCount < 50 || wordCount > 150) {
        errors.push(`core word count must be 50-150, got ${wordCount}`);
      }
    }
    if (!Array.isArray(keyPoints)) {
      errors.push('keyPoints must be array');
    } else {
      if (keyPoints.length < 3 || keyPoints.length > 5) {
        errors.push(`keyPoints count must be 3-5, got ${keyPoints.length}`);
      }
      keyPoints.forEach((kp: any, idx: number) => {
        if (typeof kp !== 'string') {
          errors.push(`keyPoints[${idx}] not string`);
          return;
        }
        const words = kp.trim().split(/\s+/).length;
        if (words < 15 || words > 30) {
          errors.push(`keyPoints[${idx}] word count must be 15-30, got ${words}`);
        }
      });
    }
    if (includeActions) {
      if (actionItems !== undefined) {
        if (!Array.isArray(actionItems)) {
          errors.push('actionItems must be array');
        } else if (actionItems.length > 3) {
          errors.push(`actionItems max 3, got ${actionItems.length}`);
        } else {
          actionItems.forEach((ai: any, idx: number) => {
            if (typeof ai !== 'string') {
              errors.push(`actionItems[${idx}] not string`);
            }
          });
        }
      }
    } else if (actionItems && Array.isArray(actionItems) && actionItems.length > 0) {
      errors.push('actionItems should be omitted when includeActions=false');
    }
    if (errors.length > 0) {
      throw new AIValidationError('Summary validation failed', errors);
    }
  }
}
