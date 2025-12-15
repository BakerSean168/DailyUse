# Story 13.56: Phase 7 - API 文档

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.56 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| Phase | Phase 7: 测试与文档 |
| 优先级 | P2 (Medium) |
| 预估工时 | 5h |
| 前置依赖 | Story 13.01-13.52 (所有模块完成) |
| 关联模块 | Documentation |

## 目标

为所有模块创建完整的 API 文档，使用 TypeDoc 自动生成。

## 任务列表

### 1. TypeDoc 配置 (1h)
- [ ] TypeDoc 安装和配置
- [ ] 文档主题设置
- [ ] 输出目录配置

### 2. 代码注释规范 (2h)
- [ ] JSDoc 注释标准
- [ ] 模块注释模板
- [ ] 示例代码规范

### 3. API 文档生成 (2h)
- [ ] 各模块文档生成
- [ ] 交叉引用配置
- [ ] 文档部署配置

## 技术规范

### TypeDoc 配置
```json
// typedoc.json
{
  "entryPoints": [
    "apps/desktop/src/main/index.ts",
    "apps/desktop/src/renderer/index.tsx"
  ],
  "entryPointStrategy": "expand",
  "out": "docs/api",
  "name": "DailyUse Desktop API Documentation",
  "readme": "README.md",
  "theme": "default",
  "includeVersion": true,
  "excludePrivate": true,
  "excludeProtected": false,
  "excludeInternal": true,
  "excludeExternals": true,
  "disableSources": false,
  "validation": {
    "notExported": true,
    "invalidLink": true,
    "notDocumented": false
  },
  "categoryOrder": [
    "Main Process",
    "Renderer Process",
    "Modules",
    "Stores",
    "Hooks",
    "Components",
    "Types",
    "Utils"
  ],
  "navigationLinks": {
    "GitHub": "https://github.com/dailyuse/dailyuse",
    "Documentation": "https://docs.dailyuse.app"
  },
  "plugin": [
    "typedoc-plugin-markdown",
    "typedoc-plugin-mermaid"
  ],
  "customCss": "./docs/api-theme.css"
}
```

### JSDoc 注释规范
```typescript
// docs/jsdoc-examples.ts

/**
 * Task Handler - 管理任务的主进程处理器
 *
 * 负责任务的增删改查操作，通过 IPC 与渲染进程通信。
 *
 * @category Main Process
 * @module TaskHandler
 *
 * @example
 * ```typescript
 * import { taskHandler } from './task-handler';
 *
 * // 注册 IPC handlers
 * taskHandler.register();
 *
 * // 设置主窗口引用
 * taskHandler.setMainWindow(mainWindow);
 * ```
 */
class TaskHandler {
  /**
   * 注册所有任务相关的 IPC handlers
   *
   * 包括以下 channels:
   * - `task:create` - 创建任务
   * - `task:update` - 更新任务
   * - `task:delete` - 删除任务
   * - `task:get` - 获取单个任务
   * - `task:get-all` - 获取所有任务
   *
   * @returns {void}
   */
  register(): void {}

  /**
   * 创建新任务
   *
   * @param {CreateTaskInput} input - 任务创建参数
   * @returns {Promise<Task>} 创建的任务对象
   * @throws {ValidationError} 当输入参数验证失败时
   *
   * @example
   * ```typescript
   * const task = await taskHandler.createTask({
   *   title: '完成报告',
   *   description: '月度销售报告',
   *   priority: 'high',
   *   dueDate: new Date('2024-01-31'),
   * });
   * ```
   */
  async createTask(input: CreateTaskInput): Promise<Task> {}

  /**
   * 批量更新任务
   *
   * @param {string[]} ids - 要更新的任务 ID 列表
   * @param {Partial<TaskUpdateInput>} updates - 更新内容
   * @returns {Promise<Task[]>} 更新后的任务列表
   *
   * @remarks
   * 此方法使用事务确保原子性操作。
   * 如果任何一个任务更新失败，所有更改都会回滚。
   */
  async batchUpdateTasks(ids: string[], updates: Partial<TaskUpdateInput>): Promise<Task[]> {}
}

/**
 * 任务创建输入参数
 *
 * @interface CreateTaskInput
 * @category Types
 */
interface CreateTaskInput {
  /**
   * 任务标题
   * @minLength 1
   * @maxLength 200
   */
  title: string;

  /**
   * 任务描述（可选）
   * @maxLength 5000
   */
  description?: string;

  /**
   * 任务优先级
   * @default 'medium'
   */
  priority?: 'low' | 'medium' | 'high';

  /**
   * 截止日期（可选）
   */
  dueDate?: Date;

  /**
   * 关联的目标 ID（可选）
   */
  goalId?: string;

  /**
   * 标签列表
   */
  tags?: string[];
}

/**
 * 任务实体
 *
 * @interface Task
 * @extends {CreateTaskInput}
 * @category Types
 */
interface Task extends CreateTaskInput {
  /**
   * 唯一标识符
   * @readonly
   */
  id: string;

  /**
   * 任务状态
   */
  status: TaskStatus;

  /**
   * 创建时间
   * @readonly
   */
  createdAt: Date;

  /**
   * 更新时间
   */
  updatedAt: Date;

  /**
   * 完成时间（仅当状态为 completed 时有值）
   */
  completedAt?: Date;
}

/**
 * 任务状态枚举
 *
 * @enum {string}
 * @category Types
 */
enum TaskStatus {
  /** 待处理 */
  PENDING = 'pending',
  /** 进行中 */
  IN_PROGRESS = 'in_progress',
  /** 已完成 */
  COMPLETED = 'completed',
  /** 已取消 */
  CANCELLED = 'cancelled',
}
```

