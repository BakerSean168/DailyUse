# STORY-066: Hook 与 Store 集成

**Story ID**: STORY-066  
**Epic**: EPIC-015 Desktop Architecture Alignment  
**Phase**: 3/6  
**Priority**: P0 (Critical)  
**Estimated**: 3 hours  
**Status**: BACKLOG  
**Depends On**: STORY-064, STORY-065

---

## 📌 Story Overview

重构 Task 相关的 Hooks，使其与 Zustand Store 集成，而不是在 Hook 内部使用独立的 `useState`。这与 Web 应用中 Composables 使用 Pinia Store 的模式一致。

## 🎯 Acceptance Criteria

- [ ] `useTaskTemplate` 从 Store 读取数据，而非本地 useState
- [ ] `useTaskTemplate` 更新操作写入 Store
- [ ] `useTaskInstance` 同样与 Store 集成
- [ ] `useTaskStatistics` 同样与 Store 集成
- [ ] 返回类型为 Entity 而非 DTO
- [ ] 多个组件使用同一 Hook 时数据共享
- [ ] TypeScript 编译无错误

## 📁 Files to Modify

```
apps/desktop/src/renderer/modules/task/presentation/hooks/
├── useTaskTemplate.ts  ← PRIMARY
├── useTaskInstance.ts  ← SECONDARY
├── useTaskStatistics.ts  ← SECONDARY
└── index.ts
```

## 🔧 Technical Details

### Current Implementation (Problem)

```typescript
// useTaskTemplate.ts
export function useTaskTemplate(): UseTaskTemplateReturn {
  // ❌ Hook 内部维护状态，不与全局 Store 同步
  const [state, setState] = useState<TaskTemplateState>({
    templates: [],
    selectedTemplate: null,
    loading: false,
    error: null,
  });
  
  const loadTemplates = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    const templates = await taskApplicationService.listTemplates();
    setState((prev) => ({ ...prev, templates, loading: false }));  // ❌ 只更新本地
  }, []);
  
  return {
    templates: state.templates,
    loading: state.loading,
    loadTemplates,
    // ...
  };
}
```

### Target Implementation

```typescript
// useTaskTemplate.ts
import { useTaskStore } from '../stores/taskStore';
import { taskApplicationService } from '../../application/services';
import { TaskTemplate } from '@dailyuse/domain-client/task';

export interface UseTaskTemplateReturn {
  // State (from Store)
  templates: TaskTemplate[];
  selectedTemplate: TaskTemplate | null;
  loading: boolean;
  error: string | null;
  
  // Computed
  activeTemplates: TaskTemplate[];
  pausedTemplates: TaskTemplate[];
  archivedTemplates: TaskTemplate[];
  
  // Actions
  loadTemplates: () => Promise<void>;
  getTemplate: (id: string) => Promise<TaskTemplate | null>;
  createTemplate: (input: CreateTaskTemplateInput) => Promise<TaskTemplate>;
  updateTemplate: (uuid: string, request: UpdateTaskTemplateRequest) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  activateTemplate: (id: string) => Promise<void>;
  pauseTemplate: (id: string) => Promise<void>;
  archiveTemplate: (id: string) => Promise<void>;
  
  // Selection
  selectTemplate: (template: TaskTemplate | null) => void;
  
  // Utilities
  clearError: () => void;
  refresh: () => Promise<void>;
}

export function useTaskTemplate(): UseTaskTemplateReturn {
  // ✅ 使用全局 Store
  const store = useTaskStore();
  
  // ✅ 从 Store 读取（使用 Zustand 的选择器）
  const templates = store.templates;
  const selectedTemplate = store.selectedTemplateId 
    ? store.getTemplateById(store.selectedTemplateId) ?? null 
    : null;
  const loading = store.isLoading;
  const error = store.error;
  
  // ✅ 计算属性
  const activeTemplates = useMemo(
    () => templates.filter(t => t.isActive),
    [templates]
  );
  
  const pausedTemplates = useMemo(
    () => templates.filter(t => t.isPaused),
    [templates]
  );
  
  const archivedTemplates = useMemo(
    () => templates.filter(t => t.isArchived),
    [templates]
  );
  
  // ✅ Actions - 调用 Service 并更新 Store
  const loadTemplates = useCallback(async () => {
    store.setLoading(true);
    store.setError(null);
    try {
      const templates = await taskApplicationService.listTemplates();
      store.setTemplates(templates);  // ✅ 存入 Store
    } catch (e) {
      const msg = e instanceof Error ? e.message : '加载失败';
      store.setError(msg);
    } finally {
      store.setLoading(false);
    }
  }, [store]);
  
  const createTemplate = useCallback(async (input: CreateTaskTemplateInput) => {
    store.setLoading(true);
    try {
      const template = await taskApplicationService.createTemplate(input);
      store.addTemplate(template);  // ✅ 添加到 Store
      return template;
    } catch (e) {
      const msg = e instanceof Error ? e.message : '创建失败';
      store.setError(msg);
      throw e;
    } finally {
      store.setLoading(false);
    }
  }, [store]);
  
  // ... 其他 actions 类似
  
  return {
    templates,
    selectedTemplate,
    loading,
    error,
    activeTemplates,
    pausedTemplates,
    archivedTemplates,
    loadTemplates,
    createTemplate,
    // ...
  };
}
```

### Interface Updates

```typescript
// Before
export interface TaskTemplateState {
  templates: TaskTemplateClientDTO[];
  selectedTemplate: TaskTemplateClientDTO | null;
  loading: boolean;
  error: string | null;
}

// After
export interface UseTaskTemplateReturn {
  templates: TaskTemplate[];
  selectedTemplate: TaskTemplate | null;
  loading: boolean;
  error: string | null;
  activeTemplates: TaskTemplate[];
  pausedTemplates: TaskTemplate[];
  archivedTemplates: TaskTemplate[];
  // ... actions
}
```

## 📚 Reference

**Web 正确实现**: 
- [useTaskTemplate.ts](../../apps/web/src/modules/task/presentation/composables/useTaskTemplate.ts)

## ⚠️ Considerations

1. **Zustand 选择器优化**: 使用 shallow compare 避免不必要的重渲染
2. **多组件共享**: 确保多个组件使用时数据一致
3. **初始加载**: 可能需要在 Hook 中添加 useEffect 自动加载

```typescript
// 可选：自动加载
useEffect(() => {
  if (!store.isInitialized) {
    loadTemplates();
    store.setInitialized(true);
  }
}, []);
```

## ✅ Definition of Done

1. useTaskTemplate 使用 Store 而非本地 state
2. useTaskInstance 使用 Store
3. useTaskStatistics 使用 Store
4. 多组件数据共享正常
5. TypeScript 编译通过
6. 准备好进入 Phase 4

---

## 📝 Notes

- 依赖 STORY-065 完成（Store 使用 Entity 类型）
- 下一步 (STORY-067) 将更新 View 使用 Hook
