/**
 * AI Generation Controller
 * AI 生成控制器
 *
 * 职责：
 * - 处理 AI 生成相关的 HTTP 请求
 * - 调用 ApplicationService 处理业务逻辑
 * - 格式化响应
 * - 错误处理
 */

import type { Response } from 'express';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';
import type { AuthenticatedRequest } from '../../../../shared/middlewares/authMiddleware';
import { AIContainer } from '../../infrastructure/di/AIContainer';

const logger = createLogger('AIGenerationController');

/**
 * AI Generation Controller
 */
export class AIGenerationController {
  private static responseBuilder = createResponseBuilder();
  private static container = AIContainer.getInstance();

  /**
   * 从用户想法生成 Goal（包含 Key Results）
   * POST /api/ai/generate/goal
   */
  static async generateGoal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { idea, context, providerUuid } = req.body;
      const accountUuid = req.user?.accountUuid;

      // 验证必需参数
      if (!accountUuid) {
        res
          .status(401)
          .json(
            AIGenerationController.responseBuilder.error(
              ResponseCode.UNAUTHORIZED,
              'Authentication required',
            ),
          );
        return;
      }

      if (!idea || typeof idea !== 'string' || idea.trim().length === 0) {
        res
          .status(400)
          .json(
            AIGenerationController.responseBuilder.error(
              ResponseCode.VALIDATION_ERROR,
              'idea is required and must be a non-empty string',
            ),
          );
        return;
      }

      logger.info('Generating goal from idea', {
        accountUuid,
        ideaLength: idea.length,
        hasContext: !!context,
        providerUuid,
      });

      // 调用 ApplicationService
      const service = AIGenerationController.container.getApplicationService();
      const result = await service.generateGoal({
        accountUuid,
        idea: idea.trim(),
        context: context?.trim(),
        providerUuid,
      });

      // 返回成功响应
      res
        .status(200)
        .json(
          AIGenerationController.responseBuilder.success(result, 'Goal generated successfully'),
        );
    } catch (error) {
      logger.error('Failed to generate goal', { error });
      res
        .status(500)
        .json(
          AIGenerationController.responseBuilder.error(
            ResponseCode.INTERNAL_ERROR,
            error instanceof Error ? error.message : 'Internal server error',
          ),
        );
    }
  }

  /**
   * 生成关键结果（Key Results）
   * POST /api/ai/generate/key-results
   */
  static async generateKeyResults(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { goalTitle, goalDescription, startDate, endDate, goalContext } = req.body;
      const accountUuid = req.user?.accountUuid;

      // 验证必需参数
      if (!accountUuid) {
        res
          .status(401)
          .json(
            AIGenerationController.responseBuilder.error(
              ResponseCode.UNAUTHORIZED,
              'Authentication required',
            ),
          );
        return;
      }

      if (!goalTitle) {
        res
          .status(400)
          .json(
            AIGenerationController.responseBuilder.error(
              ResponseCode.VALIDATION_ERROR,
              'goalTitle is required',
            ),
          );
        return;
      }

      logger.info('Generating key results', {
        accountUuid,
        goalTitle,
      });

      // 调用 ApplicationService
      const service = AIGenerationController.container.getApplicationService();
      const result = await service.generateKeyResults({
        accountUuid,
        goalTitle,
        goalDescription,
        startDate: startDate ?? Date.now(),
        endDate: endDate ?? Date.now() + 90 * 24 * 60 * 60 * 1000, // default 90 days
        goalContext,
      });

      // 返回成功响应
      res
        .status(200)
        .json(
          AIGenerationController.responseBuilder.success(
            result,
            'Key results generated successfully',
          ),
        );
    } catch (error) {
      logger.error('Failed to generate key results', { error });
      res
        .status(500)
        .json(
          AIGenerationController.responseBuilder.error(
            ResponseCode.INTERNAL_ERROR,
            error instanceof Error ? error.message : 'Internal server error',
          ),
        );
    }
  }

  /**
   * 生成任务模板（Task Templates）
   * POST /api/ai/generate/task-template
   */
  static async generateTaskTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { krTitle, krDescription, targetValue, unit } = req.body;
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        res
          .status(401)
          .json(
            AIGenerationController.responseBuilder.error(
              ResponseCode.UNAUTHORIZED,
              'Authentication required',
            ),
          );
        return;
      }

      if (!krTitle || !targetValue || !unit) {
        res
          .status(400)
          .json(
            AIGenerationController.responseBuilder.error(
              ResponseCode.VALIDATION_ERROR,
              'krTitle, targetValue, and unit are required',
            ),
          );
        return;
      }

      logger.info('Generating task template', {
        accountUuid,
        krTitle,
      });

      // TODO: 实现完整逻辑
      res
        .status(501)
        .json(
          AIGenerationController.responseBuilder.error(
            ResponseCode.INTERNAL_ERROR,
            'Task template generation not implemented yet',
          ),
        );
    } catch (error) {
      logger.error('Failed to generate task template', { error });
      res
        .status(500)
        .json(
          AIGenerationController.responseBuilder.error(
            ResponseCode.INTERNAL_ERROR,
            error instanceof Error ? error.message : 'Internal server error',
          ),
        );
    }
  }

  /**
   * 生成知识文档（Knowledge Documents）
   * POST /api/ai/generate/knowledge-document
   */
  static async generateKnowledgeDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { topic, context, templateType } = req.body;
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        res
          .status(401)
          .json(
            AIGenerationController.responseBuilder.error(
              ResponseCode.UNAUTHORIZED,
              'Authentication required',
            ),
          );
        return;
      }

      if (!topic || !templateType) {
        res
          .status(400)
          .json(
            AIGenerationController.responseBuilder.error(
              ResponseCode.VALIDATION_ERROR,
              'topic and templateType are required',
            ),
          );
        return;
      }

      logger.info('Generating knowledge document', {
        accountUuid,
        topic,
        templateType,
      });

      // TODO: 实现完整逻辑
      res
        .status(501)
        .json(
          AIGenerationController.responseBuilder.error(
            ResponseCode.INTERNAL_ERROR,
            'Knowledge document generation not implemented yet',
          ),
        );
    } catch (error) {
      logger.error('Failed to generate knowledge document', { error });
      res
        .status(500)
        .json(
          AIGenerationController.responseBuilder.error(
            ResponseCode.INTERNAL_ERROR,
            error instanceof Error ? error.message : 'Internal server error',
          ),
        );
    }
  }

  /**
   * 获取用户配额状态
   * GET /api/ai/quota
   */
  static async getQuotaStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        res
          .status(401)
          .json(
            AIGenerationController.responseBuilder.error(
              ResponseCode.UNAUTHORIZED,
              'Authentication required',
            ),
          );
        return;
      }

      logger.info('Getting quota status', { accountUuid });

      // 调用 ApplicationService
      const service = AIGenerationController.container.getApplicationService();
      const quota = await service.getQuotaStatus(accountUuid);

      res
        .status(200)
        .json(
          AIGenerationController.responseBuilder.success(
            quota,
            'Quota status retrieved successfully',
          ),
        );
    } catch (error) {
      logger.error('Failed to get quota status', { error });
      res
        .status(500)
        .json(
          AIGenerationController.responseBuilder.error(
            ResponseCode.INTERNAL_ERROR,
            error instanceof Error ? error.message : 'Internal server error',
          ),
        );
    }
  }
}


