# EPIC: Desktop React 架构对齐 - DTO/Entity 数据流规范化

**Status**: PLANNED  
**Priority**: HIGH  
**Created**: 2026-01-02  
**Target**: Align Desktop (React) architecture with Web (Vue)

---

## 📌 Executive Summary

Desktop 应用（React）的架构与 Web 应用（Vue）存在关键差异，导致：
- ❌ 类型不安全：使用 DTO 类型却期望调用实体方法  
- ❌ 架构混乱：View 层直接调用 Infrastructure 层（跨层）  
- ❌ 数据流分散：无统一的 Store + Service + Hook 模式  
- ❌ 代码重复：状态判断逻辑散落在组件中

**目标**: 让 Desktop 采用与 Web 相同的分层架构，确保数据流一致、类型安全、易于维护。

---

## 🔴 Critical Issues Found

### Issue 1: ApplicationService 缺失 DTO → Entity 转换

**Severity**: 🔴 CRITICAL

**Description**:
Web 的 ApplicationService 将 API 返回的 DTO 转换为实体对象再返回。Desktop 直接返回 DTO，跳过了转换步骤。

**Current Code** (Desktop):
```typescript
// apps/desktop/src/renderer/modules/task/application/services/TaskApplicationService.ts
async listTemplates(): Promise<TaskTemplateClientDTO[]> {
  return listTaskTemplates();  // ❌ 直接返回 DTO
}
```

**Expected Code** (Web Pattern):
```typescript
async listTemplates(): Promise<TaskTemplate[]> {
  const dtos = await listTaskTemplates();
  return dtos.map(dto => TaskTemplate.fromClientDTO(dto));  // ✅ 转换为 Entity
}
```

**Impact**:
- Store 和 Components 接收到的是纯数据对象，无法调用实体方法
- 失去了领域对象提供的业务逻辑

---

### Issue 2: Store 存储 DTO 而非 Entity

**Severity**: 🔴 CRITICAL

**Description**:
Web Store 存储 Entity 对象，Desktop Store 存储 DTO。

**Current Code** (Desktop):
```typescript
// apps/desktop/src/renderer/modules/task/presentation/stores/taskStore.ts
interface TaskState {
  templates: TaskTemplateClientDTO[];  // ❌ DTO 类型
  templatesById: Record<string, TaskTemplateClientDTO>;
}
```

**Expected Code** (Web Pattern):
```typescript
state: () => ({
  taskTemplates: [] as TaskTemplate[],  // ✅ Entity 类型
  taskInstances: [] as TaskInstance[],
})
```

**Impact**:
- 无法使用实体的计算属性和方法
- Store 中没有数据完整性保证

---

### Issue 3: View 直接调用 Infrastructure 层（跨层调用）

**Severity**: 🔴 CRITICAL

**Description**:
`TaskListView` 直接获取 API Client，跳过了 ApplicationService、Hook、Store 三层。

**Current Code** (Desktop):
```typescript
// apps/desktop/src/renderer/modules/task/presentation/views/TaskListView.tsx
export function TaskListView() {
  const [templates, setTemplates] = useState<TaskTemplateClientDTO[]>([]);
  const taskApiClient = TaskContainer.getInstance().getTemplateApiClient();  // ❌ 跨层!
  
  const loadTemplates = useCallback(async () => {
    const result = await taskApiClient.getTaskTemplates();  // ❌ 直接调用基础设施
    setTemplates(result);
  }, [loadTemplates]);
}
```

**Expected Code** (Web Pattern):
```typescript
export function TaskListView() {
  const { templates, loadTemplates, isLoading } = useTaskTemplate();  // ✅ 通过 Hook
  
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);
}
```

**Impact**:
- 违反分层架构
- 每个组件维护自己的状态，无全局同步
- 数据不持久化

---

### Issue 4: 组件使用 DTO 类型，无法调用实体方法

**Severity**: 🟠 HIGH

