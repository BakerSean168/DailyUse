# Story 11.0: 基础设施搭建

Status: ready-for-dev

## Story

作为一名**前端开发者**，
我想要**建立完整的 Zustand 状态管理架构和 shadcn/ui 组件库基础**，
以便**后续模块迁移有统一的技术基础和开发规范**。

## 业务背景

Desktop Renderer 进程从 Web 端（Vue + Vuetify + Pinia）迁移到 React + shadcn/ui + Zustand，需要先建立基础设施：
- Zustand 状态管理架构（替代 Pinia）
- shadcn/ui 组件库完善（补充缺失组件）
- 共享组件搭建（EmptyState、LoadingSpinner 等）

## Acceptance Criteria

### AC 11.0.1: Zustand 架构搭建
```gherkin
Given 项目需要统一的状态管理方案
When 安装并配置 Zustand 及其中间件
Then zustand, immer, zustand/middleware 包已安装
And 创建了 Store 模板和规范文档
And 创建了 goalStore.ts 作为参考实现
And 创建了 taskStore.ts, reminderStore.ts, scheduleStore.ts
And 创建了其他模块 Store (dashboard, account, auth, ai, notification, repository, setting)
```

### AC 11.0.2: shadcn/ui 组件库完善
```gherkin
Given 项目需要完整的 UI 组件库
When 补充缺失的 shadcn/ui 组件
Then Form, Calendar, Command, Popover 等组件已安装
And 创建了自定义 CircularProgress 组件
And 创建了 Toolbar 组件
And 配置了 sonner toast 系统
```

### AC 11.0.3: 共享组件搭建
```gherkin
Given 多个模块需要共享通用组件
When 创建共享组件库
Then EmptyState.tsx 组件已创建（显示空状态）
And LoadingSpinner.tsx 组件已创建
And ErrorBoundary.tsx 组件已创建
And ConfirmDialog.tsx 组件已创建
And PageContainer.tsx 布局组件已创建
And VirtualList.tsx 虚拟列表组件已创建
```

## Tasks / Subtasks

### Task 1: Zustand 架构搭建 (AC: 11.0.1)
- [x] T0.1.1: 安装 zustand, immer, zustand/middleware (0.5h) ✅
  ```bash
  cd apps/desktop && pnpm add zustand immer
  ```
  - zustand 5.0.9, immer 11.0.1 已安装
- [x] T0.1.2: 创建 Store 模板和规范文档 (2h) ✅
  - `docs/architecture/zustand-store-pattern.md` 已存在 (281 lines)
  - State、Actions、Selectors 规范完整
- [x] T0.1.3: 创建 goalStore.ts 作为参考实现 (3h) ✅
  - `apps/desktop/src/renderer/modules/goal/presentation/stores/goalStore.ts` 已存在 (444 lines)
  - 包含完整的 State、Actions、Selectors
  - 使用 immer 中间件
  - 使用 persist 中间件（可选字段持久化）
- [x] T0.1.4: 创建 taskStore.ts (2h) ✅
  - `apps/desktop/src/renderer/modules/task/presentation/stores/taskStore.ts` 已存在
- [x] T0.1.5: 创建 reminderStore.ts (2h) ✅
  - `apps/desktop/src/renderer/modules/reminder/presentation/stores/reminderStore.ts` 已存在
- [x] T0.1.6: 创建 scheduleStore.ts (2h) ✅
  - `apps/desktop/src/renderer/modules/schedule/presentation/stores/scheduleStore.ts` 已存在
- [x] T0.1.7: 创建其他模块 Store (4h) ✅
  - dashboardStore.ts ✅
  - accountStore.ts ✅ (新建)
  - authStore.ts ✅
  - aiStore.ts ✅
  - notificationStore.ts ✅
  - repositoryStore.ts ✅ (新建)
  - settingStore.ts ✅
  - 更新了 `types/electron.d.ts` IPC 类型定义

### Task 2: shadcn/ui 组件库完善 (AC: 11.0.2)
- [x] T0.2.1: 确认已安装的 shadcn/ui 组件 (0.5h) ✅
  - `@dailyuse/ui-shadcn` 包含 50+ 组件
  - 所有核心组件已可用
