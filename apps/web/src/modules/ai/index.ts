/**
 * AI 模块导出
 * DDD Architecture: Presentation, Infrastructure layers
 */

// ===== Presentation Layer =====
export { useAIGeneration } from './presentation/composables/useAIGeneration';

// ===== Infrastructure Layer =====
export { aiGenerationApiClient } from './infrastructure/api/aiGenerationApiClient';

// ===== Types =====
export type { AIGenerationApiClient } from './infrastructure/api/aiGenerationApiClient';

/**
 * 初始化 AI 模块
 * 应用启动时调用此方法
 */
export async function initializeAIModule(): Promise<void> {
  try {
    console.log('正在初始化 AI 模块...');
    // AI 模块无需特殊初始化，配额等数据按需加载
    console.log('AI 模块初始化完成');
  } catch (error) {
    console.error('AI 模块初始化失败:', error);
    throw error;
  }
}
