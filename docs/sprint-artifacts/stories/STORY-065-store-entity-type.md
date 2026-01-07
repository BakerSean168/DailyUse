# STORY-065: Store 改用 Entity 类型存储

**Story ID**: STORY-065  
**Epic**: EPIC-015 Desktop Architecture Alignment  
**Phase**: 2/6  
**Priority**: P0 (Critical)  
**Estimated**: 2 hours  
**Status**: BACKLOG  
**Depends On**: STORY-064

---

## 📌 Story Overview

重构 `taskStore.ts`，将存储类型从 DTO 改为 Entity，与 Web 应用的 Store 模式保持一致。

## 🎯 Acceptance Criteria

- [ ] 导入 Entity 类型 `TaskTemplate`, `TaskInstance`
- [ ] State 类型从 `TaskTemplateClientDTO` 改为 `TaskTemplate`
- [ ] State 类型从 `TaskInstanceClientDTO` 改为 `TaskInstance`
- [ ] 所有 Actions 参数和返回类型更新
- [ ] 所有 Selectors 返回类型更新
- [ ] TypeScript 编译无错误
- [ ] Zustand persist 序列化正常（如果使用）

## 📁 Files to Modify

```
apps/desktop/src/renderer/modules/task/presentation/stores/
└── taskStore.ts  ← PRIMARY
```

## 🔧 Technical Details

### Current Implementation (Problem)

```typescript
// 使用 IPC Client 的类型，而不是 contracts 的完整 ClientDTO
import type { TaskInstanceDTO } from '../../infrastructure/ipc/task-instance.ipc-client';
import type { TaskTemplateDTO } from '../../infrastructure/ipc/task-template.ipc-client';

// 本地类型别名 - 兼容原有命名
type TaskInstanceClientDTO = TaskInstanceDTO;
type TaskTemplateClientDTO = TaskTemplateDTO;

export interface TaskState {
  instances: TaskInstanceClientDTO[];
  instancesById: Record<string, TaskInstanceClientDTO>;
  templates: TaskTemplateClientDTO[];
  templatesById: Record<string, TaskTemplateClientDTO>;
  // ...
}
```

### Target Implementation

```typescript
import { TaskTemplate, TaskInstance } from '@dailyuse/domain-client/task';

export interface TaskState {
  instances: TaskInstance[];
  instancesById: Record<string, TaskInstance>;
  templates: TaskTemplate[];
  templatesById: Record<string, TaskTemplate>;
  // ...
}
```

### Interfaces to Update

#### TaskState

```typescript
// Before
interface TaskState {
  instances: TaskInstanceClientDTO[];
  instancesById: Record<string, TaskInstanceClientDTO>;
  templates: TaskTemplateClientDTO[];
  templatesById: Record<string, TaskTemplateClientDTO>;
}

// After
interface TaskState {
  instances: TaskInstance[];
  instancesById: Record<string, TaskInstance>;
  templates: TaskTemplate[];
  templatesById: Record<string, TaskTemplate>;
}
```

#### TaskActions

```typescript
// Before
interface TaskActions {
  setInstances: (instances: TaskInstanceClientDTO[]) => void;
  addInstance: (instance: TaskInstanceClientDTO) => void;
  updateInstance: (id: string, updates: Partial<TaskInstanceClientDTO>) => void;
  setTemplates: (templates: TaskTemplateClientDTO[]) => void;
  addTemplate: (template: TaskTemplateClientDTO) => void;
  updateTemplate: (id: string, updates: Partial<TaskTemplateClientDTO>) => void;
}

// After
interface TaskActions {
  setInstances: (instances: TaskInstance[]) => void;
  addInstance: (instance: TaskInstance) => void;
  updateInstance: (id: string, updates: Partial<TaskInstance>) => void;
  setTemplates: (templates: TaskTemplate[]) => void;
  addTemplate: (template: TaskTemplate) => void;
  updateTemplate: (id: string, updates: Partial<TaskTemplate>) => void;
}
```

#### TaskSelectors

```typescript
// Before
interface TaskSelectors {
  getInstanceById: (id: string) => TaskInstanceClientDTO | undefined;
  getTemplateById: (id: string) => TaskTemplateClientDTO | undefined;
  getInstancesByTemplate: (templateId: string) => TaskInstanceClientDTO[];
  getTodayInstances: () => TaskInstanceClientDTO[];
}

// After
interface TaskSelectors {
  getInstanceById: (id: string) => TaskInstance | undefined;
  getTemplateById: (id: string) => TaskTemplate | undefined;
  getInstancesByTemplate: (templateId: string) => TaskInstance[];
  getTodayInstances: () => TaskInstance[];
}
```

### Zustand Persist 处理

如果使用了 persist middleware，需要处理 Entity 序列化：

```typescript
export const useTaskStore = create<TaskState & TaskActions & TaskSelectors>()(
  persist(
    (set, get) => ({
      // ... store implementation
    }),
    {
      name: 'task-storage',
      // 可能需要自定义序列化
      storage: createJSONStorage(() => localStorage, {
        // 如果 Entity 有 toJSON 方法，默认 JSON.stringify 即可
        // 如果需要反序列化为 Entity 实例，需要自定义 reviver
      }),
    }
  )
);
```

## 📚 Reference

**Web 正确实现**: 
- [taskStore.ts](../../apps/web/src/modules/task/presentation/stores/taskStore.ts)

## ⚠️ Risks

1. **序列化问题**: Entity 实例持久化后恢复可能丢失方法
2. **类型兼容**: 确保所有调用方已准备好接收 Entity

## ✅ Definition of Done

1. State 使用 Entity 类型
2. Actions 参数使用 Entity 类型
3. Selectors 返回 Entity 类型
4. TypeScript 编译通过
5. 如有 persist，序列化正常工作
6. 准备好进入 Phase 3

---

## 📝 Notes

- 依赖 STORY-064 完成（ApplicationService 返回 Entity）
- 下一步 (STORY-066) 将更新 Hook 与 Store 集成
