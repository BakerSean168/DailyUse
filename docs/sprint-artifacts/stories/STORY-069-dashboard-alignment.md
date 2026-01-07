# STORY-069: Dashboard 统一数据获取模式

**Story ID**: STORY-069  
**Epic**: EPIC-015 Desktop Architecture Alignment  
**Phase**: 6/6  
**Priority**: P1 (High)  
**Estimated**: 1 hour  
**Status**: BACKLOG  
**Depends On**: STORY-068

---

## 📌 Story Overview

审查并重构 DashboardView，确保其使用与 Task 模块一致的数据获取模式（通过 Hook），而非直接调用 Infrastructure 层。

## 🎯 Acceptance Criteria

- [ ] DashboardView 通过 `useTaskTemplate` 获取任务数据
- [ ] 移除直接的 API Client / IPC Client 调用
- [ ] 接收 Entity 类型数据
- [ ] TypeScript 编译无错误
- [ ] Dashboard 正常显示任务相关数据

## 📁 Files to Modify

```
apps/desktop/src/renderer/views/dashboard/
└── DashboardView.tsx  ← PRIMARY
```

## 🔧 Technical Details

### Current Implementation (需审查)

```typescript
// DashboardView.tsx - 根据 grep 搜索发现的问题
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';

const [todayTasks, setTodayTasks] = useState<TaskTemplateClientDTO[]>([]);

// 可能直接调用 API
const result = await someApiClient.getTemplates();
setTodayTasks(result.filter(t => t.status === TaskTemplateStatus.ACTIVE));
```

### Target Implementation

```typescript
// DashboardView.tsx
import { useTaskTemplate } from '@/renderer/modules/task/presentation/hooks/useTaskTemplate';
import type { TaskTemplate } from '@dailyuse/domain-client/task';

export function DashboardView() {
  // ✅ 通过 Hook 获取任务数据
  const { 
    templates, 
    activeTemplates,
    loading: taskLoading,
  } = useTaskTemplate();
  
  // ✅ 使用 Entity 类型
  const todayTasks = useMemo(() => {
    return activeTemplates.filter(t => {
      // 可以使用 Entity 方法
      return t.isRecurring || t.shouldShowToday();
    });
  }, [activeTemplates]);
  
  // ... 其他 Dashboard 内容
}
```

### 需要检查的数据来源

Dashboard 可能使用多个模块的数据：

| 数据类型 | 来源 Hook | 状态 |
|---------|----------|------|
| Task Templates | `useTaskTemplate` | 本 Epic 范围 |
| Task Instances | `useTaskInstance` | 本 Epic 范围 |
| Goals | `useGoal` | 待验证 |
| Schedules | `useSchedule` | 待验证 |
| Statistics | `useTaskStatistics` | 本 Epic 范围 |

本 Story 主要关注 Task 相关数据的对齐。

## 📚 Dashboard 数据流

```
DashboardView
    ├── useTaskTemplate() → Task 模块 Store → 显示活跃任务
    ├── useTaskInstance() → Task 模块 Store → 显示今日实例
    ├── useTaskStatistics() → Task 模块 Store → 显示统计数据
    ├── useGoal() → Goal 模块 (待验证)
    └── useSchedule() → Schedule 模块 (待验证)
```

## ⚠️ 注意事项

1. **跨模块数据**: Dashboard 可能需要多个模块的 Hook
2. **加载状态**: 需要处理多个 Hook 的 loading 状态
3. **错误处理**: 需要处理多个 Hook 的 error 状态

```typescript
// 示例：处理多个 Hook
const { templates, loading: taskLoading, error: taskError } = useTaskTemplate();
const { goals, loading: goalLoading, error: goalError } = useGoal();

const isLoading = taskLoading || goalLoading;
const error = taskError || goalError;
```

## ✅ Definition of Done

1. DashboardView 使用 Task 模块 Hook 获取数据
2. 无直接 API Client 调用
3. 接收 Entity 类型
4. TypeScript 编译通过
5. Dashboard 正常显示数据
6. EPIC-015 完成！🎉

---

## 📝 Notes

- 这是 EPIC-015 的最后一个 Story
- 完成后整个架构对齐工作结束
- 可能需要类似地审查其他模块（Goal、Schedule 等）
- 建议完成后进行 Epic Retrospective
