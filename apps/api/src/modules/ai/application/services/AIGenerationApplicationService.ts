/**
 * AI Generation Application Service
 * AI 生成应用服务
 *
 * 职责（DDD 应用服务层）：
 * - 协调领域服务和仓储
 * - 处理事务边界
 * - DTO 转换
 * - 跨聚合协调
 *
 * 依赖：
 * - AIGenerationService（领域服务）
 * - Repository 接口
 */

import type {
  IAIUsageQuotaRepository,
  IAIGenerationTaskRepository,
  AIGenerationService,
} from '@dailyuse/domain-server';
import type { AIContracts } from '@dailyuse/contracts';
import { GenerationTaskType, TaskStatus, AIProvider, AIModel } from '@dailyuse/contracts';
import { randomUUID } from 'crypto';
import { createLogger } from '@dailyuse/utils';

type AIUsageQuotaClientDTO = AIContracts.AIUsageQuotaClientDTO;
type AIUsageQuotaServerDTO = AIContracts.AIUsageQuotaServerDTO;

const logger = createLogger('AIGenerationApplicationService');

/**
 * AI Generation Application Service
 */
export class AIGenerationApplicationService {
  constructor(
    private generationService: AIGenerationService,
    private quotaRepository: IAIUsageQuotaRepository,
    private taskRepository: IAIGenerationTaskRepository,
  ) {}

  /**
   * 生成关键结果（Key Results）
   *
   * 业务流程：
   * 1. 获取或创建用户配额
   * 2. 检查配额是否足够
   * 3. 创建任务记录（PENDING）
   * 4. 调用领域服务生成
   * 5. 更新任务状态（COMPLETED/FAILED）
   * 6. 更新配额使用量
   * 7. 返回结果
   */
  async generateKeyResults(params: {
    accountUuid: string;
    goalTitle: string;
    goalDescription?: string;
    category?: string;
    importance?: string;
    urgency?: string;
  }): Promise<{
    keyResults: any[];
    quota: AIUsageQuotaClientDTO;
    taskUuid: string;
  }> {
    const { accountUuid, goalTitle, goalDescription, category, importance, urgency } = params;

    // 1. 获取或创建配额
    let quota = await this.quotaRepository.findByAccountUuid(accountUuid);
    if (!quota) {
      quota = await this.quotaRepository.createDefaultQuota(accountUuid);
    }

    // 2. 创建任务记录（PENDING）
    const taskUuid = randomUUID();
    const task: any = {
      uuid: taskUuid,
      accountUuid,
      type: GenerationTaskType.GOAL_KEY_RESULTS,
      status: TaskStatus.PENDING,
      provider: AIProvider.OPENAI,
      model: AIModel.GPT4,
      input: {
        goalTitle,
        goalDescription: goalDescription || '',
        category: category || '',
        importance: importance || '',
        urgency: urgency || '',
      },
      retryCount: 0,
      maxRetries: 3,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      await this.taskRepository.save(task);

      // 3. 更新任务状态为 PROCESSING
      task.status = TaskStatus.PROCESSING;
      task.processingStartedAt = Date.now();
      task.updatedAt = Date.now();
      await this.taskRepository.save(task);

      // 4. 调用领域服务生成
      const context = {
        goalTitle,
        goalDescription,
        category,
        importance,
        urgency,
      };
      const result = await this.generationService.generateKeyResults(context, quota as any);

      // 5. 更新任务状态为 COMPLETED
      task.status = TaskStatus.COMPLETED;
      task.result = result.result;
      task.tokenUsage = result.tokenUsage;
      task.processingCompletedAt = Date.now();
      task.updatedAt = Date.now();
      await this.taskRepository.save(task);

      // 6. 更新配额
      await this.quotaRepository.save(result.updatedQuota);

      logger.info('Key results generated successfully', {
        accountUuid,
        taskUuid,
        tokensUsed: result.tokenUsage.totalTokens,
      });

      // 7. 返回结果（映射为 ClientDTO）
      return {
        keyResults: result.result as any,
        quota: this.toQuotaClientDTO(result.updatedQuota),
        taskUuid,
      };
    } catch (error) {
      // 更新任务状态为 FAILED
      task.status = TaskStatus.FAILED;
      task.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      task.updatedAt = Date.now();
      await this.taskRepository.save(task);

      logger.error('Failed to generate key results', {
        accountUuid,
        taskUuid,
        error,
      });

      throw error;
    }
  }

  /**
   * 生成任务模板（TODO: 未实现）
   */
  async generateTaskTemplate(params: {
    accountUuid: string;
    krTitle: string;
    krDescription?: string;
    targetValue?: number;
    unit?: string;
  }): Promise<any> {
    throw new Error('Task template generation not implemented yet');
  }

  /**
   * 生成知识文档（TODO: 未实现）
   */
  async generateKnowledgeDocument(params: {
    accountUuid: string;
    topic: string;
    context?: string;
    templateType: string;
  }): Promise<any> {
    throw new Error('Knowledge document generation not implemented yet');
  }

  /**
   * 获取用户配额状态
   */
  async getQuotaStatus(accountUuid: string): Promise<AIUsageQuotaClientDTO> {
    let quota = await this.quotaRepository.findByAccountUuid(accountUuid);
    if (!quota) {
      quota = await this.quotaRepository.createDefaultQuota(accountUuid);
    }

    return this.toQuotaClientDTO(quota);
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
