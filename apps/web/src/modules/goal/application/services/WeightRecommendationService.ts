import type { KeyResult } from '@dailyuse/domain-client';

/**
 * 权重分配策略
 */
export interface WeightStrategy {
  name: 'balanced' | 'focused' | 'stepped';
  label: string;
  description: string;
  weights: number[];
  reasoning: string;
  confidence: number; // 0-100，推荐置信度
}

/**
 * AI 权重推荐服务（基于规则引擎）
 *
 * 职责：
 * - 分析 KeyResult 标题关键词
 * - 生成 3 种权重分配策略
 * - 提供推荐理由
 */
export class WeightRecommendationService {
  /**
   * 高优先级关键词（权重 +20）
   */
  private readonly HIGH_PRIORITY_KEYWORDS = [
    'critical',
    'urgent',
    'important',
    'key',
    'core',
    'essential',
    'critical',
    'vital',
    'primary',
    'main',
    '关键',
    '核心',
    '重要',
    '紧急',
    '主要',
    '首要',
  ];

  /**
   * 业务价值关键词（权重 +15）
   */
  private readonly BUSINESS_VALUE_KEYWORDS = [
    'revenue',
    'sales',
    'customer',
    'user',
    'profit',
    'growth',
    'market',
    'conversion',
    'retention',
    '收入',
    '营收',
    '销售',
    '客户',
    '用户',
    '增长',
    '市场',
    '转化',
  ];

  /**
   * 效率提升关键词（权重 +10）
   */
  private readonly EFFICIENCY_KEYWORDS = [
    'reduce',
    'improve',
    'optimize',
    'automate',
    'streamline',
    'efficiency',
    'performance',
    'speed',
    '减少',
    '改进',
    '优化',
    '自动化',
    '提升',
    '效率',
    '性能',
  ];

  /**
   * 创新探索关键词（权重 +5）
   */
  private readonly INNOVATION_KEYWORDS = [
    'new',
    'innovation',
    'experiment',
    'pilot',
    'explore',
    'research',
    'prototype',
    'poc',
    '新',
    '创新',
    '试验',
    '探索',
    '研究',
    '原型',
  ];

  /**
   * 推荐权重分配策略
   */
  recommendWeights(keyResults: KeyResult[]): WeightStrategy[] {
    if (!keyResults || keyResults.length === 0) {
      return [];
    }

    // 计算每个 KR 的优先级分数
    const priorities = this.calculatePriorities(keyResults);

    return [
      this.balancedStrategy(keyResults.length),
      this.focusedStrategy(keyResults, priorities),
      this.steppedStrategy(keyResults, priorities),
    ];
  }

  /**
   * 计算 KeyResult 优先级分数（基于关键词分析）
   */
  private calculatePriorities(keyResults: KeyResult[]): number[] {
    return keyResults.map((kr) => {
      let score = 50; // 基础分数
      const title = kr.title.toLowerCase();

      // 高优先级关键词
      if (this.containsKeywords(title, this.HIGH_PRIORITY_KEYWORDS)) {
        score += 20;
      }

      // 业务价值关键词
      if (this.containsKeywords(title, this.BUSINESS_VALUE_KEYWORDS)) {
        score += 15;
      }

      // 效率提升关键词
      if (this.containsKeywords(title, this.EFFICIENCY_KEYWORDS)) {
        score += 10;
      }

      // 创新探索关键词
      if (this.containsKeywords(title, this.INNOVATION_KEYWORDS)) {
        score += 5;
      }

      return Math.min(100, score);
    });
  }

