/**
 * Repository Application Services - 按用例拆分
 * 
 * 服务列表：
 * - RepositoryManagementApplicationService: 仓库 CRUD
 * - ResourceManagementApplicationService: 资源 CRUD
 * - RepositorySearchApplicationService: 搜索功能
 * - RepositoryGoalLinkApplicationService: 目标关联
 * - RepositoryGitApplicationService: Git 操作
 * - RepositorySyncApplicationService: 数据同步
 */

export * from './RepositoryManagementApplicationService';
export * from './ResourceManagementApplicationService';
export * from './RepositorySearchApplicationService';
export * from './RepositoryGoalLinkApplicationService';
export * from './RepositoryGitApplicationService';
export * from './RepositorySyncApplicationService';

// 向后兼容：保留旧的 RepositoryWebApplicationService（标记为废弃）
export { RepositoryWebApplicationService } from './RepositoryWebApplicationService';
