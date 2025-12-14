# EPIC-011: Desktop Renderer 完整 React + shadcn/ui + Zustand 迁移

> **创建日期**: 2025-12-14  
> **优先级**: HIGH  
> **预估工作量**: 120-160 小时  
> **前置条件**: EPIC-010 Main 进程 DDD 重构完成、IPC Handlers 可用

---

## 📋 背景与问题分析

### 当前现状

Desktop Renderer 进程需要从 Web 端（Vue + Vuetify + Pinia）迁移到 React + shadcn/ui + Zustand。

| 问题 | 详细描述 | 影响 |
|------|---------|------|
| **组件覆盖率低** | Web 端有 100+ 组件，Desktop 仅有 ~15 个 | 功能不完整 |
| **缺少状态管理** | 没有统一的 Zustand Store 架构 | 状态混乱 |
| **组件结构不一致** | 缺少 cards/, dialogs/ 等子目录分类 | 维护困难 |
| **缺少 Custom Hooks** | Vue Composable 未转换为 React Hooks | 代码复用差 |
| **UI 组件不统一** | 部分使用原生 HTML，部分使用 shadcn/ui | 样式不一致 |

### 三端组件对比矩阵

| 模块 | Web 组件数 | Desktop 已有 | 缺失数量 | 完成度 |
|------|-----------|-------------|---------|-------|
| **Goal** | 35+ | 5 | ~30 | 14% |
| **Task** | 25+ | 5 | ~20 | 20% |
| **Schedule** | 12+ | 1 | ~11 | 8% |
| **Reminder** | 12+ | 0 | ~12 | 0% |
| **Dashboard** | 15+ | 2 | ~13 | 13% |
| **Account** | 8+ | 2 | ~6 | 25% |
| **Auth** | 6+ | 2 | ~4 | 33% |
| **AI** | 10+ | 1 | ~9 | 10% |
| **Notification** | 5+ | 1 | ~4 | 20% |
| **Repository** | 10+ | 1 | ~9 | 10% |
| **Setting** | 8+ | 1 | ~7 | 13% |
| **Editor** | 5+ | 0 | ~5 | 0% |
| **总计** | **151+** | **21** | **~130** | **14%** |

### Web → Desktop 技术栈映射

| Web 技术 | Desktop 技术 | 状态 |
|---------|-------------|------|
| Vue 3 | React 19 | ✅ 已配置 |
| Vuetify 3 | shadcn/ui | ⚠️ 部分使用 |
| Pinia | Zustand | ❌ 未实现 |
| Vue Composable | React Hooks | ⚠️ 部分实现 |
| Vue Router | React Router | ✅ 已配置 |
| axios | IPC Client | ✅ 已实现 |

---

## 🎯 目标

### 主要目标
1. **完整迁移所有模块组件** - 从 Web 端 Vue 组件转换为 React + shadcn/ui
2. **建立 Zustand Store 架构** - 每个模块独立 Store，统一状态管理模式
3. **实现 Custom Hooks** - 转换所有 Vue Composable 为 React Hooks
4. **统一组件目录结构** - cards/, dialogs/, forms/ 等子目录分类

### 次要目标
1. 建立组件测试规范（Vitest + React Testing Library）
2. 创建组件文档（Storybook 可选）
3. 实现暗色/亮色主题切换

### 成功标准
- [ ] 所有 12 个业务模块完成组件迁移
- [ ] 每个模块有独立的 Zustand Store
- [ ] 组件覆盖率达到 Web 端 90%+
- [ ] 所有核心用户流程可用

---

## 📐 目标架构

### Renderer 进程目录结构（重构后）

