/**
 * AI 模块初始化
 * DDD Architecture: Initialization Layer
 */

import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AIModuleInit');

/**
 * 初始化 AI 模块
 * 应用启动时调用此方法
 */
export async function initializeAIModule(): Promise<void> {
  try {
    logger.info('正在初始化 AI 模块...');
    
    // AI 模块无需特殊初始化，配额等数据按需加载
    // 未来可添加：
    // - 预加载 AI Provider 配置
    // - 初始化对话历史缓存
    // - 注册事件监听器
    
    logger.info('AI 模块初始化完成');
  } catch (error) {
    logger.error('AI 模块初始化失败:', error);
    throw error;
  }
}