### 模块文档模板
```typescript
// docs/templates/module-template.ts
/**
 * @packageDocumentation
 * @module Task
 *
 * # 任务模块
 *
 * 任务模块提供完整的任务管理功能，包括创建、编辑、删除、
 * 状态管理和与其他模块的集成。
 *
 * ## 架构概述
 *
 * ```
 * ┌─────────────────────────────────────────────────┐
 * │                 Renderer Process                │
 * │  ┌───────────┐  ┌───────────┐  ┌───────────┐   │
 * │  │   Hooks   │  │   Store   │  │    UI     │   │
 * │  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘   │
 * │        │              │              │         │
 * │        └──────────────┼──────────────┘         │
 * │                       │                        │
 * │              ┌────────┴────────┐               │
 * │              │   IPC Client    │               │
 * │              └────────┬────────┘               │
 * └───────────────────────┼────────────────────────┘
 *                         │ IPC
 * ┌───────────────────────┼────────────────────────┐
 * │                 Main Process                   │
 * │              ┌────────┴────────┐               │
 * │              │   TaskHandler   │               │
 * │              └────────┬────────┘               │
 * │                       │                        │
 * │              ┌────────┴────────┐               │
 * │              │    Database     │               │
 * │              └─────────────────┘               │
 * └────────────────────────────────────────────────┘
 * ```
 *
 * ## 快速开始
 *
 * ### Main Process 设置
 *
 * ```typescript
 * import { taskHandler } from './modules/task';
 *
 * // 在应用启动时注册
 * app.whenReady().then(() => {
 *   taskHandler.register();
 *   taskHandler.setMainWindow(mainWindow);
 * });
 * ```
 *
 * ### Renderer Process 使用
 *
 * ```typescript
 * import { useTaskStore } from './modules/task/stores';
 * import { useTasks } from './modules/task/hooks';
 *
 * function TaskList() {
 *   const { tasks, isLoading } = useTasks();
 *   const { createTask } = useTaskStore();
 *
 *   // ...
 * }
 * ```
 *
 * ## 主要组件
 *
 * ### Main Process
 * - {@link TaskHandler} - IPC 处理器
 *
 * ### Renderer Process
 * - {@link useTaskStore} - Zustand store
 * - {@link useTasks} - 任务列表 hook
 * - {@link useTask} - 单个任务 hook
 * - {@link TaskList} - 任务列表组件
 * - {@link TaskItem} - 任务项组件
 * - {@link TaskForm} - 任务表单组件
 *
 * ## 相关模块
 *
 * - {@link module:Goal | Goal} - 任务可关联到目标
 * - {@link module:Focus | Focus} - 专注时可选择任务
 * - {@link module:Notification | Notification} - 任务到期提醒
 *
 * @see {@link https://docs.dailyuse.app/modules/task | 在线文档}
 */
```

