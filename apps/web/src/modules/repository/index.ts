// @ts-nocheck
/**
 * Repository Web Module
 * 仓储Web模块导出
 */

// 导出应用层服务 (目前在 services 目录下)
export { RepositoryWebApplicationService } from './services/RepositoryWebApplicationService';

// 导出基础设施层 API 客户端
export * from './infrastructure/api/index';

// 如果有 Store，也要导出
// export { useRepositoryStore } from './presentation/stores/repositoryStore';
