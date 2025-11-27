/**
 * AI 模块导出
 * DDD Architecture: Presentation, Infrastructure layers
 */

// ===== Presentation Layer - Composables =====
export { useAIGeneration } from './presentation/composables/useAIGeneration';
export { useAIProviders } from './presentation/composables/useAIProviders';
export { useGoalGeneration } from './presentation/composables/useGoalGeneration';

// ===== Presentation Layer - Components =====
// 注意: Vue 组件通过动态导入使用，避免在 index.ts 中直接导出

// ===== Infrastructure Layer =====
export { aiGenerationApiClient } from './infrastructure/api/aiGenerationApiClient';
export { aiProviderApiClient } from './infrastructure/api/aiProviderApiClient';
export { goalGenerationApiClient } from './infrastructure/api/goalGenerationApiClient';

// ===== Types =====
export type { AIGenerationApiClient } from './infrastructure/api/aiGenerationApiClient';
export type { AIProviderApiClient } from './infrastructure/api/aiProviderApiClient';
export type { GoalGenerationApiClient } from './infrastructure/api/goalGenerationApiClient';

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
