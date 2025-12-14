# Web 模块架构分析 - Desktop 迁移指南

> 为 React + shadcn/ui + Zustand 实现准备的架构分析文档
> 生成日期：2024-12-14

## 1. 整体架构概览

### 1.1 Web 项目分层架构

```
apps/web/src/
├── modules/                    # 业务模块（核心）
│   ├── goal/                   # 目标模块
│   ├── task/                   # 任务模块
│   ├── schedule/               # 日程模块
│   ├── reminder/               # 提醒模块
│   ├── dashboard/              # 仪表板模块
│   ├── ai/                     # AI模块
│   ├── authentication/         # 认证模块
│   ├── account/                # 账户模块
│   ├── setting/                # 设置模块
│   ├── notification/           # 通知模块
│   ├── repository/             # 仓库模块
│   ├── editor/                 # 编辑器模块
│   ├── theme/                  # 主题模块
│   └── app/                    # 应用壳模块
├── stores/                     # 全局 Store
├── services/                   # 全局服务
├── shared/                     # 共享代码
├── components/                 # 全局组件
└── config/                     # 配置
```

### 1.2 模块内部分层（DDD 模式）

每个业务模块遵循统一的分层结构：

```
module/
├── application/                # 应用层
│   ├── services/               # ApplicationService (用例实现)
│   ├── composables/            # Vue Composable (仅 goal 模块有)
│   └── events/                 # 领域事件
├── infrastructure/             # 基础设施层
│   ├── api/                    # API 客户端
│   └── storage/                # 本地存储
├── presentation/               # 展示层
│   ├── components/             # Vue 组件
│   │   ├── cards/              # 卡片组件
│   │   ├── dialogs/            # 对话框组件
│   │   └── ...                 # 其他组件
│   ├── composables/            # Vue Composable (Hook)
│   ├── stores/                 # Pinia Store
│   ├── views/                  # 页面组件
│   ├── widgets/                # 小部件
│   └── router/                 # 路由配置
├── initialization/             # 模块初始化
└── index.ts                    # 模块入口
```

## 2. 核心模块组件清单

### 2.1 Goal 模块（目标管理）

#### Views (页面)
| Web 组件 | 功能描述 | Desktop 对应 | 状态 |
|---------|---------|-------------|------|
| GoalListView.vue | 目标列表页 | GoalListView.tsx | ✅ 已有 |
| GoalDetailView.vue | 目标详情页 | GoalDetailDialog.tsx | ✅ 刚创建 |
| KeyResultDetailView.vue | 关键结果详情 | - | ❌ 缺失 |
| GoalReviewCreationView.vue | 目标复盘创建 | - | ❌ 缺失 |
| GoalReviewDetailView.vue | 复盘详情 | - | ❌ 缺失 |
| MultiGoalComparisonView.vue | 多目标对比 | - | ❌ 缺失 |
| FocusCycle.vue | 专注周期 | - | ❌ 缺失 |
| WeightSnapshotView.vue | 权重快照 | - | ❌ 缺失 |

#### Components - Dialogs (对话框)
| Web 组件 | 功能描述 | Desktop 对应 | 状态 |
|---------|---------|-------------|------|
| GoalDialog.vue | 创建/编辑目标 | GoalCreateDialog.tsx | ⚠️ 部分 |
| GoalFolderDialog.vue | 目录管理 | GoalFolderManager.tsx | ⚠️ 部分 |
| KeyResultDialog.vue | 关键结果对话框 | - | ❌ 缺失 |
| GoalRecordDialog.vue | 目标记录对话框 | - | ❌ 缺失 |

#### Components - Cards (卡片)
| Web 组件 | 功能描述 | Desktop 对应 | 状态 |
|---------|---------|-------------|------|
| GoalCard.vue | 目标卡片 | GoalCard.tsx | ✅ 已有 |
| GoalInfoShowCard.vue | 目标信息展示 | - | ❌ 缺失 |
| GoalRecordCard.vue | 目标记录卡片 | - | ❌ 缺失 |
| GoalReviewListCard.vue | 复盘列表卡片 | - | ❌ 缺失 |
| KeyResultCard.vue | 关键结果卡片 | - | ❌ 缺失 |
| MotivateCard.vue | 激励卡片 | - | ❌ 缺失 |