- [x] T0.2.2: 补充缺失的 shadcn/ui 组件 (2h) ✅
  - 组件已通过 @dailyuse/ui-shadcn 包完整提供
- [x] T0.2.3: 创建 CircularProgress 组件 (1.5h) ✅
  - `apps/desktop/src/renderer/shared/components/common/CircularProgress.tsx` 已存在 (152 lines)
- [x] T0.2.4: 创建 Toolbar 组件 (1h) ✅
  - `apps/desktop/src/renderer/shared/components/common/Toolbar.tsx` 已存在 (173 lines)
- [x] T0.2.5: 配置 sonner toast 系统 (1h) ✅
  - sonner 已安装并集成
  - `apps/desktop/src/renderer/shared/components/common/Toast.tsx` 已配置
  - App.tsx 已包含 `<Toaster />`

### Task 3: 共享组件搭建 (AC: 11.0.3)
- [x] T0.3.1: 创建 EmptyState.tsx (1h) ✅
  - `apps/desktop/src/renderer/shared/components/common/EmptyState.tsx` 已存在
- [x] T0.3.2: 创建 LoadingSpinner.tsx (0.5h) ✅
  - `apps/desktop/src/renderer/shared/components/common/LoadingSpinner.tsx` 已存在
- [x] T0.3.3: 创建 ErrorBoundary.tsx (1h) ✅
  - `apps/desktop/src/renderer/shared/components/common/ErrorBoundary.tsx` 已存在
- [x] T0.3.4: 创建 ConfirmDialog.tsx (1h) ✅
  - `apps/desktop/src/renderer/shared/components/common/ConfirmDialog.tsx` 已存在
- [x] T0.3.5: 创建 PageContainer.tsx (1h) ✅
  - `apps/desktop/src/renderer/shared/components/layouts/PageContainer.tsx` 已存在 (138 lines)
- [x] T0.3.6: 创建 VirtualList.tsx (2h) ✅
  - `apps/desktop/src/renderer/shared/components/VirtualList.tsx` 已存在 (275 lines)
  - 使用 @tanstack/react-virtual

## Dev Notes

### Zustand Store 模式

```typescript
// 标准 Store 模式
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ModuleState {
  // 缓存数据
  items: Item[];
  
  // 状态管理
  isLoading: boolean;
  error: string | null;
  
  // UI 状态
  selectedId: string | null;
}

interface ModuleActions {
  setItems: (items: Item[]) => void;
  addItem: (item: Item) => void;
  updateItem: (id: string, updates: Partial<Item>) => void;
  removeItem: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: ModuleState = {
  items: [],
  isLoading: false,
  error: null,
  selectedId: null,
};

export const useModuleStore = create<ModuleState & ModuleActions>()(
  immer(
    persist(
      (set) => ({
        ...initialState,
        setItems: (items) => set({ items }),
        addItem: (item) => set((state) => { state.items.push(item); }),
        updateItem: (id, updates) => set((state) => {
          const index = state.items.findIndex(i => i.id === id);
          if (index !== -1) {
            state.items[index] = { ...state.items[index], ...updates };
          }
        }),
        removeItem: (id) => set((state) => {
          state.items = state.items.filter(i => i.id !== id);
        }),
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        reset: () => set(initialState),
      }),
      {
        name: 'module-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({ selectedId: state.selectedId }),
      }
    )
  )
);
```

### shadcn/ui 组件安装命令

```bash
# 在 apps/desktop 目录下执行
npx shadcn@latest add button card dialog input textarea select checkbox switch
npx shadcn@latest add dropdown-menu tabs progress alert tooltip skeleton
npx shadcn@latest add form calendar command popover scroll-area separator sheet badge avatar
```

### 项目结构

```
apps/desktop/src/renderer/
├── shared/
│   ├── components/
│   │   ├── ui/           # shadcn/ui 组件
│   │   ├── common/       # 通用业务组件
│   │   │   ├── EmptyState.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── VirtualList.tsx
│   │   │   └── index.ts
│   │   └── layout/       # 布局组件
│   │       ├── PageContainer.tsx
│   │       └── index.ts
│   └── hooks/
│       ├── useToast.ts
│       └── index.ts
└── modules/
    ├── goal/presentation/stores/goalStore.ts
    ├── task/presentation/stores/taskStore.ts
    ├── schedule/presentation/stores/scheduleStore.ts
    ├── reminder/presentation/stores/reminderStore.ts
    └── ...
```

