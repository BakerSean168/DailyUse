# Zustand Store Pattern - DailyUse Desktop

本文档定义了 DailyUse Desktop 应用中 Zustand 状态管理的标准模式和最佳实践。

## 概述

Zustand 是一个轻量、灵活的 React 状态管理库。在 DailyUse Desktop 中，我们使用 Zustand 替代 Web 端的 Pinia，配合以下中间件：

- **immer**: 支持不可变状态更新的简洁语法
- **persist**: 可选的状态持久化

## Store 结构规范

### 标准模式

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';

// 1. 定义 State 接口
interface ModuleState {
  // 数据缓存
  items: Item[];
  itemsById: Record<string, Item>;
  
  // 加载状态
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // UI 状态
  selectedId: string | null;
  filters: FilterOptions;
}

// 2. 定义 Actions 接口
interface ModuleActions {
  // CRUD 操作
  setItems: (items: Item[]) => void;
  addItem: (item: Item) => void;
  updateItem: (id: string, updates: Partial<Item>) => void;
  removeItem: (id: string) => void;
  
  // 状态管理
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  
  // UI 状态
  setSelectedId: (id: string | null) => void;
  setFilters: (filters: FilterOptions) => void;
  
  // 生命周期
  initialize: () => Promise<void>;
  reset: () => void;
}

// 3. 定义 Selectors（派生状态）
interface ModuleSelectors {
  getItemById: (id: string) => Item | undefined;
  getFilteredItems: () => Item[];
  getItemCount: () => number;
}

// 4. 初始状态
const initialState: ModuleState = {
  items: [],
  itemsById: {},
  isLoading: false,
  isInitialized: false,
  error: null,
  selectedId: null,
  filters: defaultFilters,
};

// 5. 创建 Store
export const useModuleStore = create<ModuleState & ModuleActions & ModuleSelectors>()(
  immer(
    persist(
      (set, get) => ({
        ...initialState,
        
        // CRUD Actions
        setItems: (items) => set((state) => {
          state.items = items;
          state.itemsById = Object.fromEntries(items.map(i => [i.id, i]));
        }),
        
        addItem: (item) => set((state) => {
          state.items.push(item);
          state.itemsById[item.id] = item;
        }),
        
        updateItem: (id, updates) => set((state) => {
          const index = state.items.findIndex(i => i.id === id);
          if (index !== -1) {
            state.items[index] = { ...state.items[index], ...updates };
            state.itemsById[id] = state.items[index];
          }
        }),
        
        removeItem: (id) => set((state) => {
          state.items = state.items.filter(i => i.id !== id);
          delete state.itemsById[id];
        }),
        
        // 状态 Actions
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        setInitialized: (initialized) => set({ isInitialized: initialized }),
        
        // UI Actions
        setSelectedId: (id) => set({ selectedId: id }),
        setFilters: (filters) => set({ filters }),
        
        // 生命周期
        initialize: async () => {
          const { isInitialized, setLoading, setItems, setError, setInitialized } = get();
          if (isInitialized) return;
          
          try {
            setLoading(true);
            // 通过 IPC 获取数据
            const items = await window.electron.module.getAll();
            setItems(items);
            setInitialized(true);
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Unknown error');
          } finally {
            setLoading(false);
          }
        },
        
        reset: () => set(initialState),
        
        // Selectors
        getItemById: (id) => get().itemsById[id],
        getFilteredItems: () => {
          const { items, filters } = get();
          return items.filter(/* apply filters */);
        },
        getItemCount: () => get().items.length,
      }),
      {
        name: 'module-store', // localStorage key
        storage: createJSONStorage(() => localStorage),
        // 只持久化 UI 状态，不持久化数据缓存
        partialize: (state) => ({
          selectedId: state.selectedId,
          filters: state.filters,
        }),
      }
    )
  )
);
```

## 文件组织

```
apps/desktop/src/renderer/modules/
├── goal/
│   └── presentation/
│       └── stores/
│           ├── goalStore.ts       # Goal 模块 Store
│           └── index.ts           # 导出
├── task/
│   └── presentation/
│       └── stores/
│           ├── taskStore.ts
│           └── index.ts
└── ...
```

## 命名规范

| 类型 | 命名 | 示例 |
|------|------|------|
| Store Hook | `use{Module}Store` | `useGoalStore` |
| State 接口 | `{Module}State` | `GoalState` |
| Actions 接口 | `{Module}Actions` | `GoalActions` |
| 初始状态 | `initial{Module}State` | `initialGoalState` |
| 持久化 key | `{module}-store` | `goal-store` |

## 使用示例

### 在组件中使用

```tsx
import { useGoalStore } from '@/modules/goal/presentation/stores';

function GoalList() {
  // 选择性订阅（推荐）
  const goals = useGoalStore((state) => state.items);
  const isLoading = useGoalStore((state) => state.isLoading);
  const addGoal = useGoalStore((state) => state.addItem);
  
  // 或使用浅比较
  const { items, isLoading, addItem } = useGoalStore(
    useShallow((state) => ({
      items: state.items,
      isLoading: state.isLoading,
      addItem: state.addItem,
    }))
  );
  
  // ...
}
```

### 在组件外使用

```typescript
import { useGoalStore } from '@/modules/goal/presentation/stores';

// 获取状态（非响应式）
const goals = useGoalStore.getState().items;

// 调用 action
useGoalStore.getState().addItem(newGoal);

// 订阅变化
const unsubscribe = useGoalStore.subscribe(
  (state) => state.items,
  (items) => console.log('Goals updated:', items)
);
```

## 与 IPC 集成

Store 通过 `window.electron` 调用主进程 IPC：

```typescript
initialize: async () => {
  try {
    set({ isLoading: true });
    const items = await window.electron.goal.getAll();
    set({ items, isInitialized: true });
  } catch (error) {
    set({ error: error.message });
  } finally {
    set({ isLoading: false });
  }
},

createGoal: async (dto: CreateGoalDTO) => {
  try {
    set({ isLoading: true });
    const newGoal = await window.electron.goal.create(dto);
    set((state) => { state.items.push(newGoal); });
    return newGoal;
  } catch (error) {
    set({ error: error.message });
    throw error;
  } finally {
    set({ isLoading: false });
  }
},
```

## 最佳实践

1. **选择性订阅**: 使用选择器函数只订阅需要的状态，避免不必要的重渲染
2. **immer 简化更新**: 使用 immer 中间件可以直接修改 draft state
3. **分离 UI 状态**: UI 状态（如 selectedId）和数据缓存分开管理
4. **部分持久化**: 只持久化 UI 偏好，不持久化从后端获取的数据
5. **错误处理**: 每个异步操作都要有 try/catch 和 loading 状态
6. **类型安全**: 完整定义 State、Actions、Selectors 接口

## 迁移指南：Pinia → Zustand

| Pinia | Zustand |
|-------|---------|
| `state: () => ({})` | `initialState` + `set()` |
| `getters: {}` | Store 内函数或 `useShallow` |
| `actions: {}` | Store 内函数 |
| `store.$patch()` | `set()` 或 immer 直接修改 |
| `store.$reset()` | `reset()` action |
| `mapStores()` | `useStore()` hook |
