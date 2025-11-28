// @ts-nocheck
import { ref } from 'vue';
import { documentApiClient } from '../api/DocumentApiClient';
import type { DocumentClientDTO } from '@dailyuse/contracts/editor';

type DocumentClientDTO = DocumentClientDTO;
type CreateDocumentDTO = CreateDocumentDTO;
type UpdateDocumentDTO = UpdateDocumentDTO;
type FindDocumentsQueryDTO = FindDocumentsQueryDTO;

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

  const loadDocuments = async (options?: FindDocumentsQueryDTO) => {
    loading.value = true;
    error.value = null;

    try {
      const result = await documentApiClient.findDocuments({
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
      console.error('Failed to load documents:', e);
    } finally {
      loading.value = false;
    }
  };

  const loadDocument = async (uuid: string) => {
    loading.value = true;
    error.value = null;

    try {
      currentDocument.value = await documentApiClient.findDocumentByUuid(uuid);
    } catch (e: any) {
      error.value = e.response?.data?.message || '加载文档详情失败';
      console.error('Failed to load document:', e);
    } finally {
      loading.value = false;
    }
  };

  const createDocument = async (dto: CreateDocumentDTO) => {
    loading.value = true;
    error.value = null;

    try {
      const newDocument = await documentApiClient.createDocument(dto);
      documents.value.unshift(newDocument);
      return newDocument;
    } catch (e: any) {
      error.value = e.response?.data?.message || '创建文档失败';
      console.error('Failed to create document:', e);
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const updateDocument = async (uuid: string, dto: UpdateDocumentDTO) => {
    loading.value = true;
    error.value = null;

    try {
      const updated = await documentApiClient.updateDocument(uuid, dto);
      const index = documents.value.findIndex((d) => d.uuid === uuid);
      if (index !== -1) {
        documents.value[index] = updated;
      }
      if (currentDocument.value?.uuid === uuid) {
        currentDocument.value = updated;
      }
      return updated;
    } catch (e: any) {
      error.value = e.response?.data?.message || '更新文档失败';
      console.error('Failed to update document:', e);
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const deleteDocument = async (uuid: string) => {
    loading.value = true;
    error.value = null;

    try {
      await documentApiClient.deleteDocument(uuid);
      documents.value = documents.value.filter((d) => d.uuid !== uuid);
      if (currentDocument.value?.uuid === uuid) {
        currentDocument.value = null;
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || '删除文档失败';
      console.error('Failed to delete document:', e);
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

