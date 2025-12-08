/**
 * Review Report Service
 * 周期性复盘报告服务 - 生成周报、月报和分析
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
}

export interface GoalMetrics {
  onTrack: number;
  behindSchedule: number;
  completed: number;
  totalGoals: number;
}

export interface TimeBreakdown {
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  byDay: Array<{ date: string; hours: number }>;
}

export interface Highlights {
  mostProductiveDay?: { date: string; hours: number };
  longestStreak?: { days: number; label: string };
  biggestWin?: { description: string; impact: string };
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

export interface ReviewInsights {
  strengths: string[];
  improvements: string[];
  patterns: string[];
  recommendations: string[];
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
  comparison: Comparison;
}

/**
 * Review Report Service - Singleton Pattern
 * 生成周期性复盘报告和分析
 */
export class ReviewReportService {
  private static instance: ReviewReportService;
  private cache = new Map<string, { report: ReviewReport; timestamp: Date }>();
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

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

    return report;
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
        longestStreak: { days: isWeekly ? 5 : 21, label: isWeekly ? '连续工作日' : '连续完成日标' },
        biggestWin: {
          description: isWeekly ? '完成项目架构设计' : '完成季度规划评审',
          impact: '推动核心项目前进',
        },
      },

      comparison: {
        vsLastPeriod: {
          completionRateDelta: 0.05,
          hoursWorkedDelta: isWeekly ? -2 : 10,
          focusHoursDelta: 2,
        },
        vsAverage: {
          completionRateVsAvg: 0.08,
          hoursWorkedVsAvg: isWeekly ? 3 : 12,
        },
      },
    };

    return report;
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

    return { strengths, improvements, patterns, recommendations };
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
    const day = String(date.getDate()).padStart(2, '0');

    if (type === 'weekly') {
      const week = Math.ceil((date.getDate() - date.getDay() + 1) / 7);
      return `report-weekly-${year}-w${week}`;
    }

    return `report-monthly-${year}-${month}`;
  }

  /**
   * 清空缓存
   */
  clearCache(cacheKey?: string): void {
    if (cacheKey) {
      this.cache.delete(cacheKey);
    } else {
      this.cache.clear();
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
