/**
 * Story 11.5: 标签统计与过滤
 * 
 * Tags Store - 标签状态管理
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { RepositoryClientDTO, ResourceClientDTO, FolderClientDTO, TagStatisticsDto, TagResourceReferenceDto } from '@dailyuse/contracts/repository';
import { apiClient } from '@/shared/api/instances';

type TagStatistics = TagStatisticsDto;
type TagResourceReference = TagResourceReferenceDto;

export const useTagsStore = defineStore('tags', () => {
  // State
  const statistics = ref<TagStatistics[]>([]);
  const selectedTag = ref<string | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const filteredResources = computed(() => {
    if (!selectedTag.value) return [];
    
    const tagStat = statistics.value.find(s => s.tag === selectedTag.value);
    return tagStat?.resources || [];
  });

  const tagCount = computed(() => statistics.value.length);

  const totalResourcesWithTags = computed(() => {
    const uniqueResourceUuids = new Set<string>();
    statistics.value.forEach(stat => {
      stat.resources.forEach(resource => {
        uniqueResourceUuids.add(resource.uuid);
      });
    });
    return uniqueResourceUuids.size;
  });

  // Actions
  async function loadStatistics(repositoryUuid: string) {
    isLoading.value = true;
    error.value = null;

    try {
      // 使用正确的 API 路径: /repositories/tags/statistics/:repositoryUuid
      const data = await apiClient.get(`/repositories/tags/statistics/${repositoryUuid}`);
      
      // apiClient 会自动提取 response.data，所以直接使用返回值
      if (Array.isArray(data)) {
        statistics.value = data;
      } else if (data && typeof data === 'object') {
        statistics.value = data.statistics || data.data || [];
      } else {
        statistics.value = [];
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to load tag statistics';
      console.error('Failed to load tag statistics:', err);
      statistics.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  function selectTag(tag: string) {
    selectedTag.value = tag;
  }

  function clearSelection() {
    selectedTag.value = null;
  }

  function reset() {
    statistics.value = [];
    selectedTag.value = null;
    error.value = null;
  }

  return {
    // State
    statistics,
    selectedTag,
    isLoading,
    error,
    
    // Computed
    filteredResources,
    tagCount,
    totalResourcesWithTags,
    
    // Actions
    loadStatistics,
    selectTag,
    clearSelection,
    reset,
  };
});

