/**
 * Built-in Status Rules (STORY-021)
 * 内置状态更新规则
 */

import { GoalStatus } from '@dailyuse/contracts';
import type {
  StatusRule,
  RuleConditionType,
  RuleMetric,
  RuleOperator,
} from '../../../../../../../packages/contracts/src/modules/goal/rules/StatusRule';

/**
 * 内置规则集
 */
export const BUILT_IN_RULES: StatusRule[] = [
  // 规则1: 所有 KR 进度 >= 80% → 进行中 (良好)
  {
    id: 'rule-on-track',
    name: '进度良好',
    description: '当所有关键结果进度都达到 80% 以上时，标记为进行中',
    enabled: true,
    priority: 10,
    conditionType: 'all',
    conditions: [
      {
        metric: 'progress',
        operator: '>=',
        value: 80,
        scope: 'all',
      },
    ],
    action: {
      status: GoalStatus.ACTIVE,
      notify: true,
      message: '🎉 太棒了！所有关键结果进度都达到 80% 以上',
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // 规则2: 任意 KR 进度 < 30% → 需要关注
  {
    id: 'rule-at-risk',
    name: '需要关注',
    description: '当任意关键结果进度低于 30% 时，需要关注',
    enabled: true,
    priority: 20,
    conditionType: 'any',
    conditions: [
      {
        metric: 'progress',
        operator: '<',
        value: 30,
        scope: 'any',
      },
    ],
    action: {
      status: GoalStatus.ACTIVE,
      notify: true,
      message: '⚠️ 注意：有关键结果进度低于 30%',
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // 规则3: 所有 KR 进度 = 100% → 已完成
  {
    id: 'rule-completed',
    name: '自动完成',
    description: '当所有关键结果都达到 100% 时，自动标记为已完成',
    enabled: true,
    priority: 100, // 最高优先级
    conditionType: 'all',
    conditions: [
      {
        metric: 'progress',
        operator: '=',
        value: 100,
        scope: 'all',
      },
    ],
    action: {
      status: GoalStatus.COMPLETED,
      notify: true,
      message: '🎊 恭喜！目标已完成，所有关键结果都达到 100%',
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // 规则4: 权重总和 != 100 → 权重异常警告
  {
    id: 'rule-weight-warning',
    name: '权重异常',
    description: '当关键结果权重总和不等于 100% 时发出警告',
    enabled: true,
    priority: 5,
    conditionType: 'any',
    conditions: [
      {
        metric: 'weight',
        operator: '!=',
        value: 100,
        scope: 'all',
      },
    ],
    action: {
      status: GoalStatus.ACTIVE,
      notify: true,
      message: '⚠️ 权重异常：关键结果权重总和不等于 100%',
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // 规则5: KR 数量 = 0 → 草稿状态
  {
    id: 'rule-draft',
    name: '草稿状态',
    description: '当目标没有关键结果时，保持为草稿状态',
    enabled: true,
    priority: 50,
    conditionType: 'all',
    conditions: [
      {
        metric: 'kr_count',
        operator: '=',
        value: 0,
        scope: 'all',
      },
    ],
    action: {
      status: GoalStatus.DRAFT,
      notify: false,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // 规则6: KR 数量 > 0 且平均进度 > 0 → 进行中
  {
    id: 'rule-in-progress',
    name: '开始执行',
    description: '当目标有关键结果且有进度时，标记为进行中',
    enabled: true,
    priority: 15,
    conditionType: 'all',
    conditions: [
      {
        metric: 'kr_count',
        operator: '>',
        value: 0,
        scope: 'all',
      },
      {
        metric: 'progress',
        operator: '>',
        value: 0,
        scope: 'any',
      },
    ],
    action: {
      status: GoalStatus.ACTIVE,
      notify: false,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

/**
 * 根据优先级排序规则
 */
export function sortRulesByPriority(rules: StatusRule[]): StatusRule[] {
  return [...rules].sort((a, b) => b.priority - a.priority);
}

/**
 * 获取启用的规则
 */
export function getEnabledRules(rules: StatusRule[]): StatusRule[] {
  return rules.filter((rule) => rule.enabled);
}

/**
 * 根据 ID 查找规则
 */
export function findRuleById(rules: StatusRule[], id: string): StatusRule | undefined {
  return rules.find((rule) => rule.id === id);
}

/**
 * 规则模板：用于创建自定义规则
 */
export const RULE_TEMPLATES = {
  /**
   * 创建进度规则
   */
  createProgressRule: (
    threshold: number,
    operator: '>=' | '<=' | '>' | '<',
    scope: 'all' | 'any',
    targetStatus: GoalStatus,
  ): Partial<StatusRule> => ({
    conditionType: scope === 'all' ? 'all' : 'any',
    conditions: [
      {
        metric: 'progress',
        operator,
        value: threshold,
        scope,
      },
    ],
    action: {
      status: targetStatus,
      notify: true,
    },
  }),

  /**
   * 创建权重规则
   */
  createWeightRule: (total: number, operator: '=' | '!=' | '>' | '<'): Partial<StatusRule> => ({
    conditionType: 'all',
    conditions: [
      {
        metric: 'weight',
        operator,
        value: total,
        scope: 'all',
      },
    ],
    action: {
      status: GoalStatus.ACTIVE,
      notify: true,
      message: `权重总和${operator === '=' ? '正确' : '异常'}`,
    },
  }),
};
