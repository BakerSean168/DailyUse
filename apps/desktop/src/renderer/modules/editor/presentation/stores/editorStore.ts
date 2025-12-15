/**
 * Editor Store - Zustand 状态管理
 * 
 * 管理 Editor 模块的所有状态，包括：
 * - 文档列表和内容
 * - 编辑状态
 * - 版本历史
 * 
 * @module editor/presentation/stores
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { editorContainer } from '../../infrastructure/di';

// ============ Types ============
export interface EditorDocument {
  uuid: string;
  accountUuid: string;
  title: string;
  content: string;
  format: 'markdown' | 'plaintext' | 'richtext';
  folderId?: string;
  tags: string[];
  isArchived: boolean;
  isDraft: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface DocumentVersion {
  uuid: string;
  documentUuid: string;
  version: number;
  content: string;
  createdAt: number;
  createdBy: string;
}

export interface EditorState {
  // 文档列表
  documents: EditorDocument[];
  documentsById: Record<string, EditorDocument>;
  
  // 当前编辑
  activeDocumentId: string | null;
  unsavedChanges: Record<string, string>; // documentId -> content
  
  // 版本历史
  versions: DocumentVersion[];
  
  // 加载状态
  isLoading: boolean;
  isSaving: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // UI 状态
  selectedFolderId: string | null;
  searchQuery: string;
  viewMode: 'list' | 'grid';
  sortBy: 'updatedAt' | 'title' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}

export interface EditorActions {
  // 文档操作
  setDocuments: (documents: EditorDocument[]) => void;
  addDocument: (document: EditorDocument) => void;
  updateDocument: (id: string, updates: Partial<EditorDocument>) => void;
  removeDocument: (id: string) => void;
  
  // 编辑操作
  setActiveDocumentId: (id: string | null) => void;
  setUnsavedContent: (documentId: string, content: string) => void;
  clearUnsavedContent: (documentId: string) => void;
  hasUnsavedChanges: (documentId: string) => boolean;
  
  // 版本操作
  setVersions: (versions: DocumentVersion[]) => void;
  
  // 状态管理
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  
  // UI 操作
  setSelectedFolderId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: 'list' | 'grid') => void;
  setSortBy: (sortBy: 'updatedAt' | 'title' | 'createdAt') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  
  // 生命周期
  initialize: () => Promise<void>;
  reset: () => void;
  
  // IPC 操作
  fetchDocuments: () => Promise<void>;
  fetchDocument: (id: string) => Promise<EditorDocument>;
  createDocument: (data: Partial<EditorDocument>) => Promise<EditorDocument>;
  saveDocument: (id: string, content: string) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  fetchVersions: (documentId: string) => Promise<void>;
  restoreVersion: (versionId: string) => Promise<void>;
}

export interface EditorSelectors {
  getDocumentById: (id: string) => EditorDocument | undefined;
  getActiveDocument: () => EditorDocument | undefined;
  getFilteredDocuments: () => EditorDocument[];
  getDocumentsByFolder: (folderId: string | null) => EditorDocument[];
  getDraftDocuments: () => EditorDocument[];
  getRecentDocuments: (limit?: number) => EditorDocument[];
}

// ============ Initial State ============
const initialState: EditorState = {
  documents: [],
  documentsById: {},
  activeDocumentId: null,
  unsavedChanges: {},
  versions: [],
  isLoading: false,
  isSaving: false,
  isInitialized: false,
  error: null,
  selectedFolderId: null,
  searchQuery: '',
  viewMode: 'list',
  sortBy: 'updatedAt',
  sortOrder: 'desc',
};

// ============ Store ============
export const useEditorStore = create<EditorState & EditorActions & EditorSelectors>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // ========== Document Actions ==========
      setDocuments: (documents) => set({
        documents,
        documentsById: Object.fromEntries(documents.map(d => [d.uuid, d])),
      }),
      
      addDocument: (document) => set((state) => ({
        documents: [...state.documents, document],
        documentsById: { ...state.documentsById, [document.uuid]: document },
      })),
      
      updateDocument: (id, updates) => set((state) => {
        const index = state.documents.findIndex(d => d.uuid === id);
        if (index === -1) return state;
        
        const updated = { ...state.documents[index], ...updates };
        const newDocuments = [...state.documents];
        newDocuments[index] = updated;
        
        return {
          documents: newDocuments,
          documentsById: { ...state.documentsById, [id]: updated },
        };
      }),
      
      removeDocument: (id) => set((state) => {
        const { [id]: _, ...rest } = state.documentsById;
        return {
          documents: state.documents.filter(d => d.uuid !== id),
          documentsById: rest,
          activeDocumentId: state.activeDocumentId === id ? null : state.activeDocumentId,
        };
      }),
      
      // ========== Editor Actions ==========
      setActiveDocumentId: (activeDocumentId) => set({ activeDocumentId }),
      
      setUnsavedContent: (documentId, content) => set((state) => ({
        unsavedChanges: { ...state.unsavedChanges, [documentId]: content },
      })),
      
      clearUnsavedContent: (documentId) => set((state) => {
        const { [documentId]: _, ...rest } = state.unsavedChanges;
        return { unsavedChanges: rest };
      }),
      
      hasUnsavedChanges: (documentId) => documentId in get().unsavedChanges,
      
      // ========== Version Actions ==========
      setVersions: (versions) => set({ versions }),
      
      // ========== Status Actions ==========
      setLoading: (isLoading) => set({ isLoading }),
      setSaving: (isSaving) => set({ isSaving }),
      setError: (error) => set({ error }),
      setInitialized: (isInitialized) => set({ isInitialized }),
      
      // ========== UI Actions ==========
      setSelectedFolderId: (selectedFolderId) => set({ selectedFolderId }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setViewMode: (viewMode) => set({ viewMode }),
      setSortBy: (sortBy) => set({ sortBy }),
      setSortOrder: (sortOrder) => set({ sortOrder }),
      
      // ========== Lifecycle ==========
      initialize: async () => {
        const { isInitialized, fetchDocuments, setInitialized, setError } = get();
        if (isInitialized) return;
        
        try {
          await fetchDocuments();
          setInitialized(true);
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to initialize editor');
        }
      },
      
      reset: () => set(initialState),
      
      // ========== IPC Actions ==========
      fetchDocuments: async () => {
        const { setLoading, setDocuments, setError } = get();
        
        try {
          setLoading(true);
          setError(null);
          
          const editorClient = editorContainer.editorClient;
          const documents = await editorClient.listDocuments(''); // TODO: 从 AuthStore 获取账户
          
          const clientDocs: EditorDocument[] = documents.map((d: any) => ({
            uuid: d.uuid,
            accountUuid: d.accountUuid,
            title: d.title,
            content: d.content ?? '',
            format: d.format ?? 'markdown',
            folderId: d.folderId,
            tags: d.tags ?? [],
            isArchived: d.isArchived ?? false,
            isDraft: d.isDraft ?? false,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt,
          }));
          
          setDocuments(clientDocs);
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to fetch documents');
          throw error;
        } finally {
          setLoading(false);
        }
      },
      
      fetchDocument: async (id) => {
        const { setLoading, updateDocument, setError } = get();
        
        try {
          setLoading(true);
          
          const editorClient = editorContainer.editorClient;
          const doc = await editorClient.getDocument(id);
          
          const clientDoc: EditorDocument = {
            uuid: doc.uuid,
            accountUuid: doc.accountUuid,
            title: doc.title,
            content: doc.content ?? '',
            format: doc.format ?? 'markdown',
            folderId: doc.folderId,
            tags: doc.tags ?? [],
            isArchived: doc.isArchived ?? false,
            isDraft: doc.isDraft ?? false,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
          };
          
          updateDocument(id, clientDoc);
          return clientDoc;
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to fetch document');
          throw error;
        } finally {
          setLoading(false);
        }
      },
      
      createDocument: async (data) => {
        const { setSaving, addDocument, setError, setActiveDocumentId } = get();
        
        try {
          setSaving(true);
          
          const editorClient = editorContainer.editorClient;
          const doc = await editorClient.createDocument({
            accountUuid: data.accountUuid ?? '',
            title: data.title ?? 'Untitled',
            content: data.content ?? '',
            format: data.format ?? 'markdown',
          });
          
          const clientDoc: EditorDocument = {
            uuid: doc.uuid,
            accountUuid: doc.accountUuid,
            title: doc.title,
            content: doc.content ?? '',
            format: doc.format ?? 'markdown',
            folderId: doc.folderId,
            tags: doc.tags ?? [],
            isArchived: false,
            isDraft: true,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
          };
          
          addDocument(clientDoc);
          setActiveDocumentId(clientDoc.uuid);
          return clientDoc;
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to create document');
          throw error;
        } finally {
          setSaving(false);
        }
      },
      
      saveDocument: async (id, content) => {
        const { setSaving, updateDocument, clearUnsavedContent, setError } = get();
        
        try {
          setSaving(true);
          
          const editorClient = editorContainer.editorClient;
          await editorClient.saveDocument(id, content);
          
          updateDocument(id, { 
            content, 
            updatedAt: Date.now(),
            isDraft: false,
          });
          clearUnsavedContent(id);
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to save document');
          throw error;
        } finally {
          setSaving(false);
        }
      },
      
      deleteDocument: async (id) => {
        const { setLoading, removeDocument, setError } = get();
        
        try {
          setLoading(true);
          
          const editorClient = editorContainer.editorClient;
          await editorClient.deleteDocument(id);
          
          removeDocument(id);
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to delete document');
          throw error;
        } finally {
          setLoading(false);
        }
      },
      
      fetchVersions: async (documentId) => {
        const { setLoading, setVersions, setError } = get();
        
        try {
          setLoading(true);
          
          const editorClient = editorContainer.editorClient;
          const versions = await editorClient.listVersions(documentId);
          
          const clientVersions: DocumentVersion[] = versions.map((v: any) => ({
            uuid: v.uuid,
            documentUuid: v.documentUuid,
            version: v.version,
            content: v.content,
            createdAt: v.createdAt,
            createdBy: v.createdBy,
          }));
          
          setVersions(clientVersions);
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to fetch versions');
          throw error;
        } finally {
          setLoading(false);
        }
      },
      
      restoreVersion: async (versionId) => {
        const { setLoading, versions, activeDocumentId, updateDocument, setError } = get();
        
        const version = versions.find(v => v.uuid === versionId);
        if (!version || !activeDocumentId) return;
        
        try {
          setLoading(true);
          
          const editorClient = editorContainer.editorClient;
          await editorClient.restoreVersion(activeDocumentId, version.version);
          
          updateDocument(activeDocumentId, {
            content: version.content,
            updatedAt: Date.now(),
          });
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to restore version');
          throw error;
        } finally {
          setLoading(false);
        }
      },
      
      // ========== Selectors ==========
      getDocumentById: (id) => get().documentsById[id],
      
      getActiveDocument: () => {
        const { activeDocumentId, documentsById } = get();
        return activeDocumentId ? documentsById[activeDocumentId] : undefined;
      },
      
      getFilteredDocuments: () => {
        const { documents, searchQuery, selectedFolderId, sortBy, sortOrder } = get();
        
        let filtered = documents.filter(d => !d.isArchived);
        
        // Filter by folder
        if (selectedFolderId !== null) {
          filtered = filtered.filter(d => d.folderId === selectedFolderId);
        }
        
        // Filter by search query
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(d => 
            d.title.toLowerCase().includes(query) ||
            d.content.toLowerCase().includes(query)
          );
        }
        
        // Sort
        filtered.sort((a, b) => {
          let cmp = 0;
          switch (sortBy) {
            case 'title':
              cmp = a.title.localeCompare(b.title);
              break;
            case 'createdAt':
              cmp = a.createdAt - b.createdAt;
              break;
            case 'updatedAt':
            default:
              cmp = a.updatedAt - b.updatedAt;
          }
          return sortOrder === 'asc' ? cmp : -cmp;
        });
        
        return filtered;
      },
      
      getDocumentsByFolder: (folderId) => {
        return get().documents.filter(d => d.folderId === folderId && !d.isArchived);
      },
      
      getDraftDocuments: () => {
        return get().documents.filter(d => d.isDraft && !d.isArchived);
      },
      
      getRecentDocuments: (limit = 5) => {
        return [...get().documents]
          .filter(d => !d.isArchived)
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .slice(0, limit);
      },
    }),
    {
      name: 'editor-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        viewMode: state.viewMode,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        activeDocumentId: state.activeDocumentId,
      }),
    }
  )
);

// ============ Convenience Hooks ============
export const useDocuments = () => useEditorStore((state) => state.documents);
export const useActiveDocument = () => useEditorStore((state) => state.getActiveDocument());
export const useEditorLoading = () => useEditorStore((state) => state.isLoading);
export const useEditorSaving = () => useEditorStore((state) => state.isSaving);
