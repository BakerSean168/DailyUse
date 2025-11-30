/**
 * Summarization Types
 * 文档摘要类型定义
 */

/**
 * 摘要结果
 */
export interface SummaryResult {
  summary: {
    core: string;
    keyPoints: string[];
    actionItems?: string[];
  };
  metadata: {
    tokensUsed: number;
    generatedAt: number;
    inputLength: number;
    compressionRatio: number;
  };
}

/**
 * 摘要请求
 */
export interface SummarizationRequest {
  text: string;
  language?: 'zh-CN' | 'en';
  includeActions?: boolean;
}
