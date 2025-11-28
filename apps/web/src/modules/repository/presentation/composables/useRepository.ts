// @ts-nocheck
import { ref, computed, onMounted, onBeforeUnmount, readonly } from 'vue';
import { RepositoryWebApplicationService } from '../../application/services/RepositoryWebApplicationService';
import { useRepositoryStore } from '../stores/repositoryStore';
import type { RepositoryClientDTO, ResourceClientDTO, FolderClientDTO, TagClientDTO, BookmarkClientDTO } from '@dailyuse/contracts/repository';

type RepositoryType = RepositoryType;
type RepositoryStatus = RepositoryStatus;

/**
 * Repository 模块组合式函数 - 新架构
 * 提供统一的仓库数据管理接口
 * 实现缓存优先的数据访问策略
 */
export function useRepository() {
  // ===== 服务和存储 =====
  const repositoryService = new RepositoryWebApplicationService();
  const repositoryStore = useRepositoryStore();

  // ===== 本地状态 =====
  const isOperating = ref(false);
  const operationError = ref<string | null>(null);

  // ===== 计算属性 - 数据访问 =====

  /**
   * 仓库相关
   */
  const repositories = computed(() => repositoryStore.getAllRepositories);
  const activeRepositories = computed(() => repositoryStore.getActiveRepositories);
  const archivedRepositories = computed(() => repositoryStore.getArchivedRepositories);
  const repositoriesByGoal = computed(
    () => (goalUuid: string) => repositoryStore.getRepositoriesByGoalUuid(goalUuid),
  );
  const repositoriesByType = computed(
    () => (type: RepositoryType) => repositoryStore.getRepositoriesByType(type),
  );

  /**
   * UI 状态
   */
  const isLoading = computed(() => repositoryStore.isLoading || isOperating.value);
  const error = computed(() => repositoryStore.error || operationError.value);
  const isInitialized = computed(() => repositoryStore.isInitialized);
  const pagination = computed(() => repositoryStore.pagination);

  // ===== 仓库操作 =====

  /**
   * 创建仓库
   */
  async function createRepository(request: {
    name: string;
    path: string;
    type: RepositoryType;
    description?: string;
    relatedGoals?: string[];
  }) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await repositoryService.createRepository(request);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建仓库失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 获取仓库列表
   */
  async function fetchRepositories(params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    goalUuid?: string;
  }) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await repositoryService.getRepositories(params);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取仓库列表失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 获取仓库详情
   */
  async function fetchRepository(uuid: string) {
    try {
      isOperating.value = true;
      operationError.value = null;

      // 先从缓存获取
      const cached = repositoryStore.getRepositoryByUuid(uuid);
      if (cached) {
        return cached;
      }

      // 缓存中没有，从服务器获取
      const result = await repositoryService.getRepositoryById(uuid);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取仓库详情失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 更新仓库
   */
  async function updateRepository(
    uuid: string,
    request: {
      uuid: string;
      name?: string;
      path?: string;
      type: RepositoryType;
      description?: string;
      relatedGoals?: string[];
      status?: RepositoryStatus;
    },
  ) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await repositoryService.updateRepository(uuid, request);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新仓库失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 删除仓库
   */
  async function deleteRepository(uuid: string) {
    try {
      isOperating.value = true;
      operationError.value = null;

      await repositoryService.deleteRepository(uuid);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除仓库失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 激活仓库
   */
  async function activateRepository(uuid: string) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await repositoryService.activateRepository(uuid);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '激活仓库失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 归档仓库
   */
  async function archiveRepository(uuid: string) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await repositoryService.archiveRepository(uuid);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '归档仓库失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  // ===== 资源操作 =====

  /**
   * 创建资源
   */
  async function createResource(request: CreateResourceRequestDTO) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await repositoryService.createResource(request);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建资源失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 获取资源详情
   */
  async function fetchResource(uuid: string) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await repositoryService.getResourceById(uuid);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取资源详情失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 更新资源
   */
  async function updateResource(
    uuid: string,
    request: UpdateResourceRequestDTO,
  ) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await repositoryService.updateResource(uuid, request);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新资源失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 删除资源
   */
  async function deleteResource(uuid: string) {
    try {
      isOperating.value = true;
      operationError.value = null;

      await repositoryService.deleteResource(uuid);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除资源失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 获取仓库资源列表
   */
  async function fetchRepositoryResources(
    repositoryUuid: string,
    params?: ResourceQueryParamsDTO,
  ) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await repositoryService.getRepositoryResources(repositoryUuid, params);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取仓库资源失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 搜索资源
   */
  async function searchResources(params: {
    query: string;
    repositoryUuid?: string;
    pagination?: { page: number; limit: number };
  }) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await repositoryService.searchResources(params);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '搜索资源失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  // ===== 仓库关联管理 =====

  /**
   * 关联目标到仓库
   */
  async function linkGoalToRepository(repositoryUuid: string, goalUuid: string) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await repositoryService.linkGoalToRepository(repositoryUuid, goalUuid);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '关联目标失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 取消目标与仓库的关联
   */
  async function unlinkGoalFromRepository(repositoryUuid: string, goalUuid: string) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await repositoryService.unlinkGoalFromRepository(repositoryUuid, goalUuid);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '取消关联失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  // ===== 数据查询方法 =====

  /**
   * 搜索仓库
   */
  async function searchRepositories(params: {
    query: string;
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
  }) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await repositoryService.searchRepositories(params);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '搜索仓库失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 获取与指定目标关联的仓库
   */
  async function getRepositoriesByGoal(goalUuid: string) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await repositoryService.getRepositoriesByGoal(goalUuid);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取关联仓库失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  // ===== 数据同步方法 =====

  /**
   * 同步所有仓库数据
   */
  async function syncAllRepositories() {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await repositoryService.syncAllRepositories();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '同步仓库数据失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 强制刷新所有数据
   */
  async function forceRefresh() {
    try {
      isOperating.value = true;
      operationError.value = null;

      await repositoryService.forceSync();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '刷新数据失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 初始化模块
   */
  async function initialize() {
    try {
      isOperating.value = true;
      operationError.value = null;

      await repositoryService.initialize();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '初始化模块失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  // ===== 工具方法 =====

  /**
   * 清除错误状态
   */
  function clearError() {
    operationError.value = null;
    repositoryStore.setError(null);
  }

  /**
   * 清除所有本地数据
   */
  function clearLocalData() {
    repositoryStore.clearAll();
  }

  /**
   * 获取仓库统计信息
   */
  const statistics = computed(() => repositoryStore.getRepositoryStatistics);

  // ===== 生命周期管理 =====

  /**
   * 自动初始化（可选）
   */
  const autoInitialize = ref(false);

  onMounted(async () => {
    if (autoInitialize.value) {
      try {
        await initialize();
      } catch (error) {
        console.error('Repository 模块自动初始化失败:', error);
      }
    }
  });

  onBeforeUnmount(() => {
    // 清理资源
    clearError();
  });

  // ===== 返回接口 =====

  return {
    // 服务实例
    repositoryService: readonly(repositoryService),

    // 状态
    isLoading: readonly(isLoading),
    error: readonly(error),
    isInitialized: readonly(isInitialized),
    pagination: readonly(pagination),
    statistics: readonly(statistics),

    // 数据
    repositories: readonly(repositories),
    activeRepositories: readonly(activeRepositories),
    archivedRepositories: readonly(archivedRepositories),
    repositoriesByGoal: readonly(repositoriesByGoal),
    repositoriesByType: readonly(repositoriesByType),

    // 仓库操作
    createRepository,
    fetchRepositories,
    fetchRepository,
    updateRepository,
    deleteRepository,
    activateRepository,
    archiveRepository,

    // 资源操作
    createResource,
    fetchResource,
    updateResource,
    deleteResource,
    fetchRepositoryResources,
    searchResources,

    // 关联管理
    linkGoalToRepository,
    unlinkGoalFromRepository,

    // 查询方法
    searchRepositories,
    getRepositoriesByGoal,

    // 数据同步
    syncAllRepositories,
    forceRefresh,
    initialize,

    // 工具方法
    clearError,
    clearLocalData,

    // 配置
    autoInitialize,
  };
}

/**
 * 轻量级 Repository 模块访问
 * 只提供数据访问，不执行网络操作
 */
export function useRepositoryData() {
  const repositoryStore = useRepositoryStore();

  return {
    // 状态
    isLoading: computed(() => repositoryStore.isLoading),
    error: computed(() => repositoryStore.error),
    isInitialized: computed(() => repositoryStore.isInitialized),

    // 数据访问
    repositories: computed(() => repositoryStore.getAllRepositories),
    activeRepositories: computed(() => repositoryStore.getActiveRepositories),
    archivedRepositories: computed(() => repositoryStore.getArchivedRepositories),

    // 查询方法
    getRepositoryByUuid: repositoryStore.getRepositoryByUuid,
    getRepositoryByName: repositoryStore.getRepositoryByName,
    getRepositoryByPath: repositoryStore.getRepositoryByPath,
    getRepositoriesByGoalUuid: repositoryStore.getRepositoriesByGoalUuid,
    getRepositoriesByType: repositoryStore.getRepositoriesByType,
    getRepositoriesByStatus: repositoryStore.getRepositoriesByStatus,

    // 搜索
    searchRepositories: repositoryStore.searchRepositories,

    // 统计信息
    statistics: computed(() => repositoryStore.getRepositoryStatistics),
  };
}

