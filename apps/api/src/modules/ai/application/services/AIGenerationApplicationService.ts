/**
 * AI Generation Application Service
 * AI 生成应用服务
 *
 * 职责（DDD 应用服务层）：
 * - 协调领域服务、基础设施和仓储
 * - 处理事务边界和业务流程
 * - DTO 转换
 * - 跨聚合协调
 *
 * 依赖：
 * - AIGenerationService（领域服务 - 纯验证逻辑）
 * - BaseAIAdapter（基础设施 - AI 调用）
 * - QuotaEnforcementService（基础设施 - 配额管理）
 * - Repository 接口（持久化）
 */

import type {
  IAIUsageQuotaRepository,
  IAIConversationRepository,
  AIGenerationValidationService,
  IKnowledgeGenerationTaskRepository,
  KnowledgeGenerationTask,
  createKnowledgeGenerationTask,
  updateTaskProgress,
  completeTask,
  failTask,
} from '@dailyuse/domain-server';
import type { AIContracts } from '@dailyuse/contracts';
import { GenerationTaskType, TaskStatus, AIProvider, AIModel } from '@dailyuse/contracts';
import { randomUUID } from 'crypto';
import { createLogger } from '@dailyuse/utils';
import type {
  BaseAIAdapter,
  AIGenerationRequest,
} from '../../infrastructure/adapters/BaseAIAdapter';
import { QuotaEnforcementService } from '../../infrastructure/QuotaEnforcementService';
import { getPromptTemplate } from '../../infrastructure/prompts/templates';
import { SUMMARIZATION_PROMPT } from '../../infrastructure/prompts/templates';
import { MessageRole } from '@dailyuse/contracts';
import { MessageServer } from '@dailyuse/domain-server';
import { AIConversationServer } from '@dailyuse/domain-server';

type AIUsageQuotaClientDTO = AIContracts.AIUsageQuotaClientDTO;
type AIUsageQuotaServerDTO = AIContracts.AIUsageQuotaServerDTO;
type AIGenerationTaskServerDTO = AIContracts.AIGenerationTaskServerDTO;
type SummarizationRequestDTO = AIContracts.SummarizationRequestDTO;
type SummarizationResultDTO = AIContracts.SummarizationResultDTO;

const logger = createLogger('AIGenerationApplicationService');

/**
 * AI Generation Application Service
 */
export class AIGenerationApplicationService {
  private readonly quotaService: QuotaEnforcementService;

  constructor(
    private validationService: AIGenerationValidationService,
    private aiAdapter: BaseAIAdapter,
    private quotaRepository: IAIUsageQuotaRepository,
    private conversationRepository: IAIConversationRepository,
    private taskRepository?: IKnowledgeGenerationTaskRepository,
    private documentService?: any, // DocumentApplicationService - 可选依赖避免循环
  ) {
    this.quotaService = new QuotaEnforcementService();
  }

