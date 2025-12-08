# STORY-031: 周期性复盘报告

## 📋 Story 概述

**Story ID**: STORY-031  
**Epic**: EPIC-006 (Smart Productivity)  
**优先级**: P2 (增强体验)  
**预估工时**: 2 天  
**状态**: 📋 Ready for Dev  
**前置依赖**: 现有统计数据收集 ✅

---

## 🎯 用户故事

**作为** DailyUse 用户  
**我希望** 定期收到 AI 生成的效率分析报告  
**以便于** 持续优化工作方式，发现改进空间

---

## 📋 验收标准

### 功能验收 - 周报生成

- [ ] 每周一自动生成上周复盘
- [ ] 展示任务完成数和完成率
- [ ] 展示目标进展情况
- [ ] 展示时间分配分析
- [ ] 生成改进建议

### 功能验收 - 月报生成

- [ ] 每月1号生成上月总结
- [ ] 对比月度目标达成情况
- [ ] 展示效率趋势变化
- [ ] 识别最高效/最低效时段
- [ ] 生成下月规划建议

### 功能验收 - 数据洞察

- [ ] 完成率趋势分析
- [ ] 任务类型时间分布
- [ ] 高价值活动识别
- [ ] 时间浪费点检测
- [ ] 工作习惯模式分析

### 功能验收 - 可视化展示

- [ ] 图表展示关键指标
- [ ] 对比历史数据
- [ ] 导出 PDF 报告
- [ ] 分享到社交媒体（可选）

---

## 🔧 技术方案

### 数据模型

```typescript
// packages/domain-client/src/analytics/
interface ReviewReport {
  id: string;
  type: 'weekly' | 'monthly' | 'quarterly';
  period: {
    start: Date;
    end: Date;
    label: string;  // "2025年第50周" | "2025年12月"
  };
  generatedAt: Date;
  
  metrics: {
    tasksCompleted: number;
    tasksTotal: number;
    completionRate: number;  // 0-1
    totalHoursWorked: number;
    averageDailyHours: number;
    focusHours: number;  // 番茄钟专注时长
    goalsProgress: {
      onTrack: number;
      behindSchedule: number;
      completed: number;
    };
  };
  
  breakdown: {
    byCategory: Record<string, number>;  // { "工作": 30h, "学习": 10h }
    byPriority: Record<string, number>;
    byDay: Array<{ date: string; hours: number }>;
  };
  
  insights: {
    strengths: string[];  // 做得好的方面
    improvements: string[];  // 需要改进的方面
    patterns: string[];  // 识别的模式
    recommendations: string[];  // AI 建议
  };
  
  highlights: {
    mostProductiveDay: { date: string; hours: number };
    longestStreak: { days: number; habit: string };
    biggestWin: { description: string; impact: string };
  };
  
  comparison: {
    vsLastPeriod: {
      completionRateDelta: number;  // +5% | -3%
      hoursWorkedDelta: number;
      focusHoursDelta: number;
    };
    vsAverage: {
      completionRateVsAvg: number;
      hoursWorkedVsAvg: number;
    };
  };
}
```

### 报告生成服务

