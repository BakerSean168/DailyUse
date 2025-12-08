/**
 * Review Report Service
 * 周期性复盘报告服务 - 生成周报、月报、季报和分析
 *
 * STORY-031: 周期性复盘与报告
 * - 生成周报、月报和季报
 * - 自动识别工作模式和趋势
 * - 提供可操作的改进建议
 * - 支持同比和环比分析
 */

export interface TaskMetrics {
  completed: number;
  total: number;
  completionRate: number; // 0-1
}

export interface WorkMetrics {
  totalHours: number;
  averageDailyHours: number;
  focusHours: number; // Deep focus session hours
  peakProductivityHour?: number; // Most productive hour (0-23)
}

export interface GoalMetrics {
  onTrack: number;
  behindSchedule: number;
  completed: number;
  totalGoals: number;
  progressScore?: number; // 0-100 overall goal progress
}

export interface TimeBreakdown {
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  byDay: Array<{ date: string; hours: number }>;
  byHour?: Record<number, number>; // Productivity by hour of day
}

export interface Highlights {
  mostProductiveDay?: { date: string; hours: number };
  longestStreak?: { days: number; label: string };
  biggestWin?: { description: string; impact: string };
  topAchievements?: string[]; // List of key accomplishments
}

export interface Comparison {
  vsLastPeriod: {
    completionRateDelta: number;
    hoursWorkedDelta: number;
    focusHoursDelta: number;
  };
  vsAverage: {
    completionRateVsAvg: number;
    hoursWorkedVsAvg: number;
  };
}

/**
 * 趋势分析接口
 */
export interface TrendAnalysis {
  direction: 'improving' | 'stable' | 'declining';
  momentum: number; // -100 to 100, positive = improving
  keyFactors: string[];
  prediction: string;
}

/**
 * 增强版比较分析
 */
export interface EnhancedComparison extends Comparison {
  trend: TrendAnalysis;
  yearOverYear?: {
    completionRateDelta: number;
    hoursWorkedDelta: number;
  };
  periodLabel: string;
}

export interface ReviewInsights {
  strengths: string[];
  improvements: string[];
  patterns: string[];
  recommendations: string[];
  actionItems?: ActionItem[]; // Specific next steps
}

/**
 * 可执行的行动项
 */
export interface ActionItem {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  category: 'productivity' | 'focus' | 'goals' | 'habits';
  estimatedImpact: string;
}

export interface ReviewReport {
  id: string;
  type: 'weekly' | 'monthly' | 'quarterly';
  period: {
    start: string; // YYYY-MM-DD
    end: string; // YYYY-MM-DD
    label: string;
  };
  generatedAt: Date;
  metrics: {
    tasks: TaskMetrics;
    work: WorkMetrics;
    goals: GoalMetrics;
  };
  breakdown: TimeBreakdown;
  insights: ReviewInsights;
  highlights: Highlights;
  comparison: EnhancedComparison;
  overallScore?: number; // 0-100 综合评分
}

/**
 * Review Report Service - Singleton Pattern
 * 生成周期性复盘报告和分析
 */
export class ReviewReportService {
  private static instance: ReviewReportService;
  private cache = new Map<string, { report: ReviewReport; timestamp: Date }>();
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  private historicalData: Map<string, ReviewReport> = new Map();

  private constructor() {}

  static getInstance(): ReviewReportService {
    if (!this.instance) {
      this.instance = new ReviewReportService();
    }
    return this.instance;
  }

  /**
   * 生成周报
   */
  async generateWeeklyReport(date: Date = new Date()): Promise<ReviewReport> {
    const cacheKey = this.generateCacheKey('weekly', date);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp.getTime() < this.cacheExpiry) {
      return cached.report;
    }

    const period = this.getWeekPeriod(date);

    // Mock data simulation
    const report = this.createMockReport('weekly', period);

    // Cache result
    this.cache.set(cacheKey, { report, timestamp: new Date() });
    this.historicalData.set(cacheKey, report);

