/**
 * useRepository Hook
 *
 * 仓库管理 Hook
 */

import { useState, useCallback } from 'react';
import { repositoryApplicationService } from '../../application/services';
import type {
  RepositoryClientDTO,
  FolderClientDTO,
  ResourceClientDTO,
  FileTreeResponse,
  SearchResponse,
} from '@dailyuse/contracts/repository';
import type { CreateFolderInput, SearchResourcesInput } from '@dailyuse/application-client';

export interface RepositoryState {
  repositories: RepositoryClientDTO[];
  currentRepository: RepositoryClientDTO | null;
  fileTree: FileTreeResponse | null;
  currentFolder: FolderClientDTO | null;
  folderContents: {
    folders: FolderClientDTO[];
    resources: ResourceClientDTO[];
  };
  searchResults: SearchResponse | null;
  loading: boolean;
  error: string | null;
}

export interface UseRepositoryReturn extends RepositoryState {
  loadRepositories: () => Promise<void>;
  selectRepository: (repositoryUuid: string) => Promise<void>;
  loadFileTree: (repositoryUuid: string) => Promise<void>;
  loadFolderContents: (folderUuid: string) => Promise<void>;
  createFolder: (input: CreateFolderInput) => Promise<FolderClientDTO>;
  deleteFolder: (folderUuid: string) => Promise<void>;
  deleteResource: (resourceUuid: string) => Promise<void>;
  searchResources: (input: SearchResourcesInput) => Promise<void>;
  clearSearchResults: () => void;
}

/**
 * 仓库管理 Hook
 */
export function useRepository(): UseRepositoryReturn {
  const [state, setState] = useState<RepositoryState>({
    repositories: [],
    currentRepository: null,
    fileTree: null,
    currentFolder: null,
    folderContents: { folders: [], resources: [] },
    searchResults: null,
    loading: false,
    error: null,
  });

  /**
   * 加载仓库列表
   */
  const loadRepositories = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const repositories = await repositoryApplicationService.listRepositories();
      setState(prev => ({
        ...prev,
        repositories,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '加载仓库失败',
      }));
    }
  }, []);

  /**
   * 选择仓库
   */
  const selectRepository = useCallback(async (repositoryUuid: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const [repository, fileTree] = await Promise.all([
        repositoryApplicationService.getRepository(repositoryUuid),
        repositoryApplicationService.getFileTree(repositoryUuid),
      ]);
      setState(prev => ({
        ...prev,
        currentRepository: repository,
        fileTree,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '选择仓库失败',
      }));
    }
  }, []);

  /**
   * 加载文件树
   */
  const loadFileTree = useCallback(async (repositoryUuid: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const fileTree = await repositoryApplicationService.getFileTree(repositoryUuid);
      setState(prev => ({
        ...prev,
        fileTree,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '加载文件树失败',
      }));
    }
  }, []);

  /**
   * 加载文件夹内容
   */
  const loadFolderContents = useCallback(async (folderUuid: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const contents = await repositoryApplicationService.getFolderContents(folderUuid);
      setState(prev => ({
        ...prev,
        folderContents: {
          folders: contents.folders || [],
          resources: contents.resources || [],
        },
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '加载文件夹内容失败',
      }));
    }
  }, []);

  /**
   * 创建文件夹
   */
  const createFolder = useCallback(async (input: CreateFolderInput): Promise<FolderClientDTO> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const folder = await repositoryApplicationService.createFolder(input);
      setState(prev => ({
        ...prev,
        folderContents: {
          ...prev.folderContents,
          folders: [...prev.folderContents.folders, folder],
        },
        loading: false,
      }));
      return folder;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '创建文件夹失败',
      }));
      throw error;
    }
  }, []);

  /**
   * 删除文件夹
   */
  const deleteFolder = useCallback(async (folderUuid: string) => {
    try {
      await repositoryApplicationService.deleteFolder(folderUuid);
      setState(prev => ({
        ...prev,
        folderContents: {
          ...prev.folderContents,
          folders: prev.folderContents.folders.filter(f => f.uuid !== folderUuid),
        },
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '删除文件夹失败',
      }));
    }
  }, []);

  /**
   * 删除资源
   */
  const deleteResource = useCallback(async (resourceUuid: string) => {
    try {
      await repositoryApplicationService.deleteResource(resourceUuid);
      setState(prev => ({
        ...prev,
        folderContents: {
          ...prev.folderContents,
          resources: prev.folderContents.resources.filter(r => r.uuid !== resourceUuid),
        },
        // 更新搜索结果中的 results
        searchResults: prev.searchResults
          ? {
              ...prev.searchResults,
              results: prev.searchResults.results.filter(r => r.resourceUuid !== resourceUuid),
            }
          : null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '删除资源失败',
      }));
    }
  }, []);

  /**
   * 搜索资源
   */
  const searchResources = useCallback(async (input: SearchResourcesInput) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const results = await repositoryApplicationService.searchResources(input);
      setState(prev => ({
        ...prev,
        searchResults: results,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '搜索资源失败',
      }));
    }
  }, []);

  /**
   * 清空搜索结果
   */
  const clearSearchResults = useCallback(() => {
    setState(prev => ({ ...prev, searchResults: null }));
  }, []);

  return {
    ...state,
    loadRepositories,
    selectRepository,
    loadFileTree,
    loadFolderContents,
    createFolder,
    deleteFolder,
    deleteResource,
    searchResources,
    clearSearchResults,
  };
}
