# DEV-SESSION: EPIC-015 Desktop Architecture Alignment

**准备日期**: 2026-01-02  
**Epic**: EPIC-015 Desktop React Architecture Alignment  
**预计工作量**: 14 hours (2-3 days)

---

## 📋 Session Overview

本开发会话将对齐 Desktop (React) 与 Web (Vue) 的分层架构模式，重点解决以下问题：

1. ApplicationService 缺少 DTO→Entity 转换
2. Store 存储 DTO 而非 Entity
3. View/Component 直接调用 Infrastructure 层
4. Hook 未与 Store 集成

---

## 🚀 Quick Start

### 前置条件

```bash
# 确保依赖安装
pnpm install

# 确保 domain-client 包已构建
pnpm nx build domain-client

# 确保 contracts 包已构建
pnpm nx build contracts
```

### 验证 Entity 类可用

```typescript
// 测试导入
import { TaskTemplate, TaskInstance } from '@dailyuse/domain-client/task';

// 验证静态方法存在
TaskTemplate.fromClientDTO;  // 应该存在
TaskInstance.fromClientDTO;  // 应该存在
```

---

## 📚 技术参考

### 1. Web 正确实现参考

#### ApplicationService

📄 **文件**: `apps/web/src/modules/task/application/services/TaskTemplateApplicationService.ts`

```typescript
import { TaskTemplate, TaskInstance } from '@dailyuse/domain-client/task';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';

export class TaskTemplateApplicationService {
  async getTaskTemplates(params?): Promise<TaskTemplate[]> {
    const templates = await taskTemplateApiClient.getTaskTemplates(params);
    return templates.map((dto: TaskTemplateClientDTO) => TaskTemplate.fromClientDTO(dto));
  }
  
  async getTaskTemplateById(uuid: string): Promise<TaskTemplate> {
    const templateDTO = await taskTemplateApiClient.getTaskTemplateById(uuid);
    return TaskTemplate.fromClientDTO(templateDTO);
  }
}
```

#### Store

📄 **文件**: `apps/web/src/modules/task/presentation/stores/taskStore.ts`

```typescript
import { TaskTemplate, TaskInstance } from '@dailyuse/domain-client/task';

export const useTaskStore = defineStore('task', {
  state: () => ({
    taskTemplates: [] as TaskTemplate[],
    taskInstances: [] as TaskInstance[],
    isLoading: false,
    error: null as string | null,
  }),
  
  getters: {
    getAllTaskTemplates(state): TaskTemplate[] {
      return state.taskTemplates;
    },
    
    getTaskTemplateByUuid: (state) => (uuid: string): TaskTemplate | null => {
      const found = state.taskTemplates.find((t) => t.uuid === uuid);
      if (!found) return null;
      
      // 安全检查：如果不是实例则转换
      if (found instanceof TaskTemplate) {
        return found;
      } else {
        console.warn('[TaskStore] 发现非实体对象，正在转换');
        return TaskTemplate.fromClientDTO(found as any);
      }
    },
  },
  
  actions: {
    setTaskTemplates(templates: TaskTemplate[]) {
      this.taskTemplates = templates;
    },
    
    addTaskTemplate(template: TaskTemplate) {
      this.taskTemplates.push(template);
    },
  },
});
```

#### Composable

📄 **文件**: `apps/web/src/modules/task/presentation/composables/useTaskTemplate.ts`

```typescript
import { ref, computed } from 'vue';
import { TaskTemplate } from '@dailyuse/domain-client/task';
import { taskTemplateApplicationService } from '../../application/services';
import { useTaskStore } from '../stores/taskStore';

export function useTaskTemplate() {
  const taskStore = useTaskStore();
  
  // 从 Store 读取
  const taskTemplates = computed(() => taskStore.getAllTaskTemplates);
  const activeTaskTemplates = computed(() =>
    taskStore.getAllTaskTemplates.filter((t) => t.status === 'ACTIVE')
  );
  
  // 操作方法
  async function fetchTaskTemplates(params?) {
    taskStore.setLoading(true);
    try {
      const templates = await taskTemplateApplicationService.getTaskTemplates(params);
      taskStore.setTaskTemplates(templates);
      return templates;
    } catch (err) {
      taskStore.setError(err.message);
      throw err;
    } finally {
      taskStore.setLoading(false);
    }
  }
  
  return {
    taskTemplates,
    activeTaskTemplates,
    fetchTaskTemplates,
    // ...
  };
}
```