### Hooks 文档示例
```typescript
/**
 * 获取任务列表的 React Hook
 *
 * 自动处理数据获取、加载状态和错误处理。
 * 支持过滤、排序和分页。
 *
 * @category Hooks
 *
 * @param {UseTasksOptions} options - 配置选项
 * @returns {UseTasksResult} 任务列表和相关状态
 *
 * @example
 * 基本用法
 * ```tsx
 * function TaskList() {
 *   const { tasks, isLoading, error } = useTasks();
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <Error message={error} />;
 *
 *   return (
 *     <ul>
 *       {tasks.map(task => (
 *         <TaskItem key={task.id} task={task} />
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 *
 * @example
 * 带过滤和排序
 * ```tsx
 * function FilteredTasks() {
 *   const { tasks } = useTasks({
 *     filter: { status: 'pending', priority: 'high' },
 *     sort: { field: 'dueDate', direction: 'asc' },
 *   });
 *
 *   return <TaskGrid tasks={tasks} />;
 * }
 * ```
 *
 * @example
 * 分页
 * ```tsx
 * function PaginatedTasks() {
 *   const [page, setPage] = useState(1);
 *   const { tasks, totalPages, hasMore } = useTasks({
 *     pagination: { page, pageSize: 20 },
 *   });
 *
 *   return (
 *     <>
 *       <TaskList tasks={tasks} />
 *       <Pagination
 *         current={page}
 *         total={totalPages}
 *         onChange={setPage}
 *       />
 *     </>
 *   );
 * }
 * ```
 */
function useTasks(options?: UseTasksOptions): UseTasksResult {}

/**
 * useTasks Hook 的配置选项
 *
 * @interface UseTasksOptions
 * @category Hooks
 */
interface UseTasksOptions {
  /**
   * 过滤条件
   */
  filter?: TaskFilter;

  /**
   * 排序配置
   */
  sort?: TaskSort;

  /**
   * 分页配置
   */
  pagination?: PaginationConfig;

  /**
   * 是否在挂载时自动获取数据
   * @default true
   */
  fetchOnMount?: boolean;

  /**
   * 轮询间隔（毫秒），0 表示禁用
   * @default 0
   */
  pollInterval?: number;
}

/**
 * useTasks Hook 的返回值
 *
 * @interface UseTasksResult
 * @category Hooks
 */
interface UseTasksResult {
  /** 任务列表 */
  tasks: Task[];

  /** 是否正在加载 */
  isLoading: boolean;

  /** 错误信息 */
  error: string | null;

  /** 总任务数 */
  total: number;

  /** 总页数 */
  totalPages: number;

  /** 是否有更多数据 */
  hasMore: boolean;

  /** 重新获取数据 */
  refetch: () => Promise<void>;

  /** 加载下一页 */
  loadMore: () => Promise<void>;
}
```

### Store 文档示例
```typescript
/**
 * 任务 Zustand Store
 *
 * 管理任务相关的客户端状态，包括任务列表、
 * 当前选中任务、过滤条件等。
 *
 * @category Stores
 *
 * @example
 * 在组件中使用
 * ```tsx
 * import { useTaskStore } from './stores/task-store';
 *
 * function TaskActions() {
 *   const { createTask, updateTask, deleteTask } = useTaskStore();
 *
 *   const handleCreate = async () => {
 *     await createTask({ title: 'New Task' });
 *   };
 *
 *   return <Button onClick={handleCreate}>Create</Button>;
 * }
 * ```
 *
 * @example
 * 使用选择器优化性能
 * ```tsx
 * // 只订阅需要的状态
 * const tasks = useTaskStore(state => state.tasks);
 * const isLoading = useTaskStore(state => state.isLoading);
 *
 * // 使用 shallow 比较
 * const { tasks, filter } = useTaskStore(
 *   state => ({ tasks: state.tasks, filter: state.filter }),
 *   shallow
 * );
 * ```
 *
 * @example
 * 在 React 外部使用
 * ```typescript
 * import { useTaskStore } from './stores/task-store';
 *
 * // 获取当前状态
 * const state = useTaskStore.getState();
 *
 * // 订阅变化
 * const unsubscribe = useTaskStore.subscribe(
 *   state => state.tasks,
 *   tasks => console.log('Tasks changed:', tasks)
 * );
 * ```
 */
const useTaskStore = create<TaskStore>()(/* ... */);

/**
 * 任务 Store 状态
 *
 * @interface TaskStoreState
 * @category Stores
 */
interface TaskStoreState {
  /** 任务列表 */
  tasks: Task[];

  /** 当前选中的任务 */
  selectedTask: Task | null;

  /** 过滤条件 */
  filter: TaskFilter;

  /** 排序配置 */
  sort: TaskSort;

  /** 加载状态 */
  isLoading: boolean;

  /** 错误信息 */
  error: string | null;
}

/**
 * 任务 Store 操作
 *
 * @interface TaskStoreActions
 * @category Stores
 */
interface TaskStoreActions {
  /**
   * 初始化 Store
   * 从数据库加载任务列表
   */
  initialize: () => Promise<void>;

  /**
   * 创建任务
   * @param input - 任务创建参数
   */
  createTask: (input: CreateTaskInput) => Promise<Task>;

  /**
   * 更新任务
   * @param id - 任务 ID
   * @param updates - 更新内容
   */
  updateTask: (id: string, updates: Partial<TaskUpdateInput>) => Promise<Task>;

  /**
   * 删除任务
   * @param id - 任务 ID
   */
  deleteTask: (id: string) => Promise<void>;

  /**
   * 设置过滤条件
   * @param filter - 新的过滤条件
   */
  setFilter: (filter: Partial<TaskFilter>) => void;

  /**
   * 设置排序配置
   * @param sort - 新的排序配置
   */
  setSort: (sort: TaskSort) => void;

  /**
   * 选中任务
   * @param task - 要选中的任务，null 表示取消选中
   */
  selectTask: (task: Task | null) => void;
}
```

### 生成脚本
```json
// package.json (scripts)
{
  "scripts": {
    "docs:api": "typedoc",
    "docs:api:watch": "typedoc --watch",
    "docs:api:serve": "serve docs/api",
    "docs:build": "npm run docs:api && npm run docs:readme",
    "docs:readme": "node scripts/generate-readme.js"
  }
}
```

## 验收标准

- [ ] TypeDoc 正确配置
- [ ] 所有公开 API 有文档
- [ ] 代码示例可运行
- [ ] 文档交叉引用正确
- [ ] 模块架构图清晰
- [ ] 文档自动生成成功
- [ ] 文档部署可访问
- [ ] TypeScript 类型检查通过

## 相关文件

- `typedoc.json`
- `docs/api/**/*.html`
- `docs/templates/module-template.ts`
- `scripts/generate-readme.js`