```
apps/desktop/src/renderer/
├── main.tsx                         # 入口
├── App.tsx                          # 根组件
├── index.css                        # 全局样式
├── styles.css                       # Tailwind 配置
│
├── modules/                         # 业务模块
│   ├── goal/
│   │   ├── application/
│   │   │   └── services/            # 应用服务（IPC 调用封装）
│   │   ├── presentation/
│   │   │   ├── components/
│   │   │   │   ├── cards/           # 卡片组件
│   │   │   │   │   ├── GoalCard.tsx
│   │   │   │   │   ├── GoalInfoCard.tsx
│   │   │   │   │   ├── GoalRecordCard.tsx
│   │   │   │   │   ├── KeyResultCard.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── dialogs/         # 对话框组件
│   │   │   │   │   ├── GoalDialog.tsx
│   │   │   │   │   ├── GoalDetailDialog.tsx
│   │   │   │   │   ├── KeyResultDialog.tsx
│   │   │   │   │   ├── GoalRecordDialog.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── forms/           # 表单组件
│   │   │   │   │   ├── GoalForm.tsx
│   │   │   │   │   ├── KeyResultForm.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── lists/           # 列表组件
│   │   │   │   │   ├── GoalList.tsx
│   │   │   │   │   ├── KeyResultList.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── panels/          # 面板组件
│   │   │   │   │   ├── ProgressBreakdownPanel.tsx
│   │   │   │   │   ├── FocusModePanel.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   └── index.ts
│   │   │   ├── hooks/               # Custom Hooks
│   │   │   │   ├── useGoal.ts
│   │   │   │   ├── useGoalManagement.ts
│   │   │   │   ├── useKeyResult.ts
│   │   │   │   ├── useFocusMode.ts
│   │   │   │   └── index.ts
│   │   │   ├── stores/              # Zustand Store
│   │   │   │   └── goalStore.ts
│   │   │   ├── views/               # 页面组件
│   │   │   │   ├── GoalListView.tsx
│   │   │   │   ├── GoalDetailView.tsx
│   │   │   │   ├── KeyResultDetailView.tsx
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── initialization/
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── task/                        # 同样结构
│   ├── schedule/                    # 同样结构
│   ├── reminder/                    # 同样结构
│   ├── dashboard/                   # 同样结构
│   ├── account/                     # 同样结构
│   ├── authentication/              # 同样结构
│   ├── ai/                          # 同样结构
│   ├── notification/                # 同样结构
│   ├── repository/                  # 同样结构
│   ├── setting/                     # 同样结构
│   └── editor/                      # 同样结构
│
├── shared/                          # 共享代码
│   ├── components/                  # 共享 UI 组件
│   │   ├── ui/                      # shadcn/ui 组件
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   ├── layout/                  # 布局组件
│   │   │   ├── AppShell.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── PageContainer.tsx
│   │   │   └── index.ts
│   │   ├── common/                  # 通用业务组件
│   │   │   ├── EmptyState.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── VirtualList.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── hooks/                       # 共享 Hooks
│   │   ├── useIPC.ts
│   │   ├── useToast.ts
│   │   ├── useTheme.ts
│   │   ├── useLocalStorage.ts
│   │   └── index.ts
│   ├── utils/                       # 工具函数
│   │   ├── cn.ts                    # className 合并
│   │   ├── date.ts                  # 日期处理
│   │   └── index.ts
│   └── types/                       # 共享类型
│       └── index.ts
│
├── stores/                          # 全局 Store
│   └── appStore.ts                  # 应用级状态
│
├── router/                          # 路由配置
│   └── index.tsx
│
└── config/                          # 配置
    └── index.ts
```

---

## 📊 Zustand Store 架构

### Store 模式规范

