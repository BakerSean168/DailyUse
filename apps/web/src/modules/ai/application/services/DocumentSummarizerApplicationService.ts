/**
 * Document Summarizer Application Service
 * 文档摘要应用服务 - 负责文档摘要生成
 *
 * 🔄 重构说明（方案 A - 简化版）：
 * - ApplicationService 只负责 API 调用 + DTO → Entity 转换
 * - 不再直接依赖 Store，返回数据给调用方
 * - Store 操作由 Composable 层负责
 */

import { apiClient } from '@/shared/api/instances';
import type { SummaryResult, SummarizationRequest } from '../../presentation/types/summarization';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('DocumentSummarizerApplicationService');

export class DocumentSummarizerApplicationService {
  private static instance: DocumentSummarizerApplicationService;

  private constructor() {}

  static getInstance(): DocumentSummarizerApplicationService {
    if (!DocumentSummarizerApplicationService.instance) {
      DocumentSummarizerApplicationService.instance =
        new DocumentSummarizerApplicationService();
    }
    return DocumentSummarizerApplicationService.instance;
  }

  /**
   * 生成文档摘要
   */
  async summarize(request: SummarizationRequest): Promise<SummaryResult> {
    logger.info('Generating document summary', {
      textLength: request.text.length,
      language: request.language,
      includeActions: request.includeActions,
    });

    const result = await apiClient.post<SummaryResult>('/api/ai/summarize', request);

    logger.info('Document summary generated', {
      tokensUsed: result.metadata.tokensUsed,
      compressionRatio: result.metadata.compressionRatio,
    });

    return result;
  }
}

export const documentSummarizerApplicationService =
  DocumentSummarizerApplicationService.getInstance();