**Description**:
所有组件 Props 接收 DTO 类型，但代码试图调用实体方法。

**Affected Files**:
- TaskCard.tsx
- TaskStatistics.tsx
- TaskDependencyGraph.tsx
- TaskDetailDialog.tsx
- TemplateSelectionDialog.tsx
- TaskInfoCard.tsx
- TaskInstanceCard.tsx

**Current Code**:
```typescript
// TaskCard.tsx
interface TaskCardProps {
  template: TaskTemplateClientDTO;  // ❌ DTO 类型
}

// ❌ 字符串比较
{template.status === 'ACTIVE' && ...}

// ❌ 需要 fallback
{template.statusText ?? template.status}
```

**Expected Code**:
```typescript
interface TaskCardProps {
  template: TaskTemplate;  // ✅ Entity 类型
}

// ✅ 使用实体 getter
{template.isActive && ...}

// ✅ 保证有值
{template.statusText}
```

**Impact**:
- 代码不够优雅，充满 fallback 和字符串比较
- 易出现运行时错误
- 难以复用业务逻辑

---

### Issue 5: Hooks 内部管理状态，未与 Store 集成

**Severity**: 🟠 HIGH

**Description**:
Desktop 的 Hook 使用本地 `useState`，不与全局 Store 同步。Web 的 Composable 使用全局 Store。

**Current Code** (Desktop):
```typescript
// apps/desktop/src/renderer/modules/task/presentation/hooks/useTaskTemplate.ts
export function useTaskTemplate(): UseTaskTemplateReturn {
  const [state, setState] = useState<TaskTemplateState>({
    templates: [],
    selectedTemplate: null,
    loading: false,
    error: null,
  });  // ❌ 本地状态，未与 Store 同步
  
  const loadTemplates = useCallback(async () => {
    const templates = await taskApplicationService.listTemplates();
    setState((prev) => ({ ...prev, templates }));  // ❌ 只更新本地
  }, []);
}
```

**Expected Code** (Web Pattern):
```typescript
export function useTaskTemplate() {
  const taskStore = useTaskStore();  // ✅ 使用全局 Store
  
  const taskTemplates = computed(() => taskStore.getAllTaskTemplates);  // ✅ 响应式访问
  
  async function fetchTaskTemplates(params?) {
    const templates = await taskTemplateApplicationService.getTaskTemplates(params);
    taskStore.setTaskTemplates(templates);  // ✅ 存入 Store
    return templates;
  }
}
```

**Impact**:
- 数据不在全局共享，多个 Hook 实例各自加载
- 无数据持久化
- 跨页面导航时数据丢失

---

### Issue 6: 组件直接调用 API Client（跨层）

**Severity**: 🟠 HIGH

**Description**:
Component 直接获取 API Client，违反分层原则。

**Current Code** (TaskCard.tsx):
```typescript
export function TaskCard({ template, onUpdate }: TaskCardProps) {
  const taskApiClient = TaskContainer.getInstance().getTemplateApiClient();  // ❌ 跨层
  
  const handleActivate = async () => {
    await taskApiClient.activateTaskTemplate(template.uuid);  // ❌ 跨层调用
    onUpdate();
  };
}
```

**Expected Code**:
```typescript
// 方案 A: Props 回调
interface TaskCardProps {
  template: TaskTemplate;
  onActivate: (uuid: string) => Promise<void>;
  onPause: (uuid: string) => Promise<void>;
}

// 方案 B: 使用 Hook
const { activateTemplate, pauseTemplate } = useTaskTemplate();
```

**Impact**:
- 违反组件职责分离
- 难以测试
- 每个组件重复相同的 API 调用逻辑

---

### Issue 7: 存在两种不同的 View 架构模式

**Severity**: 🟡 MEDIUM

**Description**:
同一模块中不同 View 使用完全不同的架构：

| View | 模式 | 问题 |
|------|------|------|
| TaskListView | 直接 API | 跨层、无 Store、无 Hook |
| TaskManagementView | Hook | 相对好，但 Hook 不与 Store 集成 |