```typescript
// modules/goal/presentation/stores/goalStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Goal, GoalFolder } from '@dailyuse/domain-client/goal';

// ========== 状态类型 ==========
interface GoalState {
  // 缓存数据
  goals: Goal[];
  goalFolders: GoalFolder[];
  
  // 状态管理
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  lastSyncTime: Date | null;
  
  // UI 状态
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    status: 'all' | 'active' | 'completed' | 'paused' | 'archived';
    dirUuid?: string;
    searchQuery: string;
  };
  selectedGoalUuid: string | null;
  selectedDirUuid: string | null;
}

// ========== Action 类型 ==========
interface GoalActions {
  // 数据操作
  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (uuid: string, updates: Partial<Goal>) => void;
  removeGoal: (uuid: string) => void;
  
  // 目录操作
  setGoalFolders: (folders: GoalFolder[]) => void;
  addGoalFolder: (folder: GoalFolder) => void;
  updateGoalFolder: (uuid: string, updates: Partial<GoalFolder>) => void;
  removeGoalFolder: (uuid: string) => void;
  
  // 状态操作
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  setSyncTime: (time: Date) => void;
  
  // UI 操作
  setFilters: (filters: Partial<GoalState['filters']>) => void;
  setPagination: (pagination: Partial<GoalState['pagination']>) => void;
  setSelectedGoal: (uuid: string | null) => void;
  setSelectedDir: (uuid: string | null) => void;
  
  // 重置
  reset: () => void;
}

// ========== 初始状态 ==========
const initialState: GoalState = {
  goals: [],
  goalFolders: [],
  isLoading: false,
  isInitialized: false,
  error: null,
  lastSyncTime: null,
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  filters: { status: 'all', dirUuid: undefined, searchQuery: '' },
  selectedGoalUuid: null,
  selectedDirUuid: null,
};

// ========== Store 创建 ==========
export const useGoalStore = create<GoalState & GoalActions>()(
  immer(
    persist(
      (set, get) => ({
        ...initialState,
        
        // 数据操作
        setGoals: (goals) => set({ goals }),
        addGoal: (goal) => set((state) => { state.goals.push(goal); }),
        updateGoal: (uuid, updates) => set((state) => {
          const index = state.goals.findIndex(g => g.uuid === uuid);
          if (index !== -1) {
            state.goals[index] = { ...state.goals[index], ...updates };
          }
        }),
        removeGoal: (uuid) => set((state) => {
          state.goals = state.goals.filter(g => g.uuid !== uuid);
        }),
        
        // 目录操作
        setGoalFolders: (folders) => set({ goalFolders: folders }),
        addGoalFolder: (folder) => set((state) => { state.goalFolders.push(folder); }),
        updateGoalFolder: (uuid, updates) => set((state) => {
          const index = state.goalFolders.findIndex(f => f.uuid === uuid);
          if (index !== -1) {
            state.goalFolders[index] = { ...state.goalFolders[index], ...updates };
          }
        }),
        removeGoalFolder: (uuid) => set((state) => {
          state.goalFolders = state.goalFolders.filter(f => f.uuid !== uuid);
        }),
        
        // 状态操作
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        setInitialized: (initialized) => set({ isInitialized: initialized }),
        setSyncTime: (time) => set({ lastSyncTime: time }),
        
        // UI 操作
        setFilters: (filters) => set((state) => ({
          filters: { ...state.filters, ...filters }
        })),
        setPagination: (pagination) => set((state) => ({
          pagination: { ...state.pagination, ...pagination }
        })),
        setSelectedGoal: (uuid) => set({ selectedGoalUuid: uuid }),
        setSelectedDir: (uuid) => set({ selectedDirUuid: uuid }),
        
        // 重置
        reset: () => set(initialState),
      }),
      {
        name: 'goal-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // 只持久化必要数据
          filters: state.filters,
          selectedDirUuid: state.selectedDirUuid,
        }),
      }
    )
  )
);

// ========== Selectors（性能优化） ==========
export const goalSelectors = {
  getAllGoals: (state: GoalState & GoalActions) => state.goals,
  getGoalByUuid: (uuid: string) => (state: GoalState & GoalActions) => 
    state.goals.find(g => g.uuid === uuid),
  getGoalsByStatus: (status: string) => (state: GoalState & GoalActions) =>
    state.goals.filter(g => g.status === status),
  getGoalsByDir: (dirUuid?: string) => (state: GoalState & GoalActions) =>
    dirUuid 
      ? state.goals.filter(g => g.folderUuid === dirUuid)
      : state.goals.filter(g => !g.folderUuid),
  getActiveGoals: (state: GoalState & GoalActions) =>
    state.goals.filter(g => g.status === 'ACTIVE'),
};
```

---

## 📋 详细任务分解

### Phase 0: 基础设施 (预估: 16 小时)

#### Story 0.1: Zustand 架构搭建

