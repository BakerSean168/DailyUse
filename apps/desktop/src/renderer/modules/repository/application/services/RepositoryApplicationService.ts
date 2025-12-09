/**
 * Repository Application Service - Renderer
 *
 * 仓库模块应用服务层
 * 封装 @dailyuse/application-client 的 Repository Use Cases
 */

import {
  listRepositories,
  getRepository,
  getFileTree,
  searchResources,
  createFolder,
  getFolderContents,
  deleteFolder,
  getResource,
  deleteResource,
  type SearchResourcesInput,
  type CreateFolderInput,
  type GetFolderContentsOutput,
} from '@dailyuse/application-client';

/**
 * 仓库应用服务
 *
 * 提供仓库相关的所有业务操作
 * 返回类型与 @dailyuse/application-client 保持一致
 */
export class RepositoryApplicationService {
  // ===== Repository Operations =====

  /**
   * 获取仓库列表
   */
  listRepositories() {
    return listRepositories();
  }

  /**
   * 获取单个仓库
   */
  getRepository(repositoryUuid: string) {
    return getRepository(repositoryUuid);
  }

  /**
   * 获取文件树
   */
  getFileTree(repositoryUuid: string) {
    return getFileTree(repositoryUuid);
  }

  /**
   * 搜索资源
   */
  searchResources(input: SearchResourcesInput) {
    return searchResources(input);
  }

  // ===== Folder Operations =====

  /**
   * 创建文件夹
   */
  createFolder(input: CreateFolderInput) {
    return createFolder(input);
  }

  /**
   * 获取文件夹内容
   */
  getFolderContents(folderUuid: string): Promise<GetFolderContentsOutput> {
    return getFolderContents(folderUuid);
  }

  /**
   * 删除文件夹
   */
  deleteFolder(folderUuid: string) {
    return deleteFolder(folderUuid);
  }

  // ===== Resource Operations =====

  /**
   * 获取资源
   */
  getResource(resourceUuid: string) {
    return getResource(resourceUuid);
  }

  /**
   * 删除资源
   */
  deleteResource(resourceUuid: string) {
    return deleteResource(resourceUuid);
  }
}

/**
 * 仓库应用服务单例
 */
export const repositoryApplicationService = new RepositoryApplicationService();
