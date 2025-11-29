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
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';
import type { AuthenticatedRequest } from '../../../../shared/middlewares/authMiddleware';
import { AIContainer } from '../../infrastructure/di/AIContainer';
import type { AIGenerationResult } from '@dailyuse/domain-server/ai';
import { QuotaExceededError, AIGenerationValidationService } from '@dailyuse/domain-server/ai';
import { z } from 'zod';

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

      // 调用 Application Service
      const service = AIConversationController.container.getApplicationService();
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
      const service = AIConversationController.container.getApplicationService();

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
   * 创建新对话
   * POST /api/ai/conversations
   */
  static async createConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const accountUuid = req.user?.accountUuid;
      const { title } = req.body;

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

      logger.info('Creating new conversation', { accountUuid, title });

      // 调用 Conversation Service
      const conversationService = AIConversationController.container.getConversationService();
      const conversation = await conversationService.createConversation(accountUuid, title);

      res
        .status(201)
        .json(
          AIConversationController.responseBuilder.success(
            conversation,
            'Conversation created successfully',
          ),
        );
    } catch (error) {
      AIConversationController.handleError(error, res);
    }
  }

  /**
   * 获取对话历史（列表，带分页）
   * GET /api/ai/conversations
   */
  static async getConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const accountUuid = req.user?.accountUuid;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

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

      logger.info('Getting conversation history', { accountUuid, page, limit });

      // 调用 Conversation Service
      const conversationService = AIConversationController.container.getConversationService();
      const result = await conversationService.listConversations(accountUuid, page, limit);

      res.status(200).json(
        AIConversationController.responseBuilder.success(
          {
            conversations: result.conversations,
            pagination: result.pagination,
          },
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

      // 调用 Conversation Service
      const conversationService = AIConversationController.container.getConversationService();
      const conversation = await conversationService.getConversation(id, true);

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
   * 删除对话（软删除）
   * DELETE /api/ai/conversations/:id
   */
  static async deleteConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      logger.info('Deleting conversation', { accountUuid, conversationId: id });

      // 先获取对话验证所有权
      const conversationService = AIConversationController.container.getConversationService();
      const conversation = await conversationService.getConversation(id, false);

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

      // 执行软删除
      await conversationService.deleteConversation(id);

      res.status(200).json(
        AIConversationController.responseBuilder.success(
          {
            deleted: true,
            conversationUuid: id,
          },
          'Conversation deleted successfully',
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
      const appService = AIConversationController.container.getApplicationService();
      const status = await appService.getQuotaStatus(accountUuid);

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
        krTitle: keyResultTitle,
        krDescription: keyResultDescription,
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
   * 文档摘要
   * POST /api/ai/summarize
   */
  static async summarizeDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const schema = z.object({
        text: z.string().min(1).max(50000),
        language: z.enum(['zh-CN', 'en']).optional().default('zh-CN'),
        includeActions: z.boolean().optional().default(true),
      });
      const parseResult = schema.safeParse(req.body);
      if (!parseResult.success) {
        res
          .status(400)
          .json(
            AIConversationController.responseBuilder.error(
              ResponseCode.VALIDATION_ERROR,
              parseResult.error.issues.map((i) => i.message).join('; '),
            ),
          );
        return;
      }
      const { text, language, includeActions } = parseResult.data;

      logger.info('Summarizing document', {
        accountUuid,
        inputLength: text.length,
        language,
        includeActions,
      });

      const appService = AIConversationController.container.getApplicationService();
      const result = await appService.summarizeDocument({
        accountUuid,
        text,
        language,
        includeActions,
      });

      res
        .status(200)
        .json(
          AIConversationController.responseBuilder.success(
            result,
            'Summary generated successfully',
          ),
        );
    } catch (error) {
      AIConversationController.handleError(error, res);
    }
  }

  /**
   * 创建知识系列生成任务（Story 4.3）
   * POST /api/ai/generate/knowledge-series
   */
  static async createKnowledgeGenerationTask(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
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

      const schema = z.object({
        topic: z.string().min(1).max(100),
        documentCount: z.number().int().min(3).max(7).optional().default(5),
        targetAudience: z.string().optional(),
        folderPath: z.string().optional(),
      });

      const parseResult = schema.safeParse(req.body);
      if (!parseResult.success) {
        res
          .status(400)
          .json(
            AIConversationController.responseBuilder.error(
              ResponseCode.VALIDATION_ERROR,
              parseResult.error.issues.map((i) => i.message).join('; '),
            ),
          );
        return;
      }

      const { topic, documentCount, targetAudience, folderPath } = parseResult.data;

      logger.info('Creating knowledge generation task', {
        accountUuid,
        topic,
        documentCount,
      });

      const generationService = AIConversationController.container.getApplicationService();
      const result = await generationService.createKnowledgeGenerationTask({
        accountUuid,
        topic,
        documentCount,
        targetAudience,
        folderPath,
      });

      res
        .status(202)
        .json(
          AIConversationController.responseBuilder.success(
            result,
            'Knowledge generation task created',
          ),
        );
    } catch (error) {
      AIConversationController.handleError(error, res);
    }
  }

  /**
   * 获取知识系列生成任务状态（Story 4.3）
   * GET /api/ai/generate/knowledge-series/:taskId
   */
  static async getKnowledgeGenerationTask(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const taskUuid = req.params.taskId;
      if (!taskUuid) {
        res
          .status(400)
          .json(
            AIConversationController.responseBuilder.error(
              ResponseCode.VALIDATION_ERROR,
              'taskId is required',
            ),
          );
        return;
      }

      logger.info('Getting knowledge generation task', { accountUuid, taskUuid });

      const generationService = AIConversationController.container.getApplicationService();
      const task = await generationService.getKnowledgeGenerationTask({
        taskUuid,
        accountUuid,
      });

      if (!task) {
        res
          .status(404)
          .json(
            AIConversationController.responseBuilder.error(
              ResponseCode.RESOURCE_NOT_FOUND,
              'Task not found',
            ),
          );
        return;
      }

      // 转换为 DTO
      const taskDTO = {
        taskUuid: task.uuid,
        topic: task.topic,
        documentCount: task.documentCount,
        targetAudience: task.targetAudience,
        status: task.status,
        progress: task.progress,
        generatedDocuments: task.generatedDocumentUuids.map((uuid) => ({
          uuid,
          title: '', // Will be filled when fetching documents
          status: 'COMPLETED',
        })),
        error: task.error,
        createdAt: task.createdAt,
        completedAt: task.completedAt,
      };

      res
        .status(200)
        .json(
          AIConversationController.responseBuilder.success(taskDTO, 'Task retrieved successfully'),
        );
    } catch (error) {
      AIConversationController.handleError(error, res);
    }
  }

  /**
   * 获取知识系列生成的文档列表（Story 4.3）
   * GET /api/ai/generate/knowledge-series/:taskId/documents
   */
  static async getGeneratedDocuments(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const taskUuid = req.params.taskId;
      if (!taskUuid) {
        res
          .status(400)
          .json(
            AIConversationController.responseBuilder.error(
              ResponseCode.VALIDATION_ERROR,
              'taskId is required',
            ),
          );
        return;
      }

      logger.info('Getting generated documents', { accountUuid, taskUuid });

      const generationService = AIConversationController.container.getApplicationService();
      const documents = await generationService.getGeneratedDocuments({
        taskUuid,
        accountUuid,
      });

      res
        .status(200)
        .json(
          AIConversationController.responseBuilder.success(
            { documents },
            'Documents retrieved successfully',
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

    // Domain validation errors (using AIValidationError) get mapped to 400
    if ((error as any)?.name === 'AIValidationError') {
      res
        .status(400)
        .json(
          AIConversationController.responseBuilder.error(
            ResponseCode.VALIDATION_ERROR,
            (error as Error).message,
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


