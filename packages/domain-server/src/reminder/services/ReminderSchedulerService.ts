/**
 * ReminderSchedulerService - 提醒调度服务
 *
 * DDD Domain Service:
 * - 管理提醒的调度
 * - 批量处理待触发的提醒
 * - 协调触发服务和控制服务
 *
 * 职责：
 * - 扫描待触发的提醒
 * - 批量触发提醒
 * - 处理调度异常
 * - 定期更新统计数据
 */

import type { ReminderTemplate } from '../aggregates/ReminderTemplate';
import type { IReminderTemplateRepository } from '../repositories/IReminderTemplateRepository';
import type { IReminderStatisticsRepository } from '../repositories/IReminderStatisticsRepository';
import type { ReminderTriggerService, ITriggerReminderResult } from './ReminderTriggerService';
import { ReminderContracts } from '@dailyuse/contracts';

type TriggerResult = ReminderContracts.TriggerResult;

/**
 * 调度结果
 */
export interface IScheduleResult {
  /** 成功数量 */
  successCount: number;
  /** 失败数量 */
  failedCount: number;
  /** 跳过数量 */
  skippedCount: number;
  /** 总数 */
  totalCount: number;
  /** 详细结果 */
  details: ITriggerReminderResult[];
  /** 执行时长（毫秒） */
  duration: number;
}

/**
 * 调度选项
 */
export interface IScheduleOptions {
  /** 账户 UUID（可选，不传则处理所有账户） */
  accountUuid?: string;
  /** 在此时间之前触发的提醒（默认当前时间） */
  beforeTime?: number;
  /** 最大处理数量（防止一次处理过多） */
  maxCount?: number;
  /** 并发数量（默认 10） */
  concurrency?: number;
}

/**
 * ReminderSchedulerService
 */
export class ReminderSchedulerService {
  constructor(
    private readonly templateRepository: IReminderTemplateRepository,
    private readonly statisticsRepository: IReminderStatisticsRepository,
    private readonly triggerService: ReminderTriggerService,
  ) {}

  /**
   * 执行调度任务
   *
   * 扫描待触发的提醒并批量触发
   */
  async schedule(options: IScheduleOptions = {}): Promise<IScheduleResult> {
    const startTime = Date.now();
    const {
      accountUuid,
      beforeTime = Date.now(),
      maxCount = 100,
      concurrency = 10,
    } = options;

    // 获取待触发的提醒
    const pendingReminders = await this.triggerService.getPendingReminders(
      beforeTime,
      accountUuid,
    );

    // 限制数量
    const remindersToProcess = pendingReminders.slice(0, maxCount);
    const totalCount = remindersToProcess.length;

    if (totalCount === 0) {
      return {
        successCount: 0,
        failedCount: 0,
        skippedCount: 0,
        totalCount: 0,
        details: [],
        duration: Date.now() - startTime,
      };
    }

    // 批量触发（控制并发）
    const results: ITriggerReminderResult[] = [];
    for (let i = 0; i < remindersToProcess.length; i += concurrency) {
      const batch = remindersToProcess.slice(i, i + concurrency);
      const batchParams = batch.map(template => ({
        template,
        triggerTime: beforeTime,
      }));
      const batchResults = await this.triggerService.triggerRemindersBatch(batchParams);
      results.push(...batchResults);
    }

    // 统计结果
    const successCount = results.filter(r => r.result === TriggerResult.SUCCESS).length;
    const failedCount = results.filter(r => r.result === TriggerResult.FAILED).length;
    const skippedCount = results.filter(r => r.result === TriggerResult.SKIPPED).length;

    return {
      successCount,
      failedCount,
      skippedCount,
      totalCount,
      details: results,
      duration: Date.now() - startTime,
    };
  }

  /**
   * 重新计算所有提醒的下次触发时间
   *
   * 用于修复数据或重新初始化
   */
  async recalculateAllNextTriggerTimes(accountUuid: string): Promise<number> {
    const templates = await this.templateRepository.findByAccountUuid(accountUuid, {
      includeDeleted: false,
    });

    let updatedCount = 0;
    for (const template of templates) {
      const nextTriggerTime = template.calculateNextTriggerTime();
      if (template.nextTriggerTime !== nextTriggerTime) {
        template.updateNextTriggerTime(nextTriggerTime);
        await this.templateRepository.save(template);
        updatedCount++;
      }
    }

    return updatedCount;
  }