| Task ID | 任务描述 | 预估 | 依赖 |
|---------|---------|------|------|
| T0.1.1 | 安装 zustand, immer, zustand/middleware | 0.5h | - |
| T0.1.2 | 创建 Store 模板和规范文档 | 2h | T0.1.1 |
| T0.1.3 | 创建 goalStore.ts 作为参考实现 | 3h | T0.1.2 |
| T0.1.4 | 创建 taskStore.ts | 2h | T0.1.3 |
| T0.1.5 | 创建 reminderStore.ts | 2h | T0.1.3 |
| T0.1.6 | 创建 scheduleStore.ts | 2h | T0.1.3 |
| T0.1.7 | 创建其他模块 Store (dashboard, account, auth, ai, notification, repository, setting) | 4h | T0.1.3 |

#### Story 0.2: shadcn/ui 组件库完善

| Task ID | 任务描述 | 预估 | 依赖 |
|---------|---------|------|------|
| T0.2.1 | 确认已安装的 shadcn/ui 组件 | 0.5h | - |
| T0.2.2 | 补充缺失的 shadcn/ui 组件 (Form, Calendar, Command, Popover...) | 2h | T0.2.1 |
| T0.2.3 | 创建 CircularProgress 组件（shadcn 无此组件） | 1.5h | - |
| T0.2.4 | 创建 Toolbar 组件 | 1h | - |
| T0.2.5 | 配置 sonner toast 系统 | 1h | - |

#### Story 0.3: 共享组件搭建

| Task ID | 任务描述 | 预估 | 依赖 |
|---------|---------|------|------|
| T0.3.1 | 创建 EmptyState.tsx | 1h | - |
| T0.3.2 | 创建 LoadingSpinner.tsx | 0.5h | - |
| T0.3.3 | 创建 ErrorBoundary.tsx | 1h | - |
| T0.3.4 | 创建 ConfirmDialog.tsx | 1h | T0.2.2 |
| T0.3.5 | 创建 PageContainer.tsx | 1h | - |
| T0.3.6 | 创建 VirtualList.tsx（优化大列表性能） | 2h | - |

---

### Phase 1: Goal 模块完整迁移 (预估: 24 小时)

#### Story 1.1: Goal Cards 组件

| Task ID | 任务描述 | Web 参考 | 预估 | 依赖 |
|---------|---------|---------|------|------|
| T1.1.1 | 完善 GoalCard.tsx | GoalCard.vue | 2h | T0.2 |
| T1.1.2 | 创建 GoalInfoCard.tsx | GoalInfoShowCard.vue | 2h | T0.2 |
| T1.1.3 | 创建 GoalRecordCard.tsx | GoalRecordCard.vue | 1.5h | T0.2 |
| T1.1.4 | 创建 KeyResultCard.tsx | KeyResultCard.vue | 2h | T0.2 |
| T1.1.5 | 创建 GoalReviewCard.tsx | GoalReviewListCard.vue | 1.5h | T0.2 |

#### Story 1.2: Goal Dialogs 组件

| Task ID | 任务描述 | Web 参考 | 预估 | 依赖 |
|---------|---------|---------|------|------|
| T1.2.1 | 完善 GoalDialog.tsx（创建/编辑） | GoalDialog.vue | 3h | T0.2 |
| T1.2.2 | 完善 GoalDetailDialog.tsx | GoalDetailView.vue | 2h | T0.2 |
| T1.2.3 | 创建 KeyResultDialog.tsx | KeyResultDialog.vue | 2.5h | T0.2 |
| T1.2.4 | 创建 GoalRecordDialog.tsx | GoalRecordDialog.vue | 2h | T0.2 |
| T1.2.5 | 创建 GoalFolderDialog.tsx | GoalFolderDialog.vue | 1.5h | T0.2 |

#### Story 1.3: Goal Hooks

| Task ID | 任务描述 | Web 参考 | 预估 | 依赖 |
|---------|---------|---------|------|------|
| T1.3.1 | 创建 useGoal.ts | useGoal.ts | 2h | T0.1.3 |
| T1.3.2 | 创建 useGoalManagement.ts | useGoalManagement.ts | 2h | T0.1.3 |
| T1.3.3 | 创建 useKeyResult.ts | useKeyResult.ts | 1.5h | T0.1.3 |
| T1.3.4 | 创建 useGoalFolder.ts | useGoalFolder.ts | 1h | T0.1.3 |

#### Story 1.4: Goal Views