---

### 2. Entity 类 API 参考

📄 **文件**: `packages/domain-client/src/task/TaskTemplate.ts`

```typescript
export class TaskTemplate {
  // 静态工厂方法
  static fromClientDTO(dto: TaskTemplateClientDTO): TaskTemplate;
  static create(params: CreateTaskTemplateParams): TaskTemplate;
  
  // Getters - 状态查询
  get isActive(): boolean;
  get isPaused(): boolean;
  get isArchived(): boolean;
  get isDeleted(): boolean;
  
  // Getters - 类型查询
  get isRecurring(): boolean;
  get isOneTime(): boolean;
  
  // Getters - 显示文本
  get statusText(): string;
  get importanceText(): string;
  get urgencyText(): string;
  get typeText(): string;
  
  // Methods - 权限检查
  canEdit(): boolean;
  canDelete(): boolean;
  canActivate(): boolean;
  canPause(): boolean;
  canArchive(): boolean;
  
  // Methods - 状态变更
  activate(): TaskTemplate;
  pause(): TaskTemplate;
  archive(): TaskTemplate;
  delete(): TaskTemplate;
  
  // Methods - 导出
  toClientDTO(): TaskTemplateClientDTO;
  toJSON(): object;
}
```

---

### 3. React/Zustand 模式参考

#### Zustand Store with Entity

```typescript
import { create } from 'zustand';
import { TaskTemplate, TaskInstance } from '@dailyuse/domain-client/task';

interface TaskState {
  templates: TaskTemplate[];
  instances: TaskInstance[];
  isLoading: boolean;
  error: string | null;
}

interface TaskActions {
  setTemplates: (templates: TaskTemplate[]) => void;
  addTemplate: (template: TaskTemplate) => void;
  updateTemplate: (id: string, updates: Partial<TaskTemplate>) => void;
  removeTemplate: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

interface TaskSelectors {
  getTemplateById: (id: string) => TaskTemplate | undefined;
  getActiveTemplates: () => TaskTemplate[];
}

export const useTaskStore = create<TaskState & TaskActions & TaskSelectors>()(
  (set, get) => ({
    // State
    templates: [],
    instances: [],
    isLoading: false,
    error: null,
    
    // Actions
    setTemplates: (templates) => set({ templates }),
    addTemplate: (template) => set((state) => ({
      templates: [...state.templates, template],
    })),
    updateTemplate: (id, updates) => set((state) => ({
      templates: state.templates.map((t) =>
        t.uuid === id ? { ...t, ...updates } : t
      ),
    })),
    removeTemplate: (id) => set((state) => ({
      templates: state.templates.filter((t) => t.uuid !== id),
    })),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    
    // Selectors
    getTemplateById: (id) => get().templates.find((t) => t.uuid === id),
    getActiveTemplates: () => get().templates.filter((t) => t.isActive),
  })
);
```

#### React Hook with Store Integration

```typescript
import { useCallback, useMemo } from 'react';
import { TaskTemplate } from '@dailyuse/domain-client/task';
import { useTaskStore } from '../stores/taskStore';
import { taskApplicationService } from '../../application/services';

export function useTaskTemplate() {
  const store = useTaskStore();
  
  // Derived state
  const templates = store.templates;
  const loading = store.isLoading;
  const error = store.error;
  
  const activeTemplates = useMemo(
    () => templates.filter((t) => t.isActive),
    [templates]
  );
  
  // Actions
  const loadTemplates = useCallback(async () => {
    store.setLoading(true);
    store.setError(null);
    try {
      const templates = await taskApplicationService.listTemplates();
      store.setTemplates(templates);
    } catch (e) {
      store.setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      store.setLoading(false);
    }
  }, [store]);
  
  const createTemplate = useCallback(async (input) => {
    store.setLoading(true);
    try {
      const template = await taskApplicationService.createTemplate(input);
      store.addTemplate(template);
      return template;
    } finally {
      store.setLoading(false);
    }
  }, [store]);
  
  return {
    templates,
    activeTemplates,
    loading,
    error,
    loadTemplates,
    createTemplate,
  };
}
```