### 技术约束

- **Zustand 版本**: ^5.0.0
- **immer 版本**: ^10.0.0
- **sonner 版本**: ^2.0.0
- **@tanstack/react-virtual**: ^3.0.0 (用于 VirtualList)

### References

- [EPIC-011: Desktop Renderer 完整 React + shadcn/ui + Zustand 迁移](./EPIC-011-DESKTOP-RENDERER-REACT-MIGRATION.md)
- [Web 模块架构分析](../architecture/web-to-desktop-migration-analysis.md)
- [Zustand 官方文档](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [shadcn/ui 官方文档](https://ui.shadcn.com/)

## Estimated Effort

| Task | 预估工时 |
|------|---------|
| Zustand 架构搭建 | 15.5h |
| shadcn/ui 组件库完善 | 6h |
| 共享组件搭建 | 6.5h |
| **总计** | **28h** |

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used
Claude Opus 4.5 (Preview)

### Debug Log References
N/A - No errors encountered

### Completion Notes List
1. **Task 1 (Zustand 架构)**: 大部分 Store 文件已预先存在。新创建了 `accountStore.ts` 和 `repositoryStore.ts`，并更新了 `types/electron.d.ts` 以添加 Account 和 Repository IPC 接口类型。
2. **Task 2 (shadcn/ui)**: 所有组件通过 `@dailyuse/ui-shadcn` 包提供，无需额外安装。CircularProgress、Toolbar、sonner Toast 均已实现。
3. **Task 3 (共享组件)**: 所有共享组件（EmptyState、LoadingSpinner、ErrorBoundary、ConfirmDialog、PageContainer、VirtualList）均已存在于 `apps/desktop/src/renderer/shared/components/` 目录。

### File List
**新创建的文件:**
- `apps/desktop/src/renderer/modules/account/presentation/stores/accountStore.ts`
- `apps/desktop/src/renderer/modules/account/presentation/stores/index.ts`
- `apps/desktop/src/renderer/modules/repository/presentation/stores/repositoryStore.ts`
- `apps/desktop/src/renderer/modules/repository/presentation/stores/index.ts`

**修改的文件:**
- `apps/desktop/src/renderer/types/electron.d.ts` - 添加 AccountIPC 和 RepositoryIPC 接口

**验证已存在的文件 (无需修改):**
- `docs/architecture/zustand-store-pattern.md` (281 lines)
- `apps/desktop/src/renderer/modules/goal/presentation/stores/goalStore.ts` (444 lines)
- `apps/desktop/src/renderer/modules/task/presentation/stores/taskStore.ts`
- `apps/desktop/src/renderer/modules/reminder/presentation/stores/reminderStore.ts`
- `apps/desktop/src/renderer/modules/schedule/presentation/stores/scheduleStore.ts`
- `apps/desktop/src/renderer/modules/dashboard/presentation/stores/dashboardStore.ts`
- `apps/desktop/src/renderer/modules/authentication/presentation/stores/authStore.ts`
- `apps/desktop/src/renderer/modules/ai/presentation/stores/aiStore.ts`
- `apps/desktop/src/renderer/modules/notification/presentation/stores/notificationStore.ts`
- `apps/desktop/src/renderer/modules/setting/presentation/stores/settingStore.ts`
- `apps/desktop/src/renderer/shared/components/common/CircularProgress.tsx` (152 lines)
- `apps/desktop/src/renderer/shared/components/common/Toolbar.tsx` (173 lines)
- `apps/desktop/src/renderer/shared/components/common/Toast.tsx`
- `apps/desktop/src/renderer/shared/components/common/EmptyState.tsx`
- `apps/desktop/src/renderer/shared/components/common/LoadingSpinner.tsx`
- `apps/desktop/src/renderer/shared/components/common/ErrorBoundary.tsx`
- `apps/desktop/src/renderer/shared/components/common/ConfirmDialog.tsx`
- `apps/desktop/src/renderer/shared/components/layouts/PageContainer.tsx` (138 lines)
- `apps/desktop/src/renderer/shared/components/VirtualList.tsx` (275 lines)
