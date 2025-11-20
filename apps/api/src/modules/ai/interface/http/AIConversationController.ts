/**
 * AI Conversation Controller
 * AI 对话控制器
 *
 * 职责：
 * - 处理 AI 对话相关的 HTTP 请求
 * - 支持普通响应和 SSE 流式响应
 * - 调用 Domain Service 处理业务逻辑
 * - 格式化响应
 * - 错误处理
 */

import type { Response } from 'express';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';
import type { AuthenticatedRequest } from '../../../../shared/middlewares/authMiddleware';
import { AIContainer } from '../../infrastructure/di/AIContainer';
import type { AIGenerationResult } from '@dailyuse/domain-server';
import {
  QuotaExceededError,
  ValidationError,
  GenerationFailedError,
  AIGenerationService,
  QuotaEnforcementService,
} from '@dailyuse/domain-server';

const logger = createLogger('AIConversationController');

/**
 * AI Conversation Controller
 */
export class AIConversationController {
  private static responseBuilder = createResponseBuilder();
  private static container = AIContainer.getInstance();

  /**
   * 发送聊天消息（普通响应）
   * POST /api/ai/chat
   */
  static async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { message, conversationUuid, systemPrompt, maxTokens, temperature } = req.body;
      const accountUuid = req.user?.accountUuid;

      // 验证认证
      if (!accountUuid) {
        res
          .status(401)
          .json(
            AIConversationController.responseBuilder.error(
              ResponseCode.UNAUTHORIZED,
              'Authentication required',
            ),
          );
        return;
      }

      // 验证必需参数
      if (!message) {
        res
          .status(400)
          .json(
            AIConversationController.responseBuilder.error(
              ResponseCode.VALIDATION_ERROR,
              'message is required',
            ),
          );
        return;
      }

      logger.info('Sending chat message', {
        accountUuid,
        conversationUuid,
        messageLength: message.length,
      });

      // 调用 Domain Service
      const service = AIConversationController.container.getGenerationService();
      const result = await service.generateText({
        accountUuid,
        conversationUuid,
        userMessage: message,
        systemPrompt,
        maxTokens,
        temperature,
      });

