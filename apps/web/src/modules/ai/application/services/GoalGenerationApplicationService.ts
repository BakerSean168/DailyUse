/**
 * Goal Generation Application Service
 * 目标生成应用服务 - 使用 AI (青牛云 API) 生成目标
 *
 * DDD Application Service 职责：
 * - 协调 API 客户端调用
 * - 管理业务流程（验证、调用、处理结果）
 * - 处理错误和异常
 * - 提供统一的接口给 Presentation 层
 *
 * Pattern A: ApplicationService 只负责 API 调用和 DTO 转换
 * UI 反馈（success/error 消息）由 Composable 层处理
 */

import type {
  GenerateGoalRequest,
  GenerateGoalResponse,
  GenerateGoalWithKRsRequest,
  GenerateGoalWithKRsResponse,
  GeneratedGoalDraft,
  KeyResultPreview,
  GoalCategory,
} from '@dailyuse/contracts/ai';
import { goalGenerationApiClient } from '../../infrastructure/api/goalGenerationApiClient';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('GoalGenerationApplicationService');

/**
 * Goal Generation Application Service
 * AI 目标生成应用服务
 *
 * 职责边界：
 * - 从用户想法生成目标草稿
 * - 从用户想法生成目标 + 关键结果
 * - 管理生成状态和错误处理
 *
 * 不负责：
 * - 目标持久化 → GoalManagementApplicationService
 * - KeyResult 管理 → KeyResultApplicationService
 * - AI 配额管理 → AIQuotaApplicationService
 */
export class GoalGenerationApplicationService {
  private static instance: GoalGenerationApplicationService;

  /** 当前生成状态 */
  private _isGenerating = false;
  private _lastError: Error | null = null;
  private _lastGeneratedGoal: GeneratedGoalDraft | null = null;
  private _lastGeneratedKeyResults: KeyResultPreview[] = [];

  private constructor() {}

  /**
   * 获取服务单例
   */
  static getInstance(): GoalGenerationApplicationService {
    if (!GoalGenerationApplicationService.instance) {
      GoalGenerationApplicationService.instance = new GoalGenerationApplicationService();
    }
    return GoalGenerationApplicationService.instance;
  }

  // ===== Getters =====

  /** 是否正在生成 */
  get isGenerating(): boolean {
    return this._isGenerating;
  }

  /** 最近一次错误 */
  get lastError(): Error | null {
    return this._lastError;
  }

  /** 最近生成的目标草稿 */
  get lastGeneratedGoal(): GeneratedGoalDraft | null {
    return this._lastGeneratedGoal;
  }

  /** 最近生成的关键结果 */
  get lastGeneratedKeyResults(): KeyResultPreview[] {
    return this._lastGeneratedKeyResults;
  }

  // ===== API 方法 =====

  /**
   * 从用户想法生成目标
   *
   * @param idea - 用户输入的想法/描述
   * @param options - 可选参数（类别、时间范围、上下文、Provider）
   * @returns 生成的目标草稿和元数据
   *
   * @example
   * ```ts
   * const result = await goalGenerationService.generateGoal(
   *   '我想在三个月内提高英语口语能力',
   *   { category: GoalCategory.LEARNING }
   * );
   * console.log(result.goal.title); // "提升英语口语能力"
   * ```
   */
  async generateGoal(
    idea: string,
    options?: {
      category?: GoalCategory;
      timeframe?: { startDate?: number; endDate?: number };
      context?: string;
      providerUuid?: string;
    },
  ): Promise<GenerateGoalResponse> {
    // 验证输入
    this.validateIdea(idea);

    try {
      this._isGenerating = true;
      this._lastError = null;

      logger.info('Generating goal from idea', {
        ideaLength: idea.length,
        hasCategory: !!options?.category,
        hasTimeframe: !!options?.timeframe,
        hasContext: !!options?.context,
        providerUuid: options?.providerUuid,
      });

      const request: GenerateGoalRequest = {
        idea: idea.trim(),
        category: options?.category,
        timeframe: options?.timeframe,
        context: options?.context,
        providerUuid: options?.providerUuid,
        includeKeyResults: false,
      };

      const response = await goalGenerationApiClient.generateGoal(request);

      // 缓存生成结果
      this._lastGeneratedGoal = response.goal;
      this._lastGeneratedKeyResults = [];

      logger.info('Goal generated successfully', {
        goalTitle: response.goal.title,
        tokensUsed: response.tokenUsage.totalTokens,
        providerUsed: response.providerUsed,
        modelUsed: response.modelUsed,
      });

      return response;
    } catch (error) {
      const errorMessage = this.handleError(error, '生成目标失败');
      throw new Error(errorMessage);
    } finally {
      this._isGenerating = false;
    }
  }

