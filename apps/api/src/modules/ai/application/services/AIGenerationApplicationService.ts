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
  AIGenerationService,
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

type AIUsageQuotaClientDTO = AIContracts.AIUsageQuotaClientDTO;
type AIUsageQuotaServerDTO = AIContracts.AIUsageQuotaServerDTO;
type GenerationTaskServerDTO = AIContracts.GenerationTaskServerDTO;

const logger = createLogger('AIGenerationApplicationService');

/**
 * AI Generation Application Service
 */
export class AIGenerationApplicationService {
  private readonly quotaService: QuotaEnforcementService;

  constructor(
    private validationService: AIGenerationService,
    private aiAdapter: BaseAIAdapter,
    private quotaRepository: IAIUsageQuotaRepository,
    private conversationRepository: IAIConversationRepository,
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
}