---

## 📁 文件修改清单

### Phase 1: ApplicationService

| 文件 | 操作 | 说明 |
|------|------|------|
| `apps/desktop/src/renderer/modules/task/application/services/TaskApplicationService.ts` | MODIFY | 添加 DTO→Entity 转换 |

### Phase 2: Store

| 文件 | 操作 | 说明 |
|------|------|------|
| `apps/desktop/src/renderer/modules/task/presentation/stores/taskStore.ts` | MODIFY | 改用 Entity 类型 |

### Phase 3: Hooks

| 文件 | 操作 | 说明 |
|------|------|------|
| `apps/desktop/src/renderer/modules/task/presentation/hooks/useTaskTemplate.ts` | MODIFY | 与 Store 集成 |
| `apps/desktop/src/renderer/modules/task/presentation/hooks/useTaskInstance.ts` | MODIFY | 与 Store 集成 |
| `apps/desktop/src/renderer/modules/task/presentation/hooks/useTaskStatistics.ts` | MODIFY | 与 Store 集成 |

### Phase 4: Views

| 文件 | 操作 | 说明 |
|------|------|------|
| `apps/desktop/src/renderer/modules/task/presentation/views/TaskListView.tsx` | MODIFY | 使用 Hook |
| `apps/desktop/src/renderer/modules/task/presentation/views/TaskManagementView.tsx` | VERIFY | 验证正确性 |

### Phase 5: Components

| 文件 | 操作 | 说明 |
|------|------|------|
| `apps/desktop/src/renderer/modules/task/presentation/components/TaskCard.tsx` | MODIFY | Props 类型 |
| `apps/desktop/src/renderer/modules/task/presentation/components/TaskStatistics.tsx` | MODIFY | Props 类型 |
| `apps/desktop/src/renderer/modules/task/presentation/components/TaskDependencyGraph.tsx` | MODIFY | Props 类型 |
| `apps/desktop/src/renderer/modules/task/presentation/components/TaskDetailDialog.tsx` | MODIFY | Props 类型 |
| `apps/desktop/src/renderer/modules/task/presentation/components/dialogs/TemplateSelectionDialog.tsx` | MODIFY | Props 类型 |
| `apps/desktop/src/renderer/modules/task/presentation/components/cards/TaskInfoCard.tsx` | MODIFY | Props 类型 |
| `apps/desktop/src/renderer/modules/task/presentation/components/cards/TaskInstanceCard.tsx` | MODIFY | Props 类型 |

### Phase 6: Dashboard

| 文件 | 操作 | 说明 |
|------|------|------|
| `apps/desktop/src/renderer/views/dashboard/DashboardView.tsx` | MODIFY | 统一模式 |

---

## ✅ 验证命令

```bash
# TypeScript 类型检查
pnpm nx run desktop:typecheck

# 运行 Desktop 应用测试
pnpm nx run desktop:test

# 启动 Desktop 应用验证功能
pnpm nx run desktop:dev
```

---

## 🎯 执行顺序

1. **STORY-064**: ApplicationService 转换 (~2h)
2. **STORY-065**: Store 类型更新 (~2h)
3. **STORY-066**: Hook 集成 (~3h)
4. **STORY-067**: View 重构 (~2h)
5. **STORY-068**: Component 类型更新 (~4h)
6. **STORY-069**: Dashboard 对齐 (~1h)

---

## 📌 注意事项

1. **增量提交**: 每个 Story 完成后 commit
2. **类型验证**: 每个 Phase 后运行 typecheck
3. **功能测试**: 每个 Phase 后手动验证功能
4. **向后兼容**: 确保不破坏现有功能

---

*Prepared by BMad Master 🧙*