  /**
   * 从用户想法生成目标 + 关键结果
   *
   * @param idea - 用户输入的想法/描述
   * @param options - 可选参数（类别、时间范围、上下文、Provider、KR 数量）
   * @returns 生成的目标草稿、关键结果预览和元数据
   *
   * @example
   * ```ts
   * const result = await goalGenerationService.generateGoalWithKRs(
   *   '我想在三个月内提高英语口语能力',
   *   { keyResultCount: 4 }
   * );
   * console.log(result.keyResults.length); // 4
   * ```
   */
  async generateGoalWithKRs(
    idea: string,
    options?: {
      category?: GoalCategory;
      timeframe?: { startDate?: number; endDate?: number };
      context?: string;
      providerUuid?: string;
      keyResultCount?: number;
    },
  ): Promise<GenerateGoalWithKRsResponse> {
    // 验证输入
    this.validateIdea(idea);
    this.validateKeyResultCount(options?.keyResultCount);

    try {
      this._isGenerating = true;
      this._lastError = null;

      logger.info('Generating goal with key results from idea', {
        ideaLength: idea.length,
        keyResultCount: options?.keyResultCount || 3,
        hasCategory: !!options?.category,
        hasTimeframe: !!options?.timeframe,
        providerUuid: options?.providerUuid,
      });

      const request: GenerateGoalWithKRsRequest = {
        idea: idea.trim(),
        category: options?.category,
        timeframe: options?.timeframe,
        context: options?.context,
        providerUuid: options?.providerUuid,
        keyResultCount: options?.keyResultCount,
      };

      const response = await goalGenerationApiClient.generateGoalWithKRs(request);

      // 缓存生成结果
      this._lastGeneratedGoal = response.goal;
      this._lastGeneratedKeyResults = response.keyResults;

      logger.info('Goal with key results generated successfully', {
        goalTitle: response.goal.title,
        keyResultCount: response.keyResults.length,
        tokensUsed: response.tokenUsage.totalTokens,
        providerUsed: response.providerUsed,
        modelUsed: response.modelUsed,
      });

      return response;
    } catch (error) {
      const errorMessage = this.handleError(error, '生成目标和关键结果失败');
      throw new Error(errorMessage);
    } finally {
      this._isGenerating = false;
    }
  }

  // ===== 工具方法 =====

  /**
   * 清除缓存的生成结果
   */
  clearLastGenerated(): void {
    this._lastGeneratedGoal = null;
    this._lastGeneratedKeyResults = [];
    this._lastError = null;
    logger.debug('Cleared last generated goal and key results');
  }

  /**
   * 验证用户输入的想法
   */
  private validateIdea(idea: string): void {
    if (!idea || typeof idea !== 'string') {
      throw new Error('请输入您的目标想法');
    }

    const trimmedIdea = idea.trim();
    if (trimmedIdea.length < 5) {
      throw new Error('目标描述至少需要 5 个字符');
    }

    if (trimmedIdea.length > 2000) {
      throw new Error('目标描述不能超过 2000 个字符');
    }
  }

  /**
   * 验证关键结果数量
   */
  private validateKeyResultCount(count?: number): void {
    if (count !== undefined) {
      if (count < 3 || count > 5) {
        throw new Error('关键结果数量必须在 3-5 之间');
      }
    }
  }

  /**
   * 统一错误处理
   * Pattern A: 只记录日志和设置内部状态，不显示 UI 消息
   */
  private handleError(error: unknown, defaultMessage: string): string {
    let errorMessage: string;

    if (error instanceof Error) {
      // 处理特定的错误类型
      if (error.message.includes('quota')) {
        errorMessage = 'AI 配额已用尽，请升级或等待配额重置';
      } else if (error.message.includes('JSON parse')) {
        errorMessage = 'AI 响应解析失败，请重试';
      } else if (error.message.includes('network') || error.message.includes('Network')) {
        errorMessage = '网络连接失败，请检查网络后重试';
      } else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        errorMessage = 'AI 生成超时，请稍后重试';
      } else {
        errorMessage = error.message || defaultMessage;
      }
      this._lastError = error;
    } else {
      errorMessage = defaultMessage;
      this._lastError = new Error(defaultMessage);
    }

    logger.error('Goal generation failed', {
      error: errorMessage,
      originalError: error,
    });

    return errorMessage;
  }

  /**
   * 初始化服务（可选的初始化逻辑）
   */
  async initialize(): Promise<void> {
    logger.info('GoalGenerationApplicationService initialized');
  }
}

/**
 * 导出单例实例获取函数
 */
export const goalGenerationApplicationService = GoalGenerationApplicationService.getInstance();
