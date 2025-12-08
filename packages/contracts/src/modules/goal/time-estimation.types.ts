/**
 * 任务时间估算类型定义
 * @module @dailyuse/contracts/goal/time-estimation
 */

/**
 * 时间估算请求
 */
export interface TimeEstimationRequest {
  taskId?: string;
  taskTitle: string;
  taskDescription: string;
  complexity?: 'simple' | 'medium' | 'complex';
  dependencies?: string[];
  historicalData?: {
    averageMinutes?: number;
    userSpeedFactor?: number;
    estimationAccuracy?: number;
  };
}

/**
 * 时间估算结果
 */
export interface TimeEstimate {
  taskId?: string;
  taskTitle: string;
  estimatedMinutes: number;
  confidenceScore: number; // 0-1
  reasoning: string;
  breakdown?: {
    analysis?: number;
    implementation?: number;
    testing?: number;
    buffer?: number;
  };
  adjustedMinutes?: number; // 基于历史数据调整后的时间
  adjustmentReason?: string;
}

/**
 * 批量时间估算结果
 */
export interface BatchTimeEstimationResult {
  estimates: TimeEstimate[];
  totalMinutes: number;
  averageConfidence: number;
  generatedAt: Date;
}

/**
 * 时间估算历史记录
 */
export interface TimeEstimationHistory {
  taskId: string;
  taskTitle: string;
  estimatedMinutes: number;
  actualMinutes?: number;
  estimationError?: number; // 百分比，负数表示高估
  complexity: 'simple' | 'medium' | 'complex';
  confidenceScore: number;
  createdAt: Date;
  completedAt?: Date;
}

/**
 * 用户时间估算模式
 */
export interface UserEstimationPattern {
  userId: string;
  totalEstimations: number;
  averageError: number; // 百分比
  completionSpeedFactor: number; // < 1 表示比平均快
  complexityBias: {
    simple: number;
    medium: number;
    complex: number;
  };
  accuracyTrend: 'improving' | 'declining' | 'stable';
  lastUpdated: Date;
}

/**
 * 时间估算精准性分析
 */
export interface EstimationAccuracyAnalysis {
  taskId: string;
  estimatedMinutes: number;
  actualMinutes: number;
  error: number; // 百分比
  possibleCauses: string[];
  recommendations: string[];
  userPattern?: string; // 用户的典型模式描述
}