| Task ID | 任务描述 | Web 参考 | 预估 | 依赖 |
|---------|---------|---------|------|------|
| T1.4.1 | 完善 GoalListView.tsx | GoalListView.vue | 2h | T1.1, T1.3 |
| T1.4.2 | 创建 GoalDetailView.tsx（独立页面） | GoalDetailView.vue | 3h | T1.1, T1.2, T1.3 |
| T1.4.3 | 创建 KeyResultDetailView.tsx | KeyResultDetailView.vue | 2h | T1.1, T1.3 |

---

### Phase 2: Task 模块完整迁移 (预估: 20 小时)

#### Story 2.1: Task Cards 组件

| Task ID | 任务描述 | Web 参考 | 预估 | 依赖 |
|---------|---------|---------|------|------|
| T2.1.1 | 完善 TaskCard.tsx | TaskTemplateCard.vue | 2h | T0.2 |
| T2.1.2 | 创建 TaskInstanceCard.tsx | TaskInstanceCard.vue | 2h | T0.2 |
| T2.1.3 | 创建 TaskInfoCard.tsx | TaskInfoShowCard.vue | 1.5h | T0.2 |
| T2.1.4 | 创建 DraggableTaskCard.tsx | DraggableTaskCard.vue | 2h | T0.2 |

#### Story 2.2: Task Dialogs 组件

| Task ID | 任务描述 | Web 参考 | 预估 | 依赖 |
|---------|---------|---------|------|------|
| T2.2.1 | 完善 TaskTemplateDialog.tsx | TaskTemplateDialog.vue | 3h | T0.2 |
| T2.2.2 | 完善 TaskDetailDialog.tsx | TaskDetailView.vue | 2h | T0.2 |
| T2.2.3 | 创建 TaskCompleteDialog.tsx | TaskCompleteDialog.vue | 1.5h | T0.2 |
| T2.2.4 | 创建 TemplateSelectionDialog.tsx | TemplateSelectionDialog.vue | 1.5h | T0.2 |

#### Story 2.3: Task Hooks

| Task ID | 任务描述 | Web 参考 | 预估 | 依赖 |
|---------|---------|---------|------|------|
| T2.3.1 | 创建 useTaskTemplate.ts | - | 2h | T0.1.4 |
| T2.3.2 | 创建 useTaskInstance.ts | - | 2h | T0.1.4 |
| T2.3.3 | 创建 useTaskDependency.ts | - | 1.5h | T0.1.4 |

#### Story 2.4: Task Views

| Task ID | 任务描述 | Web 参考 | 预估 | 依赖 |
|---------|---------|---------|------|------|
| T2.4.1 | 完善 TaskListView.tsx | TaskListView.vue | 2h | T2.1, T2.3 |
| T2.4.2 | 创建 TaskManagementView.tsx | TaskManagementView.vue | 2.5h | T2.1, T2.2, T2.3 |

---

### Phase 3: Schedule 模块完整迁移 (预估: 16 小时)

#### Story 3.1: Schedule Components

| Task ID | 任务描述 | Web 参考 | 预估 | 依赖 |
|---------|---------|---------|------|------|
| T3.1.1 | 创建 WeekViewCalendar.tsx | WeekViewCalendar.vue | 4h | T0.2 |
| T3.1.2 | 创建 ScheduleEventList.tsx | ScheduleEventList.vue | 2h | T0.2 |
| T3.1.3 | 创建 ScheduleCard.tsx | cards/ | 1.5h | T0.2 |
| T3.1.4 | 创建 CreateScheduleDialog.tsx | CreateScheduleDialog.vue | 2.5h | T0.2 |
| T3.1.5 | 创建 ScheduleTaskDetailDialog.tsx | ScheduleTaskDetailDialog.vue | 2h | T0.2 |
| T3.1.6 | 创建 ConflictAlert.tsx | ConflictAlert.vue | 1h | T0.2 |

#### Story 3.2: Schedule Hooks & Store

| Task ID | 任务描述 | 预估 | 依赖 |
|---------|---------|------|------|
| T3.2.1 | 创建 scheduleStore.ts | 2h | T0.1 |
| T3.2.2 | 创建 useSchedule.ts | 1.5h | T3.2.1 |

