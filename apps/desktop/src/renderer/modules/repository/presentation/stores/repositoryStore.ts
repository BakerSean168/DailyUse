/**
 * Repository Store - Zustand 状态管理
 * 
 * 管理 Repository 模块的所有状态，包括：
 * - 仓库列表缓存
 * - 资源列表缓存
 * - 文件夹列表缓存
 * - UI 状态（选中、搜索等）
 * 
 * @module repository/presentation/stores
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  RepositoryClientDTO,
  ResourceClientDTO,
  FolderClientDTO,
  RepositoryType,
  RepositoryStatus,
} from '@dailyuse/contracts/repository';

// ============ State Interface ============
export interface RepositoryState {
  // 核心数据
  repositories: RepositoryClientDTO[];
  repositoriesById: Record<string, RepositoryClientDTO>;
  resources: ResourceClientDTO[];
  resourcesById: Record<string, ResourceClientDTO>;
  folders: FolderClientDTO[];
  foldersById: Record<string, FolderClientDTO>;
  
  // 加载状态
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // UI 状态
  selectedRepositoryId: string | null;
  selectedResourceId: string | null;
  selectedFolderId: string | null;
  expandedFolderIds: Set<string>;
  
  // 搜索状态
  searchQuery: string;
  searchResults: ResourceClientDTO[];
  isSearching: boolean;
  
  // 分页信息
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  
  // 缓存管理
  lastSyncTime: Date | null;
}

// ============ Filter Options ============
export interface RepositoryFilters {
  type?: RepositoryType;
  status?: RepositoryStatus;
  searchQuery?: string;
}

export interface ResourceFilters {
  repositoryId?: string;
  folderId?: string | null;
  searchQuery?: string;
}

// ============ Actions Interface ============
export interface RepositoryActions {
  // Repository CRUD
  setRepositories: (repositories: RepositoryClientDTO[]) => void;
  addRepository: (repository: RepositoryClientDTO) => void;
  updateRepository: (id: string, updates: Partial<RepositoryClientDTO>) => void;
  removeRepository: (id: string) => void;
  
  // Resource CRUD
  setResources: (resources: ResourceClientDTO[]) => void;
  addResource: (resource: ResourceClientDTO) => void;
  updateResource: (id: string, updates: Partial<ResourceClientDTO>) => void;
  removeResource: (id: string) => void;
  
  // Folder CRUD
  setFolders: (folders: FolderClientDTO[]) => void;
  addFolder: (folder: FolderClientDTO) => void;
  updateFolder: (id: string, updates: Partial<FolderClientDTO>) => void;
  removeFolder: (id: string) => void;
  
  // 状态管理
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  
  // UI 操作
  setSelectedRepositoryId: (id: string | null) => void;
  setSelectedResourceId: (id: string | null) => void;
  setSelectedFolderId: (id: string | null) => void;
  toggleFolderExpanded: (id: string) => void;
  
  // 搜索操作
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: ResourceClientDTO[]) => void;
  setSearching: (searching: boolean) => void;
  clearSearch: () => void;
  
  // 分页操作
  setPagination: (pagination: Partial<RepositoryState['pagination']>) => void;
  
  // 生命周期
  initialize: () => Promise<void>;
  reset: () => void;
  
  // IPC 操作
  fetchRepositories: () => Promise<void>;
  fetchResources: (repositoryId: string) => Promise<void>;
  fetchFolders: (repositoryId: string) => Promise<void>;
  searchResources: (query: string) => Promise<void>;
}

// ============ Selectors Interface ============
export interface RepositorySelectors {
  // Repository selectors
  getRepositoryById: (id: string) => RepositoryClientDTO | undefined;
  getRepositoryByName: (name: string) => RepositoryClientDTO | undefined;
  getFilteredRepositories: (filters?: RepositoryFilters) => RepositoryClientDTO[];
  
  // Resource selectors
  getResourceById: (id: string) => ResourceClientDTO | undefined;
  getResourcesByRepository: (repositoryId: string) => ResourceClientDTO[];
  getResourcesByFolder: (folderId: string | null) => ResourceClientDTO[];
  
  // Folder selectors
  getFolderById: (id: string) => FolderClientDTO | undefined;
  getFoldersByRepository: (repositoryId: string) => FolderClientDTO[];
  getRootFolders: (repositoryId: string) => FolderClientDTO[];
  getChildFolders: (parentId: string) => FolderClientDTO[];
  
  // Counts
  getRepositoryCount: () => number;
  getResourceCount: () => number;
  getFolderCount: () => number;
}

// ============ Initial State ============
const initialState: RepositoryState = {
  repositories: [],
  repositoriesById: {},
  resources: [],
  resourcesById: {},
  folders: [],
  foldersById: {},
  isLoading: false,
  isInitialized: false,
  error: null,
  selectedRepositoryId: null,
  selectedResourceId: null,
  selectedFolderId: null,
  expandedFolderIds: new Set<string>(),
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
  },
  lastSyncTime: null,
};

// ============ Store ============
export const useRepositoryStore = create<RepositoryState & RepositoryActions & RepositorySelectors>()(
  immer(
    persist(
      (set, get) => ({
        ...initialState,
        
        // ========== Repository Actions ==========
        setRepositories: (repositories) => set((state) => {
          state.repositories = repositories;
          state.repositoriesById = Object.fromEntries(repositories.map(r => [r.uuid, r]));
          state.lastSyncTime = new Date();
        }),
        
        addRepository: (repository) => set((state) => {
          state.repositories.push(repository);
          state.repositoriesById[repository.uuid] = repository;
        }),
        
        updateRepository: (id, updates) => set((state) => {
          const index = state.repositories.findIndex(r => r.uuid === id);
          if (index !== -1) {
            state.repositories[index] = { ...state.repositories[index], ...updates };
            state.repositoriesById[id] = state.repositories[index];
          }
        }),
        
        removeRepository: (id) => set((state) => {
          state.repositories = state.repositories.filter(r => r.uuid !== id);
          delete state.repositoriesById[id];
          if (state.selectedRepositoryId === id) {
            state.selectedRepositoryId = null;
          }
        }),
        
        // ========== Resource Actions ==========
        setResources: (resources) => set((state) => {
          state.resources = resources;
          state.resourcesById = Object.fromEntries(resources.map(r => [r.uuid, r]));
        }),
        
        addResource: (resource) => set((state) => {
          state.resources.push(resource);
          state.resourcesById[resource.uuid] = resource;
        }),
        
        updateResource: (id, updates) => set((state) => {
          const index = state.resources.findIndex(r => r.uuid === id);
          if (index !== -1) {
            state.resources[index] = { ...state.resources[index], ...updates };
            state.resourcesById[id] = state.resources[index];
          }
        }),
        
        removeResource: (id) => set((state) => {
          state.resources = state.resources.filter(r => r.uuid !== id);
          delete state.resourcesById[id];
          if (state.selectedResourceId === id) {
            state.selectedResourceId = null;
          }
        }),
        
        // ========== Folder Actions ==========
        setFolders: (folders) => set((state) => {
          state.folders = folders;
          state.foldersById = Object.fromEntries(folders.map(f => [f.uuid, f]));
        }),
        
        addFolder: (folder) => set((state) => {
          state.folders.push(folder);
          state.foldersById[folder.uuid] = folder;
        }),
        
        updateFolder: (id, updates) => set((state) => {
          const index = state.folders.findIndex(f => f.uuid === id);
          if (index !== -1) {
            state.folders[index] = { ...state.folders[index], ...updates };
            state.foldersById[id] = state.folders[index];
          }
        }),
        
        removeFolder: (id) => set((state) => {
          state.folders = state.folders.filter(f => f.uuid !== id);
          delete state.foldersById[id];
          if (state.selectedFolderId === id) {
            state.selectedFolderId = null;
          }
        }),
        
        // ========== Status Actions ==========
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        setInitialized: (initialized) => set({ isInitialized: initialized }),
        
        // ========== UI Actions ==========
        setSelectedRepositoryId: (id) => set({ selectedRepositoryId: id }),
        setSelectedResourceId: (id) => set({ selectedResourceId: id }),
        setSelectedFolderId: (id) => set({ selectedFolderId: id }),
        
        toggleFolderExpanded: (id) => set((state) => {
          if (state.expandedFolderIds.has(id)) {
            state.expandedFolderIds.delete(id);
          } else {
            state.expandedFolderIds.add(id);
          }
        }),
        
        // ========== Search Actions ==========
        setSearchQuery: (query) => set({ searchQuery: query }),
        setSearchResults: (results) => set({ searchResults: results }),
        setSearching: (searching) => set({ isSearching: searching }),
        
        clearSearch: () => set((state) => {
          state.searchQuery = '';
          state.searchResults = [];
          state.isSearching = false;
        }),
        
        // ========== Pagination Actions ==========
        setPagination: (pagination) => set((state) => {
          state.pagination = { ...state.pagination, ...pagination };
        }),
        
        // ========== Lifecycle ==========
        initialize: async () => {
          const { isInitialized, fetchRepositories, setInitialized, setError } = get();
          if (isInitialized) return;
          
          try {
            await fetchRepositories();
            setInitialized(true);
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to initialize repository');
          }
        },
        
        reset: () => set(initialState),
        
        // ========== IPC Actions ==========
        fetchRepositories: async () => {
          const { setLoading, setRepositories, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            const repositories = await window.electron.repository.getAll();
            setRepositories(repositories);
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch repositories';
            setError(message);
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        fetchResources: async (repositoryId) => {
          const { setLoading, setResources, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            const resources = await window.electron.repository.getResources(repositoryId);
            setResources(resources);
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch resources';
            setError(message);
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        fetchFolders: async (repositoryId) => {
          const { setLoading, setFolders, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            const folders = await window.electron.repository.getFolders(repositoryId);
            setFolders(folders);
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch folders';
            setError(message);
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        searchResources: async (query) => {
          const { setSearching, setSearchResults, setSearchQuery, setError } = get();
          
          if (!query.trim()) {
            setSearchQuery('');
            setSearchResults([]);
            return;
          }
          
          try {
            setSearching(true);
            setSearchQuery(query);
            setError(null);
            
            const results = await window.electron.repository.search(query);
            setSearchResults(results);
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to search resources';
            setError(message);
            throw error;
          } finally {
            setSearching(false);
          }
        },
        
        // ========== Selectors ==========
        getRepositoryById: (id) => get().repositoriesById[id],
        
        getRepositoryByName: (name) => {
          return get().repositories.find(r => r.name === name);
        },
        
        getFilteredRepositories: (filters) => {
          const { repositories } = get();
          if (!filters) return repositories;
          
          return repositories.filter(repo => {
            if (filters.type && repo.type !== filters.type) return false;
            if (filters.status && repo.status !== filters.status) return false;
            if (filters.searchQuery) {
              const query = filters.searchQuery.toLowerCase();
              if (!repo.name.toLowerCase().includes(query)) return false;
            }
            return true;
          });
        },
        
        getResourceById: (id) => get().resourcesById[id],
        
        getResourcesByRepository: (repositoryId) => {
          return get().resources.filter(r => r.repositoryUuid === repositoryId);
        },
        
        getResourcesByFolder: (folderId) => {
          return get().resources.filter(r => r.folderUuid === folderId);
        },
        
        getFolderById: (id) => get().foldersById[id],
        
        getFoldersByRepository: (repositoryId) => {
          return get().folders.filter(f => f.repositoryUuid === repositoryId);
        },
        
        getRootFolders: (repositoryId) => {
          return get().folders.filter(f => f.repositoryUuid === repositoryId && !f.parentUuid);
        },
        
        getChildFolders: (parentId) => {
          return get().folders.filter(f => f.parentUuid === parentId);
        },
        
        getRepositoryCount: () => get().repositories.length,
        getResourceCount: () => get().resources.length,
        getFolderCount: () => get().folders.length,
      }),
      {
        name: 'repository-store',
        storage: createJSONStorage(() => localStorage),
        // 只持久化 UI 状态，不持久化数据缓存
        partialize: (state) => ({
          selectedRepositoryId: state.selectedRepositoryId,
          expandedFolderIds: Array.from(state.expandedFolderIds),
        }),
        // 反序列化时恢复 Set
        merge: (persisted: any, current) => ({
          ...current,
          ...persisted,
          expandedFolderIds: new Set(persisted?.expandedFolderIds || []),
        }),
      }
    )
  )
);
