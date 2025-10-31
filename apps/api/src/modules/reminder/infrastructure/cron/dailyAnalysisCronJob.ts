import { SmartFrequencyAnalysisService } from '../../application/services/SmartFrequencyAnalysisService';
import { FrequencyAdjustmentService } from '../../application/services/FrequencyAdjustmentService';
import { ReminderContainer } from '../di/ReminderContainer';

/**
 * 每日分析 Cron Job
 * 
 * 执行时间：每天凌晨 2:00
 * Cron 表达式：0 2 * * *
 * 
 * 职责：
 * - 分析所有账户的提醒效果
 * - 自动调整低效提醒的频率
 * - 生成分析报告
 */
export class DailyAnalysisCronJob {
  private analysisService!: SmartFrequencyAnalysisService;
  private adjustmentService!: FrequencyAdjustmentService;

  /**
   * 初始化服务
   */
  private async initialize(): Promise<void> {
    this.analysisService = await SmartFrequencyAnalysisService.getInstance();
    this.adjustmentService = await FrequencyAdjustmentService.getInstance();
  }

  /**
   * 执行每日分析任务
   */
  async execute(): Promise<void> {
    console.log('[DailyAnalysisCronJob] Starting daily analysis...');
    const startTime = Date.now();

    try {
      await this.initialize();

      // 获取所有活跃账户
      const accountUuids = await this.getAllActiveAccounts();
      console.log(`[DailyAnalysisCronJob] Found ${accountUuids.length} active accounts`);

      // 分析结果统计
      let totalTemplatesAnalyzed = 0;
      let totalAdjustmentsMade = 0;
      const failedAccounts: string[] = [];

      // 逐个分析账户
      for (const accountUuid of accountUuids) {
        try {
          const result = await this.analyzeAccount(accountUuid);
          totalTemplatesAnalyzed += result.templatesAnalyzed;
          totalAdjustmentsMade += result.adjustmentsMade;
        } catch (error) {
          console.error(`[DailyAnalysisCronJob] Failed to analyze account ${accountUuid}:`, error);
          failedAccounts.push(accountUuid);
        }
      }

      const duration = Date.now() - startTime;
      console.log('[DailyAnalysisCronJob] Daily analysis completed:', {
        duration: `${(duration / 1000).toFixed(2)}s`,
        totalAccounts: accountUuids.length,
        totalTemplatesAnalyzed,
        totalAdjustmentsMade,
        failedAccounts: failedAccounts.length,
      });

      // 保存分析报告
      await this.saveAnalysisReport({
        executedAt: startTime,
        duration,
        totalAccounts: accountUuids.length,
        totalTemplatesAnalyzed,
        totalAdjustmentsMade,
        failedAccounts,
      });
    } catch (error) {
      console.error('[DailyAnalysisCronJob] Fatal error during daily analysis:', error);
      throw error;
    }
  }

  /**
   * 分析单个账户
   */
  private async analyzeAccount(
    accountUuid: string,
  ): Promise<{ templatesAnalyzed: number; adjustmentsMade: number }> {
    console.log(`[DailyAnalysisCronJob] Analyzing account ${accountUuid}...`);

    // 1. 生成效果分析报告
    const report = await this.analysisService.analyzeAllTemplates(accountUuid);

    // 2. 自动调整低效提醒
    const adjustments = await this.adjustmentService.batchAutoAdjust(accountUuid);

    console.log(`[DailyAnalysisCronJob] Account ${accountUuid} analyzed:`, {
      totalTemplates: report.totalTemplates,
      avgClickRate: `${report.avgClickRate.toFixed(2)}%`,
      avgEffectiveness: report.avgEffectivenessScore.toFixed(2),
      lowEffectiveCount: report.lowEffective.length,
      adjustmentsMade: adjustments.length,
    });

    return {
      templatesAnalyzed: report.totalTemplates,
      adjustmentsMade: adjustments.length,
    };
  }

  /**
   * 获取所有活跃账户
   * 
   * 定义：最近30天内有至少一个活跃提醒模板的账户
   */
  private async getAllActiveAccounts(): Promise<string[]> {
    const container = ReminderContainer.getInstance();
    const prisma = container.getPrismaClient();

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // 查询最近30天内有活跃模板的账户
    const accounts = await prisma.reminderTemplate.findMany({
      where: {
        selfEnabled: true,
        status: 'active',
        // TODO: 需要运行 Prisma migration 后才能使用 smartFrequencyEnabled
        // smartFrequencyEnabled: true,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        accountUuid: true,
      },
      distinct: ['accountUuid'],
    });

    return accounts.map((a) => a.accountUuid);
  }

  /**
   * 保存分析报告
   * 
   * TODO: 实现报告持久化
   * 可以选择：
   * - 保存到数据库
   * - 保存到文件系统
   * - 发送到监控系统
   */
  private async saveAnalysisReport(report: {
    executedAt: number;
    duration: number;
    totalAccounts: number;
    totalTemplatesAnalyzed: number;
    totalAdjustmentsMade: number;
    failedAccounts: string[];
  }): Promise<void> {
    // TODO: 持久化报告
    console.log('[DailyAnalysisCronJob] Analysis report:', report);
  }
}

/**
 * Cron Job 注册函数
 * 
 * 使用 node-cron 或其他调度器注册此任务
 * 
 * @example
 * ```typescript
 * import cron from 'node-cron';
 * 
 * // 每天凌晨 2:00 执行
 * cron.schedule('0 2 * * *', async () => {
 *   const job = new DailyAnalysisCronJob();
 *   await job.execute();
 * });
 * ```
 */
export async function registerDailyAnalysisCronJob(): Promise<void> {
  const job = new DailyAnalysisCronJob();
  
  // TODO: 使用实际的 cron 调度器
  // 例如：node-cron, bull, agenda 等
  console.log('[DailyAnalysisCronJob] Registered (schedule: 0 2 * * *)');
  
  // 开发环境可以手动触发测试
  if (process.env.NODE_ENV === 'development') {
    console.log('[DailyAnalysisCronJob] Development mode - execute manually with: job.execute()');
  }
}
