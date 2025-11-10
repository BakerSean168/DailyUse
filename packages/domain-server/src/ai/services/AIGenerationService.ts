/**
 * AI Generation Service
 * AI 生成领域服务
 *
 * 职责：
 * - 协调 AI 生成的核心业务流程
 * - 调用 Adapter 执行生成
 * - 调用 QuotaEnforcementService 检查配额
 * - 使用 Prompt 模板构建请求
 * - 验证 AI 输出
 * - 不注入仓储（由 ApplicationService 负责持久化）
 */

import type { z } from 'zod';
import { AIContracts, GenerationTaskType } from '@dailyuse/contracts';
import type { BaseAIAdapter, AIGenerationRequest, AIGenerationResponse } from '../adapters/BaseAIAdapter';
import { getPromptTemplate } from './prompts/templates';
import { QuotaEnforcementService } from './QuotaEnforcementService';
import { AIValidationError } from '../errors/AIErrors';

type AIUsageQuotaServerDTO = AIContracts.AIUsageQuotaServerDTO;
type GenerationInputServerDTO = AIContracts.GenerationInputServerDTO;
type GenerationResultServerDTO = AIContracts.GenerationResultServerDTO;
type TokenUsageServerDTO = AIContracts.TokenUsageServerDTO;

/**
 * AI 生成服务
 */
export class AIGenerationService {
  private readonly quotaService: QuotaEnforcementService;

  constructor(
    private readonly aiAdapter: BaseAIAdapter,
  ) {
    this.quotaService = new QuotaEnforcementService();
  }

  /**
   * 生成关键结果（Key Results）
   *
   * @param input 生成输入参数
   * @param quota 用户配额（由 ApplicationService 查询后传入）
   * @returns 生成结果和更新后的配额
   */
  public async generateKeyResults(
    input: {
      goalTitle: string;
      goalDescription?: string;
      category?: string;
      importance?: string;
      urgency?: string;
    },
    quota: AIUsageQuotaServerDTO,
  ): Promise<{
    result: GenerationResultServerDTO;
    updatedQuota: AIUsageQuotaServerDTO;
    tokenUsage: TokenUsageServerDTO;
  }> {
    // 1. 检查配额
    this.quotaService.checkQuota(quota, 1);

    // 2. 获取 Prompt 模板
    const template = getPromptTemplate(GenerationTaskType.GOAL_KEY_RESULTS);

    // 3. 构建 AI 请求
    const request: AIGenerationRequest = {
      taskType: GenerationTaskType.GOAL_KEY_RESULTS,
      prompt: template.user(input),
      systemPrompt: template.system,
      temperature: 0.7,
      maxTokens: 2000,
      contextData: input,
    };

    // 4. 调用 AI Adapter 生成
    const response = await this.aiAdapter.generateText<{
      keyResults: Array<{
        title: string;
        description?: string;
        targetValue: number;
        currentValue: number;
        unit: string;
        valueType: string;
        weight: number;
      }>;
    }>(request);

    // 5. 验证输出
    this.validateKeyResultsOutput(response);

    // 6. 构建生成结果
    const result: GenerationResultServerDTO = {
      content: response.content,
      taskType: GenerationTaskType.GOAL_KEY_RESULTS,
      metadata: response.parsedContent ? (response.parsedContent as Record<string, unknown>) : null,
      generatedAt: response.generatedAt.getTime(),
    };

    // 7. 消费配额
    const updatedQuota = this.quotaService.consumeQuota(quota, 1);

    return {
      result,
      updatedQuota,
      tokenUsage: response.tokenUsage,
    };
  }

  /**
   * 生成任务模板（Task Templates）
   * TODO: 实现完整逻辑
   */
  public async generateTaskTemplate(
    input: {
      krTitle: string;
      krDescription?: string;
      targetValue: number;
      unit: string;
    },
    quota: AIUsageQuotaServerDTO,
  ): Promise<{
    result: GenerationResultServerDTO;
    updatedQuota: AIUsageQuotaServerDTO;
    tokenUsage: TokenUsageServerDTO;
  }> {
    // 检查配额
    this.quotaService.checkQuota(quota, 1);

    // TODO: 实现完整生成逻辑（类似 generateKeyResults）
    throw new Error('generateTaskTemplate not implemented yet');
  }

  /**
   * 生成知识文档（Knowledge Documents）
   * TODO: 实现完整逻辑
   */
  public async generateKnowledgeDocument(
    input: {
      topic: string;
      context?: string;
      templateType: string;
    },
    quota: AIUsageQuotaServerDTO,
  ): Promise<{
    result: GenerationResultServerDTO;
    updatedQuota: AIUsageQuotaServerDTO;
    tokenUsage: TokenUsageServerDTO;
  }> {
    // 检查配额
    this.quotaService.checkQuota(quota, 1);

    // TODO: 实现完整生成逻辑
    throw new Error('generateKnowledgeDocument not implemented yet');
  }

  /**
   * 验证关键结果输出
   */
  private validateKeyResultsOutput(response: AIGenerationResponse<unknown>): void {
    if (!response.parsedContent) {
      throw new AIValidationError('AI output parsing failed', ['No JSON content parsed']);
    }

    const content = response.parsedContent as {
      keyResults?: Array<{
        title?: string;
        targetValue?: number;
        unit?: string;
        weight?: number;
      }>;
    };

    const errors: string[] = [];

    // 检查是否有 keyResults 数组
    if (!content.keyResults || !Array.isArray(content.keyResults)) {
      errors.push('Missing or invalid keyResults array');
      throw new AIValidationError('Invalid AI output structure', errors);
    }

    // 检查数量（3-5个）
    if (content.keyResults.length < 3 || content.keyResults.length > 5) {
      errors.push(`Expected 3-5 key results, got ${content.keyResults.length}`);
    }

    // 检查每个 KR 的必需字段
    content.keyResults.forEach((kr, index) => {
      if (!kr.title || kr.title.trim().length === 0) {
        errors.push(`KR[${index}] missing title`);
      }
      if (kr.targetValue === undefined || kr.targetValue === null) {
        errors.push(`KR[${index}] missing targetValue`);
      }
      if (!kr.unit) {
        errors.push(`KR[${index}] missing unit`);
      }
      if (kr.weight === undefined || kr.weight === null || kr.weight < 0 || kr.weight > 1) {
        errors.push(`KR[${index}] invalid weight`);
      }
    });

    // 检查权重总和（应为 1.0）
    const totalWeight = content.keyResults.reduce((sum, kr) => sum + (kr.weight || 0), 0);
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      errors.push(`Total weight should be 1.0, got ${totalWeight}`);
    }

    if (errors.length > 0) {
      throw new AIValidationError('Key Results validation failed', errors);
    }
  }
}
