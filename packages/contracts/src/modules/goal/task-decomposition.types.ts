/**
 * 任务分解相关类型定义
 * @module @dailyuse/contracts/goal/task-decomposition
 */

/**
 * 分解的任务项
 */
export interface DecomposedTask {
  title: string;
  description: string;
  estimatedMinutes: number;
  complexity: 'simple' | 'medium' | 'complex';
  dependencies: string[];  // 依赖的任务 title
  suggestedOrder: number;
}

/**
 * 任务分解时间线信息
 */
export interface DecompositionTimeline {
  totalEstimatedHours: number;
  suggestedStartDate?: Date;
  suggestedEndDate?: Date;
  estimatedDays?: number;
}

/**
 * 风险项
 */
export interface RiskItem {
  description: string;
  mitigation: string;
}

/**
 * AI分解结果
 */
export interface DecompositionResult {
  tasks: DecomposedTask[];
  timeline: DecompositionTimeline;
  risks: RiskItem[];
  confidence?: number;  // 0-1 置信度
}

/**
 * 分解请求参数
 */
export interface DecompositionRequest {
  goalId: string;
  goalTitle: string;
  goalDescription: string;
  goalDeadline?: Date;
  existingTasks?: Array<{ title: string; id: string }>;  // 避免重复
  userContext?: {
    workHoursPerDay?: number;
    skillLevel?: string;
    previousSimilarGoals?: number;
  };
}

/**
 * 分解选项
 */
export interface DecompositionOptions {
  provider?: 'openai' | 'anthropic' | 'local';
  useCache?: boolean;
  maxRetries?: number;
  timeout?: number;
}