    return report;
  }

  /**
   * 生成月报
   */
  async generateMonthlyReport(date: Date = new Date()): Promise<ReviewReport> {
    const cacheKey = this.generateCacheKey('monthly', date);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp.getTime() < this.cacheExpiry) {
      return cached.report;
    }

    const period = this.getMonthPeriod(date);

    // Mock data simulation
    const report = this.createMockReport('monthly', period);

    // Cache result
    this.cache.set(cacheKey, { report, timestamp: new Date() });
    this.historicalData.set(cacheKey, report);

    return report;
  }

  /**
   * 生成季报
   * STORY-031: 新增季度报告功能
   */
  async generateQuarterlyReport(date: Date = new Date()): Promise<ReviewReport> {
    const cacheKey = this.generateCacheKey('quarterly', date);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp.getTime() < this.cacheExpiry) {
      return cached.report;
    }

    const period = this.getQuarterPeriod(date);

    // Mock data simulation
    const report = this.createMockReport('quarterly', period);

    // Cache result
    this.cache.set(cacheKey, { report, timestamp: new Date() });
    this.historicalData.set(cacheKey, report);

    return report;
  }

  /**
   * 获取多期报告比较
   * @param type 报告类型
   * @param count 获取的期数
   * @param endDate 结束日期
   */
  async getReportComparison(
    type: 'weekly' | 'monthly' | 'quarterly',
    count: number = 4,
    endDate: Date = new Date()
  ): Promise<ReviewReport[]> {
    const reports: ReviewReport[] = [];
    const currentDate = new Date(endDate);

    for (let i = 0; i < count; i++) {
      let report: ReviewReport;
      
      switch (type) {
        case 'weekly':
          report = await this.generateWeeklyReport(currentDate);
          currentDate.setDate(currentDate.getDate() - 7);
          break;
        case 'monthly':
          report = await this.generateMonthlyReport(currentDate);
          currentDate.setMonth(currentDate.getMonth() - 1);
          break;
        case 'quarterly':
          report = await this.generateQuarterlyReport(currentDate);
          currentDate.setMonth(currentDate.getMonth() - 3);
          break;
      }
      
      reports.push(report);
    }

    return reports;
  }

  /**
   * 获取周期
   */
  private getWeekPeriod(date: Date): { start: string; end: string; label: string } {
    // Get Monday of the week
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));

    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);

    const year = monday.getFullYear();
    const week = Math.ceil(
      ((monday.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7
    );

    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0],
      label: `${year}年第${week}周`,
    };
  }

  /**
   * 获取月期
   */
  private getMonthPeriod(date: Date): { start: string; end: string; label: string } {
    const year = date.getFullYear();
    const month = date.getMonth();

    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
      label: `${year}年${month + 1}月`,
    };
  }

  /**
   * 获取季度期
   * STORY-031: 新增季度周期计算
   */
  private getQuarterPeriod(date: Date): { start: string; end: string; label: string } {
    const year = date.getFullYear();
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    const startMonth = (quarter - 1) * 3;
    const endMonth = startMonth + 2;

    const start = new Date(year, startMonth, 1);
    const end = new Date(year, endMonth + 1, 0);

    const quarterNames = ['一', '二', '三', '四'];

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
      label: `${year}年第${quarterNames[quarter - 1]}季度`,
    };
  }

  /**
   * 创建模拟报告（实际应连接数据库）
   */
  private createMockReport(
    type: 'weekly' | 'monthly' | 'quarterly',
    period: { start: string; end: string; label: string }
  ): ReviewReport {
    const isWeekly = type === 'weekly';

    // Metrics
    const completedTasks = isWeekly ? 28 : 120;
    const totalTasks = isWeekly ? 35 : 145;
    const totalHours = isWeekly ? 42 : 165;
    const focusHours = isWeekly ? 18 : 72;

    const report: ReviewReport = {
      id: this.generateId(),
      type,
      period,
      generatedAt: new Date(),

      metrics: {
        tasks: {
          completed: completedTasks,
          total: totalTasks,
          completionRate: completedTasks / totalTasks,
        },
        work: {
          totalHours,
          averageDailyHours: isWeekly ? totalHours / 7 : totalHours / 30,
          focusHours,
        },
        goals: {
          onTrack: isWeekly ? 5 : 18,
          behindSchedule: isWeekly ? 2 : 4,
          completed: isWeekly ? 0 : 3,
          totalGoals: isWeekly ? 7 : 25,
        },
      },

      breakdown: {
        byCategory: {
          工作: isWeekly ? 30 : 120,
          学习: isWeekly ? 8 : 30,
          生活: isWeekly ? 4 : 15,
        },
        byPriority: {
          critical: isWeekly ? 8 : 35,
          high: isWeekly ? 12 : 50,
          medium: isWeekly ? 6 : 25,
          low: isWeekly ? 2 : 10,
        },
        byDay: isWeekly
          ? [
              { date: '2025-12-01', hours: 6.5 },
              { date: '2025-12-02', hours: 7 },
              { date: '2025-12-03', hours: 8.5 },
              { date: '2025-12-04', hours: 6 },
              { date: '2025-12-05', hours: 6.5 },
              { date: '2025-12-06', hours: 4.5 },
              { date: '2025-12-07', hours: 3 },
            ]
          : Array.from({ length: 30 }, (_, i) => ({
              date: `2025-12-${String(i + 1).padStart(2, '0')}`,
              hours: 5 + Math.random() * 3,
            })),
      },

      insights: this.generateInsights(
        {
          tasks: {
            completed: completedTasks,
            total: totalTasks,
            completionRate: completedTasks / totalTasks,
          },
          work: {
            totalHours,
            averageDailyHours: isWeekly ? totalHours / 7 : totalHours / 30,
            focusHours,
          },
          goals: {
            onTrack: isWeekly ? 5 : 18,
            behindSchedule: isWeekly ? 2 : 4,
            completed: isWeekly ? 0 : 3,
            totalGoals: isWeekly ? 7 : 25,
          },
        },
        {
          工作: isWeekly ? 30 : 120,
          学习: isWeekly ? 8 : 30,
          生活: isWeekly ? 4 : 15,
        }
      ),

      highlights: {
        mostProductiveDay: { date: '2025-12-03', hours: 8.5 },
        longestStreak: {
          days: type === 'weekly' ? 5 : type === 'monthly' ? 21 : 65,
          label: type === 'weekly' ? '连续工作日' : type === 'monthly' ? '连续完成日标' : '季度最长连续',
        },
        biggestWin: {
          description:
            type === 'weekly'
              ? '完成项目架构设计'
              : type === 'monthly'
                ? '完成月度规划评审'
                : '完成季度战略目标',
          impact: '推动核心项目前进',
        },
        topAchievements:
          type === 'quarterly'
            ? ['完成 3 个关键里程碑', '团队生产力提升 15%', '建立新的工作流程']
            : undefined,
      },

      comparison: this.generateEnhancedComparison(type, period.label, completedTasks / totalTasks),

      overallScore: this.calculateOverallScore(
        completedTasks / totalTasks,
        focusHours / totalHours,
        (isWeekly ? 5 : 18) / (isWeekly ? 7 : 25)
      ),
    };

    return report;
  }

  /**
   * 生成增强版比较分析
   */
  private generateEnhancedComparison(
    type: 'weekly' | 'monthly' | 'quarterly',
    periodLabel: string,
    completionRate: number
  ): EnhancedComparison {
    const isWeekly = type === 'weekly';
    const isQuarterly = type === 'quarterly';

    // Calculate trend based on completion rate
    const trend = this.analyzeTrend(completionRate);

    return {
      vsLastPeriod: {
        completionRateDelta: 0.05,
        hoursWorkedDelta: isWeekly ? -2 : isQuarterly ? 30 : 10,
        focusHoursDelta: isQuarterly ? 8 : 2,
      },
      vsAverage: {
        completionRateVsAvg: 0.08,
        hoursWorkedVsAvg: isWeekly ? 3 : isQuarterly ? 25 : 12,
      },
      trend,
      yearOverYear: isQuarterly
        ? {
            completionRateDelta: 0.12,
            hoursWorkedDelta: 45,
          }
        : undefined,
      periodLabel,
    };
  }

  /**
   * 分析趋势
   */
  private analyzeTrend(completionRate: number): TrendAnalysis {
    const momentum = (completionRate - 0.7) * 100; // baseline 70%

    let direction: 'improving' | 'stable' | 'declining';
    if (momentum > 10) {
      direction = 'improving';
    } else if (momentum < -10) {
      direction = 'declining';
    } else {
      direction = 'stable';
    }

    const keyFactors: string[] = [];
    if (completionRate > 0.8) {
      keyFactors.push('高任务完成率');
    }
    if (completionRate < 0.6) {
      keyFactors.push('任务积压需关注');
    }
    keyFactors.push('专注时间充足');

    const predictions: Record<typeof direction, string> = {
      improving: '保持当前势头，预计下期完成率将进一步提升',
      stable: '工作节奏稳定，建议寻找突破点',
      declining: '建议重新评估工作负载，避免疲劳累积',
    };

    return {
      direction,
      momentum: Math.round(momentum),
      keyFactors,
      prediction: predictions[direction],
    };
  }

  /**
   * 计算综合评分
   */
  private calculateOverallScore(
    completionRate: number,
    focusRatio: number,
    goalProgressRate: number
  ): number {
    // 权重: 完成率 40%, 专注比例 30%, 目标进度 30%
    const score =
      completionRate * 40 + focusRatio * 30 + goalProgressRate * 30;
    return Math.min(100, Math.max(0, Math.round(score)));
  }

  /**
   * 生成洞察
   */
  private generateInsights(
    metrics: {
      tasks: TaskMetrics;
      work: WorkMetrics;
      goals: GoalMetrics;
    },
    breakdown: Record<string, number>
  ): ReviewInsights {
    const strengths: string[] = [];
    const improvements: string[] = [];
    const patterns: string[] = [];
    const recommendations: string[] = [];

    // 完成率分析
    if (metrics.tasks.completionRate > 0.8) {
      strengths.push(`出色的任务完成率 (${(metrics.tasks.completionRate * 100).toFixed(0)}%)，保持这个节奏！`);
    } else if (metrics.tasks.completionRate < 0.5) {
      improvements.push(`任务完成率较低 (${(metrics.tasks.completionRate * 100).toFixed(0)}%)，建议减少同时进行的任务数`);
      recommendations.push('尝试使用番茄钟技术提高专注度');
    }

    // 专注时长分析
    if (metrics.work.focusHours > 15) {
      strengths.push(`深度工作时长充足 (${metrics.work.focusHours}小时)，这是高效的关键`);
    } else if (metrics.work.focusHours < 5) {
      improvements.push(`深度工作时长不足 (${metrics.work.focusHours}小时)，容易被打断`);
      recommendations.push('每天安排至少 2 小时不受打扰的专注时段');
    }

    // 时间分布模式
    const sortedCategories = Object.entries(breakdown).sort(([, a], [, b]) => b - a);
    if (sortedCategories.length > 0) {
      patterns.push(`本期最多时间投入在「${sortedCategories[0][0]}」(${sortedCategories[0][1].toFixed(1)}小时)`);
    }

    // 目标进展
    if (metrics.goals.behindSchedule > metrics.goals.onTrack) {
      improvements.push('多个目标进度落后，需要重新评估优先级');
      recommendations.push('使用 AI 任务分解功能，将大目标拆解为可执行的小任务');
    } else if (metrics.goals.completed > 0) {
      strengths.push(`已完成 ${metrics.goals.completed} 个目标，好！`);
    }

    if (patterns.length === 0) {
      patterns.push('工作节奏相对均匀，保持稳定');
    }

    // 生成可操作的行动项
    const actionItems = this.generateActionItems(metrics, improvements);

    return { strengths, improvements, patterns, recommendations, actionItems };
  }

  /**
   * 生成可操作的行动项
   * STORY-031: 提供具体的下一步行动建议
   */
  private generateActionItems(
    metrics: {
      tasks: TaskMetrics;
      work: WorkMetrics;
      goals: GoalMetrics;
    },
    improvements: string[]
  ): ActionItem[] {
    const actionItems: ActionItem[] = [];
    let idCounter = 1;

    // 基于完成率的行动项
    if (metrics.tasks.completionRate < 0.6) {
      actionItems.push({
        id: `action-${idCounter++}`,
        title: '启用任务限制模式',
        priority: 'high',
        category: 'productivity',
        estimatedImpact: '预计提升完成率 20%',
      });
    }

    // 基于专注时长的行动项
    if (metrics.work.focusHours < 10) {
      actionItems.push({
        id: `action-${idCounter++}`,
        title: '设置每日专注时间块',
        priority: 'high',
        category: 'focus',
        estimatedImpact: '每周增加 5+ 小时深度工作',
      });
    }

    // 基于目标进度的行动项
    if (metrics.goals.behindSchedule > 2) {
      actionItems.push({
        id: `action-${idCounter++}`,
        title: '重新评估滞后目标优先级',
        priority: 'medium',
        category: 'goals',
        estimatedImpact: '避免目标累积压力',
      });
    }

    // 默认行动项
    if (actionItems.length === 0) {
      actionItems.push({
        id: `action-${idCounter++}`,
        title: '保持当前良好节奏',
        priority: 'low',
        category: 'habits',
        estimatedImpact: '持续稳定的产出',
      });
    }

    return actionItems;
  }

  /**
   * 生成ID
   */
  private generateId(): string {
    return `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(type: string, date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    if (type === 'weekly') {
      const week = Math.ceil((date.getDate() - date.getDay() + 1) / 7);
      return `report-weekly-${year}-w${week}`;
    }

    if (type === 'quarterly') {
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `report-quarterly-${year}-q${quarter}`;
    }

    return `report-monthly-${year}-${month}`;
  }

  /**
   * 获取历史报告
   * @param type 报告类型
   * @param limit 返回数量限制
   */
  getHistoricalReports(
    type?: 'weekly' | 'monthly' | 'quarterly',
    limit: number = 10
  ): ReviewReport[] {
    const reports = Array.from(this.historicalData.values());
    const filtered = type ? reports.filter((r) => r.type === type) : reports;
    return filtered
      .sort((a, b) => new Date(b.period.end).getTime() - new Date(a.period.end).getTime())
      .slice(0, limit);
  }

  /**
   * 清空缓存
   */
  clearCache(cacheKey?: string): void {
    if (cacheKey) {
      this.cache.delete(cacheKey);
      this.historicalData.delete(cacheKey);
    } else {
      this.cache.clear();
      this.historicalData.clear();
    }
  }

  /**
   * 设置缓存过期时间
   */
  setCacheExpiry(hours: number): void {
    this.cacheExpiry = hours * 60 * 60 * 1000;
  }
}

export default ReviewReportService;