  /**
   * 生成关键结果（Key Results）
   *
   * 业务流程（应用层协调）：
   * 1. 获取用户配额
   * 2. 检查配额（基础设施服务）
   * 3. 获取 Prompt 模板（基础设施）
   * 4. 调用 AI Adapter 生成（基础设施）
   * 5. 验证输出（领域服务）
   * 6. 消费配额（基础设施服务）
   * 7. 持久化配额（仓储）
   * 8. 返回结果
   */
  async generateKeyResults(params: {
    accountUuid: string;
    goalTitle: string;
    goalDescription?: string;
    startDate: number;
    endDate: number;
    goalContext?: string;
  }): Promise<{
    keyResults: any[];
    tokenUsage: any;
    generatedAt: number;
  }> {
    const { accountUuid, goalTitle, goalDescription, startDate, endDate, goalContext } = params;

    // 1. 获取配额
    let quota = await this.quotaRepository.findByAccountUuid(accountUuid);
    if (!quota) {
      // 创建默认配额
      quota = {
        uuid: randomUUID(),
        accountUuid,
        quotaLimit: 100,
        currentUsage: 0,
        resetPeriod: 'MONTHLY' as any,
        lastResetAt: Date.now(),
        nextResetAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await this.quotaRepository.save(quota as any);
    }

    // 2. 检查配额（基础设施服务）
    this.quotaService.checkQuota(quota as AIUsageQuotaServerDTO, 1);

    // 3. 获取 Prompt 模板（基础设施）
    const template = getPromptTemplate(GenerationTaskType.GOAL_KEY_RESULTS);

    // 4. 构建 AI 请求上下文
    const context = {
      goalTitle,
      goalDescription,
      startDate,
      endDate,
      goalContext,
    };

    const request: AIGenerationRequest = {
      taskType: GenerationTaskType.GOAL_KEY_RESULTS,
      prompt: template.user(context),
      systemPrompt: template.system,
      temperature: 0.7,
      maxTokens: 2000,
      contextData: context,
    };

    // 5. 调用 AI Adapter 生成（基础设施）
    const response = await this.aiAdapter.generateText<
      Array<{
        title: string;
        description?: string;
        valueType: string;
        targetValue: number;
        currentValue?: number;
        unit?: string;
        weight: number;
        aggregationMethod: string;
      }>
    >(request);

    // 6. 验证输出（领域服务）
    const keyResults = response.parsedContent || [];
    this.validationService.validateKeyResultsOutput(keyResults);

    // 7. 消费配额（基础设施服务）
    const updatedQuota = this.quotaService.consumeQuota(quota as AIUsageQuotaServerDTO, 1);

    // 8. 持久化配额（仓储）
    await this.quotaRepository.save(updatedQuota as any);

    logger.info('Key results generated successfully', {
      accountUuid,
      tokensUsed: response.tokenUsage.totalTokens,
    });

    // 9. 返回结果
    return {
      keyResults,
      tokenUsage: response.tokenUsage,
      generatedAt: response.generatedAt.getTime(),
    };
  }

  /**
   * 生成任务模板（Task Templates）
   */
  async generateTasks(params: {
    accountUuid: string;
    krTitle: string;
    krDescription?: string;
    targetValue: number;
    currentValue: number;
    unit?: string;
    timeRemaining: number;
  }): Promise<{
    tasks: any[];
    tokenUsage: any;
    generatedAt: number;
  }> {
    const { accountUuid, krTitle, krDescription, targetValue, currentValue, unit, timeRemaining } =
      params;

    // 1. 获取配额
    let quota = await this.quotaRepository.findByAccountUuid(accountUuid);
    if (!quota) {
      quota = {
        uuid: randomUUID(),
        accountUuid,
        quotaLimit: 100,
        currentUsage: 0,
        resetPeriod: 'MONTHLY' as any,
        lastResetAt: Date.now(),
        nextResetAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await this.quotaRepository.save(quota as any);
    }

    // 2. 检查配额
    this.quotaService.checkQuota(quota as AIUsageQuotaServerDTO, 1);

    // 3. 获取 Prompt 模板
    const template = getPromptTemplate(GenerationTaskType.TASK_TEMPLATES);

    // 4. 构建 AI 请求
    const context = {
      keyResultTitle: krTitle,
      keyResultDescription: krDescription,
      targetValue,
      currentValue,
      unit,
      timeRemaining,
    };

    const request: AIGenerationRequest = {
      taskType: GenerationTaskType.TASK_TEMPLATES,
      prompt: template.user(context),
      systemPrompt: template.system,
      temperature: 0.7,
      maxTokens: 2000,
      contextData: context,
    };

    // 5. 调用 AI Adapter 生成
    const response = await this.aiAdapter.generateText<
      Array<{
        title: string;
        description?: string;
        estimatedHours: number;
        priority: 'HIGH' | 'MEDIUM' | 'LOW';
        dependencies: number[];
        tags?: string[];
      }>
    >(request);

    // 6. 解析并验证输出
    let tasks: any[];
    try {
      const parsed = JSON.parse(response.content);
      tasks = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      throw new Error('Failed to parse AI response');
    }

    this.validationService.validateTasksOutput(tasks);

    // 7. 消费配额
    const updatedQuota = this.quotaService.consumeQuota(quota as AIUsageQuotaServerDTO, 1);
    await this.quotaRepository.save(updatedQuota as any);

    logger.info('Tasks generated successfully', {
      accountUuid,
      tokensUsed: response.tokenUsage.totalTokens,
    });

    // 8. 返回结果
    return {
      tasks,
      tokenUsage: response.tokenUsage,
      generatedAt: response.generatedAt.getTime(),
    };
  }

  /**
   * 通用文本生成（聊天） - 迁移自模块服务供控制器使用
   */
  async generateText(request: {
    accountUuid: string;
    conversationUuid?: string;
    userMessage: string;
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
  }): Promise<{
    conversationUuid: string;
    userMessageUuid: string;
    assistantMessageUuid: string;
    content: string;
    tokensUsed: number;
    quotaRemaining: number;
  }> {
    const { accountUuid, conversationUuid, userMessage, systemPrompt, maxTokens, temperature } =
      request;

    if (!accountUuid) throw new Error('accountUuid required');
    if (!userMessage || userMessage.trim().length === 0) throw new Error('userMessage required');
    if (userMessage.length > 10000) throw new Error('userMessage too long');

    // Quota
    let quota = await this.quotaRepository.findByAccountUuid(accountUuid);
    if (!quota) {
      quota = {
        uuid: randomUUID(),
        accountUuid,
        quotaLimit: 100,
        currentUsage: 0,
        resetPeriod: 'MONTHLY' as any,
        lastResetAt: Date.now(),
        nextResetAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as any;
      await this.quotaRepository.save(quota);
    }
    this.quotaService.checkQuota(quota as AIUsageQuotaServerDTO, 1);

    // Conversation
    let conversation: AIConversationServer | null = null;
    if (conversationUuid) {
      conversation = (await this.conversationRepository.findById(conversationUuid, {
        includeChildren: true,
      })) as any;
    }
    if (!conversation) {
      const title = userMessage.length <= 50 ? userMessage : userMessage.slice(0, 47) + '...';
      conversation = AIConversationServer.create({ accountUuid, title });
      await this.conversationRepository.save(conversation as any);
    }

    try {
      // Add user message
      const userMsg = MessageServer.create({
        conversationUuid: (conversation as any).uuid,
        role: MessageRole.USER,
        content: userMessage,
      });
      (conversation as any).addMessage(userMsg);
      await this.conversationRepository.save(conversation as any);

      // Build prompt
      const messagesPrompt = (conversation as any)
        .getAllMessages()
        .map((m: any) => `${m.role}: ${m.content}`)
        .join('\n\n');
      const combinedPrompt = `${messagesPrompt}\n\nuser: ${userMessage}`;
      const aiReq: AIGenerationRequest = {
        taskType: GenerationTaskType.GENERAL_CHAT,
        prompt: combinedPrompt,
        systemPrompt,
        maxTokens,
        temperature,
      };
      const result = await this.aiAdapter.generateText(aiReq);

      // Assistant message
      const assistantMsg = MessageServer.create({
        conversationUuid: (conversation as any).uuid,
        role: MessageRole.ASSISTANT,
        content: result.content,
      });
      (conversation as any).addMessage(assistantMsg);
      await this.conversationRepository.save(conversation as any);

      // Consume quota
      const tokensUsed = result.tokenUsage?.totalTokens ?? 1;
      const updatedQuota = this.quotaService.consumeQuota(quota as AIUsageQuotaServerDTO, 1);
      await this.quotaRepository.save(updatedQuota as any);
      const remaining = updatedQuota.quotaLimit - updatedQuota.currentUsage;

      return {
        conversationUuid: (conversation as any).uuid,
        userMessageUuid: userMsg.uuid,
        assistantMessageUuid: assistantMsg.uuid,
        content: result.content,
        tokensUsed,
        quotaRemaining: remaining,
      };
    } catch (err) {
      // Soft delete conversation on error
      if (conversation) {
        (conversation as any).softDelete?.();
        await this.conversationRepository.save(conversation as any);
      }
      throw err;
    }
  }

  async generateStream(
    request: {
      accountUuid: string;
      conversationUuid?: string;
      userMessage: string;
      systemPrompt?: string;
      maxTokens?: number;
      temperature?: number;
    },
    callbacks: {
      onStart?: () => void;
      onChunk: (chunk: string) => void;
      onComplete: (result: any) => void;
      onError: (error: Error) => void;
    },
  ): Promise<void> {
    const { accountUuid, conversationUuid, userMessage, systemPrompt, maxTokens, temperature } =
      request;
    if (!accountUuid) throw new Error('accountUuid required');
    if (!userMessage || userMessage.trim().length === 0) throw new Error('userMessage required');

    let quota = await this.quotaRepository.findByAccountUuid(accountUuid);
    if (!quota) {
      quota = {
        uuid: randomUUID(),
        accountUuid,
        quotaLimit: 100,
        currentUsage: 0,
        resetPeriod: 'MONTHLY' as any,
        lastResetAt: Date.now(),
        nextResetAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as any;
      await this.quotaRepository.save(quota);
    }
    this.quotaService.checkQuota(quota as AIUsageQuotaServerDTO, 1);

    let conversation: AIConversationServer | null = null;
    if (conversationUuid) {
      conversation = (await this.conversationRepository.findById(conversationUuid, {
        includeChildren: true,
      })) as any;
    }
    if (!conversation) {
      const title = userMessage.length <= 50 ? userMessage : userMessage.slice(0, 47) + '...';
      conversation = AIConversationServer.create({ accountUuid, title });
      await this.conversationRepository.save(conversation as any);
    }

    try {
      const userMsg = MessageServer.create({
        conversationUuid: (conversation as any).uuid,
        role: MessageRole.USER,
        content: userMessage,
      });
      (conversation as any).addMessage(userMsg);
      await this.conversationRepository.save(conversation as any);

      const messagesPrompt = (conversation as any)
        .getAllMessages()
        .map((m: any) => `${m.role}: ${m.content}`)
        .join('\n\n');
      const combinedPrompt = `${messagesPrompt}\n\nuser: ${userMessage}`;
      const aiReq: AIGenerationRequest = {
        taskType: GenerationTaskType.GENERAL_CHAT,
        prompt: combinedPrompt,
        systemPrompt,
        maxTokens,
        temperature,
      };

      let full = '';
      await this.aiAdapter.generateStream(aiReq, {
        onStart: () => callbacks.onStart?.(),
        onChunk: (chunk: string) => {
          full += chunk;
          callbacks.onChunk(chunk);
        },
        onComplete: (result: any) => {
          try {
            const assistantMsg = MessageServer.create({
              conversationUuid: (conversation as any).uuid,
              role: MessageRole.ASSISTANT,
              content: full || result.content,
            });
            (conversation as any).addMessage(assistantMsg);
            this.conversationRepository.save(conversation as any);
            const updatedQuota = this.quotaService.consumeQuota(quota as AIUsageQuotaServerDTO, 1);
            this.quotaRepository.save(updatedQuota as any);
            callbacks.onComplete(result);
          } catch (e) {
            callbacks.onError(e instanceof Error ? e : new Error('Stream completion save error'));
          }
        },
        onError: async (error: Error) => {
          (conversation as any).softDelete?.();
          await this.conversationRepository.save(conversation as any);
          callbacks.onError(error);
        },
      });
    } catch (err) {
      if (conversation) {
        (conversation as any).softDelete?.();
        await this.conversationRepository.save(conversation as any);
      }
      throw err;
    }
  }

  /**
   * 获取用户配额状态
   */
  async getQuotaStatus(accountUuid: string): Promise<AIUsageQuotaClientDTO> {
    let quota = await this.quotaRepository.findByAccountUuid(accountUuid);
    if (!quota) {
      quota = {
        uuid: randomUUID(),
        accountUuid,
        quotaLimit: 100,
        currentUsage: 0,
        resetPeriod: 'MONTHLY' as any,
        lastResetAt: Date.now(),
        nextResetAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await this.quotaRepository.save(quota as any);
    }

    return this.toQuotaClientDTO(quota as AIUsageQuotaServerDTO);
  }

  /**
   * 映射：ServerDTO → ClientDTO
   */
  private toQuotaClientDTO(quota: AIUsageQuotaServerDTO): any {
    return {
      uuid: quota.uuid,
      accountUuid: quota.accountUuid,
      quotaLimit: quota.quotaLimit,
      currentUsage: quota.currentUsage,
      remainingQuota: quota.quotaLimit - quota.currentUsage,
      resetPeriod: quota.resetPeriod,
      lastResetAt: quota.lastResetAt,
      nextResetAt: quota.nextResetAt,
      createdAt: quota.createdAt,
      updatedAt: quota.updatedAt,
    };
  }

  /**
   * 文档摘要 (Story 4.1)
   */
  async summarizeDocument(params: {
    accountUuid: string;
    text: string;
    language?: 'zh-CN' | 'en';
    includeActions?: boolean;
  }): Promise<SummarizationResultDTO> {
    const { accountUuid, text, language = 'zh-CN', includeActions = true } = params;

    if (!text || text.trim().length === 0) {
      throw new Error('Text is required');
    }
    if (text.length > 50000) {
      throw new Error('Text exceeds 50,000 character limit');
    }

    // 1. 获取配额或创建默认
    let quota = await this.quotaRepository.findByAccountUuid(accountUuid);
    if (!quota) {
      quota = {
        uuid: randomUUID(),
        accountUuid,
        quotaLimit: 100,
        currentUsage: 0,
        resetPeriod: 'MONTHLY' as any,
        lastResetAt: Date.now(),
        nextResetAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as any;
      await this.quotaRepository.save(quota);
    }

    // 2. 检查配额
    this.quotaService.checkQuota(quota as AIUsageQuotaServerDTO, 1);

    // 3. 构建 Prompt
    const context = { inputText: text, language, includeActions };
    const request: AIGenerationRequest = {
      taskType: GenerationTaskType.GENERAL_CHAT, // reuse generic type; specific summarization handled by prompt
      prompt: SUMMARIZATION_PROMPT.user(context),
      systemPrompt: SUMMARIZATION_PROMPT.system,
      temperature: 0.5,
      maxTokens: 1500,
      contextData: context,
    };

    // 4. 调用 Adapter
    const response = await this.aiAdapter.generateText(request);
    let parsed: any;
    try {
      parsed = JSON.parse(response.content);
    } catch (e) {
      throw new Error('AI response JSON parse failed');
    }

    // 5. 验证输出
    this.validationService.validateSummaryOutput(parsed, includeActions);

    // 6. 消费配额 (tokensUsed fallback 1)
    const tokensUsed = response.tokenUsage?.totalTokens ?? 1;
    const updatedQuota = this.quotaService.consumeQuota(quota as AIUsageQuotaServerDTO, 1);
    await this.quotaRepository.save(updatedQuota as any);

    // 7. 计算压缩比
    const outputLength = (parsed.core?.length || 0) + (parsed.keyPoints?.join('').length || 0);
    const compressionRatio = outputLength && text.length ? outputLength / text.length : 0;

    logger.info('Document summarized', {
      accountUuid,
      tokensUsed,
      inputLength: text.length,
      compressionRatio,
    });

    return {
      summary: {
        core: parsed.core,
        keyPoints: parsed.keyPoints,
        actionItems: includeActions ? parsed.actionItems : undefined,
      },
      metadata: {
        tokensUsed,
        generatedAt: Date.now(),
        inputLength: text.length,
        compressionRatio: Number(compressionRatio.toFixed(4)),
      },
    };
  }

  /**
   * 生成知识系列文档（Story 4.3）
   *
   * 业务流程：
   * 1. 验证输入参数
   * 2. 获取并检查配额
   * 3. 构建知识系列提示
   * 4. 调用 AI Adapter 生成
   * 5. 解析并验证输出
   * 6. 消费配额
   * 7. 返回文档数组
   */
  async generateKnowledgeSeries(params: {
    accountUuid: string;
    topic: string;
    documentCount: number;
    targetAudience?: string;
  }): Promise<{
    documents: Array<{
      title: string;
      content: string;
      order: number;
    }>;
    metadata: {
      tokensUsed: number;
      generatedAt: number;
      documentCount: number;
    };
  }> {
    const { accountUuid, topic, documentCount, targetAudience } = params;

    // 1. 验证输入
    if (!topic || topic.length < 1 || topic.length > 100) {
      throw new Error('Topic must be 1-100 characters');
    }
    if (documentCount < 3 || documentCount > 7) {
      throw new Error('Document count must be 3-7');
    }

    // 2. 获取并检查配额
    let quota = await this.quotaRepository.findByAccountUuid(accountUuid);
    if (!quota) {
      // 创建默认配额
      quota = {
        uuid: randomUUID(),
        accountUuid,
        quotaLimit: 100,
        currentUsage: 0,
        resetPeriod: 'MONTHLY' as any,
        lastResetAt: Date.now(),
        nextResetAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await this.quotaRepository.save(quota as any);
    }

    // 估算 token 使用量：每个文档约 2000 tokens
    const estimatedTokens = documentCount * 2000;
    this.quotaService.checkQuota(quota as AIUsageQuotaServerDTO, estimatedTokens);

    // 3. 构建提示
    const promptTemplate = getPromptTemplate('KNOWLEDGE_SERIES');
    if (!promptTemplate) {
      throw new Error('Knowledge series prompt template not found');
    }

    const context = {
      topic,
      documentCount: documentCount.toString(),
      targetAudience: targetAudience || 'general audience',
    };

    const userPrompt = promptTemplate.user(context);
    const systemPrompt = promptTemplate.system;

    const request: AIGenerationRequest = {
      conversationUuid: null,
      accountUuid,
      prompt: userPrompt,
      systemPrompt,
      temperature: 0.7,
      maxTokens: estimatedTokens,
      contextData: context,
    };

    // 4. 调用 Adapter
    logger.info('Generating knowledge series', { accountUuid, topic, documentCount });
    const response = await this.aiAdapter.generateText(request);

    // 5. 解析输出
    let parsed: any[];
    try {
      parsed = JSON.parse(response.content);
    } catch (e) {
      logger.error('Failed to parse knowledge series JSON', {
        error: e,
        content: response.content,
      });
      throw new Error('AI response JSON parse failed');
    }

    // 6. 验证输出
    this.validationService.validateKnowledgeSeriesOutput(parsed, documentCount);

    // 7. 消费配额
    const tokensUsed = response.tokenUsage?.totalTokens ?? estimatedTokens;
    const updatedQuota = this.quotaService.consumeQuota(quota as AIUsageQuotaServerDTO, tokensUsed);
    await this.quotaRepository.save(updatedQuota as any);

    logger.info('Knowledge series generated', {
      accountUuid,
      topic,
      documentCount,
      tokensUsed,
    });

    return {
      documents: parsed,
      metadata: {
        tokensUsed,
        generatedAt: Date.now(),
        documentCount: parsed.length,
      },
    };
  }

  /**
   * 创建知识系列生成任务（Story 4.3）
   * 异步任务模式：立即返回 taskUuid，后台处理生成
   */
  async createKnowledgeGenerationTask(params: {
    accountUuid: string;
    topic: string;
    documentCount?: number;
    targetAudience?: string;
    folderPath?: string;
  }): Promise<{ taskUuid: string }> {
    if (!this.taskRepository) {
      throw new Error('Task repository not configured');
    }

    const { accountUuid, topic, documentCount = 5, targetAudience, folderPath } = params;

    // 验证输入
    if (!topic || topic.length < 1 || topic.length > 100) {
      throw new Error('Topic must be 1-100 characters');
    }
    if (documentCount < 3 || documentCount > 7) {
      throw new Error('Document count must be 3-7');
    }

    // 创建任务
    const taskUuid = randomUUID();
    const task = createKnowledgeGenerationTask({
      uuid: taskUuid,
      accountUuid,
      topic,
      documentCount,
      targetAudience,
      folderPath: folderPath || `/AI Generated/${topic}`,
    });

    await this.taskRepository.create(task);

    // 启动后台处理（不等待）
    this.processKnowledgeGenerationTask(taskUuid).catch((error) => {
      logger.error('Background task processing failed', { taskUuid, error });
    });

    return { taskUuid };
  }

  /**
   * 后台处理知识系列生成任务
   */
  private async processKnowledgeGenerationTask(taskUuid: string): Promise<void> {
    if (!this.taskRepository) {
      return;
    }

    let task = await this.taskRepository.findByUuid(taskUuid);
    if (!task) {
      logger.error('Task not found', { taskUuid });
      return;
    }

    try {
      // 更新状态为 GENERATING
      task = { ...task, status: 'GENERATING' };
      await this.taskRepository.update(task);

      // 生成文档
      logger.info('Starting knowledge series generation', {
        taskUuid,
        topic: task.topic,
        documentCount: task.documentCount,
      });

      const result = await this.generateKnowledgeSeries({
        accountUuid: task.accountUuid,
        topic: task.topic,
        documentCount: task.documentCount,
        targetAudience: task.targetAudience,
      });

      // 保存文档到 Document 模块
      const documentUuids: string[] = [];
      for (let i = 0; i < result.documents.length; i++) {
        const doc = result.documents[i];
        try {
          if (this.documentService) {
            const created = await this.documentService.create({
              accountUuid: task.accountUuid,
              title: doc.title,
              content: doc.content,
              folderPath: task.folderPath,
              tags: ['AI Generated', task.topic],
              metadata: {
                generatedBy: 'AI',
                generationTaskUuid: taskUuid,
                order: doc.order,
              },
            });
            documentUuids.push(created.uuid);
          }

          // 更新进度
          task = updateTaskProgress(task, i + 1);
          await this.taskRepository.update(task);
        } catch (error) {
          logger.error('Failed to create document', {
            taskUuid,
            documentIndex: i,
            error,
          });
        }
      }

      // 标记为完成
      task = completeTask(task, documentUuids);
      await this.taskRepository.update(task);

      logger.info('Knowledge series generation completed', {
        taskUuid,
        documentsGenerated: documentUuids.length,
      });
    } catch (error: any) {
      logger.error('Knowledge series generation failed', {
        taskUuid,
        error: error.message,
      });

      // 标记为失败
      task = failTask(task, error.message);
      await this.taskRepository.update(task);
    }
  }

  /**
   * 获取任务状态
   */
  async getKnowledgeGenerationTask(params: {
    taskUuid: string;
    accountUuid: string;
  }): Promise<KnowledgeGenerationTask | null> {
    if (!this.taskRepository) {
      throw new Error('Task repository not configured');
    }

    const task = await this.taskRepository.findByUuid(params.taskUuid);
    if (!task) {
      return null;
    }

    // 验证权限
    if (task.accountUuid !== params.accountUuid) {
      throw new Error('Unauthorized access to task');
    }

    return task;
  }

  /**
   * 获取任务生成的文档列表
   */
  async getGeneratedDocuments(params: { taskUuid: string; accountUuid: string }): Promise<any[]> {
    const task = await this.getKnowledgeGenerationTask(params);
    if (!task) {
      throw new Error('Task not found');
    }

    if (!this.documentService) {
      return [];
    }

    // 获取文档详情
    const documents = [];
    for (const docUuid of task.generatedDocumentUuids) {
      try {
        const doc = await this.documentService.findByUuid({
          uuid: docUuid,
          accountUuid: params.accountUuid,
        });
        if (doc) {
          documents.push(doc);
        }
      } catch (error) {
        logger.error('Failed to fetch document', { docUuid, error });
      }
    }

    return documents;
  }
}
