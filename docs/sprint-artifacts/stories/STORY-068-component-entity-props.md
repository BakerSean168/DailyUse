# STORY-068: Component Props 改用 Entity 类型

**Story ID**: STORY-068  
**Epic**: EPIC-015 Desktop Architecture Alignment  
**Phase**: 5/6  
**Priority**: P1 (High)  
**Estimated**: 4 hours  
**Status**: BACKLOG  
**Depends On**: STORY-067

---

## 📌 Story Overview

重构所有 Task 相关的 Component，将 Props 类型从 DTO 改为 Entity，移除组件内的直接 API Client 调用，改用 Hook 或 Props 回调。

## 🎯 Acceptance Criteria

- [ ] 所有组件 Props 使用 `TaskTemplate` / `TaskInstance` 类型
- [ ] 组件内移除 `TaskContainer.getInstance()` 调用
- [ ] 操作通过 Props 回调或 Hook 处理
- [ ] 使用 Entity 方法替代字符串比较
- [ ] 移除不必要的 fallback 表达式
- [ ] TypeScript 编译无错误

## 📁 Files to Modify

```
apps/desktop/src/renderer/modules/task/presentation/components/
├── TaskCard.tsx  ← HIGH PRIORITY
├── TaskStatistics.tsx
├── TaskDependencyGraph.tsx
├── TaskDetailDialog.tsx
├── dialogs/
│   └── TemplateSelectionDialog.tsx
└── cards/
    ├── TaskInfoCard.tsx
    └── TaskInstanceCard.tsx
```

## 🔧 Technical Details

### 1. TaskCard.tsx (重点)

#### Current Implementation (Problem)

```typescript
import { TaskContainer } from '@dailyuse/infrastructure-client';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';

interface TaskCardProps {
  template: TaskTemplateClientDTO;  // ❌ DTO 类型
  onUpdate: () => void;
}

export function TaskCard({ template, onUpdate }: TaskCardProps) {
  // ❌ 直接调用 Infrastructure
  const taskApiClient = TaskContainer.getInstance().getTemplateApiClient();

  const handleActivate = async () => {
    await taskApiClient.activateTaskTemplate(template.uuid);  // ❌ 跨层
    onUpdate();
  };

  const handlePause = async () => {
    await taskApiClient.pauseTaskTemplate(template.uuid);  // ❌ 跨层
    onUpdate();
  };

  // ❌ 字符串比较
  {template.status === 'ACTIVE' && ...}
  
  // ❌ Fallback
  {template.statusText ?? template.status}
}
```

#### Target Implementation

```typescript
import type { TaskTemplate } from '@dailyuse/domain-client/task';

interface TaskCardProps {
  template: TaskTemplate;  // ✅ Entity 类型
  onActivate: (uuid: string) => Promise<void>;
  onPause: (uuid: string) => Promise<void>;
  onArchive: (uuid: string) => Promise<void>;
  onSelect?: (template: TaskTemplate) => void;
}

export function TaskCard({ 
  template, 
  onActivate,
  onPause,
  onArchive,
  onSelect,
}: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleActivate = async () => {
    setIsUpdating(true);
    try {
      await onActivate(template.uuid);  // ✅ 通过 Props 回调
    } finally {
      setIsUpdating(false);
    }
  };

  // ✅ 使用 Entity 方法
  {template.isActive && ...}
  {template.canPause() && ...}
  
  // ✅ Entity 保证有值
  {template.statusText}
  {template.importanceText}
}
```

### 2. TaskStatistics.tsx

```typescript
// Before
interface TaskStatisticsProps {
  templates: TaskTemplateClientDTO[];
}

// After
interface TaskStatisticsProps {
  templates: TaskTemplate[];
}
```

### 3. TaskDependencyGraph.tsx

```typescript
// Before
interface TaskDependencyGraphProps {
  tasks: TaskTemplateClientDTO[];
  onTaskClick?: (task: TaskTemplateClientDTO) => void;
}

// After
interface TaskDependencyGraphProps {
  tasks: TaskTemplate[];
  onTaskClick?: (task: TaskTemplate) => void;
}
```

