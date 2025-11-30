/**
 * Status Rule Engine Service (STORY-021)
 * 状态规则引擎服务
 */

import type {
  StatusRule,
  RuleCondition,
  RuleExecutionResult,
  RuleMetric,
  RuleOperator,
} from '@dailyuse/contracts/goal';
import type { GoalStatus } from '@dailyuse/contracts/goal';
import {
  BUILT_IN_RULES,
  sortRulesByPriority,
  getEnabledRules,
} from '../rules/BuiltInRules';

/**
 * 目标数据接口（用于规则评估）
 */
export interface GoalData {
  uuid: string;
  status: GoalStatus;
  keyResults: Array<{
    uuid: string;
    progress: number;
    weight: number;
  }>;
  deadline?: number | null;
  createdAt: number;
  updatedAt: number;
}

/**
 * 状态规则引擎服务
 */
export class StatusRuleEngine {
  private rules: StatusRule[];

  constructor(customRules: StatusRule[] = []) {
    // 合并内置规则和自定义规则
    this.rules = [...BUILT_IN_RULES, ...customRules];
  }

  /**
   * 评估单个条件
   */
  private evaluateCondition(condition: RuleCondition, goal: GoalData): boolean {
    const value = this.extractMetricValue(condition.metric, condition.scope || 'all', goal);

    if (value === null) {
      return false;
    }

    return this.compareValues(value, condition.operator, condition.value);
  }

  /**
   * 提取指标值
   */
  private extractMetricValue(metric: RuleMetric, scope: string, goal: GoalData): number | null {
    switch (metric) {
      case 'progress':
        return this.getProgressValue(scope, goal);

      case 'weight':
        return this.getWeightValue(scope, goal);

      case 'kr_count':
        return goal.keyResults.length;

      case 'deadline':
        if (!goal.deadline) return null;
        const daysRemaining = Math.floor((goal.deadline - Date.now()) / (1000 * 60 * 60 * 24));
        return daysRemaining;

      default:
        return null;
    }
  }

  /**
   * 获取进度值
   */
  private getProgressValue(scope: string, goal: GoalData): number | null {
    if (scope === 'all') {
      // 所有 KR 的平均进度
      if (goal.keyResults.length === 0) return 0;
      const totalProgress = goal.keyResults.reduce((sum, kr) => sum + kr.progress, 0);
      return totalProgress / goal.keyResults.length;
    } else if (scope === 'any') {
      // 任意 KR 的最小进度
      if (goal.keyResults.length === 0) return 0;
      return Math.min(...goal.keyResults.map((kr) => kr.progress));
    } else {
      // 特定 KR 的进度
      const kr = goal.keyResults.find((k) => k.uuid === scope);
      return kr ? kr.progress : null;
    }
  }

  /**
   * 获取权重值
   */
  private getWeightValue(scope: string, goal: GoalData): number | null {
    if (scope === 'all') {
      // 所有 KR 的权重总和
      return goal.keyResults.reduce((sum, kr) => sum + kr.weight, 0);
    } else if (scope === 'any') {
      // 任意 KR 的权重（返回最小值）
      if (goal.keyResults.length === 0) return 0;
      return Math.min(...goal.keyResults.map((kr) => kr.weight));
    } else {
      // 特定 KR 的权重
      const kr = goal.keyResults.find((k) => k.uuid === scope);
      return kr ? kr.weight : null;
    }
  }

  /**
   * 比较值
   */
  private compareValues(actual: number, operator: RuleOperator, expected: number): boolean {
    switch (operator) {
      case '>':
        return actual > expected;
      case '<':
        return actual < expected;
      case '>=':
        return actual >= expected;
      case '<=':
        return actual <= expected;
      case '=':
        return Math.abs(actual - expected) < 0.01; // 浮点数比较
      case '!=':
        return Math.abs(actual - expected) >= 0.01;
      default:
        return false;
    }
  }

  /**
   * 评估单个规则
   */
  private evaluateRule(rule: StatusRule, goal: GoalData): RuleExecutionResult {
    if (!rule.enabled) {
      return {
        ruleId: rule.id,
        matched: false,
        executedAt: Date.now(),
      };
    }

    const conditionResults = rule.conditions.map((condition: RuleCondition) => ({
      condition,
      matched: this.evaluateCondition(condition, goal),
    }));

    let matched: boolean;
    if (rule.conditionType === 'all') {
      matched = conditionResults.every(
        (r: { condition: RuleCondition; matched: boolean }) => r.matched,
      );
    } else {
      matched = conditionResults.some(
        (r: { condition: RuleCondition; matched: boolean }) => r.matched,
      );
    }

    return {
      ruleId: rule.id,
      matched,
      action: matched ? rule.action : undefined,
      matchedConditions: matched
        ? conditionResults
            .filter((r: { condition: RuleCondition; matched: boolean }) => r.matched)
            .map(
              (r: { condition: RuleCondition; matched: boolean }) =>
                `${r.condition.metric} ${r.condition.operator} ${r.condition.value}`,
            )
        : undefined,
      executedAt: Date.now(),
    };
  }

  /**
   * 评估所有规则并返回最高优先级匹配的规则
   */
  public evaluate(goal: GoalData): RuleExecutionResult | null {
    const enabledRules = getEnabledRules(this.rules);
    const sortedRules = sortRulesByPriority(enabledRules);

    for (const rule of sortedRules) {
      const result = this.evaluateRule(rule, goal);
      if (result.matched) {
        return result;
      }
    }

    return null;
  }

  /**
   * 评估所有规则并返回所有匹配结果
   */
  public evaluateAll(goal: GoalData): RuleExecutionResult[] {
    const enabledRules = getEnabledRules(this.rules);
    return enabledRules
      .map((rule) => this.evaluateRule(rule, goal))
      .filter((result) => result.matched);
  }

  /**
   * 添加自定义规则
   */
  public addRule(rule: StatusRule): void {
    this.rules.push(rule);
  }

  /**
   * 移除规则
   */
  public removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex((r) => r.id === ruleId);
    if (index !== -1) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 更新规则
   */
  public updateRule(ruleId: string, updates: Partial<StatusRule>): boolean {
    const index = this.rules.findIndex((r) => r.id === ruleId);
    if (index !== -1) {
      this.rules[index] = {
        ...this.rules[index],
        ...updates,
        updatedAt: Date.now(),
      };
      return true;
    }
    return false;
  }

  /**
   * 获取所有规则
   */
  public getRules(): StatusRule[] {
    return [...this.rules];
  }

  /**
   * 清除所有自定义规则（保留内置规则）
   */
  public resetToBuiltIn(): void {
    this.rules = [...BUILT_IN_RULES];
  }
}

/**
 * 导出单例实例
 */
export const statusRuleEngine = new StatusRuleEngine();
