/**
 * Review Report Service - Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ReviewReportService } from '../ReviewReportService';
import type { ReviewReport } from '../ReviewReportService';

describe('ReviewReportService', () => {
  let service: ReviewReportService;

  beforeEach(() => {
    service = ReviewReportService.getInstance();
    service.clearCache();
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = ReviewReportService.getInstance();
      const instance2 = ReviewReportService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('generateWeeklyReport', () => {
    it('should generate weekly report', async () => {
      const report = await service.generateWeeklyReport();

      expect(report).toBeDefined();
      expect(report.type).toBe('weekly');
      expect(report.period.label).toMatch(/\d{4}年第\d+周/);
    });

    it('should have all required fields', async () => {
      const report = await service.generateWeeklyReport();

      expect(report.id).toBeTruthy();
      expect(report.generatedAt).toBeInstanceOf(Date);
      expect(report.metrics).toBeDefined();
      expect(report.breakdown).toBeDefined();
      expect(report.insights).toBeDefined();
      expect(report.highlights).toBeDefined();
      expect(report.comparison).toBeDefined();
    });

    it('should include task metrics', async () => {
      const report = await service.generateWeeklyReport();

      expect(report.metrics.tasks.completed).toBeGreaterThanOrEqual(0);
      expect(report.metrics.tasks.total).toBeGreaterThan(0);
      expect(report.metrics.tasks.completionRate).toBeGreaterThanOrEqual(0);
      expect(report.metrics.tasks.completionRate).toBeLessThanOrEqual(1);
    });

    it('should include work metrics', async () => {
      const report = await service.generateWeeklyReport();

      expect(report.metrics.work.totalHours).toBeGreaterThan(0);
      expect(report.metrics.work.averageDailyHours).toBeGreaterThan(0);
      expect(report.metrics.work.focusHours).toBeGreaterThanOrEqual(0);
    });

    it('should include goal metrics', async () => {
      const report = await service.generateWeeklyReport();

      expect(report.metrics.goals.onTrack).toBeGreaterThanOrEqual(0);
      expect(report.metrics.goals.behindSchedule).toBeGreaterThanOrEqual(0);
      expect(report.metrics.goals.completed).toBeGreaterThanOrEqual(0);
      expect(report.metrics.goals.totalGoals).toBeGreaterThan(0);
    });

    it('should include time breakdown by category', async () => {
      const report = await service.generateWeeklyReport();

      expect(Object.keys(report.breakdown.byCategory).length).toBeGreaterThan(0);
      expect(report.breakdown.byCategory['工作']).toBeGreaterThan(0);
    });

    it('should include time breakdown by priority', async () => {
      const report = await service.generateWeeklyReport();

      expect(Object.keys(report.breakdown.byPriority).length).toBeGreaterThan(0);
      expect(report.breakdown.byPriority['high']).toBeGreaterThan(0);
    });

    it('should include daily breakdown', async () => {
      const report = await service.generateWeeklyReport();

      expect(report.breakdown.byDay).toBeDefined();
      expect(Array.isArray(report.breakdown.byDay)).toBe(true);
      expect(report.breakdown.byDay.length).toBeGreaterThan(0);
    });
  });

  describe('generateMonthlyReport', () => {
    it('should generate monthly report', async () => {
      const report = await service.generateMonthlyReport();

      expect(report).toBeDefined();
      expect(report.type).toBe('monthly');
      expect(report.period.label).toMatch(/\d{4}年\d+月/);
    });

    it('should have more data than weekly report', async () => {
      const weekly = await service.generateWeeklyReport();
      const monthly = await service.generateMonthlyReport();

      expect(monthly.metrics.tasks.total).toBeGreaterThan(weekly.metrics.tasks.total);
      expect(monthly.metrics.work.totalHours).toBeGreaterThan(weekly.metrics.work.totalHours);
    });

    it('should have more daily breakdown entries than weekly', async () => {
      const weekly = await service.generateWeeklyReport();
      const monthly = await service.generateMonthlyReport();

      expect(monthly.breakdown.byDay.length).toBeGreaterThan(weekly.breakdown.byDay.length);
    });
  });

  describe('Insights Generation', () => {
    it('should include strengths', async () => {
      const report = await service.generateWeeklyReport();

      expect(Array.isArray(report.insights.strengths)).toBe(true);
    });

    it('should include improvements', async () => {
      const report = await service.generateWeeklyReport();

      expect(Array.isArray(report.insights.improvements)).toBe(true);
    });

    it('should include patterns', async () => {
      const report = await service.generateWeeklyReport();

      expect(Array.isArray(report.insights.patterns)).toBe(true);
      expect(report.insights.patterns.length).toBeGreaterThan(0);
    });

    it('should include recommendations', async () => {
      const report = await service.generateWeeklyReport();

      expect(Array.isArray(report.insights.recommendations)).toBe(true);
    });
  });

  describe('Highlights', () => {
    it('should include most productive day', async () => {
      const report = await service.generateWeeklyReport();

      expect(report.highlights.mostProductiveDay).toBeDefined();
      expect(report.highlights.mostProductiveDay?.date).toBeTruthy();
      expect(report.highlights.mostProductiveDay?.hours).toBeGreaterThan(0);
    });

    it('should include longest streak', async () => {
      const report = await service.generateWeeklyReport();

      expect(report.highlights.longestStreak).toBeDefined();
      expect(report.highlights.longestStreak?.days).toBeGreaterThan(0);
      expect(report.highlights.longestStreak?.label).toBeTruthy();
    });

    it('should include biggest win', async () => {
      const report = await service.generateWeeklyReport();

      expect(report.highlights.biggestWin).toBeDefined();
      expect(report.highlights.biggestWin?.description).toBeTruthy();
      expect(report.highlights.biggestWin?.impact).toBeTruthy();
    });
  });

  describe('Comparison Data', () => {
    it('should include comparison with last period', async () => {
      const report = await service.generateWeeklyReport();

      expect(report.comparison.vsLastPeriod).toBeDefined();
      expect(report.comparison.vsLastPeriod.completionRateDelta).toBeDefined();
      expect(report.comparison.vsLastPeriod.hoursWorkedDelta).toBeDefined();
      expect(report.comparison.vsLastPeriod.focusHoursDelta).toBeDefined();
    });

    it('should include comparison with average', async () => {
      const report = await service.generateWeeklyReport();

      expect(report.comparison.vsAverage).toBeDefined();
      expect(report.comparison.vsAverage.completionRateVsAvg).toBeDefined();
      expect(report.comparison.vsAverage.hoursWorkedVsAvg).toBeDefined();
    });

    it('should have numeric delta values', async () => {
      const report = await service.generateWeeklyReport();

      expect(typeof report.comparison.vsLastPeriod.completionRateDelta).toBe('number');
      expect(typeof report.comparison.vsLastPeriod.hoursWorkedDelta).toBe('number');
      expect(typeof report.comparison.vsAverage.completionRateVsAvg).toBe('number');
    });
  });

  describe('Completion Rate Calculations', () => {
    it('should calculate valid completion rate', async () => {
      const report = await service.generateWeeklyReport();

      const rate = report.metrics.tasks.completionRate;
      expect(rate).toBeGreaterThanOrEqual(0);
      expect(rate).toBeLessThanOrEqual(1);
    });

    it('should match completed/total calculation', async () => {
      const report = await service.generateWeeklyReport();

      const expectedRate = report.metrics.tasks.completed / report.metrics.tasks.total;
      expect(Math.abs(report.metrics.tasks.completionRate - expectedRate)).toBeLessThan(0.01);
    });
  });

  describe('Caching', () => {
    it('should cache weekly reports', async () => {
      const date = new Date();
      const report1 = await service.generateWeeklyReport(date);
      const report2 = await service.generateWeeklyReport(date);

      expect(report1.id).toBe(report2.id);
      expect(report1.generatedAt.getTime()).toBe(report2.generatedAt.getTime());
    });

    it('should cache monthly reports', async () => {
      const date = new Date();
      const report1 = await service.generateMonthlyReport(date);
      const report2 = await service.generateMonthlyReport(date);

      expect(report1.id).toBe(report2.id);
    });

    it('should clear cache', async () => {
      const date = new Date();
      await service.generateWeeklyReport(date);
      service.clearCache();

      // Still works after clear, but creates new report
      const report = await service.generateWeeklyReport(date);
      expect(report).toBeDefined();
    });
  });

  describe('Cache Expiry', () => {
    it('should allow setting cache expiry', () => {
      service.setCacheExpiry(48);
      expect(() => service.setCacheExpiry(48)).not.toThrow();
    });
  });

  describe('Period Calculations', () => {
    it('should have valid period dates', async () => {
      const report = await service.generateWeeklyReport();

      expect(report.period.start).toMatch(/\d{4}-\d{2}-\d{2}/);
      expect(report.period.end).toMatch(/\d{4}-\d{2}-\d{2}/);

      const startDate = new Date(report.period.start);
      const endDate = new Date(report.period.end);

      expect(startDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
    });

    it('should have descriptive period labels', async () => {
      const report = await service.generateWeeklyReport();

      expect(report.period.label).toMatch(/年/);
      expect(report.period.label.length).toBeGreaterThan(0);
    });
  });

  describe('Breakdown Totals', () => {
    it('should have consistent breakdown data', async () => {
      const report = await service.generateWeeklyReport();

      expect(report.breakdown.byCategory).toBeDefined();
      expect(report.breakdown.byPriority).toBeDefined();
      expect(report.breakdown.byDay).toBeDefined();

      // At least one category should have hours
      const totalHours = Object.values(report.breakdown.byCategory).reduce(
        (sum, h) => sum + h,
        0
      );
      expect(totalHours).toBeGreaterThan(0);
    });

    it('should have valid daily entries', async () => {
      const report = await service.generateWeeklyReport();

      for (const day of report.breakdown.byDay) {
        expect(day.date).toMatch(/\d{4}-\d{2}-\d{2}/);
        expect(day.hours).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Metrics Consistency', () => {
    it('should have consistent goal totals', async () => {
      const report = await service.generateWeeklyReport();

      const goalTotal =
        report.metrics.goals.onTrack +
        report.metrics.goals.behindSchedule +
        report.metrics.goals.completed;

      expect(goalTotal).toBeLessThanOrEqual(report.metrics.goals.totalGoals);
    });

    it('should have realistic work hours', async () => {
      const report = await service.generateWeeklyReport();

      // Weekly should be roughly 5-7 days
      const expectedDays = report.type === 'weekly' ? 7 : 30;
      const expectedMaxHours = expectedDays * 16; // Assuming max 16 hours per day

      expect(report.metrics.work.totalHours).toBeLessThan(expectedMaxHours);
    });

    it('should have focus hours less than or equal to total hours', async () => {
      const report = await service.generateWeeklyReport();

      expect(report.metrics.work.focusHours).toBeLessThanOrEqual(
        report.metrics.work.totalHours
      );
    });
  });

  describe('Different Dates', () => {
    it('should generate report for past date', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);

      const report = await service.generateWeeklyReport(pastDate);

      expect(report).toBeDefined();
      expect(report.generatedAt).toBeInstanceOf(Date);
    });

    it('should generate report for future date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const report = await service.generateWeeklyReport(futureDate);

      expect(report).toBeDefined();
    });
  });

  describe('Report Uniqueness', () => {
    it('should generate unique IDs', async () => {
      service.clearCache(); // Force new report generation
      const report1 = await service.generateWeeklyReport();

      service.clearCache();
      const report2 = await service.generateWeeklyReport();

      expect(report1.id).not.toBe(report2.id);
    });

    it('should have recent generation timestamp', async () => {
      const beforeGen = new Date();
      const report = await service.generateWeeklyReport();
      const afterGen = new Date();

      expect(report.generatedAt.getTime()).toBeGreaterThanOrEqual(beforeGen.getTime());
      expect(report.generatedAt.getTime()).toBeLessThanOrEqual(afterGen.getTime());
    });
  });

  // ==========================================
  // STORY-031: 新增功能测试
  // ==========================================

  describe('generateQuarterlyReport', () => {
    it('should generate quarterly report', async () => {
      const report = await service.generateQuarterlyReport();

      expect(report).toBeDefined();
      expect(report.type).toBe('quarterly');
      expect(report.period.label).toMatch(/\d{4}年第.季度/);
    });

    it('should have more data than monthly report', async () => {
      const monthly = await service.generateMonthlyReport();
      const quarterly = await service.generateQuarterlyReport();

      expect(quarterly.metrics.tasks.total).toBeGreaterThanOrEqual(monthly.metrics.tasks.total);
      expect(quarterly.metrics.work.totalHours).toBeGreaterThanOrEqual(monthly.metrics.work.totalHours);
    });

    it('should include topAchievements for quarterly', async () => {
      const report = await service.generateQuarterlyReport();

      expect(report.highlights.topAchievements).toBeDefined();
      expect(Array.isArray(report.highlights.topAchievements)).toBe(true);
      expect(report.highlights.topAchievements!.length).toBeGreaterThan(0);
    });

    it('should include yearOverYear comparison', async () => {
      const report = await service.generateQuarterlyReport();

      expect(report.comparison.yearOverYear).toBeDefined();
      expect(report.comparison.yearOverYear?.completionRateDelta).toBeDefined();
      expect(report.comparison.yearOverYear?.hoursWorkedDelta).toBeDefined();
    });

    it('should cache quarterly reports', async () => {
      const date = new Date();
      const report1 = await service.generateQuarterlyReport(date);
      const report2 = await service.generateQuarterlyReport(date);

      expect(report1.id).toBe(report2.id);
    });
  });

  describe('Enhanced Comparison (Trend Analysis)', () => {
    it('should include trend analysis', async () => {
      const report = await service.generateWeeklyReport();

      expect(report.comparison.trend).toBeDefined();
      expect(report.comparison.trend.direction).toBeDefined();
      expect(['improving', 'stable', 'declining']).toContain(report.comparison.trend.direction);
    });

    it('should have momentum score', async () => {
      const report = await service.generateWeeklyReport();

      expect(typeof report.comparison.trend.momentum).toBe('number');
      expect(report.comparison.trend.momentum).toBeGreaterThanOrEqual(-100);
      expect(report.comparison.trend.momentum).toBeLessThanOrEqual(100);
    });

    it('should have key factors', async () => {
      const report = await service.generateWeeklyReport();

      expect(Array.isArray(report.comparison.trend.keyFactors)).toBe(true);
      expect(report.comparison.trend.keyFactors.length).toBeGreaterThan(0);
    });

    it('should have prediction text', async () => {
      const report = await service.generateWeeklyReport();

      expect(typeof report.comparison.trend.prediction).toBe('string');
      expect(report.comparison.trend.prediction.length).toBeGreaterThan(0);
    });

    it('should include period label', async () => {
      const report = await service.generateMonthlyReport();

      expect(report.comparison.periodLabel).toBeDefined();
      expect(report.comparison.periodLabel.length).toBeGreaterThan(0);
    });
  });

  describe('Overall Score', () => {
    it('should include overall score', async () => {
      const report = await service.generateWeeklyReport();

      expect(report.overallScore).toBeDefined();
      expect(typeof report.overallScore).toBe('number');
    });

    it('should have valid score range (0-100)', async () => {
      const report = await service.generateWeeklyReport();

      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.overallScore).toBeLessThanOrEqual(100);
    });

    it('should calculate score for all report types', async () => {
      const weekly = await service.generateWeeklyReport();
      const monthly = await service.generateMonthlyReport();
      const quarterly = await service.generateQuarterlyReport();

      expect(weekly.overallScore).toBeDefined();
      expect(monthly.overallScore).toBeDefined();
      expect(quarterly.overallScore).toBeDefined();
    });
  });

  describe('Action Items', () => {
    it('should include action items in insights', async () => {
      const report = await service.generateWeeklyReport();

      expect(report.insights.actionItems).toBeDefined();
      expect(Array.isArray(report.insights.actionItems)).toBe(true);
    });

    it('should have valid action item structure', async () => {
      const report = await service.generateWeeklyReport();

      if (report.insights.actionItems && report.insights.actionItems.length > 0) {
        const actionItem = report.insights.actionItems[0];
        expect(actionItem.id).toBeTruthy();
        expect(actionItem.title).toBeTruthy();
        expect(['high', 'medium', 'low']).toContain(actionItem.priority);
        expect(['productivity', 'focus', 'goals', 'habits']).toContain(actionItem.category);
        expect(actionItem.estimatedImpact).toBeTruthy();
      }
    });
  });

  describe('getReportComparison', () => {
    it('should get multiple weekly reports', async () => {
      const reports = await service.getReportComparison('weekly', 3);

      expect(reports).toBeDefined();
      expect(reports.length).toBe(3);
      reports.forEach((report) => {
        expect(report.type).toBe('weekly');
      });
    });

    it('should get multiple monthly reports', async () => {
      const reports = await service.getReportComparison('monthly', 2);

      expect(reports).toBeDefined();
      expect(reports.length).toBe(2);
      reports.forEach((report) => {
        expect(report.type).toBe('monthly');
      });
    });

    it('should get multiple quarterly reports', async () => {
      const reports = await service.getReportComparison('quarterly', 2);

      expect(reports).toBeDefined();
      expect(reports.length).toBe(2);
      reports.forEach((report) => {
        expect(report.type).toBe('quarterly');
      });
    });

    it('should default to 4 reports', async () => {
      const reports = await service.getReportComparison('weekly');

      expect(reports.length).toBe(4);
    });
  });

  describe('getHistoricalReports', () => {
    it('should return historical reports after generation', async () => {
      service.clearCache();
      await service.generateWeeklyReport();
      await service.generateMonthlyReport();

      const history = service.getHistoricalReports();
      expect(history.length).toBeGreaterThan(0);
    });

    it('should filter by report type', async () => {
      service.clearCache();
      await service.generateWeeklyReport();
      await service.generateMonthlyReport();
      await service.generateQuarterlyReport();

      const weeklyOnly = service.getHistoricalReports('weekly');
      weeklyOnly.forEach((report) => {
        expect(report.type).toBe('weekly');
      });
    });

    it('should respect limit parameter', async () => {
      const history = service.getHistoricalReports(undefined, 5);
      expect(history.length).toBeLessThanOrEqual(5);
    });

    it('should sort by period end date descending', async () => {
      const history = service.getHistoricalReports(undefined, 10);
      
      for (let i = 1; i < history.length; i++) {
        const prevEnd = new Date(history[i - 1].period.end);
        const currEnd = new Date(history[i].period.end);
        expect(prevEnd.getTime()).toBeGreaterThanOrEqual(currEnd.getTime());
      }
    });
  });

  describe('Quarter Period Calculations', () => {
    // These tests verify the quarter label is correct
    // The cache interactions from previous tests may affect exact dates
    // but the quarter classification should be correct
    
    it('should calculate Q1 correctly', async () => {
      service.clearCache();
      const janDate = new Date(2025, 0, 15); // January
      const report = await service.generateQuarterlyReport(janDate);

      // The label should indicate Q1 regardless of cache state
      expect(report.period.label).toContain('一季度');
      expect(report.type).toBe('quarterly');
    });

    it('should calculate Q2 correctly', async () => {
      service.clearCache();
      const mayDate = new Date(2025, 4, 15); // May
      const report = await service.generateQuarterlyReport(mayDate);

      expect(report.period.label).toContain('二季度');
      expect(report.type).toBe('quarterly');
    });

    it('should calculate Q3 correctly', async () => {
      service.clearCache();
      const augDate = new Date(2025, 7, 15); // August
      const report = await service.generateQuarterlyReport(augDate);

      expect(report.period.label).toContain('三季度');
      expect(report.type).toBe('quarterly');
    });

    it('should calculate Q4 correctly', async () => {
      service.clearCache();
      const novDate = new Date(2025, 10, 15); // November
      const report = await service.generateQuarterlyReport(novDate);

      expect(report.period.label).toContain('四季度');
      expect(report.type).toBe('quarterly');
    });

    it('should generate valid quarterly date range', async () => {
      service.clearCache();
      const date = new Date(2025, 6, 15); // July - Q3
      const report = await service.generateQuarterlyReport(date);

      // Verify we get a valid date range
      const startDate = new Date(report.period.start);
      const endDate = new Date(report.period.end);
      
      expect(startDate.getTime()).toBeLessThan(endDate.getTime());
      // Quarter should span ~90 days
      const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeGreaterThanOrEqual(89);
      expect(daysDiff).toBeLessThanOrEqual(92);
    });
  });
});