#### Components - 其他
| Web 组件 | 功能描述 | Desktop 对应 | 状态 |
|---------|---------|-------------|------|
| AIGenerateKRButton.vue | AI生成关键结果 | - | ❌ 缺失 |
| AIKeyResultsSection.vue | AI关键结果区 | - | ❌ 缺失 |
| ActivateFocusModeDialog.vue | 专注模式激活 | - | ❌ 缺失 |
| FocusModeHistoryPanel.vue | 专注历史面板 | - | ❌ 缺失 |
| FocusModeStatusBar.vue | 专注状态栏 | - | ❌ 缺失 |
| GoalFolder.vue | 目标文件夹 | - | ❌ 缺失 |
| KRPreviewList.vue | KR预览列表 | - | ❌ 缺失 |
| ProgressBreakdownPanel.vue | 进度分解面板 | - | ❌ 缺失 |
| dag/ | DAG可视化组件 | - | ❌ 缺失 |
| timeline/ | 时间线组件 | - | ❌ 缺失 |
| echarts/ | 图表组件 | - | ❌ 缺失 |
| weight/ | 权重管理组件 | - | ❌ 缺失 |
| comparison/ | 对比组件 | - | ❌ 缺失 |

---

### 2.2 Task 模块（任务管理）

#### Views (页面)
| Web 组件 | 功能描述 | Desktop 对应 | 状态 |
|---------|---------|-------------|------|
| TaskListView.vue | 任务列表页 | TaskListView.tsx | ✅ 已有 |
| TaskDetailView.vue | 任务详情页 | TaskDetailDialog.tsx | ⚠️ 部分 |
| TaskManagementView.vue | 任务管理页 | - | ❌ 缺失 |
| DependencyValidationDemoView.vue | 依赖验证演示 | - | ❌ 缺失 |

#### Components - Dialogs (对话框)
| Web 组件 | 功能描述 | Desktop 对应 | 状态 |
|---------|---------|-------------|------|
| TaskTemplateDialog.vue | 任务模板对话框 | TaskCreateDialog.tsx | ⚠️ 部分 |
| TaskCompleteDialog.vue | 任务完成对话框 | - | ❌ 缺失 |
| TemplateSelectionDialog.vue | 模板选择对话框 | - | ❌ 缺失 |

#### Components - Cards (卡片)
| Web 组件 | 功能描述 | Desktop 对应 | 状态 |
|---------|---------|-------------|------|
| TaskTemplateCard.vue | 任务模板卡片 | TaskCard.tsx | ⚠️ 部分 |
| TaskInstanceCard.vue | 任务实例卡片 | - | ❌ 缺失 |
| TaskInfoShowCard.vue | 任务信息展示 | - | ❌ 缺失 |
| TaskInSummaryCard.vue | 任务摘要卡片 | - | ❌ 缺失 |
| DraggableTaskCard.vue | 可拖拽任务卡片 | - | ❌ 缺失 |

#### Components - 其他
| Web 组件 | 功能描述 | Desktop 对应 | 状态 |
|---------|---------|-------------|------|
| TaskDependencyGraph.vue | 任务依赖图 | TaskDependencyGraph.tsx | ✅ 已有 |
| TaskInstanceManagement.vue | 实例管理 | - | ❌ 缺失 |
| TaskTemplateManagement.vue | 模板管理 | - | ❌ 缺失 |
| TaskAIGenerationDialog.vue | AI生成任务 | - | ❌ 缺失 |
| TaskTemplateForm/ | 模板表单组件 | - | ❌ 缺失 |
| critical-path/ | 关键路径组件 | - | ❌ 缺失 |
| dag/ | DAG组件 | - | ❌ 缺失 |
| dependency/ | 依赖组件 | - | ❌ 缺失 |

---

### 2.3 Schedule 模块（日程管理）

#### Views (页面)
| Web 组件 | 功能描述 | Desktop 对应 | 状态 |
|---------|---------|-------------|------|
| ScheduleWeekView.vue | 周视图 | ScheduleListView.tsx | ⚠️ 部分 |
| ScheduleDashboardView.vue | 日程仪表板 | - | ❌ 缺失 |

#### Components
| Web 组件 | 功能描述 | Desktop 对应 | 状态 |
|---------|---------|-------------|------|
| CreateScheduleDialog.vue | 创建日程对话框 | - | ❌ 缺失 |
| WeekViewCalendar.vue | 周历组件 | - | ❌ 缺失 |
| ScheduleEventList.vue | 事件列表 | - | ❌ 缺失 |
| ScheduleConflictAlert.vue | 冲突提醒 | - | ❌ 缺失 |
| ScheduleTaskDetailDialog.vue | 任务详情对话框 | - | ❌ 缺失 |
| cards/ | 卡片组件 | - | ❌ 缺失 |