#### Story 3.3: Schedule Views

| Task ID | 任务描述 | Web 参考 | 预估 | 依赖 |
|---------|---------|---------|------|------|
| T3.3.1 | 完善 ScheduleListView.tsx → ScheduleWeekView.tsx | ScheduleWeekView.vue | 3h | T3.1, T3.2 |

---

### Phase 4: Reminder 模块完整迁移 (预估: 16 小时)

#### Story 4.1: Reminder Components

| Task ID | 任务描述 | Web 参考 | 预估 | 依赖 |
|---------|---------|---------|------|------|
| T4.1.1 | 创建 ReminderGroupCard.tsx | GroupDesktopCard.vue | 2h | T0.2 |
| T4.1.2 | 创建 ReminderTemplateCard.tsx | TemplateDesktopCard.vue | 2h | T0.2 |
| T4.1.3 | 创建 ReminderGroupDialog.tsx | GroupDialog.vue | 2h | T0.2 |
| T4.1.4 | 创建 ReminderTemplateDialog.tsx | TemplateDialog.vue | 2.5h | T0.2 |
| T4.1.5 | 创建 TemplateMoveDialog.tsx | TemplateMoveDialog.vue | 1.5h | T0.2 |
| T4.1.6 | 创建 ReminderInstanceSidebar.tsx | ReminderInstanceSidebar.vue | 2h | T0.2 |

#### Story 4.2: Reminder Hooks & Store

| Task ID | 任务描述 | 预估 | 依赖 |
|---------|---------|------|------|
| T4.2.1 | 创建 reminderStore.ts | 2h | T0.1 |
| T4.2.2 | 创建 useReminder.ts | 1.5h | T4.2.1 |
| T4.2.3 | 创建 useReminderGroup.ts | 1h | T4.2.1 |

#### Story 4.3: Reminder Views

| Task ID | 任务描述 | Web 参考 | 预估 | 依赖 |
|---------|---------|---------|------|------|
| T4.3.1 | 创建 ReminderDesktopView.tsx | ReminderDesktopView.vue | 3h | T4.1, T4.2 |

---

### Phase 5: Dashboard 模块 (预估: 12 小时)

#### Story 5.1: Dashboard Components

| Task ID | 任务描述 | Web 参考 | 预估 | 依赖 |
|---------|---------|---------|------|------|
| T5.1.1 | 创建 DashboardWidget.tsx（基类） | - | 2h | T0.2 |
| T5.1.2 | 创建 GoalWidget.tsx | - | 2h | T5.1.1 |
| T5.1.3 | 创建 TaskWidget.tsx | - | 2h | T5.1.1 |
| T5.1.4 | 创建 ReminderWidget.tsx | - | 2h | T5.1.1 |
| T5.1.5 | 创建 StatisticsWidget.tsx | - | 2h | T5.1.1 |

#### Story 5.2: Dashboard View

| Task ID | 任务描述 | 预估 | 依赖 |
|---------|---------|------|------|
| T5.2.1 | 完善 DashboardView.tsx | 2h | T5.1 |

---

### Phase 6: 其他模块 (预估: 24 小时)

#### Story 6.1: Account 模块

| Task ID | 任务描述 | 预估 | 依赖 |
|---------|---------|------|------|
| T6.1.1 | 创建 AccountProfileCard.tsx | 1.5h | T0.2 |
| T6.1.2 | 创建 AccountSettingsDialog.tsx | 2h | T0.2 |
| T6.1.3 | 创建 useAccount.ts | 1h | T0.1 |

#### Story 6.2: Authentication 模块

| Task ID | 任务描述 | 预估 | 依赖 |
|---------|---------|------|------|
| T6.2.1 | 完善 LoginView.tsx | 2h | T0.2 |
| T6.2.2 | 创建 RegisterView.tsx | 2h | T0.2 |
| T6.2.3 | 创建 useAuth.ts | 1.5h | T0.1 |

#### Story 6.3: AI 模块

| Task ID | 任务描述 | 预估 | 依赖 |
|---------|---------|------|------|
| T6.3.1 | 创建 AIConversationView.tsx | 3h | T0.2 |
| T6.3.2 | 创建 AIGenerationDialog.tsx | 2h | T0.2 |
| T6.3.3 | 创建 useAI.ts | 1.5h | T0.1 |

