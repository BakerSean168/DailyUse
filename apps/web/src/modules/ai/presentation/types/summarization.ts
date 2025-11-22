// Migrated from ai-tools/types/summarization.ts
export interface SummaryResult {
  summary: { core: string; keyPoints: string[]; actionItems?: string[] };
  metadata: {
    tokensUsed: number;
    generatedAt: number;
    inputLength: number;
    compressionRatio: number;
  };
}
export interface SummarizationRequest {
  text: string;
  language?: 'zh-CN' | 'en';
  includeActions?: boolean;
}