  /**
   * 重新计算账户的统计数据
   */
  async recalculateStatistics(accountUuid: string): Promise<void> {
    const statistics = await this.statisticsRepository.findOrCreate(accountUuid);
    const templates = await this.templateRepository.findByAccountUuid(accountUuid, {
      includeHistory: true,
    });

    // 调用聚合根的 calculate 方法重新计算
    statistics.calculate(templates);
    
    await this.statisticsRepository.save(statistics);
  }

  /**
   * 批量重新计算多个账户的统计数据
   */
  async recalculateStatisticsBatch(accountUuids: string[]): Promise<void> {
    for (const accountUuid of accountUuids) {
      await this.recalculateStatistics(accountUuid);
    }
  }

  /**
   * 获取即将触发的提醒（未来一段时间内）
   *
   * @param accountUuid 账户 UUID
   * @param withinMinutes 未来多少分钟内（默认 60）
   */
  async getUpcomingReminders(
    accountUuid: string,
    withinMinutes: number = 60,
  ): Promise<ReminderTemplate[]> {
    const now = Date.now();
    const future = now + withinMinutes * 60 * 1000;

    const templates = await this.templateRepository.findByNextTriggerBefore(future, accountUuid);
    
    // 过滤出真正在未来时间范围内的（排除已过期的）
    return templates.filter(t => t.nextTriggerTime && t.nextTriggerTime > now);
  }

  /**
   * 获取过期未触发的提醒
   *
   * @param accountUuid 账户 UUID
   * @param beforeMinutes 多少分钟前（默认 5）
   */
  async getOverdueReminders(
    accountUuid: string,
    beforeMinutes: number = 5,
  ): Promise<ReminderTemplate[]> {
    const now = Date.now();
    const past = now - beforeMinutes * 60 * 1000;

    return await this.templateRepository.findByNextTriggerBefore(past, accountUuid);
  }

  /**
   * 处理过期未触发的提醒
   *
   * @param accountUuid 账户 UUID
   * @param action 处理动作：'trigger' 立即触发 | 'skip' 跳过并记录 | 'reschedule' 重新调度
   */
  async handleOverdueReminders(
    accountUuid: string,
    action: 'trigger' | 'skip' | 'reschedule' = 'skip',
  ): Promise<IScheduleResult> {
    const startTime = Date.now();
    const overdueReminders = await this.getOverdueReminders(accountUuid);

    if (overdueReminders.length === 0) {
      return {
        successCount: 0,
        failedCount: 0,
        skippedCount: 0,
        totalCount: 0,
        details: [],
        duration: Date.now() - startTime,
      };
    }

    const results: ITriggerReminderResult[] = [];

    switch (action) {
      case 'trigger':
        // 立即触发
        const triggerParams = overdueReminders.map(template => ({
          template,
          reason: '过期补触发',
        }));
        const triggerResults = await this.triggerService.triggerRemindersBatch(triggerParams);
        results.push(...triggerResults);
        break;

      case 'skip':
        // 跳过并记录
        for (const template of overdueReminders) {
          await this.triggerService.recordTriggerSkipped(
            template,
            '过期跳过',
            template.nextTriggerTime || Date.now(),
          );
          
          // 计算下次触发时间
          const nextTriggerTime = template.calculateNextTriggerTime();
          template.updateNextTriggerTime(nextTriggerTime);
          await this.templateRepository.save(template);

          results.push({
            success: true,
            result: TriggerResult.SKIPPED,
            triggerTime: template.nextTriggerTime || Date.now(),
            nextTriggerTime,
            message: '过期跳过',
          });
        }
        break;

      case 'reschedule':
        // 重新调度到下一个时间点
        for (const template of overdueReminders) {
          const nextTriggerTime = template.calculateNextTriggerTime();
          template.updateNextTriggerTime(nextTriggerTime);
          await this.templateRepository.save(template);

          results.push({
            success: true,
            result: TriggerResult.SKIPPED,
            triggerTime: Date.now(),
            nextTriggerTime,
            message: '重新调度',
          });
        }
        break;
    }

    const successCount = results.filter(r => r.result === TriggerResult.SUCCESS).length;
    const failedCount = results.filter(r => r.result === TriggerResult.FAILED).length;
    const skippedCount = results.filter(r => r.result === TriggerResult.SKIPPED).length;

    return {
      successCount,
      failedCount,
      skippedCount,
      totalCount: overdueReminders.length,
      details: results,
      duration: Date.now() - startTime,
    };
  }
}
