import type { IReminderTemplateRepository } from '@dailyuse/domain-server';
import { FrequencyAdjustment } from '@dailyuse/domain-server';
import { ReminderContainer } from '../../infrastructure/di/ReminderContainer';
import { SmartFrequencyAnalysisService } from './SmartFrequencyAnalysisService';

/**
 * 调整结果
 */
export interface AdjustmentResult {
  templateId: string;
  success: boolean;
  originalInterval: number;
  adjustedInterval: number;
  reason: string;
  appliedAt: number;
}

/**
 * Frequency Adjustment Service
 * 
 * 职责：
 * - 应用频率调整建议
 * - 处理用户确认/拒绝调整
 * - 自动应用调整（当用户启用自动模式时）
 */
export class FrequencyAdjustmentService {
  private static instance: FrequencyAdjustmentService;

  private constructor(
    private reminderTemplateRepository: IReminderTemplateRepository,
    private analysisService: SmartFrequencyAnalysisService,
  ) {}

  /**
   * 创建服务实例
   */
  static async createInstance(
    reminderTemplateRepository?: IReminderTemplateRepository,
    analysisService?: SmartFrequencyAnalysisService,
  ): Promise<FrequencyAdjustmentService> {
    const container = ReminderContainer.getInstance();
    const templateRepo = reminderTemplateRepository || container.getReminderTemplateRepository();
    const analysis = analysisService || (await SmartFrequencyAnalysisService.getInstance());

    FrequencyAdjustmentService.instance = new FrequencyAdjustmentService(templateRepo, analysis);
    return FrequencyAdjustmentService.instance;
  }

  /**
   * 获取服务单例
   */
  static async getInstance(): Promise<FrequencyAdjustmentService> {
    if (!FrequencyAdjustmentService.instance) {
      FrequencyAdjustmentService.instance = await FrequencyAdjustmentService.createInstance();
    }
    return FrequencyAdjustmentService.instance;
  }

