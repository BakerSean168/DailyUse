/**
 * useDocument Composable
 * 文档管理 Composable
 *
 * 🔄 重构说明（方案 A - 简化版）：
 * - Composable 负责协调 ApplicationService 和状态管理
 * - Service 直接返回 DTO 或抛出错误
 * - Composable 使用 try/catch 处理错误 + 显示通知
 */

// @ts-nocheck
import { ref } from 'vue';
import { documentApplicationService } from '../application/DocumentApplicationService';
import type { DocumentClientDTO } from '@dailyuse/contracts/editor';
import { getGlobalMessage } from '@dailyuse/ui';

export function useDocument() {
  const documents = ref<DocumentClientDTO[]>([]);
  const currentDocument = ref<DocumentClientDTO | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pagination = ref({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  const { success: showSuccess, error: showError } = getGlobalMessage();

  const loadDocuments = async (options?: FindDocumentsQueryDTO) => {
    try {
      loading.value = true;
      error.value = null;

      const result = await documentApplicationService.findDocuments({
        page: options?.page || 1,
        pageSize: options?.pageSize || 20,
        sortBy: options?.sortBy,
        sortOrder: options?.sortOrder,
        folderPath: options?.folderPath,
      });

      documents.value = result.items;
      pagination.value = {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      };
    } catch (e: any) {
      error.value = e.response?.data?.message || '加载文档列表失败';
      showError(error.value);
    } finally {
      loading.value = false;
    }
  };

  const loadDocument = async (uuid: string) => {
    try {
      loading.value = true;
      error.value = null;

      currentDocument.value = await documentApplicationService.findDocumentByUuid(uuid);
    } catch (e: any) {
      error.value = e.response?.data?.message || '加载文档详情失败';
      showError(error.value);
    } finally {
      loading.value = false;
    }
  };

  const createDocument = async (dto: CreateDocumentDTO) => {
    try {
      loading.value = true;
      error.value = null;

      const newDocument = await documentApplicationService.createDocument(dto);
      documents.value.unshift(newDocument);
      showSuccess('文档创建成功');
      return newDocument;
    } catch (e: any) {
      error.value = e.response?.data?.message || '创建文档失败';
      showError(error.value);
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const updateDocument = async (uuid: string, dto: UpdateDocumentDTO) => {
    try {
      loading.value = true;
      error.value = null;

      const updated = await documentApplicationService.updateDocument(uuid, dto);
      const index = documents.value.findIndex((d) => d.uuid === uuid);
      if (index !== -1) {
        documents.value[index] = updated;
      }
      if (currentDocument.value?.uuid === uuid) {
        currentDocument.value = updated;
      }
      showSuccess('文档更新成功');
      return updated;
    } catch (e: any) {
      error.value = e.response?.data?.message || '更新文档失败';
      showError(error.value);
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const deleteDocument = async (uuid: string) => {
    try {
      loading.value = true;
      error.value = null;

      await documentApplicationService.deleteDocument(uuid);
      documents.value = documents.value.filter((d) => d.uuid !== uuid);
      if (currentDocument.value?.uuid === uuid) {
        currentDocument.value = null;
      }
      showSuccess('文档已删除');
    } catch (e: any) {
      error.value = e.response?.data?.message || '删除文档失败';
      showError(error.value);
      throw e;
    } finally {
      loading.value = false;
    }
  };

  return {
    documents,
    currentDocument,
    loading,
    error,
    pagination,
    loadDocuments,
    loadDocument,
    createDocument,
    updateDocument,
    deleteDocument,
  };
}