---

### 2.4 Reminder 模块（提醒管理）

#### Views (页面)
| Web 组件 | 功能描述 | Desktop 对应 | 状态 |
|---------|---------|-------------|------|
| ReminderDesktopView.vue | 提醒桌面视图 | - | ❌ 缺失 |

#### Components - Dialogs (对话框)
| Web 组件 | 功能描述 | Desktop 对应 | 状态 |
|---------|---------|-------------|------|
| GroupDialog.vue | 分组对话框 | - | ❌ 缺失 |
| TemplateDialog.vue | 模板对话框 | - | ❌ 缺失 |
| TemplateMoveDialog.vue | 移动模板对话框 | - | ❌ 缺失 |

#### Components - Cards (卡片)
| Web 组件 | 功能描述 | Desktop 对应 | 状态 |
|---------|---------|-------------|------|
| GroupDesktopCard.vue | 分组卡片 | - | ❌ 缺失 |
| TemplateDesktopCard.vue | 模板卡片 | - | ❌ 缺失 |

#### Components - 其他
| Web 组件 | 功能描述 | Desktop 对应 | 状态 |
|---------|---------|-------------|------|
| ReminderInstanceSidebar.vue | 实例侧边栏 | - | ❌ 缺失 |
| ScheduleStatusCard.vue | 日程状态卡片 | - | ❌ 缺失 |
| grid/ | 网格组件 | - | ❌ 缺失 |
| context-menu/ | 上下文菜单 | - | ❌ 缺失 |

---

## 3. 状态管理架构

### 3.1 Web 端 Pinia Store 结构

每个模块都有自己的 Pinia Store，采用纯缓存存储模式：

```typescript
// Web 端 Store 模式 (Pinia)
export const useGoalStore = defineStore('goal', {
  state: () => ({
    // 缓存数据
    goals: [],
    goalFolders: [],
    
    // 状态管理
    isLoading: false,
    isInitialized: false,
    error: null,
    lastSyncTime: null,
    
    // UI 状态
    pagination: { page: 1, limit: 20, total: 0 },
    filters: { status: 'all', dirUuid: undefined, searchQuery: '' },
    selectedGoalUuid: null,
  }),
  
  getters: {
    getAllGoals(): Goal[] { return this.goals; },
    getGoalByUuid: (state) => (uuid: string) => state.goals.find(g => g.uuid === uuid),
    getGoalsByDir: () => (dirUuid?: string) => ...,
    getGoalsByStatus: () => (status: string) => ...,
  },
  
  actions: {
    setGoals(goals: Goal[]) { this.goals = goals; },
    addGoal(goal: Goal) { this.goals.push(goal); },
    updateGoal(uuid: string, updates: Partial<Goal>) { ... },
    removeGoal(uuid: string) { ... },
    setLoading(loading: boolean) { this.isLoading = loading; },
    setError(error: string | null) { this.error = error; },
  },
});
```

### 3.2 Desktop 端 Zustand Store 转换

对应的 Zustand Store 设计：

```typescript
// Desktop 端 Store 模式 (Zustand)
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';

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
  pagination: { page: number; limit: number; total: number };
  filters: { status: string; dirUuid?: string; searchQuery: string };
  selectedGoalUuid: string | null;
}

interface GoalActions {
  // Getters (通过 selectors 实现)
  getAllGoals: () => Goal[];
  getGoalByUuid: (uuid: string) => Goal | undefined;
  getGoalsByDir: (dirUuid?: string) => Goal[];
  getGoalsByStatus: (status: string) => Goal[];
  
  // Actions
  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (uuid: string, updates: Partial<Goal>) => void;
  removeGoal: (uuid: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<GoalState['filters']>) => void;
  reset: () => void;
}

export const useGoalStore = create<GoalState & GoalActions>()(
  immer(
    persist(
      (set, get) => ({
        // 初始状态
        goals: [],
        goalFolders: [],
        isLoading: false,
        isInitialized: false,
        error: null,
        lastSyncTime: null,
        pagination: { page: 1, limit: 20, total: 0 },
        filters: { status: 'all', dirUuid: undefined, searchQuery: '' },
        selectedGoalUuid: null,
        
        // Selectors
        getAllGoals: () => get().goals,
        getGoalByUuid: (uuid) => get().goals.find(g => g.uuid === uuid),
        getGoalsByDir: (dirUuid) => dirUuid 
          ? get().goals.filter(g => g.folderUuid === dirUuid)
          : get().goals.filter(g => !g.folderUuid),
        getGoalsByStatus: (status) => get().goals.filter(g => g.status === status),
        
        // Actions
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
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        setFilters: (filters) => set((state) => ({ 
          filters: { ...state.filters, ...filters }
        })),
        reset: () => set({
          goals: [],
          goalFolders: [],
          isLoading: false,
          error: null,
          selectedGoalUuid: null,
        }),
      }),
      { name: 'goal-store' }
    )
  )
);
```

