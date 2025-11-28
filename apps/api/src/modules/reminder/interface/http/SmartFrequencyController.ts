import type { Request, Response } from 'express';
import { SmartFrequencyAnalysisService } from '../../application/services/SmartFrequencyAnalysisService';
import { FrequencyAdjustmentService } from '../../application/services/FrequencyAdjustmentService';
import { ReminderResponseService } from '../../application/services/ReminderResponseService';
import type { IReminderTemplateRepository } from '@dailyuse/domain-server';
import { ReminderContainer } from '../../infrastructure/di/ReminderContainer';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('SmartFrequencyController');

/**
 * Smart Frequency 控制器
 * 
 * 负责处理智能频率调整相关的 HTTP 请求
 * 
 * 职责：
 * - 提供效果分析报告
 * - 处理频率调整建议的接受/拒绝
 * - 触发手动分析
 * - 记录用户响应行为
 */
export class SmartFrequencyController {
  private static analysisService: SmartFrequencyAnalysisService | null = null;
  private static adjustmentService: FrequencyAdjustmentService | null = null;
  private static responseService: ReminderResponseService | null = null;
  private static templateRepository: IReminderTemplateRepository | null = null;
  private static responseBuilder = createResponseBuilder();

  /**
   * 初始化服务（延迟加载）
   */
  private static async getAnalysisService(): Promise<SmartFrequencyAnalysisService> {
    if (!SmartFrequencyController.analysisService) {
      SmartFrequencyController.analysisService =
        await SmartFrequencyAnalysisService.getInstance();
    }
    return SmartFrequencyController.analysisService;
  }

  private static async getAdjustmentService(): Promise<FrequencyAdjustmentService> {
    if (!SmartFrequencyController.adjustmentService) {
      SmartFrequencyController.adjustmentService =
        await FrequencyAdjustmentService.getInstance();
    }
    return SmartFrequencyController.adjustmentService;
  }

  private static async getResponseService(): Promise<ReminderResponseService> {
    if (!SmartFrequencyController.responseService) {
      SmartFrequencyController.responseService = await ReminderResponseService.getInstance();
    }
    return SmartFrequencyController.responseService;
  }

  private static getTemplateRepository(): IReminderTemplateRepository {
    if (!SmartFrequencyController.templateRepository) {
      const container = ReminderContainer.getInstance();
      SmartFrequencyController.templateRepository = container.getReminderTemplateRepository();
    }
    return SmartFrequencyController.templateRepository;
  }