```typescript
// packages/application-client/src/analytics/ReviewReportService.ts
export class ReviewReportService {
  /**
   * 生成周报
   */
  async generateWeeklyReport(date: Date = new Date()): Promise<ReviewReport> {
    const period = this.getWeekPeriod(date);
    const tasks = await this.getTasksInPeriod(period);
    const goals = await this.getGoalsInPeriod(period);
    const focusSessions = await this.getFocusSessionsInPeriod(period);
    
    const metrics = this.calculateMetrics(tasks, goals, focusSessions);
    const breakdown = this.analyzeBreakdown(tasks);
    const insights = await this.generateInsights(metrics, breakdown, period);
    const highlights = this.findHighlights(tasks, goals, focusSessions);
    const comparison = await this.compareWithHistory(metrics, period);
    
    return {
      id: generateId(),
      type: 'weekly',
      period,
      generatedAt: new Date(),
      metrics,
      breakdown,
      insights,
      highlights,
      comparison,
    };
  }

  /**
   * 生成洞察
   */
  private async generateInsights(
    metrics: any,
    breakdown: any,
    period: any
  ): Promise<{
    strengths: string[];
    improvements: string[];
    patterns: string[];
    recommendations: string[];
  }> {
    const strengths: string[] = [];
    const improvements: string[] = [];
    const patterns: string[] = [];
    const recommendations: string[] = [];
    
    // 完成率分析
    if (metrics.completionRate > 0.8) {
      strengths.push(`出色的任务完成率 (${(metrics.completionRate * 100).toFixed(0)}%)，保持这个节奏！`);
    } else if (metrics.completionRate < 0.5) {
      improvements.push(`任务完成率较低 (${(metrics.completionRate * 100).toFixed(0)}%)，建议减少同时进行的任务数`);
      recommendations.push('尝试使用番茄钟技术提高专注度');
    }
    
    // 专注时长分析
    if (metrics.focusHours > 15) {
      strengths.push(`深度工作时长充足 (${metrics.focusHours}小时)，这是高效的关键`);
    } else if (metrics.focusHours < 5) {
      improvements.push(`深度工作时长不足 (${metrics.focusHours}小时)，容易被打断`);
      recommendations.push('每天安排至少 2 小时不受打扰的专注时段');
    }
    
    // 时间分布模式
    const mostProductiveCategory = Object.entries(breakdown.byCategory)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0];
    
    if (mostProductiveCategory) {
      patterns.push(`本周最多时间投入在「${mostProductiveCategory[0]}」(${mostProductiveCategory[1]}小时)`);
    }
    
    // 工作日分布
    const workingDays = breakdown.byDay.filter((d: any) => d.hours > 0).length;
    if (workingDays < 5) {
      patterns.push(`本周只有 ${workingDays} 天有任务记录，考虑保持更稳定的工作节奏`);
    }
    
    // 目标进展
    if (metrics.goalsProgress.behindSchedule > metrics.goalsProgress.onTrack) {
      improvements.push('多个目标进度落后，需要重新评估优先级');
      recommendations.push('使用 AI 任务分解功能，将大目标拆解为可执行的小任务');
    }
    
    return { strengths, improvements, patterns, recommendations };
  }

  /**
   * 找亮点
   */
  private findHighlights(
    tasks: Task[],
    goals: Goal[],
    sessions: FocusSession[]
  ): ReviewReport['highlights'] {
    // 最高效的一天
    const tasksByDay = groupBy(tasks, t => format(t.completedAt!, 'yyyy-MM-DD'));
    const mostProductiveDay = Object.entries(tasksByDay)
      .map(([date, tasks]) => ({
        date,
        hours: tasks.reduce((sum, t) => sum + (t.actualMinutes || 0), 0) / 60,
      }))
      .sort((a, b) => b.hours - a.hours)[0];
    
    // 最长连续天数（可以从习惯模块获取）
    const longestStreak = {
      days: 7,  // 示例
      habit: '早起',
    };
    
    // 最大成就
    const completedGoals = goals.filter(g => g.isCompleted);
    const biggestWin = completedGoals.length > 0
      ? {
          description: `完成目标: ${completedGoals[0].title}`,
          impact: '推动核心项目前进',
        }
      : {
          description: `完成 ${tasks.length} 个任务`,
          impact: '保持稳定产出',
        };
    
    return {
      mostProductiveDay,
      longestStreak,
      biggestWin,
    };
  }

  /**
   * 历史对比
   */
  private async compareWithHistory(
    currentMetrics: any,
    period: any
  ): Promise<ReviewReport['comparison']> {
    const lastPeriod = this.getPreviousPeriod(period);
    const lastMetrics = await this.getMetricsForPeriod(lastPeriod);
    
    const avgMetrics = await this.getAverageMetrics(period.type);
    
    return {
      vsLastPeriod: {
        completionRateDelta: currentMetrics.completionRate - lastMetrics.completionRate,
        hoursWorkedDelta: currentMetrics.totalHoursWorked - lastMetrics.totalHoursWorked,
        focusHoursDelta: currentMetrics.focusHours - lastMetrics.focusHours,
      },
      vsAverage: {
        completionRateVsAvg: currentMetrics.completionRate - avgMetrics.completionRate,
        hoursWorkedVsAvg: currentMetrics.totalHoursWorked - avgMetrics.totalHoursWorked,
      },
    };
  }
}
```

### UI 组件

```
周报视图:
┌─────────────────────────────────────────────────────┐
│  📊 2025年第50周 效率复盘               [导出PDF]   │
│  12月2日 - 12月8日                                   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  核心指标                                            │
│  ┌─────────────────────────────────────────────┐   │
│  │  ✅ 任务完成   28/35 (80%)    ↑ +5%        │   │
│  │  ⏱ 工作时长    42 小时        ↓ -3h         │   │
│  │  🔥 专注时长   18 小时        ↑ +2h         │   │
│  │  🎯 目标进展   5/7 按计划     → 持平        │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  时间分配                                            │
│  [条形图: 工作 60% | 学习 25% | 生活 15%]           │
│                                                      │
│  每日趋势                                            │
│  [折线图: 显示每天工作时长]                         │
│                                                      │
│  ✨ 本周亮点                                         │
│  • 🏆 最高效的一天: 周三 (8.5小时)                  │
│  • 🔥 最长连续: 早起习惯 7 天                       │
│  • 🎉 最大成就: 完成项目架构设计                    │
│                                                      │
│  💪 做得好的地方                                     │
│  • 出色的任务完成率 (80%)，保持这个节奏！           │
│  • 深度工作时长充足 (18小时)，这是高效的关键        │
│                                                      │
│  📈 改进空间                                         │
│  • 周末没有任务记录，考虑保持更稳定的工作节奏       │
│  • 2 个目标进度落后，需要重新评估优先级             │
│                                                      │
│  💡 下周建议                                         │
│  • 尝试使用番茄钟技术提高专注度                     │
│  • 使用 AI 任务分解功能，将大目标拆解为小任务       │
│  • 每天安排至少 2 小时不受打扰的专注时段            │
│                                                      │
│             [查看详细数据]    [制定下周计划]        │
└─────────────────────────────────────────────────────┘
```

---

## 📁 文件变更清单

### 新增文件

```
packages/application-client/src/analytics/
  ├── ReviewReportService.ts
  ├── MetricsAggregator.ts
  └── InsightGenerator.ts

packages/domain-client/src/analytics/
  └── aggregates/ReviewReport.ts

apps/desktop/src/renderer/views/analytics/
  ├── ReviewReportView.tsx
  ├── WeeklyReport.tsx
  └── MonthlyReport.tsx

apps/desktop/src/renderer/components/analytics/
  ├── MetricsCard.tsx
  ├── TrendChart.tsx
  ├── TimeDistributionChart.tsx
  └── HighlightsSection.tsx
```

---

## 📝 注意事项

1. **定时生成**：使用后台任务在每周一/每月1号自动生成
2. **数据隐私**：报告数据不上传，仅本地存储
3. **可扩展性**：预留季度报告、年度报告接口
4. **导出功能**：支持导出为 PDF/图片格式分享
