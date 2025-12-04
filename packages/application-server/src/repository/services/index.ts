/**
 * Repository Services Index
 *
 * 导出所有 Repository 模块的 Services
 */

// ===== Repository 用例 =====
export { CreateRepository, createRepository } from './create-repository';
export type { CreateRepositoryInput } from './create-repository';

export { GetRepository, getRepository } from './get-repository';

export { ListRepositories, listRepositories } from './list-repositories';

export { UpdateRepositoryConfig, updateRepositoryConfig } from './update-repository-config';
export type { UpdateRepositoryConfigInput } from './update-repository-config';

export { UpdateRepositoryStats, updateRepositoryStats } from './update-repository-stats';
export type { UpdateRepositoryStatsInput } from './update-repository-stats';

export { ArchiveRepository, archiveRepository } from './archive-repository';

export { ActivateRepository, activateRepository } from './activate-repository';

export { DeleteRepository, deleteRepository } from './delete-repository';

// ===== Resource 用例 =====
export { CreateResource, createResource } from './create-resource';
export type { CreateResourceInput } from './create-resource';

export { GetResource, getResource as getResourceById } from './get-resource';

export { ListResources, listResources as getResourcesByRepository } from './list-resources';

export { UpdateResourceContent, updateResourceContent as updateMarkdownContent } from './update-resource-content';
export type { UpdateResourceContentInput } from './update-resource-content';

export { DeleteResource, deleteResource } from './delete-resource';

// ===== Folder 用例 =====
export { CreateFolder, createFolder } from './create-folder';
export type { CreateFolderInput } from './create-folder';

export { GetFolder, getFolder } from './get-folder';

export { GetFolderTree, getFolderTree } from './get-folder-tree';

export { RenameFolder, renameFolder } from './rename-folder';

export { MoveFolder, moveFolder } from './move-folder';

export { DeleteFolder, deleteFolder } from './delete-folder';

// ===== Search Service =====
export {
  SearchService,
  search,
} from './search-application';

// ===== Tags Service =====
export {
  TagsService,
  getTagStatistics,
} from './tags-application';

// ===== Repository Statistics Service =====
export {
  RepositoryStatisticsService,
  getOrCreateStatistics,
  getStatistics,
  initializeStatistics,
  recalculateStatistics,
  handleStatisticsUpdateEvent,
  deleteStatistics,
} from './repository-statistics-application';