**Impact**:
- 架构不一致，代码风格混乱
- 新开发者不知道遵循哪个模式

---

## 📊 Web vs Desktop 架构对比

### 数据流

**Web (Vue) - 正确模式**:
```
API Response (DTO)
       ↓
ApplicationService (DTO → Entity 转换)
       ↓
Composable (读/写 Store)
       ↓
Store (存储 Entity)
       ↓
Component (使用 Entity)
```

**Desktop (React) - 当前问题**:
```
IPC Response (DTO)
       ↓
直接到 Component 或 Hook 的 useState
       ↓
Component (使用 DTO，无法调用实体方法)
       ↓
❌ 每个组件独立状态，无全局同步
```

### 类型使用规范

| 层级 | Web (Vue) ✅ | Desktop (React) ⚠️ |
|------|-------------|-------------------|
| IPC/API Response | DTO | DTO |
| ApplicationService 返回 | Entity | DTO ❌ |
| Store 存储 | Entity | DTO ❌ |
| Hook/Composable | Entity | DTO ❌ |
| Component Props | Entity | DTO ❌ |

---

## 🎯 重构目标架构

```
┌─────────────────────────────────────────────────────────┐
│              IPC/Infrastructure 层                       │
│        返回 TaskTemplateClientDTO (DTO)                 │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│          Application Service 层                          │
│    - 调用 IPC/Infrastructure                             │
│    - DTO → TaskTemplate Entity 转换                     │
│    - 返回 Entity 对象                                    │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│          Hook / Composable 层                            │
│    - 调用 ApplicationService                             │
│    - 读/写 Zustand Store                                │
│    - 提供响应式数据和方法给 Component                    │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│         Zustand Store 层                                 │
│    - 存储 TaskTemplate Entity 对象                       │
│    - 状态管理和持久化                                    │
│    - 提供 Selectors                                      │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│          Component 层                                    │
│    - Props 接收 Entity 类型                              │
│    - 使用 Entity 的方法和计算属性                        │
│    - 通过 Hook 调用操作方法                              │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 重构分解 - 6 个 Phase

### Phase 1: ApplicationService 添加 DTO→Entity 转换

**文件**: `apps/desktop/src/renderer/modules/task/application/services/TaskApplicationService.ts`

**任务**:
1. 导入 Entity 类: `TaskTemplate`, `TaskInstance` from `@dailyuse/domain-client/task`
2. 修改所有返回 DTO 的方法，添加转换逻辑
3. 返回类型改为 Entity

**涉及方法**:
- `listTemplates()` - DTO[] → Entity[]
- `getTemplate()` - DTO → Entity
- `createTemplate()` - DTO → Entity
- `updateTemplate()` - DTO → Entity
- `activateTemplate()` - DTO → Entity
- `pauseTemplate()` - DTO → Entity
- `archiveTemplate()` - DTO → Entity
- `listInstances()` - DTO[] → Entity[]
- `getInstancesByDateRange()` - DTO[] → Entity[]

**Estimated**: 2 hours

---

### Phase 2: Store 重构使用 Entity 类型

**文件**: `apps/desktop/src/renderer/modules/task/presentation/stores/taskStore.ts`

**任务**:
1. 导入 Entity 类
2. 修改 state 类型声明: `TaskTemplateClientDTO` → `TaskTemplate`
3. 修改 actions 参数类型
4. 添加序列化处理（如需 persist）

**涉及字段**:
- `templates: TaskTemplateClientDTO[]` → `templates: TaskTemplate[]`
- `templatesById` 类型更新
- `instances` 类型更新
- 所有 CRUD action 的参数和返回类型

**Estimated**: 2 hours

---

### Phase 3: Hooks 与 Store 集成

**文件**:
- `apps/desktop/src/renderer/modules/task/presentation/hooks/useTaskTemplate.ts`
- `apps/desktop/src/renderer/modules/task/presentation/hooks/useTaskInstance.ts`
- `apps/desktop/src/renderer/modules/task/presentation/hooks/useTaskStatistics.ts`

**任务**:
1. 移除 Hook 内部的 `useState`
2. 导入 `useTaskStore()`
3. 修改数据来源：从 Store 读取
4. 修改更新方式：写入 Store
5. 返回类型改为 Entity

**before**:
```typescript
const [state, setState] = useState<TaskTemplateState>({...});
const loadTemplates = () => {
  const templates = await taskApplicationService.listTemplates();
  setState((prev) => ({ ...prev, templates }));
};
```

**after**:
```typescript
const { templates, setTemplates, isLoading, setLoading } = useTaskStore();
const loadTemplates = async () => {
  setLoading(true);
  const templates = await taskApplicationService.listTemplates();
  setTemplates(templates);
  setLoading(false);
};
```

**Estimated**: 3 hours

---

### Phase 4: View 统一使用 Hook

**文件**:
- `apps/desktop/src/renderer/modules/task/presentation/views/TaskListView.tsx`
- `apps/desktop/src/renderer/modules/task/presentation/views/TaskManagementView.tsx`

**任务**:
1. 移除直接的 `TaskContainer.getInstance().getTemplateApiClient()` 调用
2. 使用 `useTaskTemplate` Hook
3. 移除本地 `useState<TaskTemplateClientDTO[]>`
4. 删除本地 `loadTemplates` 逻辑

**before**:
```typescript
const [templates, setTemplates] = useState<TaskTemplateClientDTO[]>([]);
const taskApiClient = TaskContainer.getInstance().getTemplateApiClient();
const loadTemplates = async () => {
  const result = await taskApiClient.getTaskTemplates();
  setTemplates(result);
};
```

**after**:
```typescript
const { templates, loadTemplates, isLoading, error } = useTaskTemplate();

