# STORY-067: View 统一使用 Hook

**Story ID**: STORY-067  
**Epic**: EPIC-015 Desktop Architecture Alignment  
**Phase**: 4/6  
**Priority**: P0 (Critical)  
**Estimated**: 2 hours  
**Status**: BACKLOG  
**Depends On**: STORY-066

---

## 📌 Story Overview

重构 Task 相关的 View 组件，使其通过 Hook 获取数据，而非直接调用 Infrastructure 层（API Client / IPC Client）。

## 🎯 Acceptance Criteria

- [ ] `TaskListView` 使用 `useTaskTemplate` Hook
- [ ] `TaskListView` 移除直接的 `TaskContainer.getInstance()` 调用
- [ ] `TaskListView` 移除本地 `useState<TaskTemplateClientDTO[]>`
- [ ] `TaskManagementView` 验证已使用 Hook（可能只需微调）
- [ ] View 层不再有跨层调用
- [ ] TypeScript 编译无错误

## 📁 Files to Modify

```
apps/desktop/src/renderer/modules/task/presentation/views/
├── TaskListView.tsx  ← PRIMARY (重点重构)
└── TaskManagementView.tsx  ← SECONDARY (验证/微调)
```

## 🔧 Technical Details

### TaskListView - Current Implementation (Problem)

```typescript
// TaskListView.tsx
import { TaskContainer } from '@dailyuse/infrastructure-client';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';

export function TaskListView() {
  // ❌ 本地状态
  const [templates, setTemplates] = useState<TaskTemplateClientDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // ❌ 直接调用 Infrastructure 层
  const taskApiClient = TaskContainer.getInstance().getTemplateApiClient();

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await taskApiClient.getTaskTemplates();  // ❌ 跨层调用
      setTemplates(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载任务失败');
    } finally {
      setLoading(false);
    }
  }, [taskApiClient]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);
  
  // ... 渲染逻辑
}
```

### TaskListView - Target Implementation

```typescript
// TaskListView.tsx
import { useTaskTemplate } from '../hooks/useTaskTemplate';
import type { TaskTemplate } from '@dailyuse/domain-client/task';

export function TaskListView() {
  // ✅ 通过 Hook 获取所有数据和操作
  const {
    templates,
    loading,
    error,
    loadTemplates,
    activeTemplates,
    pausedTemplates,
  } = useTaskTemplate();
  
  // ✅ 其他本地 UI 状态保留
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'templates' | 'today' | 'stats' | 'dependencies'>('templates');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // ✅ 过滤使用 Entity 方法
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        // 可以使用 Entity 的属性和方法
        const matchesTitle = template.title.toLowerCase().includes(query);
        const matchesDesc = template.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }
      
      // ✅ 使用 Entity 方法替代字符串比较
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'ACTIVE' && !template.isActive) return false;
        if (statusFilter === 'PAUSED' && !template.isPaused) return false;
        if (statusFilter === 'ARCHIVED' && !template.isArchived) return false;
      }
      
      return true;
    });
  }, [templates, searchQuery, statusFilter, typeFilter]);

  // ... 渲染逻辑
}
```

### TaskManagementView - 验证

`TaskManagementView` 已经使用 `useTaskTemplate`，但需要验证：

1. 确认使用的是更新后的 Hook
2. 确认接收的是 Entity 类型
3. 移除任何直接的 API Client 调用

```typescript
// TaskManagementView.tsx - 验证点
import { useTaskTemplate } from '../hooks/useTaskTemplate';

export function TaskManagementView() {
  const {
    templates,        // ✅ 应该是 TaskTemplate[]
    loading,
    error,
    loadTemplates,
    deleteTemplate,
    activateTemplate,
    pauseTemplate,
    archiveTemplate,
  } = useTaskTemplate();
  
  // 验证：不应该有 TaskContainer.getInstance() 调用
  // 验证：templates 类型应该是 TaskTemplate[]
}
```

### 需要移除的导入

```typescript
// ❌ 移除这些导入
import { TaskContainer } from '@dailyuse/infrastructure-client';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';

// ✅ 添加/保留这些导入
import { useTaskTemplate } from '../hooks/useTaskTemplate';
import type { TaskTemplate } from '@dailyuse/domain-client/task';
```

## 📚 Reference

**Web 正确实现**: 
- Vue 组件使用 Composables 模式

## ⚠️ Checklist

### TaskListView 重构检查点

- [ ] 移除 `const taskApiClient = TaskContainer.getInstance().getTemplateApiClient();`
- [ ] 移除 `useState<TaskTemplateClientDTO[]>`
- [ ] 移除 `useState` for loading/error（使用 Hook 提供的）
- [ ] 移除本地 `loadTemplates` 函数定义
- [ ] 添加 `useTaskTemplate()` Hook 调用
- [ ] 更新过滤逻辑使用 Entity 方法
- [ ] 更新 `TaskCard` 传入的 props 类型（下一个 Story）

### TaskManagementView 验证检查点

- [ ] 确认使用 `useTaskTemplate()`
- [ ] 确认无直接 API Client 调用
- [ ] 确认 templates 类型正确

## ✅ Definition of Done

1. TaskListView 完全通过 Hook 获取数据
2. TaskManagementView 确认正确使用 Hook
3. 无跨层直接调用
4. TypeScript 编译通过
5. 功能正常工作（任务列表显示、过滤、Tab 切换）
6. 准备好进入 Phase 5

---

## 📝 Notes

- 依赖 STORY-066 完成（Hook 与 Store 集成）
- 下一步 (STORY-068) 将更新 Component Props 类型
- TaskCard 在本 Story 仍使用旧 props，下一个 Story 更新
