// @ts-nocheck
import { defineStore } from 'pinia';
import { Repository, Resource } from '@dailyuse/domain-client';
import { RepositoryContracts } from '@dailyuse/contracts';

/**
 * Repository Store - 新架构
 * 纯缓存存储，不直接调用外部服务
 * 所有数据操作通过 ApplicationService 进行
 */
export const useRepositoryStore = defineStore('repository', {
  state: () => ({
    // ===== 核心数据 =====
    repositories: [] as Repository[],
    resources: [] as Resource[],

    // ===== 状态管理 =====
    isLoading: false,
    error: null as string | null,
    isInitialized: false,

    // ===== UI 状态 =====
    selectedRepository: null as string | null,
    selectedResource: null as string | null,
    repositoryBeingEdited: null as Repository | null,

    // ===== 分页信息 =====
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
    },

    // ===== 缓存管理 =====
    lastSyncTime: null as Date | null,
    cacheExpiry: 5 * 60 * 1000, // 5分钟过期
  }),

  getters: {
    // ===== 基础获取器 =====

    /**
     * 获取所有仓库
     */
    getAllRepositories(state): Repository[] {
      return state.repositories as Repository[];
    },

    /**
     * 获取所有资源
     */
    getAllResources(state): Resource[] {
      return state.resources as Resource[];
    },

    /**
     * 根据UUID获取仓库
     */
    getRepositoryByUuid:
      (state) =>
      (uuid: string): Repository | null => {
        const found = state.repositories.find((r) => r.uuid === uuid);
        if (!found) return null;

        // 如果反序列化正常工作，这里应该已经是 Repository 实例
        // 但为了安全起见，如果不是实例则转换
        if (found instanceof Repository) {
          return found;
        } else {
          console.warn('[RepositoryStore] 发现非实体对象，正在转换为 Repository 实例');
          return Repository.fromServerDTO(found as any);
        }
      },

    /**
     * 根据UUID获取资源
     */
    getResourceByUuid:
      (state) =>
      (uuid: string): Resource | null => {
        const found = state.resources.find((r) => r.uuid === uuid);
        if (!found) return null;

        // 确保返回的是 Resource 实例
        if (found instanceof Resource) {
          return found;
        } else {
          console.warn('[RepositoryStore] 发现非实体对象，正在转换为 Resource 实例');
          return Resource.fromServerDTO(found as any);
        }
      },

    /**
     * 根据名称获取仓库
     */
    getRepositoryByName:
      (state) =>
      (name: string): Repository | null => {
        const found = state.repositories.find((r) => r.name === name);
        if (!found) return null;

        return found instanceof Repository ? found : Repository.fromServerDTO(found as any);
      },

    /**
     * 根据路径获取仓库
     */
    getRepositoryByPath:
      (state) =>
      (path: string): Repository | null => {
        const found = state.repositories.find((r) => r.path === path);
        if (!found) return null;

        return found instanceof Repository ? found : Repository.fromServerDTO(found as any);
      },

    /**
     * 根据仓库UUID获取资源
     */
    getResourcesByRepositoryUuid:
      (state) =>
      (repositoryUuid: string): Resource[] => {
        return state.resources
          .filter((r) => r.repositoryUuid === repositoryUuid)
          .map((resource) => {
            if (resource instanceof Resource) {
              return resource;
            } else {
              return Resource.fromServerDTO(resource as any);
            }
          });
      },

    // ===== 选中状态 =====

    /**
     * 获取当前选中的仓库
     */
    getSelectedRepository(state): Repository | null {
      if (!state.selectedRepository) return null;
      const found = state.repositories.find((r) => r.uuid === state.selectedRepository);
      if (!found) return null;

      return found instanceof Repository ? found : Repository.fromServerDTO(found as any);
    },

    /**
     * 获取当前选中的资源
     */
    getSelectedResource(state): Resource | null {
      if (!state.selectedResource) return null;
      const found = state.resources.find((r) => r.uuid === state.selectedResource);
      if (!found) return null;

      return found instanceof Resource ? found : Resource.fromServerDTO(found as any);
    },

    /**
     * 获取正在编辑的仓库
     */
    getRepositoryBeingEdited(state): Repository | null {
      if (!state.repositoryBeingEdited) return null;

      const repo = state.repositoryBeingEdited;
      if (repo instanceof Repository) {
        return repo;
      } else {
        console.warn('[RepositoryStore] 发现非实体对象，正在转换为 Repository 实例');
        return Repository.fromServerDTO(repo as any);
      }
    },

    // ===== 业务逻辑获取器 =====

    /**
     * 根据目标UUID获取关联的仓库
     */
    getRepositoriesByGoalUuid:
      (state) =>
      (goalUuid: string): Repository[] => {
        return state.repositories
          .filter((r) => {
            if (!r.relatedGoals || r.relatedGoals.length === 0) return false;
            return r.relatedGoals.includes(goalUuid);
          })
          .map((repo) => {
            if (repo instanceof Repository) {
              return repo;
            } else {
              return Repository.fromServerDTO(repo as any);
            }
          });
      },

    /**
     * 根据类型获取仓库
     */
    getRepositoriesByType:
      (state) =>
      (type: RepositoryContracts.RepositoryType): Repository[] => {
        return state.repositories
          .filter((r) => r.type === type)
          .map((repo) => {
            if (repo instanceof Repository) {
              return repo;
            } else {
              return Repository.fromServerDTO(repo as any);
            }
          });
      },

    /**
     * 根据状态获取仓库
     */
    getRepositoriesByStatus:
      (state) =>
      (status: RepositoryContracts.RepositoryStatus): Repository[] => {
        return state.repositories
          .filter((r) => r.status === status)
          .map((repo) => {
            if (repo instanceof Repository) {
              return repo;
            } else {
              return Repository.fromServerDTO(repo as any);
            }
          });
      },

    /**
     * 获取活跃仓库
     */
    getActiveRepositories(state): Repository[] {
      return state.repositories
        .filter((r) => r.status === RepositoryContracts.RepositoryStatus.ACTIVE)
        .map((repo) => {
          if (repo instanceof Repository) {
            return repo;
          } else {
            return Repository.fromServerDTO(repo as any);
          }
        });
    },

    /**
     * 获取已归档仓库
     */
    getArchivedRepositories(state): Repository[] {
      return state.repositories
        .filter((r) => r.status === RepositoryContracts.RepositoryStatus.ARCHIVED)
        .map((repo) => {
          if (repo instanceof Repository) {
            return repo;
          } else {
            return Repository.fromServerDTO(repo as any);
          }
        });
    },

    /**
     * 根据类型获取资源
     */
    getResourcesByType:
      (state) =>
      (type: RepositoryContracts.ResourceType): Resource[] => {
        return state.resources
          .filter((r) => r.type === type)
          .map((resource) => {
            if (resource instanceof Resource) {
              return resource;
            } else {
              return Resource.fromServerDTO(resource as any);
            }
          });
      },

    /**
     * 根据状态获取资源
     */
    getResourcesByStatus:
      (state) =>
      (status: RepositoryContracts.ResourceStatus): Resource[] => {
        return state.resources
          .filter((r) => r.status === status)
          .map((resource) => {
            if (resource instanceof Resource) {
              return resource;
            } else {
              return Resource.fromServerDTO(resource as any);
            }
          });
      },

    // ===== 搜索相关 =====

    /**
     * 搜索仓库（按名称和描述）
     */
    searchRepositories:
      (state) =>
      (query: string): Repository[] => {
        if (!query.trim()) return state.repositories as Repository[];

        const lowerQuery = query.toLowerCase();
        return state.repositories
          .filter((r) => {
            return (
              r.name?.toLowerCase().includes(lowerQuery) ||
              r.description?.toLowerCase().includes(lowerQuery) ||
              r.path?.toLowerCase().includes(lowerQuery)
            );
          })
          .map((repo) => {
            if (repo instanceof Repository) {
              return repo;
            } else {
              return Repository.fromServerDTO(repo as any);
            }
          });
      },

    /**
     * 搜索资源（按名称和描述）
     */
    searchResources:
      (state) =>
      (query: string): Resource[] => {
        if (!query.trim()) return state.resources as Resource[];

        const lowerQuery = query.toLowerCase();
        return state.resources
          .filter((r) => {
            return (
              r.name?.toLowerCase().includes(lowerQuery) ||
              r.description?.toLowerCase().includes(lowerQuery) ||
              r.path?.toLowerCase().includes(lowerQuery) ||
              r.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
            );
          })
          .map((resource) => {
            if (resource instanceof Resource) {
              return resource;
            } else {
              return Resource.fromServerDTO(resource as any);
            }
          });
      },

    // ===== 统计信息 =====

    /**
     * 仓库统计
     */
    getRepositoryStatistics(state): {
      total: number;
      active: number;
      archived: number;
      syncing: number;
      inactive: number;
      byType: Record<string, number>;
    } {
      const total = state.repositories.length;
      const active = state.repositories.filter(
        (r) => r.status === RepositoryContracts.RepositoryStatus.ACTIVE,
      ).length;
      const archived = state.repositories.filter(
        (r) => r.status === RepositoryContracts.RepositoryStatus.ARCHIVED,
      ).length;
      const syncing = state.repositories.filter(
        (r) => r.status === RepositoryContracts.RepositoryStatus.SYNCING,
      ).length;
      const inactive = state.repositories.filter(
        (r) => r.status === RepositoryContracts.RepositoryStatus.INACTIVE,
      ).length;

      const byType: Record<string, number> = {};
      state.repositories.forEach((repo) => {
        const type = repo.type || 'unknown';
        byType[type] = (byType[type] || 0) + 1;
      });

      return { total, active, archived, syncing, inactive, byType };
    },

    /**
     * 资源统计
     */
    getResourceStatistics(state): {
      total: number;
      active: number;
      archived: number;
      draft: number;
      byType: Record<string, number>;
      byRepository: Record<string, number>;
    } {
      const total = state.resources.length;
      const active = state.resources.filter(
        (r) => r.status === RepositoryContracts.ResourceStatus.ACTIVE,
      ).length;
      const archived = state.resources.filter(
        (r) => r.status === RepositoryContracts.ResourceStatus.ARCHIVED,
      ).length;
      const draft = state.resources.filter(
        (r) => r.status === RepositoryContracts.ResourceStatus.DRAFT,
      ).length;

      const byType: Record<string, number> = {};
      const byRepository: Record<string, number> = {};

      state.resources.forEach((resource) => {
        // 按类型统计
        const type = resource.type || 'unknown';
        byType[type] = (byType[type] || 0) + 1;

        // 按仓库统计
        const repositoryUuid = resource.repositoryUuid || 'unknown';
        byRepository[repositoryUuid] = (byRepository[repositoryUuid] || 0) + 1;
      });

      return { total, active, archived, draft, byType, byRepository };
    },

    // ===== 缓存管理 =====

    /**
     * 检查是否需要刷新缓存
     */
    shouldRefreshCache(state): boolean {
      if (!state.lastSyncTime) return true;

      // 如果超过30分钟未同步，则需要刷新
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      return state.lastSyncTime < thirtyMinutesAgo;
    },
  },

  actions: {
    // ===== 状态管理 =====

    /**
     * 设置加载状态
     */
    setLoading(loading: boolean) {
      this.isLoading = loading;
    },

    /**
     * 设置错误信息
     */
    setError(error: string | null) {
      this.error = error;
    },

    /**
     * 标记为已初始化
     */
    setInitialized(initialized: boolean) {
      this.isInitialized = initialized;
    },

    /**
     * 更新最后同步时间
     */
    updateLastSyncTime() {
      this.lastSyncTime = new Date();
    },

    /**
     * 设置分页信息
     */
    setPagination(pagination: { page?: number; limit?: number; total?: number }) {
      this.pagination = { ...this.pagination, ...pagination };
    },

    // ===== 选中状态管理 =====

    /**
     * 设置选中的仓库
     */
    setSelectedRepository(uuid: string | null) {
      this.selectedRepository = uuid;
    },

    /**
     * 设置选中的资源
     */
    setSelectedResource(uuid: string | null) {
      this.selectedResource = uuid;
    },

    /**
     * 设置正在编辑的仓库
     */
    setRepositoryBeingEdited(repository: Repository | null) {
      this.repositoryBeingEdited = repository;
    },

    // ===== 数据同步方法（由 ApplicationService 调用）=====

    /**
     * 批量设置仓库
     */
    setRepositories(repositories: Repository[]) {
      this.repositories = [...repositories];
      console.log(`✅ [RepositoryStore] 已设置 ${repositories.length} 个仓库`);
    },

    /**
     * 批量设置资源
     */
    setResources(resources: Resource[]) {
      this.resources = [...resources];
      console.log(`✅ [RepositoryStore] 已设置 ${resources.length} 个资源`);
    },

    /**
     * 添加单个仓库到缓存
     */
    addRepository(repository: Repository) {
      const existingIndex = this.repositories.findIndex((r) => r.uuid === repository.uuid);
      if (existingIndex >= 0) {
        this.repositories[existingIndex] = repository;
      } else {
        this.repositories.push(repository);
      }
    },

    /**
     * 添加单个资源到缓存
     */
    addResource(resource: Resource) {
      const existingIndex = this.resources.findIndex((r) => r.uuid === resource.uuid);
      if (existingIndex >= 0) {
        this.resources[existingIndex] = resource;
      } else {
        this.resources.push(resource);
      }
    },

    /**
     * 添加多个仓库到缓存
     */
    addRepositories(repositories: Repository[]) {
      repositories.forEach((repository) => {
        this.addRepository(repository);
      });
    },

    /**
     * 添加多个资源到缓存
     */
    addResources(resources: Resource[]) {
      resources.forEach((resource) => {
        this.addResource(resource);
      });
    },

    /**
     * 更新仓库
     */
    updateRepository(uuid: string, updatedRepository: Repository) {
      const index = this.repositories.findIndex((r) => r.uuid === uuid);
      if (index >= 0) {
        this.repositories[index] = updatedRepository;
      }
    },

    /**
     * 更新资源
     */
    updateResource(uuid: string, updatedResource: Resource) {
      const index = this.resources.findIndex((r) => r.uuid === uuid);
      if (index >= 0) {
        this.resources[index] = updatedResource;
      }
    },

    /**
     * 移除仓库
     */
    removeRepository(uuid: string) {
      const index = this.repositories.findIndex((r) => r.uuid === uuid);
      if (index >= 0) {
        this.repositories.splice(index, 1);

        // 如果删除的是当前选中的仓库，清除选中状态
        if (this.selectedRepository === uuid) {
          this.selectedRepository = null;
        }

        // 如果删除的是正在编辑的仓库，清除编辑状态
        if (this.repositoryBeingEdited?.uuid === uuid) {
          this.repositoryBeingEdited = null;
        }

        // 同时移除该仓库下的所有资源
        this.removeResourcesByRepositoryUuid(uuid);
      }
    },

    /**
     * 移除资源
     */
    removeResource(uuid: string) {
      const index = this.resources.findIndex((r) => r.uuid === uuid);
      if (index >= 0) {
        this.resources.splice(index, 1);

        // 如果删除的是当前选中的资源，清除选中状态
        if (this.selectedResource === uuid) {
          this.selectedResource = null;
        }
      }
    },

    /**
     * 根据仓库UUID移除相关资源
     */
    removeResourcesByRepositoryUuid(repositoryUuid: string) {
      this.resources = this.resources.filter(
        (resource) => resource.repositoryUuid !== repositoryUuid,
      );
    },

    /**
     * 批量移除仓库
     */
    removeRepositories(uuids: string[]) {
      this.repositories = this.repositories.filter(
        (repository) => !uuids.includes(repository.uuid),
      );

      // 如果删除的包含当前选中的仓库，清除选中状态
      if (this.selectedRepository && uuids.includes(this.selectedRepository)) {
        this.selectedRepository = null;
      }

      // 如果删除的包含正在编辑的仓库，清除编辑状态
      if (this.repositoryBeingEdited && uuids.includes(this.repositoryBeingEdited.uuid)) {
        this.repositoryBeingEdited = null;
      }

      // 移除这些仓库下的所有资源
      uuids.forEach((uuid) => {
        this.removeResourcesByRepositoryUuid(uuid);
      });
    },

    /**
     * 批量移除资源
     */
    removeResources(uuids: string[]) {
      this.resources = this.resources.filter((resource) => !uuids.includes(resource.uuid));

      // 如果删除的包含当前选中的资源，清除选中状态
      if (this.selectedResource && uuids.includes(this.selectedResource)) {
        this.selectedResource = null;
      }
    },

    // ===== 初始化和清理 =====

    /**
     * 初始化 Store
     */
    initialize(): void {
      this.isInitialized = true;
      console.log(
        `✅ [RepositoryStore] 初始化完成: ${this.repositories.length} 个仓库，${this.resources.length} 个资源`,
      );
    },

    /**
     * 清除所有数据
     */
    clearAll() {
      this.repositories = [];
      this.resources = [];
      this.selectedRepository = null;
      this.selectedResource = null;
      this.repositoryBeingEdited = null;
      this.lastSyncTime = null;
      this.error = null;
      this.isInitialized = false;

      console.log('🧹 [RepositoryStore] 已清除所有数据');
    },

    /**
     * 批量同步所有数据
     */
    syncAllData(repositories: Repository[], resources: Resource[]) {
      this.setRepositories(repositories);
      this.setResources(resources);
      this.updateLastSyncTime();

      console.log('🔄 [RepositoryStore] 批量同步完成');
    },

    // ===== 兼容性方法（保持向后兼容）=====

    /**
     * @deprecated 使用 getRepositoryByUuid 替代
     */
    getRepositoryById(uuid: string) {
      console.warn('[RepositoryStore] getRepositoryById 已废弃，请使用 getRepositoryByUuid');
      return this.repositories.find((r) => r.uuid === uuid) || null;
    },

    /**
     * @deprecated 使用 getResourceByUuid 替代
     */
    getResourceById(uuid: string) {
      console.warn('[RepositoryStore] getResourceById 已废弃，请使用 getResourceByUuid');
      return this.resources.find((r) => r.uuid === uuid) || null;
    },

    /**
     * 开始编辑仓库 - 创建副本
     */
    startEditingRepository(uuid: string) {
      const repository = this.getRepositoryByUuid(uuid);
      if (repository) {
        // 使用 DTO 转换创建副本以避免引用问题
        this.repositoryBeingEdited = Repository.fromServerDTO(repository.toServerDTO());
      }
    },

    /**
     * 取消编辑
     */
    cancelEditing() {
      this.repositoryBeingEdited = null;
    },

    /**
     * 获取可序列化的状态快照
     */
    getSerializableSnapshot() {
      return {
        repositories: [...this.repositories],
        resources: [...this.resources],
        timestamp: Date.now(),
      };
    },

    /**
     * 从快照恢复数据
     */
    restoreFromSnapshot(snapshot: {
      repositories: Repository[];
      resources: Resource[];
      timestamp?: number;
    }) {
      this.setRepositories(snapshot.repositories);
      this.setResources(snapshot.resources);
      this.updateLastSyncTime();

      console.log(`✅ [RepositoryStore] 从快照恢复数据成功`);
    },
  },

  persist: {
    key: 'repository-store',
    storage: localStorage,
    // 选择性持久化关键数据，避免持久化加载状态
    pick: [
      'repositories',
      'resources',
      'selectedRepository',
      'selectedResource',
      'lastSyncTime',
      'isInitialized',
    ],

    // 自定义序列化器，处理Date对象和Domain实体
    serializer: {
      serialize: (value: any) => {
        try {
          // 处理需要序列化的数据
          const serializedValue = {
            ...value,
            // 将Date转换为ISO字符串
            lastSyncTime: value.lastSyncTime ? value.lastSyncTime.toISOString() : null,

            // 将Domain实体转换为DTO
            repositories:
              value.repositories?.map((repository: any) =>
                repository && typeof repository.toDTO === 'function'
                  ? repository.toServerDTO()
                  : repository,
              ) || [],

            resources:
              value.resources?.map((resource: any) =>
                resource && typeof resource.toDTO === 'function'
                  ? resource.toServerDTO()
                  : resource,
              ) || [],
          };

          return JSON.stringify(serializedValue);
        } catch (error) {
          console.error('RepositoryStore 序列化失败:', error);
          return JSON.stringify({});
        }
      },

      deserialize: (value: string) => {
        try {
          const parsed = JSON.parse(value);

          return {
            ...parsed,
            // 恢复Date对象
            lastSyncTime: parsed.lastSyncTime ? new Date(parsed.lastSyncTime) : null,

            // 将DTO转换回Domain实体（当实体类可用时）
            repositories:
              parsed.repositories?.map((repositoryDTO: any) => {
                if (repositoryDTO && Repository && typeof Repository.fromServerDTO === 'function') {
                  return Repository.fromServerDTO(repositoryDTO);
                }
                return repositoryDTO;
              }) || [],

            resources:
              parsed.resources?.map((resourceDTO: any) => {
                if (resourceDTO && Resource && typeof Resource.fromServerDTO === 'function') {
                  return Resource.fromServerDTO(resourceDTO);
                }
                return resourceDTO;
              }) || [],
          };
        } catch (error) {
          console.error('RepositoryStore 反序列化失败:', error);
          return {};
        }
      },
    },
  },
});

export type RepositoryStore = ReturnType<typeof useRepositoryStore>;
