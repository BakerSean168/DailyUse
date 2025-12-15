# Story 13.2: 建立 Renderer 端 DI 容器模式

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.2 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| 优先级 | P0 (Critical) |
| 复杂度 | Medium |
| 预估工时 | 5h |
| 状态 | Backlog |

## 目标

在 Renderer 端建立统一的依赖注入模式，实现模块级的服务容器，便于管理和测试。

## 背景

当前问题：
1. 各模块服务实例化方式不统一
2. 难以进行单元测试（无法 mock 依赖）
3. 服务之间的依赖关系不清晰

## 任务列表

- [ ] 1. 创建 `renderer/shared/infrastructure/di/` 目录
- [ ] 2. 实现 `RendererContainer` 基类
  - [ ] 支持服务注册和获取
  - [ ] 支持单例和工厂模式
  - [ ] 支持延迟初始化
- [ ] 3. 实现 `ContainerRegistry` 中央注册表
  - [ ] 注册所有模块容器
  - [ ] 提供全局访问入口
- [ ] 4. 实现容器 Hooks
  - [ ] `useContainer<T>(containerKey)` - 获取容器
  - [ ] `useService<T>(containerKey, serviceKey)` - 获取服务
- [ ] 5. 定义容器接口规范
- [ ] 6. 添加单元测试

## 技术设计

### 目录结构

```
renderer/shared/infrastructure/di/
├── renderer-container.ts    # 容器基类
├── container-registry.ts    # 中央注册表
├── container-hooks.ts       # React Hooks
├── types.ts                 # 类型定义
└── index.ts                 # 导出
```

### RendererContainer 接口

```typescript
export type ServiceFactory<T> = () => T;

export interface ContainerConfig {
  lazy?: boolean;  // 延迟初始化，默认 true
}

export abstract class RendererContainer {
  private services: Map<string, unknown> = new Map();
  private factories: Map<string, ServiceFactory<unknown>> = new Map();
  
  protected register<T>(key: string, factory: ServiceFactory<T>): void;
  protected registerSingleton<T>(key: string, factory: ServiceFactory<T>): void;
  
  get<T>(key: string): T;
  has(key: string): boolean;
  
  abstract initialize(): Promise<void>;
  abstract dispose(): void;
}
```

### ContainerRegistry

```typescript
export class ContainerRegistry {
  private static containers: Map<string, RendererContainer> = new Map();
  
  static register(key: string, container: RendererContainer): void;
  static get<T extends RendererContainer>(key: string): T;
  static has(key: string): boolean;
  
  static async initializeAll(): Promise<void>;
  static disposeAll(): void;
}

// 容器键常量
export const ContainerKeys = {
  TASK: 'task',
  GOAL: 'goal',
  SCHEDULE: 'schedule',
  REMINDER: 'reminder',
  // ...
} as const;
```

### Hooks 使用示例

```typescript
// 获取容器
const taskContainer = useContainer<TaskContainer>(ContainerKeys.TASK);

// 获取服务
const taskIPCClient = useService<TaskIPCClient>(
  ContainerKeys.TASK, 
  'taskIPCClient'
);

// 在组件中使用
function TaskList() {
  const taskIPCClient = useService<TaskIPCClient>(ContainerKeys.TASK, 'ipcClient');
  
  useEffect(() => {
    taskIPCClient.list({ accountUuid }).then(setTasks);
  }, []);
}
```

## 验收标准

- [ ] `RendererContainer` 基类可被正确继承
- [ ] 服务可以正确注册和获取
- [ ] 单例模式工作正常
- [ ] Hooks 在 React 组件中正常使用
- [ ] 容器可以正确初始化和销毁
- [ ] 单元测试覆盖率 > 80%

## 文件清单

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `renderer/shared/infrastructure/di/renderer-container.ts` | 新建 | 容器基类 |
| `renderer/shared/infrastructure/di/container-registry.ts` | 新建 | 中央注册表 |
| `renderer/shared/infrastructure/di/container-hooks.ts` | 新建 | React Hooks |
| `renderer/shared/infrastructure/di/types.ts` | 新建 | 类型定义 |
| `renderer/shared/infrastructure/di/index.ts` | 新建 | 导出 |

## 依赖关系

- **前置依赖**: Story 13.1 (IPC Client 基础架构)
- **后续依赖**: 所有模块的 Container (Stories 13.7, 13.10 等)

## 风险与注意事项

1. **循环依赖**: 容器之间避免循环依赖
2. **内存泄漏**: 确保 dispose 时清理所有资源
3. **React 生命周期**: Hooks 需要正确处理组件卸载