---

## 4. 数据流架构

### 4.1 Web 端数据流

```
┌─────────────────────────────────────────────────────────────────┐
│                        Vue Component                              │
│  (使用 Composable 获取数据和操作)                                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │ useGoalManagement()
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Composable Layer                            │
│  - 协调 Service 和 Store                                          │
│  - 处理错误和通知                                                  │
│  - 管理本地 UI 状态                                                │
└─────────────────────┬───────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌───────────────┐ ┌──────────┐ ┌──────────────┐
│ Application   │ │  Pinia   │ │   Global     │
│ Service       │ │  Store   │ │   Message    │
│ (API调用+转换) │ │ (缓存数据)│ │  (通知)      │
└───────┬───────┘ └──────────┘ └──────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Infrastructure Layer                          │
│  - API Client (axios)                                             │
│  - DTO <-> Entity 转换                                            │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Desktop 端数据流（推荐）

```
┌─────────────────────────────────────────────────────────────────┐
│                      React Component                              │
│  (使用 Hook 获取数据和操作)                                        │
└─────────────────────┬───────────────────────────────────────────┘
                      │ useGoalManagement()
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Custom Hook                                │
│  - 协调 Service 和 Zustand Store                                  │
│  - 处理错误和 Toast 通知                                          │
│  - 管理本地 UI 状态 (useState)                                    │
└─────────────────────┬───────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌───────────────┐ ┌──────────┐ ┌──────────────┐
│ Application   │ │  Zustand │ │   Toast      │
│ Service       │ │  Store   │ │   (sonner)   │
│ (IPC调用+转换) │ │ (缓存数据)│ │  (通知)      │
└───────┬───────┘ └──────────┘ └──────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Infrastructure Layer                          │
│  - IPC Client (Electron IPC)                                      │
│  - DTO <-> Entity 转换                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Vue → React 组件转换指南

### 5.1 Vuetify → shadcn/ui 组件映射

| Vuetify 组件 | shadcn/ui 组件 | 说明 |
|-------------|----------------|------|
| `<v-dialog>` | `<Dialog>` | 模态对话框 |
| `<v-card>` | `<Card>` | 卡片容器 |
| `<v-btn>` | `<Button>` | 按钮 |
| `<v-text-field>` | `<Input>` | 文本输入 |
| `<v-textarea>` | `<Textarea>` | 文本区域 |
| `<v-select>` | `<Select>` | 下拉选择 |
| `<v-checkbox>` | `<Checkbox>` | 复选框 |
| `<v-switch>` | `<Switch>` | 开关 |
| `<v-menu>` | `<DropdownMenu>` | 下拉菜单 |
| `<v-list>` | 自定义或 `<Command>` | 列表 |
| `<v-list-item>` | `<CommandItem>` | 列表项 |
| `<v-toolbar>` | 自定义 Toolbar | 工具栏 |
| `<v-tabs>` | `<Tabs>` | 标签页 |
| `<v-progress-circular>` | 自定义或 `<Progress>` | 圆形进度 |
| `<v-progress-linear>` | `<Progress>` | 线性进度 |
| `<v-alert>` | `<Alert>` | 提示框 |
| `<v-tooltip>` | `<Tooltip>` | 工具提示 |
| `<v-icon>` | Lucide Icons | 图标 |
| `<v-skeleton-loader>` | `<Skeleton>` | 骨架屏 |
| `<v-date-picker>` | `<Calendar>` | 日期选择 |
| `<v-form>` | react-hook-form + `<Form>` | 表单 |
| `<v-snackbar>` | `sonner` toast | 消息提示 |

### 5.2 Vue 语法 → React 语法