### 4. TaskDetailDialog.tsx

```typescript
// Before
const [template, setTemplate] = useState<TaskTemplateClientDTO | null>(null);

// After
const [template, setTemplate] = useState<TaskTemplate | null>(null);
```

### 5. TemplateSelectionDialog.tsx

```typescript
// Before
interface TemplateSelectionDialogProps {
  templates: TaskTemplateClientDTO[];
  onSelect?: (template: TaskTemplateClientDTO) => void;
}

// After
interface TemplateSelectionDialogProps {
  templates: TaskTemplate[];
  onSelect?: (template: TaskTemplate) => void;
}
```

### 6. TaskInfoCard.tsx

```typescript
// Before
interface TaskInfoCardProps {
  template: TaskTemplateClientDTO;
}

// After
interface TaskInfoCardProps {
  template: TaskTemplate;
}
```

### 7. TaskInstanceCard.tsx

```typescript
// Before
interface TaskInstanceCardProps {
  instance: TaskInstanceClientDTO;
  template?: TaskTemplateClientDTO;
}

// After
interface TaskInstanceCardProps {
  instance: TaskInstance;
  template?: TaskTemplate;
}
```

## 🔄 使用 Entity 方法替代字符串比较

### Status 判断

```typescript
// ❌ Before
{template.status === 'ACTIVE' && <Badge>Active</Badge>}
{template.status === 'PAUSED' && <Badge>Paused</Badge>}

// ✅ After
{template.isActive && <Badge>Active</Badge>}
{template.isPaused && <Badge>Paused</Badge>}
{template.isArchived && <Badge>Archived</Badge>}
```

### 权限判断

```typescript
// ❌ Before (需要手写逻辑)
{template.status === 'ACTIVE' && (
  <Button onClick={handlePause}>暂停</Button>
)}

// ✅ After (使用 Entity 方法)
{template.canPause() && (
  <Button onClick={handlePause}>暂停</Button>
)}
{template.canActivate() && (
  <Button onClick={handleActivate}>激活</Button>
)}
{template.canArchive() && (
  <Button onClick={handleArchive}>归档</Button>
)}
```

### 显示文本

```typescript
// ❌ Before (需要 fallback)
{template.statusText ?? template.status}
{template.importanceText ?? template.importance}
{template.urgencyText ?? template.urgency}

// ✅ After (Entity 保证有值)
{template.statusText}
{template.importanceText}
{template.urgencyText}
```

## 📚 调用方更新

更新调用 TaskCard 的 View：

```typescript
// TaskListView.tsx / TaskManagementView.tsx

const { activateTemplate, pauseTemplate, archiveTemplate } = useTaskTemplate();

<TaskCard
  template={template}
  onActivate={activateTemplate}
  onPause={pauseTemplate}
  onArchive={archiveTemplate}
  onSelect={(t) => setSelectedTemplate(t)}
/>
```

## ⚠️ 检查清单

### 每个组件

- [ ] Props 接口类型更新为 Entity
- [ ] 移除 `TaskContainer.getInstance()` 调用
- [ ] 移除直接 API Client 调用
- [ ] 移除 DTO 相关导入
- [ ] 添加 Entity 类型导入
- [ ] 使用 Entity 方法替代字符串比较
- [ ] 移除 fallback 表达式
- [ ] 更新回调函数签名

## ✅ Definition of Done

1. 所有 7 个组件 Props 使用 Entity 类型
2. 无直接 Infrastructure 层调用
3. 使用 Entity 方法进行状态判断
4. TypeScript 编译通过
5. 所有组件功能正常
6. 准备好进入 Phase 6

---

## 📝 Notes

- 这是工作量最大的一个 Story（7 个组件）
- 建议按优先级处理：TaskCard → Others
- 依赖 STORY-067 完成（View 使用 Hook）
- 下一步 (STORY-069) 将更新 Dashboard
