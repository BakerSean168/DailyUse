/**
 * useTaskTemplate Hook
 *
 * 任务模板管理 Hook
 */

import { useState, useCallback, useEffect } from 'react';
import { taskApplicationService } from '../../application/services';
import type { TaskTemplateClientDTO, UpdateTaskTemplateRequest } from '@dailyuse/contracts/task';
import type { CreateTaskTemplateInput } from '@dailyuse/application-client';

// ===== Types =====

export interface TaskTemplateState {
  templates: TaskTemplateClientDTO[];
  selectedTemplate: TaskTemplateClientDTO | null;
  loading: boolean;
  error: string | null;
}

export interface UseTaskTemplateReturn extends TaskTemplateState {
  // Query
  loadTemplates: () => Promise<void>;
  getTemplate: (id: string) => Promise<TaskTemplateClientDTO | null>;
  
  // Mutations
  createTemplate: (input: CreateTaskTemplateInput) => Promise<TaskTemplateClientDTO>;
  updateTemplate: (uuid: string, request: UpdateTaskTemplateRequest) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  
  // Status changes
  activateTemplate: (id: string) => Promise<void>;
  pauseTemplate: (id: string) => Promise<void>;
  archiveTemplate: (id: string) => Promise<void>;
  
  // Selection
  selectTemplate: (template: TaskTemplateClientDTO | null) => void;
  
  // Utilities
  clearError: () => void;
  refresh: () => Promise<void>;
}

// ===== Hook Implementation =====

export function useTaskTemplate(): UseTaskTemplateReturn {
  const [state, setState] = useState<TaskTemplateState>({
    templates: [],
    selectedTemplate: null,
    loading: false,
    error: null,
  });

  // ===== Query =====

  const loadTemplates = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const templates = await taskApplicationService.listTemplates();
      setState((prev) => ({ ...prev, templates, loading: false }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '加载任务模板失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, []);

  const getTemplate = useCallback(async (id: string) => {
    return taskApplicationService.getTemplate(id);
  }, []);

  // ===== Mutations =====

  const createTemplate = useCallback(async (input: CreateTaskTemplateInput) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const template = await taskApplicationService.createTemplate(input);
      setState((prev) => ({
        ...prev,
        templates: [...prev.templates, template],
        loading: false,
      }));
      return template;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '创建任务模板失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw e;
    }
  }, []);

  const updateTemplate = useCallback(async (uuid: string, request: UpdateTaskTemplateRequest) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const template = await taskApplicationService.updateTemplate(uuid, request);
      setState((prev) => ({
        ...prev,
        templates: prev.templates.map((t) => (t.uuid === uuid ? { ...t, ...template } as TaskTemplateClientDTO : t)),
        selectedTemplate: prev.selectedTemplate?.uuid === uuid ? { ...prev.selectedTemplate, ...template } as TaskTemplateClientDTO : prev.selectedTemplate,
        loading: false,
      }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '更新任务模板失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw e;
    }
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await taskApplicationService.deleteTemplate(id);
      setState((prev) => ({
        ...prev,
        templates: prev.templates.filter((t) => t.uuid !== id),
        selectedTemplate: prev.selectedTemplate?.uuid === id ? null : prev.selectedTemplate,
        loading: false,
      }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '删除任务模板失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw e;
    }
  }, []);

  // ===== Status Changes =====

  const activateTemplate = useCallback(async (id: string) => {
    try {
      await taskApplicationService.activateTemplate(id);
      // Reload templates after activation
      const templates = await taskApplicationService.listTemplates();
      setState((prev) => ({
        ...prev,
        templates,
      }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '激活任务失败';
      setState((prev) => ({ ...prev, error: errorMessage }));
      throw e;
    }
  }, []);

  const pauseTemplate = useCallback(async (id: string) => {
    try {
      const template = await taskApplicationService.pauseTemplate(id);
      setState((prev) => ({
        ...prev,
        templates: prev.templates.map((t) => (t.uuid === id ? template : t)),
      }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '暂停任务失败';
      setState((prev) => ({ ...prev, error: errorMessage }));
      throw e;
    }
  }, []);

  const archiveTemplate = useCallback(async (id: string) => {
    try {
      const template = await taskApplicationService.archiveTemplate(id);
      setState((prev) => ({
        ...prev,
        templates: prev.templates.map((t) => (t.uuid === id ? template : t)),
      }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '归档任务失败';
      setState((prev) => ({ ...prev, error: errorMessage }));
      throw e;
    }
  }, []);

  // ===== Selection =====

  const selectTemplate = useCallback((template: TaskTemplateClientDTO | null) => {
    setState((prev) => ({ ...prev, selectedTemplate: template }));
  }, []);

  // ===== Utilities =====

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const refresh = useCallback(async () => {
    await loadTemplates();
  }, [loadTemplates]);

  // ===== Effects =====

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // ===== Return =====

  return {
    // State
    templates: state.templates,
    selectedTemplate: state.selectedTemplate,
    loading: state.loading,
    error: state.error,
    // Query
    loadTemplates,
    getTemplate,
    // Mutations
    createTemplate,
    updateTemplate,
    deleteTemplate,
    // Status
    activateTemplate,
    pauseTemplate,
    archiveTemplate,
    // Selection
    selectTemplate,
    // Utilities
    clearError,
    refresh,
  };
}

export default useTaskTemplate;