| Vue 语法 | React 语法 |
|---------|-----------|
| `ref()` / `reactive()` | `useState()` |
| `computed()` | `useMemo()` |
| `watch()` | `useEffect()` |
| `onMounted()` | `useEffect(() => {}, [])` |
| `onUnmounted()` | `useEffect(() => { return () => {} }, [])` |
| `v-model` | `value` + `onChange` |
| `v-if` / `v-else` | `{condition && <Comp />}` |
| `v-for` | `.map()` |
| `v-show` | `style={{ display: ... }}` |
| `@click` | `onClick` |
| `@input` | `onChange` |
| `:prop` | `prop={}` |
| `<slot>` | `children` prop |
| `<slot name="x">` | `slots.x` 或命名 children |
| `defineEmits()` | 回调 props (`onXxx`) |
| `defineProps()` | `interface Props {}` |
| Composable | Custom Hook |

---

## 6. 迁移优先级建议

### Phase 1: 核心基础设施 (高优先级)

1. **Zustand Store 模板** - 创建标准化的 Store 模式
2. **Custom Hooks 模板** - 创建标准化的 Hook 模式
3. **shadcn/ui 基础组件** - Dialog, Card, Button, Input, Form
4. **Toast 通知系统** - 使用 sonner

### Phase 2: Goal 模块完善 (高优先级)

1. GoalDialog (创建/编辑) - 完善 GoalCreateDialog
2. KeyResultDialog - 关键结果对话框
3. KeyResultCard - 关键结果卡片
4. GoalInfoShowCard - 目标信息展示
5. useGoalStore (Zustand) - 状态管理

### Phase 3: Task 模块完善 (高优先级)

1. TaskTemplateDialog - 完善任务模板对话框
2. TaskInstanceCard - 任务实例卡片
3. TaskCompleteDialog - 完成任务对话框
4. useTaskStore (Zustand) - 状态管理

### Phase 4: Schedule 模块 (中优先级)

1. WeekViewCalendar - 周历组件
2. CreateScheduleDialog - 创建日程对话框
3. ScheduleEventList - 事件列表

### Phase 5: Reminder 模块 (中优先级)

1. ReminderDesktopView - 主视图
2. GroupDialog / TemplateDialog - 对话框
3. GroupDesktopCard / TemplateDesktopCard - 卡片

### Phase 6: 高级功能 (低优先级)

1. DAG 可视化组件
2. 时间线组件
3. 图表组件 (ECharts → Recharts)
4. AI 功能组件
5. 专注模式组件

---

## 7. 目录结构建议

Desktop 端推荐目录结构：

```
apps/desktop/src/renderer/
├── modules/
│   ├── goal/
│   │   ├── application/
│   │   │   └── services/
│   │   ├── presentation/
│   │   │   ├── components/
│   │   │   │   ├── cards/           # ✨ 新增
│   │   │   │   │   ├── GoalCard.tsx
│   │   │   │   │   ├── GoalInfoCard.tsx
│   │   │   │   │   └── KeyResultCard.tsx
│   │   │   │   ├── dialogs/         # ✨ 新增
│   │   │   │   │   ├── GoalDialog.tsx
│   │   │   │   │   ├── GoalDetailDialog.tsx
│   │   │   │   │   └── KeyResultDialog.tsx
│   │   │   │   └── index.ts
│   │   │   ├── hooks/
│   │   │   │   ├── useGoalManagement.ts
│   │   │   │   ├── useKeyResult.ts
│   │   │   │   └── useGoalStore.ts  # Zustand Hook
│   │   │   ├── stores/              # ✨ 新增
│   │   │   │   └── goalStore.ts     # Zustand Store
│   │   │   ├── views/
│   │   │   └── index.ts
│   │   ├── initialization/
│   │   └── index.ts
│   ├── task/                        # 同样结构
│   ├── schedule/                    # 同样结构
│   ├── reminder/                    # 同样结构
│   └── ...
├── shared/
│   ├── components/                  # 共享 UI 组件
│   │   ├── ui/                      # shadcn/ui 组件
│   │   ├── layout/                  # 布局组件
│   │   └── common/                  # 通用组件
│   ├── hooks/                       # 共享 Hooks
│   └── utils/                       # 工具函数
└── stores/                          # 全局 Store (如有需要)
```

---

## 8. 下一步行动

1. **创建 Zustand Store 模板** - 标准化状态管理
2. **完善 Goal 模块** - 补齐缺失组件
3. **创建组件转换清单** - 跟踪进度
4. **建立组件测试规范** - 确保质量

---

> 📝 此文档由 BMad Master 生成，用于指导 Desktop 端 React + shadcn/ui + Zustand 重构工作。
