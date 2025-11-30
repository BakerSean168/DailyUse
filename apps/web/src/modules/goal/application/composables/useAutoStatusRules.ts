/**
 * Auto Status Rules Composable (STORY-021)
 * 自动状态规则组合式函数
 */

import { ref } from 'vue';
import { statusRuleEngine, type GoalData } from '../services/StatusRuleEngine';
import type { RuleExecutionResult, GoalStatus } from '@dailyuse/contracts/goal';

/**
 * 自动状态规则配置
 */
export interface AutoRuleConfig {
  enabled: boolean;
  allowManualOverride: boolean;
  notifyOnChange: boolean;
}

/**
 * 规则执行历史记录
 */
export interface RuleExecutionHistory {
  goalUuid: string;
  executedAt: number;
  ruleId: string;
  previousStatus: string;
  newStatus: string;
  message?: string;
}

/**
 * 规则建议结果
 */
export interface RuleSuggestion {
  goalUuid: string;
  currentStatus: GoalStatus;
  suggestedStatus?: GoalStatus;
  notify: boolean;
  message?: string;
  executionResult: RuleExecutionResult | null;
}

const config = ref<AutoRuleConfig>({
  enabled: true,
  allowManualOverride: true,
  notifyOnChange: true,
});

const executionHistory = ref<RuleExecutionHistory[]>([]);

/**
 * 自动状态规则管理
 */
export function useAutoStatusRules() {
  /**
   * 将任意 Goal 对象转换为 GoalData
   */
  const convertToGoalData = (goal: any): GoalData => {
    // 提取 progress 值（处理可能的嵌套结构）
    const getProgress = (kr: any): number => {
      if (typeof kr.progress === 'number') {
        return kr.progress;
      }
      if (kr.progress && typeof kr.progress.current === 'number') {
        return kr.progress.current;
      }
      return 0;
    };

    return {
      uuid: goal.uuid,
      status: goal.status,
      keyResults: (goal.keyResults || []).map((kr: any) => ({
        uuid: kr.uuid,
        progress: getProgress(kr),
        weight: kr.weight || 0,
      })),
      deadline: goal.deadline || goal.timeFrame?.endDate || null,
      createdAt: goal.createdAt || Date.now(),
      updatedAt: goal.updatedAt || Date.now(),
    };
  };

  /**
   * 评估规则并返回建议
   */
  const evaluateGoal = (goal: any): RuleSuggestion => {
    if (!config.value.enabled) {
      return {
        goalUuid: goal.uuid,
        currentStatus: goal.status,
        notify: false,
        executionResult: null,
      };
    }

    const goalData = convertToGoalData(goal);
    const result = statusRuleEngine.evaluate(goalData);

    if (!result || !result.matched || !result.action) {
      return {
        goalUuid: goal.uuid,
        currentStatus: goal.status,
        notify: false,
        executionResult: result,
      };
    }

    return {
      goalUuid: goal.uuid,
      currentStatus: goal.status,
      suggestedStatus: result.action.status,
      notify: result.action.notify,
      message: result.action.message,
      executionResult: result,
    };
  };

  /**
   * 记录规则执行历史
   */
  const recordHistory = (
    goalUuid: string,
    ruleId: string,
    previousStatus: string,
    newStatus: string,
    message?: string,
  ) => {
    executionHistory.value.push({
      goalUuid,
      executedAt: Date.now(),
      ruleId,
      previousStatus,
      newStatus,
      message,
    });

    // 保持历史记录不超过 100 条
    if (executionHistory.value.length > 100) {
      executionHistory.value = executionHistory.value.slice(-100);
    }
  };

  /**
   * 更新配置
   */
  const updateConfig = (newConfig: Partial<AutoRuleConfig>) => {
    config.value = { ...config.value, ...newConfig };
  };

  /**
   * 获取目标的执行历史
   */
  const getGoalHistory = (goalUuid: string): RuleExecutionHistory[] => {
    return executionHistory.value.filter((h) => h.goalUuid === goalUuid);
  };

  /**
   * 清除历史记录
   */
  const clearHistory = () => {
    executionHistory.value = [];
  };

  /**
   * 获取规则引擎实例（用于规则管理）
   */
  const getRuleEngine = () => {
    return statusRuleEngine;
  };

  return {
    // State
    config,
    executionHistory,

    // Methods
    evaluateGoal,
    recordHistory,
    updateConfig,
    getGoalHistory,
    clearHistory,
    getRuleEngine,
    convertToGoalData,
  };
}
