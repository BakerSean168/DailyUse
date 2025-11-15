/**
 * API模块统一导出入口
 * 提供完整的前端API解决方案
 *
 * 注意：业务API服务已迁移到各模块的infrastructure/api中
 * 此模块仅提供核心API客户端和工具
 */

// 核心类型
export type * from './core/types';

// 核心配置
export { environmentConfig, isDevelopment, isProduction } from './core/config';

// 核心客户端
export { ApiClient, createApiClient } from './core/client';
export { InterceptorManager, AuthManager } from './core/interceptors';

// 预配置实例
export { api, apiClient, publicApiClient, uploadClient, adminApiClient } from './instances';

// 跨模块查询客户端
export { CrossModuleAPIClient } from './crossModuleApiClient';
export type { GoalBindingOption, KeyResultBindingOption } from './crossModuleApiClient';

// 组合式API（如果有的话）
// export { useAuth } from './composables/useAuth';
// export { useRequest, usePagination, useInfiniteScroll } from './composables/useRequest';

// 导出默认API实例以便快速使用
export { api as default } from './instances';