  /**
   * 检查文本是否包含关键词
   */
  private containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
  }

  /**
   * 策略 1: 均衡分配
   * 适用场景：所有 KR 同等重要
   * 
   * **新策略**: 生成 1-10 范围的权重（而不是 0-100）
   */
  private balancedStrategy(count: number): WeightStrategy {
    // 使用 1-10 的权重范围
    const baseWeight = count <= 3 ? 3 : 2;
    const weights = Array(count).fill(baseWeight).map(() => baseWeight);

    return {
      name: 'balanced',
      label: '均衡策略',
      description: '所有 KeyResult 权重相等，适合目标优先级相近的场景',
      weights,
      reasoning: `每个 KR 分配权重 ${baseWeight}/10，确保所有目标均衡推进`,
      confidence: 80,
    };
  }

  /**
   * 策略 2: 聚焦策略
   * 适用场景：根据关键词识别核心 KR
   * 
   * **新策略**: 生成 1-10 范围的权重（而不是 0-100）
   */
  private focusedStrategy(keyResults: KeyResult[], priorities: number[]): WeightStrategy {
    const count = keyResults.length;
    
    // 将优先级分数 (0-100) 映射到权重范围 (1-10)
    const weights = priorities.map((p) => {
      // 映射公式：priority 越高，权重越大
      const weight = Math.round((p / 100) * 9) + 1; // 结果范围 1-10
      return Math.max(1, Math.min(10, weight)); // 确保在 1-10 范围内
    });

    // 找出最高权重的 KR 索引
    const maxWeightIndex = weights.indexOf(Math.max(...weights));
    const topKRTitle = keyResults[maxWeightIndex]?.title || 'KR';

    return {
      name: 'focused',
      label: '聚焦策略',
      description: '根据关键词分析，重点关注高优先级 KeyResult',
      weights,
      reasoning: `基于标题关键词分析，"${topKRTitle.slice(0, 30)}${topKRTitle.length > 30 ? '...' : ''}" 识别为核心 KR，权重最高`,
      confidence: this.calculateConfidence(priorities),
    };
  }

  /**
   * 策略 3: 阶梯策略
   * 适用场景：明确的优先级顺序
   * 
   * **新策略**: 生成 1-10 范围的权重（而不是 0-100）
   */
  private steppedStrategy(keyResults: KeyResult[], priorities: number[]): WeightStrategy {
    const count = keyResults.length;

    // 创建优先级排序映射
    const priorityIndexes = priorities
      .map((p, i) => ({ priority: p, index: i }))
      .sort((a, b) => b.priority - a.priority);

    // 使用 1-10 范围生成阶梯权重
    // 高优先级 KR 权重更高
    const tempWeights: number[] = [];
    if (count === 1) {
      tempWeights.push(5); // 单个 KR 权重为 5
    } else if (count === 2) {
      tempWeights.push(7, 3); // 7 和 3
    } else if (count === 3) {
      tempWeights.push(7, 4, 1); // 7、4、1
    } else {
      // 对于更多的 KR，使用更均衡的分布
      for (let i = 0; i < count; i++) {
        const weight = Math.max(1, 10 - i * 2);
        tempWeights.push(weight);
      }
    }

    // 映射回原始顺序
    const weights = new Array(count).fill(0);
    priorityIndexes.forEach((item, i) => {
      weights[item.index] = tempWeights[i];
    });

    // 找出排名
    const topRank = priorityIndexes.findIndex((item) => item.index === priorityIndexes[0].index);

    return {
      name: 'stepped',
      label: '阶梯策略',
      description: '按优先级梯度分配权重，适合明确优先级顺序的场景',
      weights,
      reasoning: `按优先级创建阶梯式分布，最高优先级 KR 获得权重 ${weights[priorityIndexes[0].index]}/10`,
      confidence: this.calculateConfidence(priorities),
    };
  }

  /**
   * 计算推荐置信度
   * 基于优先级分数的方差：方差越大，置信度越高
   */
  private calculateConfidence(priorities: number[]): number {
    if (priorities.length <= 1) return 50;

    const mean = priorities.reduce((a, b) => a + b, 0) / priorities.length;
    const variance =
      priorities.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / priorities.length;

    // 方差映射到置信度 (0-100)
    // 方差 0 → 低置信度 50
    // 方差 400+ → 高置信度 95
    const confidence = Math.min(95, 50 + (variance / 400) * 45);

    return Math.round(confidence);
  }

  /**
   * 验证权重
   * 
   * **新规则**: 
   * - 权重范围: 1-10（而不是 0-100）
   * - 无需权重总和为 100%
   * - 权重占比由总权重自动计算
   */
  validateWeights(weights: number[]): { valid: boolean; error?: string; info?: string } {
    // 检查每个权重是否在 1-10 之间
    for (let i = 0; i < weights.length; i++) {
      const w = weights[i];
      if (w < 1 || w > 10) {
        return {
          valid: false,
          error: `第 ${i + 1} 个权重必须在 1-10 之间，当前值：${w}`,
        };
      }
      if (!Number.isInteger(w)) {
        return {
          valid: false,
          error: `第 ${i + 1} 个权重必须是整数，当前值：${w}`,
        };
      }
    }

    // 计算总权重和占比
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const weightDistribution = weights
      .map((w) => ((w / totalWeight) * 100).toFixed(2))
      .join('%, ')
      .concat('%');

    return { 
      valid: true,
      info: `总权重: ${totalWeight}, 占比: ${weightDistribution}`
    };
  }

  /**
   * 应用策略到 KeyResult 数组（直接修改对象，不返回新数组）
   * 注意：此方法会直接修改传入的 keyResults 对象
   */
  applyStrategy(keyResults: any[], strategy: WeightStrategy): void {
    keyResults.forEach((kr, index) => {
      if (strategy.weights[index] !== undefined) {
        kr.weight = strategy.weights[index];
      }
    });
  }
}

// 导出单例
export const weightRecommendationService = new WeightRecommendationService();