#### Story 6.4: Notification 模块

| Task ID | 任务描述 | 预估 | 依赖 |
|---------|---------|------|------|
| T6.4.1 | 创建 NotificationCenter.tsx | 2h | T0.2 |
| T6.4.2 | 创建 NotificationItem.tsx | 1h | T0.2 |
| T6.4.3 | 创建 useNotification.ts | 1h | T0.1 |

#### Story 6.5: Repository 模块

| Task ID | 任务描述 | 预估 | 依赖 |
|---------|---------|------|------|
| T6.5.1 | 创建 RepositoryExplorer.tsx | 3h | T0.2 |
| T6.5.2 | 创建 FolderTree.tsx | 2h | T0.2 |
| T6.5.3 | 创建 ResourceCard.tsx | 1.5h | T0.2 |
| T6.5.4 | 创建 useRepository.ts | 1.5h | T0.1 |

#### Story 6.6: Setting 模块

| Task ID | 任务描述 | 预估 | 依赖 |
|---------|---------|------|------|
| T6.6.1 | 创建 SettingsView.tsx | 2h | T0.2 |
| T6.6.2 | 创建 ThemeSettings.tsx | 1.5h | T0.2 |
| T6.6.3 | 创建 GeneralSettings.tsx | 1.5h | T0.2 |
| T6.6.4 | 创建 useSetting.ts | 1h | T0.1 |

---

### Phase 7: 高级功能 (预估: 24 小时)

#### Story 7.1: 可视化组件

| Task ID | 任务描述 | Web 参考 | 预估 | 依赖 |
|---------|---------|---------|------|------|
| T7.1.1 | 创建 GoalDAG.tsx（目标依赖图） | dag/ | 4h | - |
| T7.1.2 | 完善 TaskDependencyGraph.tsx | TaskDependencyGraph.vue | 3h | - |
| T7.1.3 | 创建 GoalTimeline.tsx | timeline/ | 3h | - |
| T7.1.4 | 创建 ProgressChart.tsx（使用 Recharts） | echarts/ | 3h | - |

#### Story 7.2: Focus Mode 专注模式

| Task ID | 任务描述 | Web 参考 | 预估 | 依赖 |
|---------|---------|---------|------|------|
| T7.2.1 | 创建 FocusModeDialog.tsx | ActivateFocusModeDialog.vue | 2h | T0.2 |
| T7.2.2 | 创建 FocusModeStatusBar.tsx | FocusModeStatusBar.vue | 1.5h | T0.2 |
| T7.2.3 | 创建 FocusModeHistoryPanel.tsx | FocusModeHistoryPanel.vue | 2h | T0.2 |
| T7.2.4 | 创建 useFocusMode.ts | useFocusMode.ts | 1.5h | T0.1 |

#### Story 7.3: AI 增强功能

| Task ID | 任务描述 | Web 参考 | 预估 | 依赖 |
|---------|---------|---------|------|------|
| T7.3.1 | 创建 AIGenerateKRButton.tsx | AIGenerateKRButton.vue | 1.5h | T0.2 |
| T7.3.2 | 创建 AIKeyResultsSection.tsx | AIKeyResultsSection.vue | 2h | T0.2 |
| T7.3.3 | 创建 TaskAIGenerationDialog.tsx | TaskAIGenerationDialog.vue | 2h | T0.2 |

---

## 📈 进度追踪

### 总体进度

| Phase | 描述 | 任务数 | 预估工时 | 状态 |
|-------|------|-------|---------|------|
| Phase 0 | 基础设施 | 18 | 16h | ⬜ 未开始 |
| Phase 1 | Goal 模块 | 17 | 24h | ⬜ 未开始 |
| Phase 2 | Task 模块 | 14 | 20h | ⬜ 未开始 |
| Phase 3 | Schedule 模块 | 9 | 16h | ⬜ 未开始 |
| Phase 4 | Reminder 模块 | 10 | 16h | ⬜ 未开始 |
| Phase 5 | Dashboard 模块 | 6 | 12h | ⬜ 未开始 |
| Phase 6 | 其他模块 | 20 | 24h | ⬜ 未开始 |
| Phase 7 | 高级功能 | 11 | 24h | ⬜ 未开始 |
| **总计** | | **105** | **152h** | |