useEffect(() => {
  loadTemplates();
}, [loadTemplates]);
```

**Estimated**: 2 hours

---

### Phase 5: Component Props 改用 Entity 类型

**文件**:
- `apps/desktop/src/renderer/modules/task/presentation/components/TaskCard.tsx`
- `apps/desktop/src/renderer/modules/task/presentation/components/TaskStatistics.tsx`
- `apps/desktop/src/renderer/modules/task/presentation/components/TaskDependencyGraph.tsx`
- `apps/desktop/src/renderer/modules/task/presentation/components/TaskDetailDialog.tsx`
- `apps/desktop/src/renderer/modules/task/presentation/components/dialogs/TemplateSelectionDialog.tsx`
- `apps/desktop/src/renderer/modules/task/presentation/components/cards/TaskInfoCard.tsx`
- `apps/desktop/src/renderer/modules/task/presentation/components/cards/TaskInstanceCard.tsx`

**任务**:
1. Props 类型: `TaskTemplateClientDTO` → `TaskTemplate`
2. 移除直接 API Client 调用
3. 改用 Hook 或 props 回调处理操作
4. 使用实体方法替代字符串比较
5. 移除 fallback 语句

**before** (TaskCard.tsx):
```typescript
interface TaskCardProps {
  template: TaskTemplateClientDTO;
  onUpdate: () => void;
}
const taskApiClient = TaskContainer.getInstance().getTemplateApiClient();
const handleActivate = async () => {
  await taskApiClient.activateTaskTemplate(template.uuid);
};
{template.status === 'ACTIVE' && ...}
{template.statusText ?? template.status}
```

**after**:
```typescript
interface TaskCardProps {
  template: TaskTemplate;
  onActivate: (uuid: string) => Promise<void>;
}
const handleActivate = async () => {
  await onActivate(template.uuid);
};
{template.isActive && ...}
{template.statusText}
```

**Estimated**: 4 hours

---

### Phase 6: Dashboard 统一数据获取模式

**文件**: `apps/desktop/src/renderer/views/dashboard/DashboardView.tsx`

**任务**:
1. 检查当前实现
2. 如果直接使用 API Client，改为使用 Hook
3. 如果使用本地 state，改为使用 Store

**Estimated**: 1 hour

---

## ✅ 验证清单

### 编译检查
- [ ] 无 TypeScript 类型错误
- [ ] 无 ESLint 警告
- [ ] 类型导入正确

### 功能测试
- [ ] TaskListView 正常加载和显示任务
- [ ] TaskManagementView 正常工作
- [ ] 任务创建/编辑/删除正常
- [ ] 任务状态变更正常（激活/暂停/归档）
- [ ] TaskCard 点击和操作正常
- [ ] DashboardView 数据正确加载

### 架构检查
- [ ] 无跨层直接调用
- [ ] 所有 Component Props 使用 Entity 类型
- [ ] 所有数据通过 Store 管理
- [ ] Hook 与 Store 正确集成
- [ ] ApplicationService 返回 Entity
- [ ] View 使用 Hook 而非直接 API Client

### 性能检查
- [ ] 无不必要的重新渲染
- [ ] 数据持久化正常

---

## 📊 工作量预估

| Phase | 文件数 | 任务数 | 时间 |
|-------|-------|-------|------|
| 1: ApplicationService | 1 | 9+ | 2h |
| 2: Store | 1 | 5+ | 2h |
| 3: Hooks | 3 | 3 | 3h |
| 4: Views | 2 | 4 | 2h |
| 5: Components | 7 | 7 | 4h |
| 6: Dashboard | 1 | 2 | 1h |
| **总计** | **15** | **30+** | **14h** |

---

## 📚 参考文件

### Web (Vue) 正确实现
```
apps/web/src/modules/task/
├── application/services/
│   └── TaskTemplateApplicationService.ts  ✅ 参考：DTO→Entity转换
├── presentation/
│   ├── composables/
│   │   └── useTaskTemplate.ts  ✅ 参考：Store集成
│   └── stores/
│       └── taskStore.ts  ✅ 参考：Entity存储
```

### Desktop (React) 需要修改
```
apps/desktop/src/renderer/modules/task/
├── application/services/
│   └── TaskApplicationService.ts  ⚠️ 添加转换
├── presentation/
│   ├── hooks/
│   │   ├── useTaskTemplate.ts  ⚠️ 与Store集成
│   │   ├── useTaskInstance.ts
│   │   └── useTaskStatistics.ts
│   ├── stores/
│   │   └── taskStore.ts  ⚠️ 用Entity存储
│   ├── views/
│   │   ├── TaskListView.tsx  ⚠️ 用Hook
│   │   └── TaskManagementView.tsx
│   └── components/
│       ├── TaskCard.tsx  ⚠️ 用Entity类型
│       ├── TaskStatistics.tsx
│       ├── TaskDependencyGraph.tsx
│       ├── TaskDetailDialog.tsx
│       ├── dialogs/
│       │   └── TemplateSelectionDialog.tsx
│       └── cards/
│           ├── TaskInfoCard.tsx
│           └── TaskInstanceCard.tsx

apps/desktop/src/renderer/views/
└── dashboard/
    └── DashboardView.tsx  ⚠️ 统一模式
```

---

## 🚀 执行建议

1. **按 Phase 顺序执行** - 每个 Phase 完成后运行测试
2. **从下到上构建** - Phase 1→2→3→4→5→6
3. **增量测试** - 每个 Phase 完成后验证功能
4. **Git 提交** - 每个 Phase 一个 commit

---

## 🎯 成功标准

✅ 重构完成时：
- Desktop 与 Web 使用相同的分层架构
- 所有 Component 使用 Entity 类型
- 所有数据通过 Store 和 Hook 管理
- 无跨层直接调用
- 代码风格和模式一致
- 所有功能正常工作
- TypeScript 类型完全正确

---

*Epic Generated by BMad Master 🧙*  
*Last Updated: 2026-01-02*
