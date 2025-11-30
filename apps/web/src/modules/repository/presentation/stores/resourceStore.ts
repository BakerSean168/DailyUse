/**
 * Resource Store - Pinia
 * Epic 10 Story 10-2: Resource CRUD + Markdown 编辑器
 * 
 * Features:
 * - Resource CRUD operations
 * - Multi-tab management
 * - Auto-save with 500ms debounce
 * - LocalStorage persistence
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import type { RepositoryClientDTO, ResourceClientDTO, FolderClientDTO } from '@dailyuse/contracts/repository';
import { ResourceApiClient } from '../../infrastructure/api/ResourceApiClient';
import { apiClient } from '@/shared/api/instances';

export interface ResourceTab {
  uuid: string;
  name: string;
  icon: string;
  isDirty: boolean;
  isPinned?: boolean;
}

export const useResourceStore = defineStore('resource', () => {
  // State
  const resources = ref<ResourceClientDTO[]>([]);
  const selectedResource = ref<ResourceClientDTO | null>(null);
  const openTabs = ref<ResourceTab[]>([]);
  const activeTabUuid = ref<string | null>(null);
  const isLoading = ref(false);
  const isSaving = ref(false);

  // API Client
  const resourceApi = new ResourceApiClient(apiClient);

  // Computed
  const activeTab = computed(() => {
    return openTabs.value.find((tab) => tab.uuid === activeTabUuid.value);
  });

  const hasUnsavedChanges = computed(() => {
    return openTabs.value.some((tab) => tab.isDirty);
  });

  // Actions

  /**
   * 加载仓库下的所有资源
   */
  async function loadResources(repositoryUuid: string) {
    try {
      isLoading.value = true;
      resources.value = await resourceApi.getResourcesByRepository(repositoryUuid);
    } catch (error) {
      console.error('Failed to load resources:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 加载单个资源详情
   */
  async function loadResourceById(uuid: string) {
    try {
      isLoading.value = true;
      selectedResource.value = await resourceApi.getResourceById(uuid);
      return selectedResource.value;
    } catch (error) {
      console.error('Failed to load resource:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 创建新资源
   */
  async function createResource(dto: {
    repositoryUuid: string;
    name: string;
    type: string;
    path: string;
    folderUuid?: string;
    content?: string;
  }) {
    try {
      isLoading.value = true;
      const newResource = await resourceApi.createResource(dto);
      resources.value.push(newResource);
      return newResource;
    } catch (error) {
      console.error('Failed to create resource:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 保存 Markdown 内容 (带 500ms 防抖)
   */
  const debouncedSaveContent = useDebounceFn(
    async (uuid: string, content: string) => {
      try {
        isSaving.value = true;
        await resourceApi.updateMarkdownContent(uuid, content);

        // 更新 tab 状态
        const tab = openTabs.value.find((t) => t.uuid === uuid);
        if (tab) {
          tab.isDirty = false;
        }

        // 更新资源列表
        const resource = resources.value.find((r) => r.uuid === uuid);
        if (resource) {
          resource.content = content;
          resource.updatedAt = Date.now();
        }

        console.log(`✅ Resource ${uuid} saved successfully`);
      } catch (error) {
        console.error('Failed to save content:', error);
        throw error;
      } finally {
        isSaving.value = false;
      }
    },
    500 // 500ms debounce
  );

  /**
   * 保存内容 (Story 10-2 AC #5)
   */
  async function saveContent(uuid: string, content: string) {
    // 标记为 dirty
    const tab = openTabs.value.find((t) => t.uuid === uuid);
    if (tab) {
      tab.isDirty = true;
    }

    // 触发防抖保存
    await debouncedSaveContent(uuid, content);
  }

  /**
   * 立即保存 (强制)
   */
  async function saveContentImmediately(uuid: string, content: string) {
    try {
      isSaving.value = true;
      await resourceApi.updateMarkdownContent(uuid, content);

      const tab = openTabs.value.find((t) => t.uuid === uuid);
      if (tab) {
        tab.isDirty = false;
      }

      const resource = resources.value.find((r) => r.uuid === uuid);
      if (resource) {
        resource.content = content;
        resource.updatedAt = Date.now();
      }
    } catch (error) {
      console.error('Failed to save content immediately:', error);
      throw error;
    } finally {
      isSaving.value = false;
    }
  }

  /**
   * 删除资源
   */
  async function deleteResource(uuid: string) {
    try {
      await resourceApi.deleteResource(uuid);
      resources.value = resources.value.filter((r) => r.uuid !== uuid);

      // 关闭对应的 tab
      closeTab(uuid);
    } catch (error) {
      console.error('Failed to delete resource:', error);
      throw error;
    }
  }

  /**
   * 在新标签页中打开资源 (Story 10-2 AC #6)
   */
  async function openInTab(resource: ResourceClientDTO) {
    // 检查是否已打开
    const existingTab = openTabs.value.find((tab) => tab.uuid === resource.uuid);
    if (existingTab) {
      activeTabUuid.value = resource.uuid;
      return;
    }

    // 加载完整资源数据
    const fullResource = await loadResourceById(resource.uuid);

    // 创建新 tab
    const newTab: ResourceTab = {
      uuid: resource.uuid,
      name: resource.name,
      icon: getResourceIcon(resource.type),
      isDirty: false,
      isPinned: false,
    };

    openTabs.value.push(newTab);
    activeTabUuid.value = resource.uuid;
    selectedResource.value = fullResource;
  }

  /**
   * 关闭标签页
   */
  function closeTab(uuid: string) {
    const index = openTabs.value.findIndex((tab) => tab.uuid === uuid);
    if (index === -1) return;

    // 检查是否有未保存的更改
    const tab = openTabs.value[index];
    if (tab.isDirty) {
      // 由调用方处理确认对话框
      return false;
    }

    openTabs.value.splice(index, 1);

    // 如果关闭的是当前激活的 tab，切换到上一个
    if (activeTabUuid.value === uuid) {
      if (openTabs.value.length > 0) {
        activeTabUuid.value = openTabs.value[Math.max(0, index - 1)].uuid;
      } else {
        activeTabUuid.value = null;
        selectedResource.value = null;
      }
    }

    return true;
  }

  /**
   * 切换到指定 tab
   */
  async function switchTab(uuid: string) {
    activeTabUuid.value = uuid;
    await loadResourceById(uuid);
  }

  /**
   * 固定/取消固定 tab
   */
  function togglePinTab(uuid: string) {
    const tab = openTabs.value.find((t) => t.uuid === uuid);
    if (tab) {
      tab.isPinned = !tab.isPinned;
    }
  }

  /**
   * 关闭所有 tab (除了固定的)
   */
  function closeAllTabs(excludePinned = true) {
    if (excludePinned) {
      openTabs.value = openTabs.value.filter((tab) => tab.isPinned);
    } else {
      openTabs.value = [];
    }

    if (openTabs.value.length > 0) {
      activeTabUuid.value = openTabs.value[0].uuid;
    } else {
      activeTabUuid.value = null;
      selectedResource.value = null;
    }
  }

  /**
   * 关闭其他 tab
   */
  function closeOtherTabs(keepUuid: string) {
    openTabs.value = openTabs.value.filter(
      (tab) => tab.uuid === keepUuid || tab.isPinned
    );
    activeTabUuid.value = keepUuid;
  }

  /**
   * 重排序 tabs (拖拽)
   */
  function reorderTabs(newOrder: ResourceTab[]) {
    openTabs.value = newOrder;
  }

  /**
   * 获取资源图标
   */
  function getResourceIcon(type: string): string {
    const iconMap: Record<string, string> = {
      MARKDOWN: 'mdi-language-markdown',
      IMAGE: 'mdi-image',
      VIDEO: 'mdi-video',
      AUDIO: 'mdi-music',
      PDF: 'mdi-file-pdf-box',
      LINK: 'mdi-link',
      CODE: 'mdi-code-braces',
      OTHER: 'mdi-file',
    };
    return iconMap[type] || 'mdi-file';
  }

  /**
   * 重置状态
   */
  function reset() {
    resources.value = [];
    selectedResource.value = null;
    openTabs.value = [];
    activeTabUuid.value = null;
    isLoading.value = false;
    isSaving.value = false;
  }

  return {
    // State
    resources,
    selectedResource,
    openTabs,
    activeTabUuid,
    isLoading,
    isSaving,

    // Computed
    activeTab,
    hasUnsavedChanges,

    // Actions
    loadResources,
    loadResourceById,
    createResource,
    saveContent,
    saveContentImmediately,
    deleteResource,
    openInTab,
    closeTab,
    switchTab,
    togglePinTab,
    closeAllTabs,
    closeOtherTabs,
    reorderTabs,
    reset,
  };
});