      // 返回成功响应
      res.status(200).json(
        AIConversationController.responseBuilder.success(
          {
            conversationUuid: result.conversationUuid,
            userMessageUuid: result.userMessageUuid,
            assistantMessageUuid: result.assistantMessageUuid,
            content: result.content,
            tokensUsed: result.tokensUsed,
            quotaRemaining: result.quotaRemaining,
          },
          'Message sent successfully',
        ),
      );
    } catch (error) {
      AIConversationController.handleError(error, res);
    }
  }

  /**
   * 发送聊天消息（流式响应）
   * POST /api/ai/chat/stream
   */
  static async sendMessageStream(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { message, conversationUuid, systemPrompt, maxTokens, temperature } = req.body;
      const accountUuid = req.user?.accountUuid;

      // 验证认证
      if (!accountUuid) {
        res
          .status(401)
          .json(
            AIConversationController.responseBuilder.error(
              ResponseCode.UNAUTHORIZED,
              'Authentication required',
            ),
          );
        return;
      }

      // 验证必需参数
      if (!message) {
        res
          .status(400)
          .json(
            AIConversationController.responseBuilder.error(
              ResponseCode.VALIDATION_ERROR,
              'message is required',
            ),
          );
        return;
      }

      logger.info('Starting chat stream', {
        accountUuid,
        conversationUuid,
        messageLength: message.length,
      });

      // 设置 SSE 响应头
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // 禁用 nginx 缓冲

      // 发送初始连接事件
      res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected' })}\n\n`);

      // 调用 Domain Service
      const service = AIConversationController.container.getGenerationService();

      await service.generateStream(
        {
          accountUuid,
          conversationUuid,
          userMessage: message,
          systemPrompt,
          maxTokens,
          temperature,
        },
        {
          onStart: () => {
            res.write(`event: start\ndata: ${JSON.stringify({ status: 'generating' })}\n\n`);
          },
          onChunk: (chunk: string) => {
            res.write(`event: chunk\ndata: ${JSON.stringify({ content: chunk })}\n\n`);
          },
          onComplete: (result: AIGenerationResult) => {
            res.write(
              `event: complete\ndata: ${JSON.stringify({
                status: 'completed',
                tokensUsed: result.tokenUsage?.totalTokens ?? 0,
                finishReason: result.finishReason,
              })}\n\n`,
            );
            res.end();
          },
          onError: (error: Error) => {
            logger.error('Stream error', { error });
            res.write(
              `event: error\ndata: ${JSON.stringify({
                status: 'error',
                message: error.message,
              })}\n\n`,
            );
            res.end();
          },
        },
      );
    } catch (error) {
      logger.error('Failed to start stream', { error });

      // 如果还没有发送响应头，返回 JSON 错误
      if (!res.headersSent) {
        AIConversationController.handleError(error, res);
      } else {
        // 如果已经发送了流，发送错误事件
        res.write(
          `event: error\ndata: ${JSON.stringify({
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
          })}\n\n`,
        );
        res.end();
      }
    }
  }

  /**
   * 获取对话历史
   * GET /api/ai/conversations
   */
  static async getConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        res
          .status(401)
          .json(
            AIConversationController.responseBuilder.error(
              ResponseCode.UNAUTHORIZED,
              'Authentication required',
            ),
          );
        return;
      }

      logger.info('Getting conversation history', { accountUuid });

      // 调用 Domain Service
      const service = AIConversationController.container.getGenerationService();
      const conversations = await service.getConversationHistory(accountUuid);

      // 转换为 Client DTO
      const conversationDTOs = conversations.map((conv: any) => {
        const dto = conv.toClientDTO();
        return dto;
      });

      res
        .status(200)
        .json(
          AIConversationController.responseBuilder.success(
            conversationDTOs,
            'Conversations retrieved successfully',
          ),
        );
    } catch (error) {
      AIConversationController.handleError(error, res);
    }
  }

  /**
   * 获取单个对话详情（包含消息）
   * GET /api/ai/conversations/:id
   */
  static async getConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        res
          .status(401)
          .json(
            AIConversationController.responseBuilder.error(
              ResponseCode.UNAUTHORIZED,
              'Authentication required',
            ),
          );
        return;
      }

      if (!id) {
        res
          .status(400)
          .json(
            AIConversationController.responseBuilder.error(
              ResponseCode.VALIDATION_ERROR,
              'Conversation ID is required',
            ),
          );
        return;
      }

      logger.info('Getting conversation', { accountUuid, conversationId: id });

      // 调用 Domain Service
      const service = AIConversationController.container.getGenerationService();
      const conversation = await service.getConversation(id);

      if (!conversation) {
        res
          .status(404)
          .json(
            AIConversationController.responseBuilder.error(
              ResponseCode.NOT_FOUND,
              'Conversation not found',
            ),
          );
        return;
      }

      // 验证所有权
      if (conversation.accountUuid !== accountUuid) {
        res
          .status(403)
          .json(
            AIConversationController.responseBuilder.error(ResponseCode.FORBIDDEN, 'Access denied'),
          );
        return;
      }

      // 转换为 Client DTO（包含消息）
      const conversationDTO = conversation.toClientDTO();
      // 手动添加消息
      const messages = conversation.getAllMessages().map((msg: any) => msg.toClientDTO());
      const fullDTO = {
        ...conversationDTO,
        messages,
      };

      res
        .status(200)
        .json(
          AIConversationController.responseBuilder.success(
            fullDTO,
            'Conversation retrieved successfully',
          ),
        );
    } catch (error) {
      AIConversationController.handleError(error, res);
    }
  }

  /**
   * 获取配额状态
   * GET /api/ai/quota
   */
  static async getQuotaStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        res
          .status(401)
          .json(
            AIConversationController.responseBuilder.error(
              ResponseCode.UNAUTHORIZED,
              'Authentication required',
            ),
          );
        return;
      }

      logger.info('Getting quota status', { accountUuid });

      // 调用 Domain Service
      const quotaService = AIConversationController.container.getQuotaService();
      const status = await quotaService.getQuotaStatus(accountUuid);

      res
        .status(200)
        .json(
          AIConversationController.responseBuilder.success(
            status,
            'Quota status retrieved successfully',
          ),
        );
    } catch (error) {
      AIConversationController.handleError(error, res);
    }
  }

  /**
   * 生成关键结果
   * POST /api/ai/generate/key-results
   */
  static async generateKeyResults(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        res
          .status(401)
          .json(
            AIConversationController.responseBuilder.error(
              ResponseCode.UNAUTHORIZED,
              'Authentication required',
            ),
          );
        return;
      }

      // Validate request
      const { goalTitle, goalDescription, startDate, endDate, goalContext } = req.body;

      if (!goalTitle || typeof goalTitle !== 'string') {
        res
          .status(400)
          .json(
            AIConversationController.responseBuilder.error(
              ResponseCode.VALIDATION_ERROR,
              'goalTitle is required and must be a string',
            ),
          );
        return;
      }

      if (!startDate || typeof startDate !== 'number') {
        res
          .status(400)
          .json(
            AIConversationController.responseBuilder.error(
              ResponseCode.VALIDATION_ERROR,
              'startDate is required and must be a timestamp',
            ),
          );
        return;
      }

      if (!endDate || typeof endDate !== 'number') {
        res
          .status(400)
          .json(
            AIConversationController.responseBuilder.error(
              ResponseCode.VALIDATION_ERROR,
              'endDate is required and must be a timestamp',
            ),
          );
        return;
      }

      logger.info('Generating key results', { accountUuid, goalTitle });

      // Call application service
      const appService = AIConversationController.container.getApplicationService();
      const result = await appService.generateKeyResults({
        accountUuid,
        goalTitle,
        goalDescription,
        startDate,
        endDate,
        goalContext,
      });

      res.status(200).json(
        AIConversationController.responseBuilder.success(
          {
            keyResults: result.keyResults,
            tokenUsage: result.tokenUsage,
            generatedAt: result.generatedAt,
          },
          'Key results generated successfully',
        ),
      );
    } catch (error) {
      AIConversationController.handleError(error, res);
    }
  }

  /**
   * 生成任务模板
   * POST /api/ai/generate/tasks
   */
  static async generateTasks(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        res
          .status(401)
          .json(
            AIConversationController.responseBuilder.error(
              ResponseCode.UNAUTHORIZED,
              'Authentication required',
            ),
          );
        return;
      }

      // Validate request
      const {
        keyResultTitle,
        keyResultDescription,
        targetValue,
        currentValue,
        unit,
        timeRemaining,
      } = req.body;

      if (!keyResultTitle || typeof keyResultTitle !== 'string') {
        res
          .status(400)
          .json(
            AIConversationController.responseBuilder.error(
              ResponseCode.VALIDATION_ERROR,
              'keyResultTitle is required and must be a string',
            ),
          );
        return;
      }

      if (targetValue === undefined || typeof targetValue !== 'number') {
        res
          .status(400)
          .json(
            AIConversationController.responseBuilder.error(
              ResponseCode.VALIDATION_ERROR,
              'targetValue is required and must be a number',
            ),
          );
        return;
      }

      if (currentValue === undefined || typeof currentValue !== 'number') {
        res
          .status(400)
          .json(
            AIConversationController.responseBuilder.error(
              ResponseCode.VALIDATION_ERROR,
              'currentValue is required and must be a number',
            ),
          );
        return;
      }

      if (timeRemaining === undefined || typeof timeRemaining !== 'number') {
        res
          .status(400)
          .json(
            AIConversationController.responseBuilder.error(
              ResponseCode.VALIDATION_ERROR,
              'timeRemaining is required and must be a number',
            ),
          );
        return;
      }

      logger.info('Generating tasks', { accountUuid, keyResultTitle });

      // Call application service
      const appService = AIConversationController.container.getApplicationService();
      const result = await appService.generateTasks({
        accountUuid,
        keyResultTitle,
        keyResultDescription,
        targetValue,
        currentValue,
        unit,
        timeRemaining,
      });

      res.status(200).json(
        AIConversationController.responseBuilder.success(
          {
            tasks: result.tasks,
            tokenUsage: result.tokenUsage,
            generatedAt: result.generatedAt,
          },
          'Tasks generated successfully',
        ),
      );
    } catch (error) {
      AIConversationController.handleError(error, res);
    }
  }

  /**
   * 统一错误处理
   */
  private static handleError(error: unknown, res: Response): void {
    logger.error('Controller error', { error });

    if (error instanceof QuotaExceededError) {
      res
        .status(429)
        .json(
          AIConversationController.responseBuilder.error(
            ResponseCode.INTERNAL_ERROR,
            error.message,
          ),
        );
      return;
    }

    if (error instanceof ValidationError) {
      res
        .status(400)
        .json(
          AIConversationController.responseBuilder.error(
            ResponseCode.VALIDATION_ERROR,
            error.message,
          ),
        );
      return;
    }

    if (error instanceof GenerationFailedError) {
      res
        .status(500)
        .json(
          AIConversationController.responseBuilder.error(
            ResponseCode.INTERNAL_ERROR,
            error.message,
          ),
        );
      return;
    }

    // 默认错误响应
    res
      .status(500)
      .json(
        AIConversationController.responseBuilder.error(
          ResponseCode.INTERNAL_ERROR,
          error instanceof Error ? error.message : 'Internal server error',
        ),
      );
  }
}
