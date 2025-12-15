# Story 13.3: 统一模块初始化机制

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.3 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| 优先级 | P0 (Critical) |
| 复杂度 | Medium |
| 预估工时 | 4h |
| 状态 | Backlog |

## 目标

建立统一的模块初始化流程，管理模块启动顺序和依赖关系，提供初始化状态追踪。

## 背景

当前问题：
1. 各模块初始化时机不一致
2. 没有统一的初始化状态管理
3. 初始化失败时缺少恢复机制
4. 模块之间的启动依赖关系不明确

## 任务列表

- [ ] 1. 创建 `renderer/shared/infrastructure/initialization/` 目录
- [ ] 2. 定义 `ModuleInitializer` 接口
  - [ ] `name`: 模块名称
  - [ ] `dependencies`: 依赖的其他模块
  - [ ] `initialize()`: 初始化方法
  - [ ] `dispose()`: 清理方法
  - [ ] `priority`: 优先级（可选）
- [ ] 3. 实现 `InitializationManager` 管理器
  - [ ] 注册模块初始化器
  - [ ] 解析依赖关系（拓扑排序）
  - [ ] 按顺序执行初始化
  - [ ] 处理初始化错误
  - [ ] 支持重试机制
- [ ] 4. 实现 `InitializationState` 状态管理
  - [ ] 追踪每个模块的初始化状态
  - [ ] 提供 React Hook 访问状态
- [ ] 5. 添加初始化日志
- [ ] 6. 添加单元测试

## 技术设计

### 目录结构

```
renderer/shared/infrastructure/initialization/
├── module-initializer.ts       # 初始化器接口
├── initialization-manager.ts   # 初始化管理器
├── initialization-state.ts     # 状态管理
├── initialization-hooks.ts     # React Hooks
└── index.ts                    # 导出
```

### ModuleInitializer 接口

```typescript
export enum InitializationStatus {
  PENDING = 'pending',
  INITIALIZING = 'initializing',
  READY = 'ready',
  ERROR = 'error',
  DISPOSED = 'disposed',
}

export interface ModuleInitializer {
  name: string;
  dependencies?: string[];
  priority?: number;  // 数字越小优先级越高，默认 100
  
  initialize(): Promise<void>;
  dispose(): Promise<void>;
  
  // 可选：健康检查
  healthCheck?(): Promise<boolean>;
}
```

### InitializationManager

```typescript
export class InitializationManager {
  private initializers: Map<string, ModuleInitializer> = new Map();
  private state: InitializationState;
  
  register(initializer: ModuleInitializer): void;
  unregister(name: string): void;
  
  async initializeAll(): Promise<InitializationResult>;
  async initializeModule(name: string): Promise<void>;
  
  async disposeAll(): Promise<void>;
  async disposeModule(name: string): Promise<void>;
  
  getStatus(name: string): InitializationStatus;
  getAllStatus(): Map<string, InitializationStatus>;
  
  // 等待特定模块就绪
  waitFor(name: string): Promise<void>;
  waitForAll(): Promise<void>;
}
```

### 使用示例

```typescript
// 定义模块初始化器
const taskModuleInitializer: ModuleInitializer = {
  name: 'task',
  dependencies: ['auth', 'account'],
  priority: 50,
  
  async initialize() {
    // 初始化 Task 容器
    const container = new TaskContainer();
    await container.initialize();
    ContainerRegistry.register(ContainerKeys.TASK, container);
  },
  
  async dispose() {
    const container = ContainerRegistry.get(ContainerKeys.TASK);
    container.dispose();
  },
};

// 注册并初始化
InitializationManager.register(taskModuleInitializer);
await InitializationManager.initializeAll();

// 在组件中使用
function App() {
  const { isReady, errors } = useInitializationStatus();
  
  if (!isReady) {
    return <SplashScreen />;
  }
  
  if (errors.length > 0) {
    return <InitializationError errors={errors} />;
  }
  
  return <MainApp />;
}
```

## 验收标准

- [ ] 模块按正确的依赖顺序初始化
- [ ] 初始化状态可被追踪和查询
- [ ] 初始化失败时有清晰的错误信息
- [ ] 支持单个模块的重新初始化
- [ ] `useInitializationStatus` Hook 正常工作
- [ ] 单元测试覆盖率 > 80%

## 文件清单

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `renderer/shared/infrastructure/initialization/module-initializer.ts` | 新建 | 初始化器接口 |
| `renderer/shared/infrastructure/initialization/initialization-manager.ts` | 新建 | 管理器 |
| `renderer/shared/infrastructure/initialization/initialization-state.ts` | 新建 | 状态管理 |
| `renderer/shared/infrastructure/initialization/initialization-hooks.ts` | 新建 | React Hooks |
| `renderer/shared/infrastructure/initialization/index.ts` | 新建 | 导出 |

## 依赖关系

- **前置依赖**: Story 13.2 (DI 容器模式)
- **后续依赖**: 所有模块的初始化配置

## 风险与注意事项

1. **循环依赖**: 需要检测并报告循环依赖
2. **超时处理**: 单个模块初始化超时不应阻塞其他模块
3. **错误恢复**: 关键模块失败应有恢复策略
