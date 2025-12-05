/**
 * Generate Key Results
 *
 * AI 生成关键结果用例
 */

import type { IGoalApiClient } from '@dailyuse/infrastructure-client';
import { GoalContainer } from '@dailyuse/infrastructure-client';

/**
 * Generate Key Results Input
 */
export interface GenerateKeyResultsInput {
  goalTitle: string;
  goalDescription?: string;
  startDate: number;
  endDate: number;
  goalContext?: string;
}

/**
 * Generate Key Results Output
 */
export interface GenerateKeyResultsOutput {
  keyResults: Array<{
    title: string;
    description?: string;
    targetValue?: number;
    unit?: string;
  }>;
  tokenUsage: unknown;
  generatedAt: number;
}

/**
 * Generate Key Results
 */
export class GenerateKeyResults {
  private static instance: GenerateKeyResults;

  private constructor(private readonly apiClient: IGoalApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalApiClient): GenerateKeyResults {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getGoalApiClient();
    GenerateKeyResults.instance = new GenerateKeyResults(client);
    return GenerateKeyResults.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GenerateKeyResults {
    if (!GenerateKeyResults.instance) {
      GenerateKeyResults.instance = GenerateKeyResults.createInstance();
    }
    return GenerateKeyResults.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GenerateKeyResults.instance = undefined as unknown as GenerateKeyResults;
  }

  /**
   * 执行用例
   */
  async execute(input: GenerateKeyResultsInput): Promise<GenerateKeyResultsOutput> {
    return this.apiClient.generateKeyResults(input);
  }
}

/**
 * 便捷函数
 */
export const generateKeyResults = (input: GenerateKeyResultsInput): Promise<GenerateKeyResultsOutput> =>
  GenerateKeyResults.getInstance().execute(input);
