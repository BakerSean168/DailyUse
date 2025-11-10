/**
 * AI Module DI Container
 * AI 模块依赖注入容器
 *
 * 职责：
 * - 管理服务实例生命周期
 * - 提供统一的依赖注入接口
 * - 单例模式
 */

import { PrismaClient } from '@prisma/client';
import { OpenAIAdapter, AIGenerationService } from '@dailyuse/domain-server';
import { AIGenerationApplicationService } from '../../application/services/AIGenerationApplicationService';
import { PrismaAIUsageQuotaRepository } from '../repositories/PrismaAIUsageQuotaRepository';
import { PrismaAIGenerationTaskRepository } from '../repositories/PrismaAIGenerationTaskRepository';

/**
 * AI Container 单例
 */
export class AIContainer {
  private static instance: AIContainer;
  private prisma: PrismaClient;
  private applicationService?: AIGenerationApplicationService;

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
   * 获取 ApplicationService
   */
  getApplicationService(): AIGenerationApplicationService {
    if (!this.applicationService) {
      // 创建 Adapter
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is not set');
      }
      const adapter = new OpenAIAdapter(apiKey);

      // 创建 Domain Service
      const generationService = new AIGenerationService(adapter);

      // 创建 Repositories
      const quotaRepository = new PrismaAIUsageQuotaRepository(this.prisma);
      const taskRepository = new PrismaAIGenerationTaskRepository(this.prisma);

      // 创建 Application Service
      this.applicationService = new AIGenerationApplicationService(
        generationService,
        quotaRepository,
        taskRepository,
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
