/**
 * useGoalFolder Hook
 *
 * 目标文件夹管理 Hook
 */

import { useState, useCallback, useEffect } from 'react';
import { goalApplicationService } from '../../application/services';
import type { GoalFolderClientDTO, UpdateGoalFolderRequest } from '@dailyuse/contracts/goal';
import type { CreateGoalFolderInput } from '@dailyuse/application-client';

// ===== Types =====

export interface GoalFolderState {
  folders: GoalFolderClientDTO[];
  loading: boolean;
  error: string | null;
}

export interface UseGoalFolderReturn extends GoalFolderState {
  loadFolders: () => Promise<void>;
  getFolder: (id: string) => Promise<GoalFolderClientDTO | null>;
  createFolder: (input: CreateGoalFolderInput) => Promise<GoalFolderClientDTO>;
  updateFolder: (uuid: string, request: UpdateGoalFolderRequest) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  clearError: () => void;
  refresh: () => Promise<void>;
}

// ===== Hook Implementation =====

export function useGoalFolder(): UseGoalFolderReturn {
  const [state, setState] = useState<GoalFolderState>({
    folders: [],
    loading: false,
    error: null,
  });

  const loadFolders = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const folders = await goalApplicationService.listFolders();
      setState((prev) => ({ ...prev, folders, loading: false }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '加载文件夹失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, []);

  const getFolder = useCallback(async (id: string) => {
    return goalApplicationService.getFolder(id);
  }, []);

  const createFolder = useCallback(async (input: CreateGoalFolderInput) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const folder = await goalApplicationService.createFolder(input);
      setState((prev) => ({
        ...prev,
        folders: [...prev.folders, folder],
        loading: false,
      }));
      return folder;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '创建文件夹失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw e;
    }
  }, []);

  const updateFolder = useCallback(async (uuid: string, request: UpdateGoalFolderRequest) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const folder = await goalApplicationService.updateFolder(uuid, request);
      setState((prev) => ({
        ...prev,
        folders: prev.folders.map((f) => (f.uuid === uuid ? { ...f, ...folder } as GoalFolderClientDTO : f)),
        loading: false,
      }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '更新文件夹失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw e;
    }
  }, []);

  const deleteFolder = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await goalApplicationService.deleteFolder(id);
      setState((prev) => ({
        ...prev,
        folders: prev.folders.filter((f) => f.uuid !== id),
        loading: false,
      }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '删除文件夹失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw e;
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const refresh = useCallback(async () => {
    await loadFolders();
  }, [loadFolders]);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  return {
    folders: state.folders,
    loading: state.loading,
    error: state.error,
    loadFolders,
    getFolder,
    createFolder,
    updateFolder,
    deleteFolder,
    clearError,
    refresh,
  };
}

export default useGoalFolder;