  /**
   * 获取账户的效果分析报告
   * @route GET /api/reminders/smart-frequency/effectiveness-report/:accountUuid
   */
  static async getEffectivenessReport(req: Request, res: Response): Promise<Response> {
    try {
      const { accountUuid } = req.params;
      const service = await SmartFrequencyController.getAnalysisService();

      logger.info('Generating effectiveness report', { accountUuid });

      const report = await service.analyzeAllTemplates(accountUuid);

      logger.info('Effectiveness report generated', {
        accountUuid,
        totalTemplates: report.totalTemplates,
        avgEffectiveness: report.avgEffectivenessScore,
      });

      return SmartFrequencyController.responseBuilder.sendSuccess(
        res,
        report,
        'Effectiveness report generated successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error generating effectiveness report', { error: error.message });
        return SmartFrequencyController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return SmartFrequencyController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 分析单个提醒模板
   * @route POST /api/reminders/smart-frequency/analyze/:templateId
   */
  static async analyzeTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const { templateId } = req.params;
      const { lookbackDays = 30 } = req.body;
      const service = await SmartFrequencyController.getAnalysisService();

      logger.info('Analyzing template', { templateId, lookbackDays });

      const metrics = await service.analyzeTemplate(templateId, lookbackDays);

      if (!metrics) {
        logger.warn('Insufficient data for analysis', { templateId });
        return SmartFrequencyController.responseBuilder.sendError(res, {
          code: ResponseCode.BAD_REQUEST,
          message: 'Insufficient data for analysis (requires at least 10 responses)',
        });
      }

      logger.info('Template analyzed', {
        templateId,
        effectivenessScore: metrics.effectivenessScore,
        sampleSize: metrics.sampleSize,
      });

      return SmartFrequencyController.responseBuilder.sendSuccess(
        res,
        metrics.toServerDTO(),
        'Template analyzed successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error analyzing template', { error: error.message });
        return SmartFrequencyController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return SmartFrequencyController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取频率调整建议
   * @route GET /api/reminders/smart-frequency/suggestion/:templateId
   */
  static async getAdjustmentSuggestion(req: Request, res: Response): Promise<Response> {
    try {
      const { templateId } = req.params;
      const service = await SmartFrequencyController.getAnalysisService();

      logger.info('Getting adjustment suggestion', { templateId });

      const suggestion = await service.suggestFrequencyAdjustment(templateId);

      if (!suggestion) {
        logger.info('No adjustment needed', { templateId });
        return SmartFrequencyController.responseBuilder.sendSuccess(
          res,
          { needsAdjustment: false },
          'No adjustment needed',
        );
      }

      logger.info('Adjustment suggestion generated', {
        templateId,
        originalInterval: suggestion.originalInterval,
        adjustedInterval: suggestion.adjustedInterval,
      });

      return SmartFrequencyController.responseBuilder.sendSuccess(
        res,
        { needsAdjustment: true, suggestion },
        'Adjustment suggestion generated',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error getting adjustment suggestion', { error: error.message });
        return SmartFrequencyController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return SmartFrequencyController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 接受频率调整建议
   * @route POST /api/reminders/smart-frequency/accept-adjustment/:templateId
   */
  static async acceptAdjustment(req: Request, res: Response): Promise<Response> {
    try {
      const { templateId } = req.params;
      const service = await SmartFrequencyController.getAdjustmentService();

      logger.info('Accepting adjustment', { templateId });

      const result = await service.acceptAdjustment(templateId);

      logger.info('Adjustment accepted', {
        templateId,
        adjustedInterval: result.adjustedInterval,
      });

      return SmartFrequencyController.responseBuilder.sendSuccess(
        res,
        result,
        'Adjustment accepted and applied successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error accepting adjustment', { error: error.message });
        return SmartFrequencyController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return SmartFrequencyController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 拒绝频率调整建议
   * @route POST /api/reminders/smart-frequency/reject-adjustment/:templateId
   */
  static async rejectAdjustment(req: Request, res: Response): Promise<Response> {
    try {
      const { templateId } = req.params;
      const service = await SmartFrequencyController.getAdjustmentService();

      logger.info('Rejecting adjustment', { templateId });

      await service.rejectAdjustment(templateId);

      logger.info('Adjustment rejected', { templateId });

      return SmartFrequencyController.responseBuilder.sendSuccess(
        res,
        { templateId },
        'Adjustment rejected successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error rejecting adjustment', { error: error.message });
        return SmartFrequencyController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return SmartFrequencyController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 切换智能频率功能
   * @route POST /api/reminders/smart-frequency/toggle/:templateId
   */
  static async toggleSmartFrequency(req: Request, res: Response): Promise<Response> {
    try {
      const { templateId } = req.params;
      const { enabled } = req.body;

      if (typeof enabled !== 'boolean') {
        return SmartFrequencyController.responseBuilder.sendError(res, {
          code: ResponseCode.BAD_REQUEST,
          message: 'enabled must be a boolean',
        });
      }

      const repository = SmartFrequencyController.getTemplateRepository();
      const template = await repository.findById(templateId);

      if (!template) {
        return SmartFrequencyController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: `Template ${templateId} not found`,
        });
      }

      logger.info('Toggling smart frequency', { templateId, enabled });

      template.toggleSmartFrequency(enabled);
      await repository.save(template);

      logger.info('Smart frequency toggled', { templateId, enabled });

      return SmartFrequencyController.responseBuilder.sendSuccess(
        res,
        { templateId, smartFrequencyEnabled: enabled },
        `Smart frequency ${enabled ? 'enabled' : 'disabled'} successfully`,
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error toggling smart frequency', { error: error.message });
        return SmartFrequencyController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return SmartFrequencyController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 记录用户响应行为
   * @route POST /api/reminders/smart-frequency/record-response
   */
  static async recordResponse(req: Request, res: Response): Promise<Response> {
    try {
      const { templateId, action, responseTime } = req.body;

      // 验证必填字段
      if (!templateId || !action) {
        return SmartFrequencyController.responseBuilder.sendError(res, {
          code: ResponseCode.BAD_REQUEST,
          message: 'templateId and action are required',
        });
      }

      // 验证 action 类型
      const validActions = ['clicked', 'ignored', 'snoozed', 'dismissed', 'completed'];
      if (!validActions.includes(action)) {
        return SmartFrequencyController.responseBuilder.sendError(res, {
          code: ResponseCode.BAD_REQUEST,
          message: `Invalid action. Must be one of: ${validActions.join(', ')}`,
        });
      }

      // 验证模板是否存在
      const repository = SmartFrequencyController.getTemplateRepository();
      const template = await repository.findById(templateId);

      if (!template) {
        return SmartFrequencyController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: `Template ${templateId} not found`,
        });
      }

      // 记录响应
      const service = await SmartFrequencyController.getResponseService();
      const recordUuid = await service.recordResponse({
        templateUuid: templateId,
        action,
        responseTime,
      });

      logger.info('Response recorded', { templateId, action, recordUuid });

      return SmartFrequencyController.responseBuilder.sendSuccess(
        res,
        { templateId, action, recordUuid, recorded: true },
        'Response recorded successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error recording response', { error: error.message });
        return SmartFrequencyController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return SmartFrequencyController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取响应统计
   * @route GET /api/reminders/smart-frequency/response-stats/:templateId
   */
  static async getResponseStats(req: Request, res: Response): Promise<Response> {
    try {
      const { templateId } = req.params;
      const { lookbackDays = 30 } = req.query;

      const service = await SmartFrequencyController.getResponseService();
      const stats = await service.getResponseStats(templateId, Number(lookbackDays));

      logger.info('Response stats retrieved', { templateId, stats });

      return SmartFrequencyController.responseBuilder.sendSuccess(
        res,
        stats,
        'Response stats retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error getting response stats', { error: error.message });
        return SmartFrequencyController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return SmartFrequencyController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }
}


