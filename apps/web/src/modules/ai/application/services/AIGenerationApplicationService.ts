/**
 * AI Generation Application Service
 * AI 生成应用服务 - 负责任务模板和知识文档生成
 *
 * 🔄 重构说明（方案 A - 简化版）：
 * - ApplicationService 只负责 API 调用 + DTO → Entity 转换
 * - 不再直接依赖 Store，返回数据给调用方
 * - Store 操作由 Composable 层负责
 * - 这样确保无循环依赖，且 Service 可独立测试
 *
 * 注意：
 * - 关键结果生成已迁移至 Goal 模块（goalApiClient.generateKeyResults）
 * - 此服务负责任务模板和知识文档生成
 */

import type { AIUsageQuotaClientDTO } from '@dailyuse/contracts/ai';
import { aiGenerationApiClient } from '../../infrastructure/api/aiGenerationApiClient';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AIGenerationApplicationService');

export interface GenerateTaskTemplateRequest {
  krTitle: string;
  krDescription?: string;
  targetValue?: number;
  unit?: string;
}

export interface GenerateTasksRequest {
  keyResultTitle: string;
  keyResultDescription?: string;
  targetValue: number;
  currentValue: number;
  unit?: string;
  timeRemaining: number;
}

export interface GenerateTasksResponse {
  tasks: any[];
  tokenUsage: any;
  generatedAt: number;
}

export interface GenerateKnowledgeDocumentRequest {
  topic: string;
  context?: string;
  templateType: string;
}

export class AIGenerationApplicationService {
  private static instance: AIGenerationApplicationService;

  private constructor() {}

  static getInstance(): AIGenerationApplicationService {
    if (!AIGenerationApplicationService.instance) {
      AIGenerationApplicationService.instance = new AIGenerationApplicationService();
    }
    return AIGenerationApplicationService.instance;
  }

  /**
   * 生成任务模板
   */
  async generateTaskTemplate(request: GenerateTaskTemplateRequest): Promise<any> {
    logger.info('Generating task template', { krTitle: request.krTitle });

    const result = await aiGenerationApiClient.generateTaskTemplate(request);

    logger.info('Task template generated successfully');
    return result;
  }

  /**
   * 生成任务列表
   */
  async generateTasks(request: GenerateTasksRequest): Promise<GenerateTasksResponse> {
    logger.info('Generating tasks', { keyResultTitle: request.keyResultTitle });

    const result = await aiGenerationApiClient.generateTasks(request);

    logger.info('Tasks generated successfully', {
      count: result.tasks.length,
      generatedAt: result.generatedAt,
    });

    return result;
  }

  /**
   * 生成知识文档
   */
  async generateKnowledgeDocument(request: GenerateKnowledgeDocumentRequest): Promise<any> {
    logger.info('Generating knowledge document', { topic: request.topic });

    const result = await aiGenerationApiClient.generateKnowledgeDocument(request);

    logger.info('Knowledge document generated successfully');
    return result;
  }

  /**
   * 获取配额状态
   */
  async getQuotaStatus(): Promise<AIUsageQuotaClientDTO> {
    logger.info('Fetching quota status');

    const quota = await aiGenerationApiClient.getQuotaStatus();

    logger.info('Quota status fetched', { quota });
    return quota;
  }
}

export const aiGenerationApplicationService = AIGenerationApplicationService.getInstance();
