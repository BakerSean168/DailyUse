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
});
