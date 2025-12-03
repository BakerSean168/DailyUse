import { defineStore } from 'pinia';
import type { FolderClient } from '@dailyuse/contracts/repository';
import { Folder } from '@dailyuse/domain-client/repository';

// 类型声明使用 FolderClient 接口（避免 TS 展开类的私有字段）
// 运行时实际存储的是 Folder 实体实例
type FolderData = FolderClient;

/**
 * Folder Store
 * 管理文件夹数据，支持树形结构
 * 
 * 注意：Pinia 响应式系统会保留类实例的方法。
 * 持久化时通过自定义 serializer 处理：
 * - serialize: 调用 toServerDTO() 转为纯数据
 * - deserialize: 调用 Folder.fromServerDTO() 重建实体实例
 */
export const useFolderStore = defineStore('folder', {
  state: () => ({
    // ===== 核心数据 =====
    folders: [] as FolderData[],
    foldersByRepository: {} as Record<string, FolderData[]>, // 按仓储UUID索引

    // ===== 状态管理 =====
    isLoading: false,
    error: null as string | null,

    // ===== UI 状态 =====
    selectedFolder: null as string | null,
    expandedFolders: [] as string[], // 展开的文件夹UUID列表
  }),

  getters: {
    /**
     * 获取所有文件夹
     */
    getAllFolders(state): FolderData[] {
      return state.folders;
    },

    /**
     * 根据UUID获取文件夹
     */
    getFolderByUuid:
      (state) =>
      (uuid: string): FolderData | null => {
        return state.folders.find((f) => f.uuid === uuid) || null;
      },

    /**
     * 根据仓储UUID获取文件夹
     */
    getFoldersByRepositoryUuid:
      (state) =>
      (repositoryUuid: string): FolderData[] => {
        return state.foldersByRepository[repositoryUuid] || [];
      },

    /**
     * 获取根文件夹（无父文件夹）
     */
    getRootFolders:
      (state) =>
      (repositoryUuid: string): FolderData[] => {
        const folders = state.foldersByRepository[repositoryUuid] || [];
        return folders.filter((f) => !f.parentUuid);
      },

    /**
     * 根据父UUID获取子文件夹
     */
    getChildrenFolders:
      (state) =>
      (parentUuid: string): FolderData[] => {
        return state.folders.filter((f) => f.parentUuid === parentUuid);
      },

    /**
     * 获取文件夹树（仅根节点）
     */
    getFolderTree:
      (state) =>
      (repositoryUuid: string): FolderData[] => {
        const allFolders = state.foldersByRepository[repositoryUuid] || [];
        return buildTree(allFolders);
      },

    /**
     * 获取当前选中的文件夹
     */
    getSelectedFolder(state): FolderData | null {
      if (!state.selectedFolder) return null;
      return state.folders.find((f) => f.uuid === state.selectedFolder) || null;
    },

    /**
     * 检查文件夹是否已展开
     */
    isFolderExpanded:
      (state) =>
      (uuid: string): boolean => {
        return state.expandedFolders.includes(uuid);
      },
  },

  actions: {
    // ===== 状态管理 =====
    setLoading(loading: boolean) {
      this.isLoading = loading;
    },

    setError(error: string | null) {
      this.error = error;
    },

    // ===== 数据同步方法（由 ApplicationService 调用）=====

    /**
     * 设置仓储的文件夹树
     */
    setFoldersForRepository(repositoryUuid: string, folders: FolderData[]) {
      this.foldersByRepository[repositoryUuid] = folders;
      
      // 同时更新全局文件夹列表
      // 移除该仓储的旧文件夹
      this.folders = this.folders.filter((f) => f.repositoryUuid !== repositoryUuid);
      // 添加新文件夹
      this.folders.push(...folders);

      console.log(`✅ [FolderStore] 已设置 ${folders.length} 个文件夹 (仓储: ${repositoryUuid})`);
    },

    /**
     * 添加单个文件夹
     */
    addFolder(folder: FolderData) {
      const existingIndex = this.folders.findIndex((f) => f.uuid === folder.uuid);
      if (existingIndex >= 0) {
        this.folders[existingIndex] = folder;
      } else {
        this.folders.push(folder);
      }

      // 更新 foldersByRepository 索引
      const repositoryUuid = folder.repositoryUuid;
      if (!this.foldersByRepository[repositoryUuid]) {
        this.foldersByRepository[repositoryUuid] = [];
      }
      
      const repoFolderIndex = this.foldersByRepository[repositoryUuid].findIndex(
        (f) => f.uuid === folder.uuid
      );
      
      if (repoFolderIndex >= 0) {
        this.foldersByRepository[repositoryUuid][repoFolderIndex] = folder;
      } else {
        this.foldersByRepository[repositoryUuid].push(folder);
      }
    },

    /**
     * 更新文件夹
     */
    updateFolder(uuid: string, updatedFolder: FolderData) {
      const index = this.folders.findIndex((f) => f.uuid === uuid);
      if (index >= 0) {
        this.folders[index] = updatedFolder;

        // 更新 foldersByRepository 索引
        const repositoryUuid = updatedFolder.repositoryUuid;
        const repoFolderIndex = this.foldersByRepository[repositoryUuid]?.findIndex(
          (f) => f.uuid === uuid
        );
        if (repoFolderIndex >= 0) {
          this.foldersByRepository[repositoryUuid][repoFolderIndex] = updatedFolder;
        }
      }
    },

    /**
     * 移除文件夹
     */
    removeFolder(uuid: string) {
      const folder = this.folders.find((f) => f.uuid === uuid);
      if (!folder) return;

      const repositoryUuid = folder.repositoryUuid;

      // 从全局列表移除
      this.folders = this.folders.filter((f) => f.uuid !== uuid);

      // 从 foldersByRepository 移除
      if (this.foldersByRepository[repositoryUuid]) {
        this.foldersByRepository[repositoryUuid] = this.foldersByRepository[repositoryUuid].filter(
          (f) => f.uuid !== uuid
        );
      }

      // 如果删除的是当前选中的文件夹，清除选中状态
      if (this.selectedFolder === uuid) {
        this.selectedFolder = null;
      }

      // 从展开列表移除
      this.expandedFolders = this.expandedFolders.filter((id) => id !== uuid);
    },

    /**
     * 移除仓储的所有文件夹
     */
    removeFoldersByRepositoryUuid(repositoryUuid: string) {
      // 从全局列表移除
      this.folders = this.folders.filter((f) => f.repositoryUuid !== repositoryUuid);

      // 从 foldersByRepository 移除
      delete this.foldersByRepository[repositoryUuid];

      // 清除相关的选中和展开状态
      const foldersToRemove = this.folders.filter((f) => f.repositoryUuid === repositoryUuid);
      foldersToRemove.forEach((folder) => {
        if (this.selectedFolder === folder.uuid) {
          this.selectedFolder = null;
        }
        this.expandedFolders = this.expandedFolders.filter((id) => id !== folder.uuid);
      });
    },

    // ===== 选中状态管理 =====

    /**
     * 设置选中的文件夹
     */
    setSelectedFolder(uuid: string | null) {
      this.selectedFolder = uuid;
    },

    /**
     * 切换文件夹展开状态
     */
    toggleFolderExpansion(uuid: string) {
      const index = this.expandedFolders.indexOf(uuid);
      if (index >= 0) {
        this.expandedFolders.splice(index, 1);
      } else {
        this.expandedFolders.push(uuid);
      }
    },

    /**
     * 展开文件夹
     */
    expandFolder(uuid: string) {
      if (!this.expandedFolders.includes(uuid)) {
        this.expandedFolders.push(uuid);
      }
    },

    /**
     * 折叠文件夹
     */
    collapseFolder(uuid: string) {
      this.expandedFolders = this.expandedFolders.filter((id) => id !== uuid);
    },

    /**
     * 展开所有文件夹
     */
    expandAll(repositoryUuid: string) {
      const folders = this.foldersByRepository[repositoryUuid] || [];
      this.expandedFolders = folders.map((f) => f.uuid);
    },

    /**
     * 折叠所有文件夹
     */
    collapseAll() {
      this.expandedFolders = [];
    },

    // ===== 初始化和清理 =====

    /**
     * 清除所有数据
     */
    clearAll() {
      this.folders = [];
      this.foldersByRepository = {};
      this.selectedFolder = null;
      this.expandedFolders = [];
      this.error = null;

      console.log('🧹 [FolderStore] 已清除所有数据');
    },
  },

  persist: {
    key: 'folder-store',
    storage: localStorage,
    pick: ['folders', 'foldersByRepository', 'selectedFolder', 'expandedFolders'],

    serializer: {
      serialize: (value: any) => {
        try {
          const serializedValue = {
            ...value,
            folders:
              value.folders?.map((folder: any) =>
                folder && typeof folder.toServerDTO === 'function'
                  ? folder.toServerDTO()
                  : folder
              ) || [],
            foldersByRepository: Object.entries(value.foldersByRepository || {}).reduce(
              (acc, [key, folders]: [string, any]) => {
                acc[key] =
                  folders?.map((folder: any) =>
                    folder && typeof folder.toServerDTO === 'function'
                      ? folder.toServerDTO()
                      : folder
                  ) || [];
                return acc;
              },
              {} as Record<string, any>
            ),
          };

          return JSON.stringify(serializedValue);
        } catch (error) {
          console.error('FolderStore 序列化失败:', error);
          return JSON.stringify({});
        }
      },

      deserialize: (value: string) => {
        try {
          const parsed = JSON.parse(value);

          return {
            ...parsed,
            // 将 DTO 转换回 Folder 实体
            folders: (parsed.folders || []).map((dto: any) => Folder.fromServerDTO(dto)),
            foldersByRepository: Object.entries(parsed.foldersByRepository || {}).reduce(
              (acc, [key, folders]: [string, any]) => {
                acc[key] = (folders || []).map((dto: any) => Folder.fromServerDTO(dto));
                return acc;
              },
              {} as Record<string, FolderData[]>
            ),
          };
        } catch (error) {
          console.error('FolderStore 反序列化失败:', error);
          return {};
        }
      },
    },
  },
});

/**
 * 构建文件夹树
 * 注意：Folder 实体已经带有 children 属性，此函数只是返回根文件夹
 */
function buildTree(folders: FolderData[]): FolderData[] {
  // Folder 实体本身已包含 children，直接返回根文件夹
  return folders.filter((f) => !f.parentUuid);
}

export type FolderStore = ReturnType<typeof useFolderStore>;