  /**
   * 用户接受调整建议
   * 
   * @param templateId - 提醒模板ID
   */
  async acceptAdjustment(templateId: string): Promise<AdjustmentResult> {
    const template = await this.reminderTemplateRepository.findById(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // 检查是否有待确认的调整
    if (!template.frequencyAdjustment || template.frequencyAdjustment.userConfirmed) {
      throw new Error('No pending adjustment to accept');
    }

    // 应用调整
    const adjustment = template.frequencyAdjustment;
    await this.applyAdjustment(templateId, {
      originalInterval: adjustment.originalInterval,
      adjustedInterval: adjustment.adjustedInterval,
      reason: adjustment.adjustmentReason,
    });

    // 标记为已确认
    template.confirmFrequencyAdjustment();
    await this.reminderTemplateRepository.save(template);

    return {
      templateId,
      success: true,
      originalInterval: adjustment.originalInterval,
      adjustedInterval: adjustment.adjustedInterval,
      reason: adjustment.adjustmentReason,
      appliedAt: Date.now(),
    };
  }

  /**
   * 用户拒绝调整建议
   * 
   * @param templateId - 提醒模板ID
   */
  async rejectAdjustment(templateId: string): Promise<void> {
    const template = await this.reminderTemplateRepository.findById(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // 拒绝调整
    template.rejectFrequencyAdjustment('用户手动拒绝');
    await this.reminderTemplateRepository.save(template);
  }

  /**
   * 自动应用调整（不需要用户确认）
   * 
   * @param templateId - 提醒模板ID
   * @param adjustment - 调整建议
   */
  async applyAutoAdjustment(
    templateId: string,
    adjustment: {
      originalInterval: number;
      adjustedInterval: number;
      reason: string;
    },
  ): Promise<AdjustmentResult> {
    const template = await this.reminderTemplateRepository.findById(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // 创建频率调整记录
    const frequencyAdjustment = FrequencyAdjustment.create({
      originalInterval: adjustment.originalInterval,
      adjustedInterval: adjustment.adjustedInterval,
      adjustmentReason: adjustment.reason,
      isAutoAdjusted: true,
      userConfirmed: true, // 自动调整立即确认
    });

    template.applyFrequencyAdjustment(frequencyAdjustment.toServerDTO());

    // 应用到 trigger 配置
    await this.applyAdjustment(templateId, adjustment);

    await this.reminderTemplateRepository.save(template);

    return {
      templateId,
      success: true,
      originalInterval: adjustment.originalInterval,
      adjustedInterval: adjustment.adjustedInterval,
      reason: adjustment.reason,
      appliedAt: Date.now(),
    };
  }

  /**
   * 建议调整但等待用户确认（手动模式）
   * 
   * @param templateId - 提醒模板ID
   */
  async suggestAdjustment(templateId: string): Promise<AdjustmentResult | null> {
    const suggestion = await this.analysisService.suggestFrequencyAdjustment(templateId);
    if (!suggestion) {
      return null;
    }

    const template = await this.reminderTemplateRepository.findById(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // 创建频率调整记录（等待确认）
    const frequencyAdjustment = FrequencyAdjustment.create({
      originalInterval: suggestion.originalInterval,
      adjustedInterval: suggestion.adjustedInterval,
      adjustmentReason: suggestion.reason,
      isAutoAdjusted: false,
      userConfirmed: false, // 等待用户确认
    });

    template.applyFrequencyAdjustment(frequencyAdjustment.toServerDTO());
    await this.reminderTemplateRepository.save(template);

    return {
      templateId,
      success: true,
      originalInterval: suggestion.originalInterval,
      adjustedInterval: suggestion.adjustedInterval,
      reason: suggestion.reason,
      appliedAt: Date.now(),
    };
  }

  /**
   * 批量处理自动调整
   * 
   * @param accountUuid - 账户ID
   * @returns 调整结果列表
   */
  async batchAutoAdjust(accountUuid: string): Promise<AdjustmentResult[]> {
    const report = await this.analysisService.analyzeAllTemplates(accountUuid);
    const results: AdjustmentResult[] = [];

    // 处理低效提醒（自动降低频率）
    for (const lowEffective of report.lowEffective) {
      const template = await this.reminderTemplateRepository.findById(lowEffective.templateId);
      if (!template || !template.smartFrequencyEnabled) {
        continue;
      }

      // 检查是否已经有待确认的调整
      if (template.frequencyAdjustment && !template.frequencyAdjustment.userConfirmed) {
        continue;
      }

      try {
        const suggestion = await this.analysisService.suggestFrequencyAdjustment(
          lowEffective.templateId,
        );
        if (suggestion) {
          const result = await this.applyAutoAdjustment(lowEffective.templateId, suggestion);
          results.push(result);
        }
      } catch (error) {
        console.error(`Failed to adjust template ${lowEffective.templateId}:`, error);
      }
    }

    return results;
  }

  /**
   * 应用调整到 trigger 配置
   * 
   * 注意：这里需要根据实际的 trigger 配置结构来实现
   * 目前暂时作为占位方法
   * 
   * @private
   */
  private async applyAdjustment(
    templateId: string,
    adjustment: {
      originalInterval: number;
      adjustedInterval: number;
      reason: string;
    },
  ): Promise<void> {
    const template = await this.reminderTemplateRepository.findById(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // TODO: 实际应用到 trigger 配置
    // 这里需要：
    // 1. 解析当前的 trigger 配置
    // 2. 根据 trigger 类型（interval/cron/specific）更新间隔
    // 3. 保存更新后的配置

    // 示例：如果是 interval trigger
    // const trigger = template.trigger;
    // if (trigger.type === 'interval') {
    //   trigger.interval = adjustment.adjustedInterval;
    //   template.updateTrigger(trigger);
    //   await this.reminderTemplateRepository.save(template);
    // }

    console.log(`[FrequencyAdjustmentService] Would adjust template ${templateId}:`, {
      from: adjustment.originalInterval,
      to: adjustment.adjustedInterval,
      reason: adjustment.reason,
    });
  }
}