### 状态图例
- ⬜ 未开始
- 🟡 进行中
- ✅ 已完成
- ❌ 阻塞

---

## 🔄 Vue → React 转换指南

### 组件映射表

| Vuetify 组件 | shadcn/ui 组件 | 备注 |
|-------------|----------------|------|
| `<v-dialog>` | `<Dialog>` | - |
| `<v-card>` | `<Card>` | - |
| `<v-btn>` | `<Button>` | - |
| `<v-text-field>` | `<Input>` | - |
| `<v-textarea>` | `<Textarea>` | - |
| `<v-select>` | `<Select>` | - |
| `<v-checkbox>` | `<Checkbox>` | - |
| `<v-switch>` | `<Switch>` | - |
| `<v-menu>` | `<DropdownMenu>` | - |
| `<v-tabs>` | `<Tabs>` | - |
| `<v-progress-circular>` | 自定义 `<CircularProgress>` | 需自行实现 |
| `<v-progress-linear>` | `<Progress>` | - |
| `<v-alert>` | `<Alert>` | - |
| `<v-tooltip>` | `<Tooltip>` | - |
| `<v-icon>` | Lucide Icons | - |
| `<v-skeleton-loader>` | `<Skeleton>` | - |
| `<v-date-picker>` | `<Calendar>` | - |
| `<v-form>` | react-hook-form + `<Form>` | - |
| `<v-snackbar>` | sonner toast | - |

### Vue → React 语法转换

| Vue 语法 | React 语法 |
|---------|-----------|
| `ref()` / `reactive()` | `useState()` |
| `computed()` | `useMemo()` |
| `watch()` | `useEffect()` |
| `onMounted()` | `useEffect(() => {}, [])` |
| `v-model` | `value` + `onChange` |
| `v-if` | `{condition && <Comp />}` |
| `v-for` | `.map()` |
| `@click` | `onClick` |
| `defineEmits()` | 回调 props |
| Composable | Custom Hook |
| Pinia Store | Zustand Store |

---

## 🧪 测试策略

### 单元测试
- 使用 Vitest + React Testing Library
- 每个组件至少一个渲染测试
- Custom Hooks 使用 `@testing-library/react-hooks`

### 集成测试
- 测试 Store + Hook + 组件的集成
- 模拟 IPC 调用

### E2E 测试（可选）
- 使用 Playwright
- 覆盖核心用户流程

---

## 📝 验收标准

### 功能验收
- [ ] 所有列表视图可正常加载数据
- [ ] 所有 CRUD 操作正常工作
- [ ] 所有对话框可正常打开/关闭
- [ ] 状态在 Store 中正确管理
- [ ] 错误处理和 Toast 提示正常

### 视觉验收
- [ ] 组件样式与 Web 端一致
- [ ] 暗色/亮色主题切换正常
- [ ] 响应式布局正常

### 性能验收
- [ ] 大列表使用虚拟滚动
- [ ] 无不必要的重渲染
- [ ] Store 使用 selector 优化

---

## 📚 参考资源

- [shadcn/ui 文档](https://ui.shadcn.com/)
- [Zustand 文档](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [React Hook Form 文档](https://react-hook-form.com/)
- [Lucide Icons](https://lucide.dev/)
- [Sonner Toast](https://sonner.emilkowal.ski/)
- [Web 模块架构分析](./web-to-desktop-migration-analysis.md)

---

## 📅 里程碑

| 里程碑 | 目标日期 | 包含 Phase | 状态 |
|-------|---------|-----------|------|
| M1: 基础设施完成 | TBD | Phase 0 | ⬜ |
| M2: 核心模块完成 | TBD | Phase 1-4 | ⬜ |
| M3: 全模块完成 | TBD | Phase 5-6 | ⬜ |
| M4: 高级功能完成 | TBD | Phase 7 | ⬜ |

---

> 📝 此 EPIC 由 BMad Master 创建，用于追踪 Desktop Renderer 进程从 Web 端的完整迁移工作。
