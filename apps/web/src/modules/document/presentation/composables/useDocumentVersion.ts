// @ts-nocheck
/**
 * useDocumentVersion Composable
 * 
 * Presentation Layer - Composable
 * 提供版本历史、比较、恢复等响应式状态和方法
 */

import { ref, computed } from 'vue';
import { documentVersionApi } from '../../infrastructure/api/DocumentVersionApiClient';
import type { DocumentClientDTO } from '@dailyuse/contracts/editor';


export function useDocumentVersion(documentUuid: string) {
  // ==================== State ====================
  const versions = ref<DocumentVersionClientDTO[]>([]);
  const currentPage = ref(1);
  const pageSize = ref(20);
  const totalVersions = ref(0);
  const totalPages = ref(0);
  
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  const comparison = ref<VersionComparisonDTO | null>(null);
  const comparing = ref(false);
  
  const restoring = ref(false);

  // ==================== Computed ====================
  const hasVersions = computed(() => versions.value.length > 0);
  const hasMorePages = computed(() => currentPage.value < totalPages.value);

  // ==================== Methods ====================
  
  /**
   * 加载版本历史
   */
  async function loadVersions(page = 1) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await documentVersionApi.getVersionHistory(documentUuid, {
        page,
        pageSize: pageSize.value,
      });
      
      versions.value = response.items;
      currentPage.value = response.page;
      totalVersions.value = response.total;
      totalPages.value = response.totalPages;
    } catch (err: any) {
      error.value = err.message || '加载版本历史失败';
      console.error('Load versions error:', err);
    } finally {
      loading.value = false;
    }
  }

  /**
   * 加载更多版本 (分页)
   */
  async function loadMore() {
    if (!hasMorePages.value || loading.value) return;
    
    const nextPage = currentPage.value + 1;
    loading.value = true;
    
    try {
      const response = await documentVersionApi.getVersionHistory(documentUuid, {
        page: nextPage,
        pageSize: pageSize.value,
      });
      
      versions.value.push(...response.items);
      currentPage.value = response.page;
    } catch (err: any) {
      error.value = err.message || '加载更多版本失败';
      console.error('Load more versions error:', err);
    } finally {
      loading.value = false;
    }
  }

  /**
   * 比较两个版本
   */
  async function compareVersions(fromVersion: number, toVersion: number) {
    comparing.value = true;
    error.value = null;
    
    try {
      const result = await documentVersionApi.compareVersions(
        documentUuid,
        fromVersion,
        toVersion
      );
      comparison.value = result;
      return result;
    } catch (err: any) {
      error.value = err.message || '比较版本失败';
      console.error('Compare versions error:', err);
      throw err;
    } finally {
      comparing.value = false;
    }
  }

  /**
   * 恢复到指定版本
   */
  async function restoreToVersion(versionNumber: number) {
    restoring.value = true;
    error.value = null;
    
    try {
      await documentVersionApi.restoreVersion(documentUuid, versionNumber);
      
      // 恢复成功后重新加载版本历史
      await loadVersions(1);
      
      return true;
    } catch (err: any) {
      error.value = err.message || '恢复版本失败';
      console.error('Restore version error:', err);
      return false;
    } finally {
      restoring.value = false;
    }
  }

  /**
   * 清除比较结果
   */
  function clearComparison() {
    comparison.value = null;
  }

  /**
   * 刷新版本列表
   */
  async function refresh() {
    await loadVersions(currentPage.value);
  }

  // ==================== Return ====================
  return {
    // State
    versions,
    currentPage,
    pageSize,
    totalVersions,
    totalPages,
    loading,
    error,
    comparison,
    comparing,
    restoring,
    
    // Computed
    hasVersions,
    hasMorePages,
    
    // Methods
    loadVersions,
    loadMore,
    compareVersions,
    restoreToVersion,
    clearComparison,
    refresh,
  };
}

