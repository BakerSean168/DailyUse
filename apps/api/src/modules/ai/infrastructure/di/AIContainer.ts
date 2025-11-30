/**
 * AI Module DI Container
 * AI 模块依赖注入容器
 *
 * 职责：
 * - 管理服务实例生命周期
 * - 提供统一的依赖注入接口
 * - 单例模式
 *
 * 架构说明：
 * - 领域服务从 @dailyuse/domain-server 导入（纯验证逻辑）
 * - 基础设施服务从本地 infrastructure/ 导入（Adapter、Quota、Prompts）
 * - 应用服务协调所有依赖
 */

import { PrismaClient } from '@prisma/client';
import { AIGenerationValidationService } from '@dailyuse/domain-server/ai';
import { AIGenerationApplicationService } from '../../application/services/AIGenerationApplicationService';
import { AIConversationService } from '../../application/services/AIConversationService';
import { AIProviderConfigService } from '../../application/services/AIProviderConfigService';
import { PrismaAIUsageQuotaRepository } from '../repositories/PrismaAIUsageQuotaRepository';
import { PrismaAIConversationRepository } from '../repositories/PrismaAIConversationRepository';
import { PrismaAIProviderConfigRepository } from '../repositories/PrismaAIProviderConfigRepository';
import { KnowledgeGenerationTaskRepository } from '../repositories/KnowledgeGenerationTaskRepository';
import { OpenAIAdapter } from '../adapters/OpenAIAdapter';
import type { BaseAIAdapter } from '../adapters/BaseAIAdapter';

/**
 * AI Container 单例
 */
export class AIContainer {
  private static instance: AIContainer;
  private prisma: PrismaClient;
  private applicationService?: AIGenerationApplicationService;
  private conversationService?: AIConversationService;
  private providerConfigService?: AIProviderConfigService;
  private validationService?: AIGenerationValidationService;
  private conversationRepository?: PrismaAIConversationRepository;
  private quotaRepository?: PrismaAIUsageQuotaRepository;
  private providerConfigRepository?: PrismaAIProviderConfigRepository;
  private taskRepository?: KnowledgeGenerationTaskRepository;
  private aiAdapter?: BaseAIAdapter;

  private constructor() {
    // 初始化 Prisma Client（共享实例）
    this.prisma = new PrismaClient();
  }

  /**
   * 获取容器单例
   */
  static getInstance(): AIContainer {
    if (!AIContainer.instance) {
      AIContainer.instance = new AIContainer();
    }
    return AIContainer.instance;
  }

  /**
   * 获取 Conversation Repository
   */
  getConversationRepository(): PrismaAIConversationRepository {
    if (!this.conversationRepository) {
      this.conversationRepository = new PrismaAIConversationRepository(this.prisma);
    }
    return this.conversationRepository;
  }

  /**
   * 获取 Quota Repository
   */
  getQuotaRepository(): PrismaAIUsageQuotaRepository {
    if (!this.quotaRepository) {
      this.quotaRepository = new PrismaAIUsageQuotaRepository(this.prisma);
    }
    return this.quotaRepository;
  }

  /**
   * 获取 Task Repository
   */
  getTaskRepository(): KnowledgeGenerationTaskRepository {
    if (!this.taskRepository) {
      this.taskRepository = new KnowledgeGenerationTaskRepository(this.prisma);
    }
    return this.taskRepository;
  }

  /**
   * 获取 Provider Config Repository
   */
  getProviderConfigRepository(): PrismaAIProviderConfigRepository {
    if (!this.providerConfigRepository) {
      this.providerConfigRepository = new PrismaAIProviderConfigRepository(this.prisma);
    }
    return this.providerConfigRepository;
  }

  /**
   * 获取 AI Adapter（基础设施）
   * @deprecated 使用 getProviderConfigService().getAdapterForProvider() 获取指定 Provider 的 Adapter
   */
  getAIAdapter(): BaseAIAdapter {
    if (!this.aiAdapter) {
      const apiKey = process.env.OPENAI_API_KEY || '';
      this.aiAdapter = new OpenAIAdapter(apiKey);
    }
    return this.aiAdapter;
  }

  /**
   * 获取 Provider Config Service（Provider CRUD + 适配器管理）
   */
  getProviderConfigService(): AIProviderConfigService {
    if (!this.providerConfigService) {
      const repository = this.getProviderConfigRepository();
      this.providerConfigService = new AIProviderConfigService(repository);
    }
    return this.providerConfigService;
  }

  /**
   * 获取 AIGenerationValidationService（领域服务 - 纯验证）
   */
  getValidationService(): AIGenerationValidationService {
    if (!this.validationService) {
      this.validationService = new AIGenerationValidationService();
    }
    return this.validationService;
  }

  /**
   * 获取 AIConversationService（对话管理服务）
   */
  getConversationService(): AIConversationService {
    if (!this.conversationService) {
      const conversationRepository = this.getConversationRepository();
      this.conversationService = new AIConversationService(conversationRepository);
    }
    return this.conversationService;
  }

  /**
   * 获取 ApplicationService
   */
  getApplicationService(): AIGenerationApplicationService {
    if (!this.applicationService) {
      // 创建依赖
      const validationService = this.getValidationService();
      const aiAdapter = this.getAIAdapter();
      const quotaRepository = this.getQuotaRepository();
      const conversationRepository = this.getConversationRepository();
      const taskRepository = this.getTaskRepository();

      // 创建 Application Service
      this.applicationService = new AIGenerationApplicationService(
        validationService,
        aiAdapter,
        quotaRepository,
        conversationRepository,
        taskRepository,
        null, // documentService - 避免循环依赖，稍后设置
      );
    }

    return this.applicationService;
  }

  /**
   * 清理资源
   */
  async dispose(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
